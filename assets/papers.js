/*
  Flavor Forum: recent papers list (papers.html), single paper page with
  reader and comments (paper.html), and the moderation page (admin.html).

  The paper list comes from assets/papers.json, written once a day by
  scripts/fetch_papers.py. Comments come from the comments service set in
  assets/comments-config.js.
*/
(function () {
  "use strict";

  var CFG = window.FF_CONFIG || {};
  var API = String(CFG.COMMENTS_API || "").replace(/\/+$/, "");
  var COMMENTS_READY = /^https?:\/\//.test(API) && API.indexOf("YOUR-SUBDOMAIN") < 0;
  var SITEKEY = CFG.TURNSTILE_SITEKEY || "";
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  /* ------------------------------------------------------------ helpers */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parts(iso) {
    var p = String(iso || "").split("-");
    return { y: +p[0], m: (+p[1] || 1) - 1, d: +p[2] || 1 };
  }
  function longDate(iso) { var p = parts(iso); return p.d + " " + MONTHS[p.m] + " " + p.y; }
  function shortDate(iso) { var p = parts(iso); return p.d + " " + MONTHS[p.m].slice(0, 3) + " " + p.y; }
  function daysAgo(iso) {
    var p = parts(iso);
    var then = Date.UTC(p.y, p.m, p.d), now = new Date();
    return Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000);
  }
  function timeAgo(isoTime) {
    var t = new Date(isoTime).getTime();
    if (isNaN(t)) return "";
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) { var h = Math.floor(s / 3600); return h + (h === 1 ? " hour ago" : " hours ago"); }
    if (s < 86400 * 30) { var d = Math.floor(s / 86400); return d + (d === 1 ? " day ago" : " days ago"); }
    var dt = new Date(t);
    return dt.getDate() + " " + MONTHS[dt.getMonth()].slice(0, 3) + " " + dt.getFullYear();
  }
  function fullTime(isoTime) {
    var d = new Date(isoTime);
    return isNaN(d) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  function math(el) {
    if (!el || !window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
      });
    } catch (e) { /* leave the TeX as text */ }
  }
  function plainTitle(t) {
    return String(t || "").replace(/\$([^$]*)\$/g, "$1").replace(/\\([a-zA-Z]+)/g, "$1").replace(/[{}^_]/g, "");
  }
  function authorLine(p, max) {
    var names = p.authors.map(function (a) { return a.n; });
    var total = p.n_authors || names.length;
    var shown = names.slice(0, max);
    var rest = total - shown.length;
    var s = shown.join(", ");
    if (rest > 0) s += " + " + rest + " more";
    if (p.collaboration) s = p.collaboration + " Collaboration · " + s;
    return s;
  }
  function getJSON(url, opts) {
    return fetch(url, opts || {}).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || ("HTTP " + r.status));
        return data;
      });
    });
  }
  function loadPapers() {
    return fetch("assets/papers.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function adminKey() {
    try { return sessionStorage.getItem("ff_admin_key") || ""; } catch (e) { return ""; }
  }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }

  var ICON_COMMENT = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M3 4.5h14v9H8.5L5 16.5v-3H3z"/></svg>';

  /* ------------------------------------------------------------ list page */
  function listPage(root) {
    var meta = $("papers-meta"), search = $("paper-search"), olderBtn = $("show-older");
    var all = [], counts = {}, window_days = 60, showOlder = false;

    function card(p) {
      var n = counts[p.id] || 0;
      return '<li><a class="paper-card" href="paper.html?id=' + encodeURIComponent(p.id) + '">' +
        '<span class="paper-top"><span>' + esc(shortDate(p.date)) + '</span>' +
        '<span class="sep">·</span><span>arXiv:' + esc(p.id) + '</span>' +
        (p.categories && p.categories[0] ? '<span class="cat">' + esc(p.categories[0]) + '</span>' : "") +
        '</span>' +
        '<span class="paper-title">' + esc(p.title) + '</span>' +
        '<span class="paper-authors">' + esc(authorLine(p, 4)) + '</span>' +
        (p.institutes && p.institutes.length ? '<span class="chips">' +
          p.institutes.slice(0, 3).map(function (i) { return '<span class="chip">' + esc(i) + '</span>'; }).join("") +
          (p.institutes.length > 3 ? '<span class="chip chip-more">+' + (p.institutes.length - 3) + '</span>' : "") +
          '</span>' : "") +
        '<span class="paper-foot">' + ICON_COMMENT +
        (n ? n + (n === 1 ? " comment" : " comments") : "No comments yet") + '</span>' +
        '</a></li>';
    }

    function render() {
      var q = (search.value || "").trim().toLowerCase();
      var recent = all.filter(function (p) { return daysAgo(p.date) <= window_days; });
      var older = all.filter(function (p) { return daysAgo(p.date) > window_days; });
      var pool = showOlder ? all : recent;
      var list = q ? pool.filter(function (p) {
        var hay = [p.title, p.id, p.collaboration, p.abstract].concat(
          p.authors.map(function (a) { return a.n; }), p.institutes || []).join(" ").toLowerCase();
        return hay.indexOf(q) >= 0;
      }) : pool;

      root.innerHTML = list.length
        ? '<ol class="paper-cards">' + list.map(card).join("") + '</ol>'
        : '<p class="empty">' + (q ? "No paper matches your search." :
          "No papers in the last " + window_days + " days yet. The list is updated every morning.") + '</p>';
      math(root);
      olderBtn.hidden = !older.length;
      olderBtn.textContent = showOlder ? "Show only the last " + window_days + " days"
        : "Show older papers (" + older.length + ")";
      meta.textContent = recent.length + (recent.length === 1 ? " paper" : " papers") +
        " in the last " + window_days + " days";
    }

    loadPapers().then(function (data) {
      all = data.papers || [];
      window_days = data.window_days || 60;
      var upd = $("papers-updated");
      if (upd && data.updated) upd.textContent = "List last changed on " + longDate(data.updated) + ".";
      render();
      if (COMMENTS_READY && all.length) {
        getJSON(API + "/api/counts").then(function (d) { counts = d.counts || {}; render(); })
          .catch(function () { /* counts are optional */ });
      }
    }).catch(function () {
      root.innerHTML = '<p class="empty">The paper list could not be loaded. Please reload the page.</p>';
    });

    search.addEventListener("input", render);
    olderBtn.addEventListener("click", function () { showOlder = !showOlder; render(); });
  }

  /* ------------------------------------------------------------ paper page */
  function paperPage(root) {
    var id = new URLSearchParams(location.search).get("id") || "";

    // Admin link: paper.html?id=...#admin=KEY stores the key for this tab only.
    var m = location.hash.match(/admin=([^&]+)/);
    if (m) {
      try { sessionStorage.setItem("ff_admin_key", decodeURIComponent(m[1])); } catch (e) {}
      history.replaceState(null, "", location.pathname + location.search);
    }

    loadPapers().then(function (data) {
      var p = (data.papers || []).filter(function (x) { return x.id === id; })[0];
      if (!p) return notFound();
      showPaper(p);
    }).catch(function () {
      root.innerHTML = '<p class="empty">The paper could not be loaded. Please reload the page.</p>';
    });

    function notFound() {
      root.innerHTML = '<div class="wrap"><div class="talk-wrap">' +
        '<a class="back" href="papers.html">← Preprint watch</a>' +
        '<p class="kicker">Paper not found</p><h1 class="talk-h1">This paper is not in our list.</h1>' +
        '<p>The link may be mistyped, or the paper was removed from the list.' +
        (/^\d{4}\.\d{4,5}$/.test(id) ? ' You can still <a href="https://arxiv.org/abs/' + esc(id) + '" rel="noopener">read it on arXiv</a>.' : "") +
        '</p></div></div>';
    }

    function showPaper(p) {
      document.title = plainTitle(p.title) + " · Flavor Forum";
      var abs = "https://arxiv.org/abs/" + p.id, pdf = "https://arxiv.org/pdf/" + p.id,
        html = "https://arxiv.org/html/" + p.id;
      var total = p.n_authors || p.authors.length;
      var authors = p.authors.map(function (a) {
        return a.in ? '<span class="au au-in" title="Affiliated with an institute in India">' + esc(a.n) + '</span>'
          : '<span class="au">' + esc(a.n) + '</span>';
      }).join(", ");
      if (total > p.authors.length) authors += ' <span class="au-more">+ ' + (total - p.authors.length) + ' more authors</span>';

      root.innerHTML =
        '<div class="wrap"><header class="paper-head">' +
        '<a class="back" href="papers.html">← Preprint watch</a>' +
        '<p class="kicker">arXiv:' + esc(p.id) + (p.categories ? ' · ' + esc(p.categories.join(", ")) : "") +
        ' · ' + esc(longDate(p.date)) + '</p>' +
        '<h1 class="talk-h1">' + esc(p.title) + '</h1>' +
        (p.collaboration ? '<p class="collab">' + esc(p.collaboration) + ' Collaboration</p>' : "") +
        '<p class="authors">' + authors + '</p>' +
        (p.institutes && p.institutes.length ? '<p class="chips">' + p.institutes.map(function (i) {
          return '<span class="chip">' + esc(i) + '</span>'; }).join("") + '</p>' : "") +
        '<p class="paper-links">' +
        '<a class="btn btn-small" href="' + abs + '" target="_blank" rel="noopener">arXiv page</a>' +
        '<a class="btn btn-small btn-quiet" href="' + pdf + '" target="_blank" rel="noopener">PDF</a>' +
        (p.html ? '<a class="btn btn-small btn-quiet" href="' + html + '" target="_blank" rel="noopener">HTML</a>' : "") +
        (p.inspire ? '<a class="btn btn-small btn-quiet" href="https://inspirehep.net/literature/' + esc(p.inspire) + '" target="_blank" rel="noopener">INSPIRE</a>' : "") +
        '</p>' +
        '<details class="abstract" open><summary>Abstract</summary><p>' + esc(p.abstract) + '</p></details>' +
        '</header></div>' +
        '<div class="paper-layout">' +
        '<section class="reader" id="reader" aria-label="Read the paper"></section>' +
        '<section class="discussion" id="discussion" aria-labelledby="disc-h"></section>' +
        '</div>';
      math(root.querySelector(".paper-head"));
      reader($("reader"), p, pdf, html);
      comments($("discussion"), p);
    }
  }

  /* ------------------------------------------------------------ reader */
  function reader(el, p, pdf, html) {
    var small = window.matchMedia("(max-width: 700px)").matches;
    if (CFG.EMBED_READER === false || (small && !p.html)) {
      el.innerHTML = '<div class="reader-off"><p>' +
        (small ? "On a phone the paper reads best in its own tab." : "Read the paper on arXiv.") +
        '</p><p><a class="btn" href="' + (p.html ? html : pdf) + '" target="_blank" rel="noopener">Open the paper</a></p></div>';
      return;
    }
    // Desktop starts with the PDF; phones start with arXiv's HTML version.
    var mode = small ? "html" : "pdf";
    el.innerHTML =
      '<div class="reader-bar">' +
      '<div class="seg" role="group" aria-label="Format">' +
      '<button type="button" data-mode="pdf">PDF</button>' +
      (p.html ? '<button type="button" data-mode="html">HTML</button>' : "") +
      '</div>' +
      '<a id="reader-open" href="#" target="_blank" rel="noopener">Open in a new tab ↗</a>' +
      '</div>' +
      '<iframe id="reader-frame" title="Paper: arXiv ' + esc(p.id) + '" loading="lazy" allow="fullscreen"></iframe>' +
      '<p class="reader-note">Shown from arXiv. If the paper does not appear above, use “Open in a new tab”.</p>';
    var frame = $("reader-frame"), open = $("reader-open");
    function set(m) {
      mode = m;
      var src = m === "html" ? html : pdf;
      if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
      open.href = src;
      Array.prototype.forEach.call(el.querySelectorAll(".seg button"), function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-mode") === m ? "true" : "false");
      });
    }
    el.querySelector(".seg").addEventListener("click", function (e) {
      var m = e.target.getAttribute && e.target.getAttribute("data-mode");
      if (m) set(m);
    });
    set(mode);
  }

  /* ------------------------------------------------------------ comments */
  function renderBody(text) {
    var safe = esc(text);
    safe = safe.replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="nofollow ugc noopener">' + u + '</a>';
    });
    return safe.split(/\n{2,}/).map(function (para) {
      return "<p>" + para.replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function comments(el, p) {
    var isAdmin = !!adminKey();
    var items = [], replyTo = null, widgetId = null;

    el.innerHTML =
      '<h2 id="disc-h">Discussion <span class="count" id="c-count"></span></h2>' +
      (COMMENTS_READY ?
        '<form class="c-form" id="c-form" novalidate>' +
        '<div class="replying" id="c-replying" hidden></div>' +
        '<label class="sr" for="c-body">Your comment</label>' +
        '<textarea id="c-body" rows="4" maxlength="4000" placeholder="Share a question, a remark or a related reference. Maths as $...$ works." required></textarea>' +
        '<div class="c-row">' +
        '<label class="sr" for="c-name">Name (optional)</label>' +
        '<input id="c-name" type="text" maxlength="60" autocomplete="name" placeholder="Name (optional)">' +
        '<button class="btn btn-small" type="submit" id="c-send">Post</button>' +
        '</div>' +
        '<input type="text" name="website" id="c-website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div id="c-turnstile" class="c-turnstile"></div>' +
        '<p class="c-msg" id="c-msg" role="status"></p>' +
        '<p class="c-note">No login needed. Leave the name empty to post as Anonymous. Names are not verified. ' +
        'Please be respectful; comments that break this may be removed.</p>' +
        '</form>'
        : '<p class="c-note">Comments are not switched on yet.</p>') +
      '<div class="c-preview" id="c-preview" hidden><p class="c-preview-label">Preview</p><div id="c-preview-body"></div></div>' +
      '<ol class="c-list" id="c-list"><li class="c-loading">Loading comments…</li></ol>';

    if (!COMMENTS_READY) { $("c-list").innerHTML = ""; return; }

    var form = $("c-form"), body = $("c-body"), name = $("c-name"), msg = $("c-msg"),
      send = $("c-send"), list = $("c-list");
    name.value = recall("ff_name");

    // Turnstile spam check (shown only if Cloudflare needs the visitor to click).
    window.ffTurnstileReady = function () {
      if (!window.turnstile || widgetId !== null) return;
      widgetId = window.turnstile.render("#c-turnstile", {
        sitekey: SITEKEY, appearance: "interaction-only", "refresh-expired": "auto", action: "comment"
      });
    };
    var ts = document.createElement("script");
    ts.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ffTurnstileReady";
    ts.async = true; ts.defer = true;
    document.head.appendChild(ts);

    // Live preview of maths.
    var prevBox = $("c-preview"), prevBody = $("c-preview-body"), prevTimer = null;
    body.addEventListener("input", function () {
      clearTimeout(prevTimer);
      prevTimer = setTimeout(function () {
        var v = body.value.trim();
        prevBox.hidden = v.indexOf("$") < 0 && v.indexOf("\\(") < 0;
        if (!prevBox.hidden) { prevBody.innerHTML = renderBody(v); math(prevBody); }
      }, 250);
    });

    function setReply(c) {
      replyTo = c ? c.id : null;
      var box = $("c-replying");
      if (c) {
        box.innerHTML = 'Replying to <strong>' + esc(c.name || "Anonymous") + '</strong> ' +
          '<button type="button" class="linkish" id="c-cancel">Cancel</button>';
        box.hidden = false;
        $("c-cancel").onclick = function () { setReply(null); };
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        body.focus({ preventScroll: true });
      } else {
        box.hidden = true; box.innerHTML = "";
      }
    }

    function one(c, isReply) {
      return '<li class="c-item' + (isReply ? " c-reply" : "") + '" id="c' + c.id + '">' +
        '<div class="c-meta"><span class="c-name' + (c.name ? "" : " anon") + '">' + esc(c.name || "Anonymous") + '</span>' +
        '<time datetime="' + esc(c.created_at) + '" title="' + esc(fullTime(c.created_at)) + '">' + esc(timeAgo(c.created_at)) + '</time></div>' +
        '<div class="c-body">' + renderBody(c.body) + '</div>' +
        '<div class="c-actions">' +
        (isReply ? "" : '<button type="button" class="linkish" data-reply="' + c.id + '">Reply</button>') +
        (isAdmin ? '<button type="button" class="linkish danger" data-hide="' + c.id + '">Hide</button>' : "") +
        '</div></li>';
    }

    function draw() {
      var tops = items.filter(function (c) { return !c.parent_id; });
      var html = tops.map(function (c) {
        var kids = items.filter(function (r) { return r.parent_id === c.id; });
        return one(c, false) + (kids.length ? '<li class="c-kids"><ol>' + kids.map(function (r) { return one(r, true); }).join("") + '</ol></li>' : "");
      }).join("");
      list.innerHTML = html || '<li class="c-empty">No comments yet. Start the discussion.</li>';
      $("c-count").textContent = items.length ? "(" + items.length + ")" : "";
      math(list);
    }

    list.addEventListener("click", function (e) {
      var t = e.target;
      var r = t.getAttribute && t.getAttribute("data-reply");
      if (r) {
        setReply(items.filter(function (c) { return c.id === +r; })[0]);
        return;
      }
      var h = t.getAttribute && t.getAttribute("data-hide");
      if (h && confirmHide()) {
        getJSON(API + "/api/admin/hide", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + adminKey() },
          body: JSON.stringify({ id: +h, hidden: true })
        }).then(function () {
          items = items.filter(function (c) { return c.id !== +h && c.parent_id !== +h; });
          draw();
        }).catch(function (err) { msg.textContent = err.message; });
      }
    });
    function confirmHide() {
      // Two clicks instead of a browser dialog: the first arms the button.
      var now = Date.now();
      if (confirmHide.at && now - confirmHide.at < 4000) { confirmHide.at = 0; return true; }
      confirmHide.at = now;
      msg.textContent = "Click Hide again within 4 seconds to remove this comment.";
      return false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = body.value.trim();
      if (!text) { msg.textContent = "Please write a comment first."; body.focus(); return; }
      var token = window.turnstile && widgetId !== null ? window.turnstile.getResponse(widgetId) : "";
      if (!token) { msg.textContent = "The spam check is still running. Please wait a second and press Post again."; return; }
      send.disabled = true; msg.textContent = "Posting…";
      store("ff_name", name.value.trim());
      getJSON(API + "/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper: p.id, parent: replyTo, name: name.value.trim(), body: text,
          token: token, website: $("c-website").value })
      }).then(function (d) {
        if (d.comment) { items.push(d.comment); draw(); }
        body.value = ""; prevBox.hidden = true; setReply(null);
        msg.textContent = "Posted. Thank you!";
        var el2 = d.comment && $("c" + d.comment.id);
        if (el2) el2.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }).catch(function (err) {
        msg.textContent = err.message || "Could not post. Please try again.";
      }).then(function () {
        send.disabled = false;
        if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
      });
    });

    getJSON(API + "/api/comments?paper=" + encodeURIComponent(p.id)).then(function (d) {
      items = d.comments || [];
      draw();
      if (location.hash && /^#c\d+$/.test(location.hash)) {
        var target = document.querySelector(location.hash);
        if (target) target.scrollIntoView();
      }
    }).catch(function () {
      list.innerHTML = '<li class="c-empty">Comments could not be loaded. Please reload the page.</li>';
    });
  }

  /* ------------------------------------------------------------ admin page */
  function adminPage(root) {
    var keyInput = $("admin-key"), out = $("admin-out");
    keyInput.value = adminKey();
    $("admin-form").addEventListener("submit", function (e) {
      e.preventDefault();
      try { sessionStorage.setItem("ff_admin_key", keyInput.value.trim()); } catch (x) {}
      load();
    });
    function load() {
      if (!COMMENTS_READY) { out.innerHTML = "<p>Comments are not set up yet (see assets/comments-config.js).</p>"; return; }
      out.innerHTML = "<p>Loading…</p>";
      getJSON(API + "/api/admin/recent", { headers: { "Authorization": "Bearer " + adminKey() } })
        .then(function (d) {
          var rows = (d.comments || []).map(function (c) {
            return '<tr class="' + (c.hidden ? "is-hidden" : "") + '">' +
              '<td><a href="paper.html?id=' + encodeURIComponent(c.paper_id) + '#c' + c.id + '">' + esc(c.paper_id) + '</a></td>' +
              '<td>' + esc(c.name || "Anonymous") + (c.parent_id ? ' <span class="muted">(reply)</span>' : "") +
              '<br><span class="muted">' + esc(fullTime(c.created_at)) + '</span></td>' +
              '<td class="admin-body">' + esc(c.body) + '</td>' +
              '<td><button type="button" class="btn btn-small ' + (c.hidden ? "" : "btn-quiet") + '" data-id="' + c.id + '" data-hidden="' + (c.hidden ? 1 : 0) + '">' +
              (c.hidden ? "Show again" : "Hide") + '</button></td></tr>';
          }).join("");
          out.innerHTML = rows ? '<table class="admin-table"><thead><tr><th>Paper</th><th>Who</th><th>Comment</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
            : "<p>No comments yet.</p>";
        })
        .catch(function (err) { out.innerHTML = "<p>" + esc(err.message) + "</p>"; });
    }
    out.addEventListener("click", function (e) {
      var id = e.target.getAttribute && e.target.getAttribute("data-id");
      if (!id) return;
      var hidden = e.target.getAttribute("data-hidden") === "1";
      getJSON(API + "/api/admin/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + adminKey() },
        body: JSON.stringify({ id: +id, hidden: !hidden })
      }).then(load).catch(function (err) { alertBox(err.message); });
    });
    function alertBox(t) { out.insertAdjacentHTML("afterbegin", '<p class="c-msg">' + esc(t) + "</p>"); }
    if (keyInput.value) load();
  }

  /* ------------------------------------------------------------ start */
  var el;
  if ((el = $("paper-list"))) listPage(el);
  if ((el = $("paper-page"))) paperPage(el);
  if ((el = $("admin-page"))) adminPage(el);
})();
