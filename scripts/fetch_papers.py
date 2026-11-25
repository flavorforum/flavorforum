#!/usr/bin/env python3
"""
Flavor Forum: build assets/papers.json from INSPIRE.

Lists recent flavour-physics papers (hep-ph, hep-ex, hep-lat on arXiv) that have
at least one author at an institute in India. Runs once a day from the GitHub
workflow in .github/workflows/site.yml, and can also be run by hand:

    python3 scripts/fetch_papers.py

Only the Python standard library is used.

What it does
  1. Asks INSPIRE for all hep-ph, hep-ex and hep-lat papers (primary category)
     from the last WINDOW_DAYS days.
  2. Keeps a paper if
       - at least one author's affiliation is in India, and
       - its title or abstract matches a line in scripts/flavour-keywords.txt,
     or if its arXiv number is in scripts/include.txt.
     Papers in scripts/exclude.txt are always dropped.
  3. Checks whether arXiv has an HTML version (used by the reading page).
  4. Merges the result into assets/papers.json. Papers older than the window
     stay in the file, so their pages and comments keep working; the list
     page only shows the last WINDOW_DAYS days.

INSPIRE does not support searching by country, so the India check is done
here, on the affiliation text of each author.
"""

import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------- settings
WINDOW_DAYS = 60
ARCHIVES = ["hep-ph", "hep-ex", "hep-lat"]
# Papers with more authors than this are treated as collaboration papers and
# stored with a shortened author list. Set SKIP_LARGE_COLLABORATIONS to True to
# leave them out completely.
LARGE_AUTHOR_COUNT = 30
SKIP_LARGE_COLLABORATIONS = False
MAX_STORED_AUTHORS = 15  # for collaboration papers
MAX_INSTITUTES = 6

ROOT = Path(__file__).resolve().parent.parent
OUT_FILE = ROOT / "assets" / "papers.json"
KEYWORD_FILE = ROOT / "scripts" / "flavour-keywords.txt"
INCLUDE_FILE = ROOT / "scripts" / "include.txt"
EXCLUDE_FILE = ROOT / "scripts" / "exclude.txt"

INSPIRE = "https://inspirehep.net/api/literature"
FIELDS = ",".join([
    "control_number", "titles", "abstracts", "arxiv_eprints", "earliest_date",
    "collaborations", "authors.full_name", "authors.affiliations.value",
    "authors.raw_affiliations.value",
])
USER_AGENT = "FlavorForumBot/1.0 (+https://flavorforum.in; flavourforum@gmail.com)"

# ---------------------------------------------------------------- India check
# 1. The word "India" in the full affiliation text, or
# 2. a known Indian institute or place name (for affiliations written without
#    the country, e.g. "Department of Physics, IIT Kanpur").
INDIA_RE = re.compile(r"\bIndia\b")
INDIAN_PLACE_RE = re.compile(
    r"\b(IIT|IITs|IISER|IISc|NISER|IIIT|NIT|IIEST|TIFR|BARC|VECC|HRI|IMSc|IUCAA|ICTS|"
    r"NCRA|RRI|PRL|IACS|SINP|IOPB|JNU|BHU|AMU|HBNI|CHRIST)\b|"
    r"Tata Inst|Harish[- ]Chandra|Saha Inst|S\. ?N\. ?Bose|Bose Inst|Indian (Inst|Assoc|Stat)|"
    r"Raman Res|Phys(ical|\.) Res(earch|\.) Lab|Bhabha|Homi Bhabha|"
    r"\b(Bhubaneswar|Kanpur|Kharagpur|Guwahati|Gauhati|Kolkata|Calcutta|Chennai|Madras|"
    r"Mumbai|Bombay|Delhi|Bangalore|Bengaluru|Pune|Allahabad|Prayagraj|Varanasi|Banaras|"
    r"Aligarh|Jadavpur|Jaipur|Mohali|Chandigarh|Panjab|Bhopal|Indore|Roorkee|Tezpur|Shillong|"
    r"Dibrugarh|Cochin|Kochi|Kerala|Thiruvananthapuram|Trivandrum|Kozhikode|Calicut|Mysore|"
    r"Mysuru|Manipal|Visva[- ]Bharati|Santiniketan|Lucknow|Jammu|Patna|Ranchi|Dhanbad|"
    r"Ahmedabad|Gandhinagar|Vadodara|Tirupati|Pondicherry|Puducherry|Silchar|Agartala|Imphal|"
    r"Aizawl|Kurukshetra|Jalandhar|Ropar|Rupnagar|Mandi|Jodhpur|Bhilai|Raipur|Nagpur|Warangal|"
    r"Tiruchirappalli|Trichy|Vellore|Kalyani|Burdwan|Bardhaman|Siliguri|Sambalpur|Berhampur|"
    r"Cuttack|Jatni|Jamia|Sikkim|Mizoram|Nagaland|Manipur|Assam|Gujarat|Rajasthan|Haryana|"
    r"Uttarakhand|Dehradun|Jharkhand|West Bengal|Tamil Nadu|Karnataka|Telangana|"
    r"Andhra Pradesh|Maharashtra|Madhya Pradesh|Chhattisgarh|Odisha|Orissa)\b"
)
NOT_INDIA_RE = re.compile(r"\b(Pakistan|Bangladesh|Sri Lanka|Nepal|USA|U\.S\.A|United States)\b")


