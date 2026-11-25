/*
  Flavor Forum comments service (Cloudflare Worker + D1).

  Public endpoints
    GET  /api/comments?paper=2611.01234   comments on one paper (oldest first)
    GET  /api/counts                      { counts: { "2611.01234": 3, ... } }
    POST /api/comments                    add a comment (JSON, see below)

  Admin endpoints (header  Authorization: Bearer <ADMIN_KEY>)
    GET  /api/admin/recent                last 200 comments on all papers, hidden ones included
    POST /api/admin/hide                  { id, hidden: true|false }

  POST /api/comments body:
    { paper, parent (optional id), name (optional), body, token (Turnstile), website (honeypot, must be empty) }

  Protection against abuse:
    - Cloudflare Turnstile check on every new comment
    - at most 4 comments per 10 minutes and 30 per day from one visitor
    - length limits, at most 3 links per comment, no exact repeats
    - admins can hide any comment
  Visitor IP addresses are never stored; only a salted hash, for the limits above.
*/

const PAPER_RE = /^\d{4}\.\d{4,5}$/;
const MAX_NAME = 60;
const MAX_BODY = 4000;
const MAX_LINKS = 3;
const LIMIT_10_MIN = 4;
const LIMIT_DAY = 30;

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    try {
      if (request.method === "GET" && path === "/api/comments") return await listComments(url, env, cors);
      if (request.method === "GET" && path === "/api/counts") return await counts(env, cors);
      if (request.method === "POST" && path === "/api/comments") return await addComment(request, env, cors);
      if (path.startsWith("/api/admin/")) {
        if (!isAdmin(request, env)) return json({ error: "Wrong admin key." }, 401, cors);
        if (request.method === "GET" && path === "/api/admin/recent") return await adminRecent(env, cors);
        if (request.method === "POST" && path === "/api/admin/hide") return await adminHide(request, env, cors);
      }
      if (path === "" || path === "/") return json({ ok: true, service: "Flavor Forum comments" }, 200, cors);
      return json({ error: "Not found." }, 404, cors);
    } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      return json({ error: "Something went wrong on the server. Please try again later." }, 500, cors);
    }
  },
};

/* ---------------------------------------------------------------- public */

async function listComments(url, env, cors) {
  const paper = (url.searchParams.get("paper") || "").trim();
  if (!PAPER_RE.test(paper)) return json({ error: "Unknown paper." }, 400, cors);
  const { results } = await env.DB.prepare(
    "SELECT id, parent_id, name, body, created_at FROM comments WHERE paper_id = ? AND hidden = 0 ORDER BY id"
  ).bind(paper).all();
  return json({ comments: results }, 200, cors, "no-store");
}

async function counts(env, cors) {
  const { results } = await env.DB.prepare(
    "SELECT paper_id, COUNT(*) AS n FROM comments WHERE hidden = 0 GROUP BY paper_id"
  ).all();
  const out = {};
  for (const r of results) out[r.paper_id] = r.n;
  return json({ counts: out }, 200, cors, "public, max-age=60");
}

