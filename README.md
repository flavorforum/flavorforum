# Flavor Forum website

Static website for Flavor Forum, hosted on GitHub Pages at <https://flavorforum.in>.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: two upcoming events, recent talks, contact |
| `past-talks.html` | List of all past talks, grouped by year |
| `talk.html?id=...` | One talk: title, abstract, speaker details |
| `papers.html` | Preprint watch: recent flavor papers from groups in India (last 60 days), as cards |
| `paper.html?id=<arXiv number>` | One paper: details, the paper itself (from arXiv), and comments |
| `admin.html` | Moderation of comments (not linked from the site) |
| `discussion-room.html` | Discussion room: rules and the Join button |
| `room.html` | The video call itself (Daily), opened in a new tab by the Join button |
| `404.html` | Page shown for a wrong link |

## Everyday edits

**Add a past talk.** Open `assets/talks.js`, copy one block, paste it at the top of the list and change the fields. The past-talks list, the talk page and the "Recent talks" on the home page update by themselves. Titles and abstracts can use `<sub>` and `<sup>`, for example `B<sub>s</sub> → μ<sup>+</sup>μ<sup>−</sup>`.

**Change the upcoming events.** Edit the two `<article class="ad ...">` blocks in `index.html`. When a date is fixed, replace `To be announced` with the date and time. After the talk, delete the block and add the talk to `assets/talks.js`.

**Do not put meeting passcodes or admin tokens in this repository.** Everything here is public.

## Discussion room

The call runs on Daily (dashboard.daily.co) and is shown inside `room.html`, so visitors stay on flavorforum.in. The room address is set in one line near the bottom of `room.html` (`ROOM_URL`). The Daily library is kept in `assets/vendor/` so the site does not depend on an outside script host.

**Admin link.** An owner token gives the holder host controls (mute or remove people, end the meeting for all). Make one with the API key from the Daily dashboard (Developers → API keys):

```
curl -s -X POST https://api.daily.co/v1/meeting-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"properties":{"room_name":"flavorforum_general","is_owner":true,"user_name":"Flavor Forum (host)","exp":1830297600}}'
```

It prints `{"token":"..."}`. The admin link is `https://flavorforum.in/room.html#t=` followed by the token. Keep it private and do not commit it here. The token expires on 1 January 2028; run the command again to make a new one.

## Preprint watch and comments

### How it works

- **Paper list.** Every morning at 06:47 IST, the workflow `.github/workflows/site.yml` runs `scripts/fetch_papers.py`. It asks INSPIRE for new hep-ph, hep-ex and hep-lat papers, keeps those with an author at an institute in India whose title or abstract matches a line in `scripts/flavour-keywords.txt`, and writes `assets/papers.json`. The same workflow then publishes the site. Papers older than 60 days stay in the file, so their pages and comments keep working; `papers.html` shows them under "Show older papers".
- **Reading.** `paper.html` shows the paper from arXiv inside the page (PDF on computers, arXiv's HTML version on phones when it exists). The PDF itself is never copied to this site.
- **Comments.** These are stored by a small Cloudflare Worker with a D1 database (code in `worker/`). Free plan, no login for visitors. A Cloudflare Turnstile check, rate limits (4 comments per 10 minutes and 30 per day per visitor) and a hidden trap field keep out spam. Visitor IP addresses are never stored, only a salted hash used for the rate limits.

### Everyday edits

- **A flavor paper is missing:** add its arXiv number to `scripts/include.txt`.
- **An off-topic paper is listed:** add its arXiv number to `scripts/exclude.txt`.
- **Change what counts as flavor:** edit `scripts/flavour-keywords.txt` (one pattern per line, explained at the top of the file).

Commit the change; the workflow runs on every push, so the list updates within a few minutes. To run it at any other time: **Actions → Update papers and publish site → Run workflow**.

**Moderation.** Open <https://flavorforum.in/admin.html> and enter the admin key. It lists the latest 200 comments with Hide / Show again buttons. While that tab is open, paper pages also show a Hide button under each comment (click it twice). Hiding a comment also hides its replies.

### One-time setup (about 30–40 minutes)

**1. Switch Pages to the workflow.** In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Check that the custom domain still shows `flavorforum.in` on the same page. Push these files; the workflow fills `assets/papers.json` and publishes the site. (Commits made by a workflow do not start a normal Pages build, which is why the workflow publishes the site itself.)

**2. Cloudflare account.** Sign up free at <https://dash.cloudflare.com/sign-up> (no card needed). Your DNS can stay where it is.

**3. Turnstile (spam check).** Dashboard → **Turnstile → Add widget**. Name: Flavor Forum. Hostnames: `flavorforum.in`, `www.flavorforum.in`, `localhost`. Widget mode: Managed. It shows a **Site key** and a **Secret key**; keep the page open.

**4. Comments service.** Needs Node.js (on macOS: `brew install node`). In a terminal:

```
cd worker
npx wrangler login                                   # opens the browser once
npx wrangler d1 create flavorforum-comments          # prints a database_id
```

Paste the printed `database_id` into `worker/wrangler.toml`, then:

```
npx wrangler d1 execute flavorforum-comments --remote --file=schema.sql
npx wrangler secret put TURNSTILE_SECRET    # paste the Turnstile Secret key
npx wrangler secret put ADMIN_KEY           # paste a long random password (keep it safe)
npx wrangler secret put IP_SALT             # paste another long random string
npx wrangler deploy                         # prints https://flavorforum-comments.<name>.workers.dev
```

A random string for the last two: `openssl rand -hex 24`.

**5. Connect the site.** In `assets/comments-config.js` set `COMMENTS_API` to the address printed by `wrangler deploy` and `TURNSTILE_SITEKEY` to the Turnstile Site key. Commit and push. Both values are public by design; the secret key and admin key are only in Cloudflare.

**6. Check.** Open a paper on <https://flavorforum.in/papers.html>, post a test comment, then hide it from `admin.html`.

If the paper does not appear inside the page (arXiv may refuse to be shown inside another site), set `EMBED_READER: false` in `assets/comments-config.js`; the page then shows "Open the paper" buttons instead.

**Limits of the free plans:** 100,000 Worker requests per day and 5 GB of D1 storage, far more than this site needs. GitHub turns off scheduled workflows in a repository with no activity for 60 days; if that happens, re-enable it under the Actions tab.

### Testing on your computer

Run the site with `python3 -m http.server 8000` as below. To test comments locally, in `worker/` create a file `.dev.vars` containing

```
DEV_SKIP_TURNSTILE=1
ADMIN_KEY=local-test-admin-key-123
IP_SALT=local
```

then run `npx wrangler d1 execute flavorforum-comments --local --file=schema.sql` and `npx wrangler dev`, and set `COMMENTS_API` to `http://localhost:8787` while testing. Do not commit `.dev.vars`.

## Publishing on GitHub Pages

1. Create a public repository and upload all files in this folder, including `CNAME` and `.nojekyll`.
2. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The `CNAME` file sets the custom domain to `flavorforum.in`. At the domain registrar, add:
   - four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - one `CNAME` record for `www` pointing to `<your-github-username>.github.io`
4. When **Settings → Pages** shows the DNS check as successful, tick **Enforce HTTPS**.

Until the DNS records work, the site will not load at the github.io address either, because GitHub redirects it to the custom domain. To preview before that, delete `CNAME` for now and add the domain back in Settings → Pages later.

## Preview on your computer

From this folder run `python3 -m http.server 8000` and open <http://localhost:8000>.