def is_indian(text):
    if not text:
        return False
    if INDIA_RE.search(text):
        return True
    if NOT_INDIA_RE.search(text):
        return False
    return bool(INDIAN_PLACE_RE.search(text))


# ---------------------------------------------------------------- helpers
def log(*args):
    print(*args, file=sys.stderr, flush=True)


def http_get(url, accept="application/json", tries=5):
    """GET a URL and return (status, bytes). Retries on rate limits and server errors."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < tries - 1:
                wait = 5 * (attempt + 1)
                log(f"  HTTP {e.code}, waiting {wait}s and trying again")
                time.sleep(wait)
                continue
            return e.code, b""
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < tries - 1:
                log(f"  network error ({e}), trying again")
                time.sleep(5 * (attempt + 1))
                continue
            raise
    return 0, b""


def read_list(path):
    if not path.exists():
        return set()
    out = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            out.add(re.sub(r"v\d+$", "", line.replace("arXiv:", "").strip()))
    return out


def read_keywords(path):
    pats = []
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            pats.append(re.compile(line))
        except re.error as e:
            log(f"Skipping bad pattern on line {n} of {path.name}: {e}")
    return pats


def pick(items, key, prefer_source="arXiv"):
    """From INSPIRE's list of titles/abstracts, prefer the arXiv version."""
    if not items:
        return ""
    for it in items:
        if it.get("source") == prefer_source and it.get(key):
            return it[key]
    return items[0].get(key, "")


def display_name(full_name):
    """INSPIRE gives 'Surname, Given'. Show 'Given Surname'."""
    if "," in full_name:
        last, first = [s.strip() for s in full_name.split(",", 1)]
        return f"{first} {last}".strip()
    return full_name.strip()


def tidy(text):
    return re.sub(r"\s+", " ", text or "").strip()


def norm_date(d):
    d = (d or "").strip()
    if re.fullmatch(r"\d{4}-\d{2}", d):
        return d + "-01"
    if re.fullmatch(r"\d{4}", d):
        return d + "-01-01"
    return d[:10]


# ---------------------------------------------------------------- INSPIRE
def search_inspire(query):
    """Yield all metadata records for a query, following INSPIRE's pagination."""
    params = {"q": query, "size": 100, "sort": "mostrecent", "fields": FIELDS}
    url = INSPIRE + "?" + urllib.parse.urlencode(params)
    page = 0
    while url:
        page += 1
        status, body = http_get(url)
        if status != 200:
            raise RuntimeError(f"INSPIRE returned HTTP {status} for {url}")
        data = json.loads(body)
        hits = data.get("hits", {})
        if page == 1:
            log(f"INSPIRE: {hits.get('total', 0)} records for: {query}")
        for h in hits.get("hits", []):
            yield h.get("metadata", {})
        url = data.get("links", {}).get("next")
        time.sleep(0.6)  # INSPIRE allows 15 requests per 5 seconds


def inspire_by_arxiv(arxiv_id):
    q = f"arxiv:{arxiv_id}"
    for md in search_inspire(q):
        return md
    return None