async function addComment(request, env, cors) {
  const raw = await request.text();
  if (raw.length > 20000) return json({ error: "Comment is too long." }, 413, cors);
  let data;
  try { data = JSON.parse(raw); } catch { return json({ error: "Bad request." }, 400, cors); }

  // Honeypot: real visitors never see or fill this field.
  if (data.website) return json({ ok: true }, 200, cors);

  const paper = String(data.paper || "").trim();
  const name = clean(String(data.name || "")).replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
  const body = clean(String(data.body || "")).replace(/\n{3,}/g, "\n\n").trim();
  let parent = data.parent == null || data.parent === "" ? null : Number(data.parent);

  if (!PAPER_RE.test(paper)) return json({ error: "Unknown paper." }, 400, cors);
  if (!body) return json({ error: "Please write a comment." }, 400, cors);
  if (body.length > MAX_BODY) return json({ error: `Please keep comments under ${MAX_BODY} characters.` }, 400, cors);
  const links = (body.match(/https?:\/\/|www\./gi) || []).length;
  if (links > MAX_LINKS) return json({ error: `Please include at most ${MAX_LINKS} links.` }, 400, cors);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!(await turnstileOk(String(data.token || ""), ip, env))) {
    return json({ error: "The spam check did not pass. Please reload the page and try again." }, 403, cors);
  }

  const ipHash = await sha256(ip + "|" + (env.IP_SALT || ""));
  const now = new Date();
  const tenMinAgo = new Date(now - 10 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 3600 * 1000).toISOString();
  const recent = await env.DB.prepare(
    "SELECT SUM(created_at > ?) AS short, COUNT(*) AS day FROM comments WHERE ip_hash = ? AND created_at > ?"
  ).bind(tenMinAgo, ipHash, dayAgo).first();
  if ((recent.short || 0) >= LIMIT_10_MIN || (recent.day || 0) >= LIMIT_DAY) {
    return json({ error: "You have posted many comments in a short time. Please wait a little and try again." }, 429, cors);
  }
  const dup = await env.DB.prepare(
    "SELECT id FROM comments WHERE ip_hash = ? AND paper_id = ? AND body = ? AND created_at > ? LIMIT 1"
  ).bind(ipHash, paper, body, dayAgo).first();
  if (dup) return json({ error: "This comment has already been posted." }, 409, cors);

  if (parent !== null) {
    if (!Number.isInteger(parent)) return json({ error: "Bad request." }, 400, cors);
    const p = await env.DB.prepare(
      "SELECT id, parent_id FROM comments WHERE id = ? AND paper_id = ? AND hidden = 0"
    ).bind(parent, paper).first();
    if (!p) return json({ error: "The comment you are replying to no longer exists." }, 400, cors);
    if (p.parent_id) parent = p.parent_id; // keep replies one level deep
  }

  const created = now.toISOString();
  const res = await env.DB.prepare(
    "INSERT INTO comments (paper_id, parent_id, name, body, created_at, ip_hash) VALUES (?, ?, ?, ?, ?, ?) RETURNING id"
  ).bind(paper, parent, name, body, created, ipHash).first();

  return json({ comment: { id: res.id, parent_id: parent, name, body, created_at: created } }, 201, cors);
}

/* ---------------------------------------------------------------- admin */

async function adminRecent(env, cors) {
  const { results } = await env.DB.prepare(
    "SELECT id, paper_id, parent_id, name, body, created_at, hidden FROM comments ORDER BY id DESC LIMIT 200"
  ).all();
  return json({ comments: results }, 200, cors, "no-store");
}

async function adminHide(request, env, cors) {
  let data;
  try { data = await request.json(); } catch { return json({ error: "Bad request." }, 400, cors); }
  const id = Number(data.id);
  if (!Number.isInteger(id)) return json({ error: "Bad request." }, 400, cors);
  const hidden = data.hidden === false ? 0 : 1;
  // Hiding a comment also hides its replies; unhiding brings them back.
  await env.DB.prepare("UPDATE comments SET hidden = ? WHERE id = ? OR parent_id = ?").bind(hidden, id, id).run();
  return json({ ok: true, id, hidden: !!hidden }, 200, cors);
}

function isAdmin(request, env) {
  const key = env.ADMIN_KEY || "";
  const got = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (key.length < 16 || got.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

/* ---------------------------------------------------------------- helpers */

async function turnstileOk(token, ip, env) {
  if (env.DEV_SKIP_TURNSTILE === "1") return true; // only set in .dev.vars for local testing
  if (!token || !env.TURNSTILE_SECRET) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!r.ok) return false;
  const out = await r.json();
  return out.success === true;
}

function clean(s) {
  // Remove control characters except newline and tab; normalise line endings.
  return s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "");
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = request.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(obj, status, cors, cache) {
  const headers = { "Content-Type": "application/json; charset=utf-8", ...cors };
  if (cache) headers["Cache-Control"] = cache;
  return new Response(JSON.stringify(obj), { status, headers });
}
