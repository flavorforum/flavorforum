-- Flavor Forum comments database (Cloudflare D1).
-- Create once with:
--   npx wrangler d1 execute flavorforum-comments --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id   TEXT    NOT NULL,             -- arXiv number, e.g. 2611.01234
  parent_id  INTEGER,                      -- set for replies (one level only)
  name       TEXT    NOT NULL DEFAULT '',  -- empty means "Anonymous"
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL,             -- ISO time, UTC
  ip_hash    TEXT    NOT NULL,             -- salted hash, used only for rate limits
  hidden     INTEGER NOT NULL DEFAULT 0    -- 1 = removed by an admin
);

CREATE INDEX IF NOT EXISTS idx_comments_paper ON comments (paper_id, hidden, id);
CREATE INDEX IF NOT EXISTS idx_comments_ip    ON comments (ip_hash, created_at);
