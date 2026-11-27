/*
  Flavor Forum: settings for the papers pages and comments.

  COMMENTS_API       address of the comments service (Cloudflare Worker), printed
                     by `npx wrangler deploy`, e.g.
                     "https://flavorforum-comments.yourname.workers.dev"
  TURNSTILE_SITEKEY  "Site key" of the Turnstile widget (Cloudflare dashboard →
                     Turnstile). The secret key goes in the Worker, never here.
  EMBED_READER       true: show the paper from arXiv inside the page.
                     false: show only "Open on arXiv" buttons.

  Both values above are public by design; it is fine that they are in this file.
*/
window.FF_CONFIG = {
  COMMENTS_API: "https://flavorforum-comments.flavourforum.workers.dev",
  TURNSTILE_SITEKEY: "0x4AAAAAAGVgjVruMA8WRZwO",
  EMBED_READER: true
};