def to_paper(md):
    """Turn an INSPIRE record into the small dict stored in papers.json, or None."""
    eprints = md.get("arxiv_eprints") or []
    if not eprints:
        return None
    arxiv_id = re.sub(r"v\d+$", "", eprints[0].get("value", ""))
    if not arxiv_id:
        return None

    authors_in = md.get("authors") or []
    authors, institutes, any_indian = [], [], False
    for a in authors_in:
        affs = [x.get("value", "") for x in (a.get("affiliations") or [])]
        raws = [x.get("value", "") for x in (a.get("raw_affiliations") or [])]
        indian = any(is_indian(r) for r in raws) or any(is_indian(v) for v in affs)
        if indian:
            any_indian = True
            # Prefer INSPIRE's short institute names; fall back to the raw text.
            names = [v for v in affs if is_indian(v)] or [r for r in raws if is_indian(r)] or affs
            for v in names:
                v = tidy(v)
                if len(v) > 70:
                    v = v[:67].rsplit(" ", 1)[0] + "…"
                if v and v not in institutes:
                    institutes.append(v)
        authors.append({"n": display_name(a.get("full_name", "")), "in": indian})

    collab = ", ".join(c.get("value", "") for c in (md.get("collaborations") or []) if c.get("value"))
    n_authors = len(authors)
    if n_authors > LARGE_AUTHOR_COUNT:
        indian_first = [a for a in authors if a["in"]][:MAX_STORED_AUTHORS]
        authors = indian_first or authors[:MAX_STORED_AUTHORS]

    return {
        "id": arxiv_id,
        "date": norm_date(md.get("earliest_date")),
        "title": tidy(pick(md.get("titles"), "title")),
        "abstract": tidy(pick(md.get("abstracts"), "value")),
        "authors": authors,
        "n_authors": n_authors,
        "collaboration": collab,
        "institutes": institutes[:MAX_INSTITUTES],
        "categories": eprints[0].get("categories", []),
        "inspire": md.get("control_number"),
        "_indian": any_indian,
    }


def is_flavour(paper, patterns):
    text = paper["title"] + "\n" + paper["abstract"]
    return any(p.search(text) for p in patterns)


# ---------------------------------------------------------------- arXiv HTML
def arxiv_has_html(arxiv_id):
    """True if arXiv has an HTML version of the paper (made by LaTeXML)."""
    status, body = http_get(f"https://arxiv.org/html/{arxiv_id}", accept="text/html", tries=2)
    time.sleep(1.0)
    return status == 200 and b"ltx_" in body[:200000]


# ---------------------------------------------------------------- main
def main():
    today = dt.date.today()
    since = today - dt.timedelta(days=WINDOW_DAYS)
    patterns = read_keywords(KEYWORD_FILE)
    include, exclude = read_list(INCLUDE_FILE), read_list(EXCLUDE_FILE)
    log(f"{len(patterns)} keyword patterns, {len(include)} included, {len(exclude)} excluded")

    old = {"papers": []}
    if OUT_FILE.exists():
        old = json.loads(OUT_FILE.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in old.get("papers", [])}

    archives = " or ".join(f"primarch {a}" for a in ARCHIVES)
    query = f"de > {since.isoformat()} and ({archives})"

    found = {}
    seen = 0
    for md in search_inspire(query):
        seen += 1
        p = to_paper(md)
        if not p or p["id"] in exclude:
            continue
        if p["id"] in include or (p["_indian"] and is_flavour(p, patterns)):
            if SKIP_LARGE_COLLABORATIONS and p["n_authors"] > LARGE_AUTHOR_COUNT and p["id"] not in include:
                continue
            found[p["id"]] = p
    log(f"Checked {seen} records, {len(found)} match")

    for arxiv_id in sorted(include - set(found)):
        md = inspire_by_arxiv(arxiv_id)
        p = to_paper(md) if md else None
        if p:
            found[p["id"]] = p
        else:
            log(f"Included paper {arxiv_id} not found on INSPIRE yet")

    # Merge: refresh papers found today, keep older ones, drop excluded ones.
    for pid, p in found.items():
        prev = by_id.get(pid, {})
        p["html"] = prev.get("html", False)
        p["html_checked"] = prev.get("html_checked")
        p["added"] = prev.get("added", today.isoformat())
        by_id[pid] = p
    for pid in list(by_id):
        if pid in exclude:
            del by_id[pid]

    # arXiv HTML check: new papers, and papers without HTML that are under 10 days old.
    for p in by_id.values():
        recent = p.get("date", "") >= (today - dt.timedelta(days=10)).isoformat()
        if not p.get("html") and (p.get("html_checked") is None or recent) and p.get("html_checked") != today.isoformat():
            try:
                p["html"] = arxiv_has_html(p["id"])
            except Exception as e:  # never fail the whole run on this
                log(f"  arXiv HTML check failed for {p['id']}: {e}")
            p["html_checked"] = today.isoformat()

    papers = sorted(by_id.values(), key=lambda p: (p.get("date", ""), p["id"]), reverse=True)
    for p in papers:
        p.pop("_indian", None)

    new_content = {"window_days": WINDOW_DAYS, "papers": papers}
    old_content = {"window_days": old.get("window_days"), "papers": old.get("papers", [])}
    if new_content == old_content and OUT_FILE.exists():
        log("No change to papers.json")
        return
    new_content = {"updated": today.isoformat(), **new_content}
    OUT_FILE.write_text(json.dumps(new_content, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    log(f"Wrote {len(papers)} papers to {OUT_FILE.name}")


if __name__ == "__main__":
    main()
