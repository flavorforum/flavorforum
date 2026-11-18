# Flavor Forum website

Static website for Flavor Forum, hosted on GitHub Pages at <https://flavorforum.in>.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: two upcoming events, recent talks, contact |
| `past-talks.html` | List of all past talks, grouped by year |
| `talk.html?id=...` | One talk: title, abstract, speaker details |
| `discussion-room.html` | Discussion room (coming soon) |
| `404.html` | Page shown for a wrong link |

## Everyday edits

**Add a past talk.** Open `assets/talks.js`, copy one block, paste it at the top of the list and change the fields. The past-talks list, the talk page and the "Recent talks" on the home page update by themselves. Titles and abstracts can use `<sub>` and `<sup>`, for example `B<sub>s</sub> → μ<sup>+</sup>μ<sup>−</sup>`.

**Change the upcoming events.** Edit the two `<article class="ad ...">` blocks in `index.html`. When a date is fixed, replace `To be announced` with the date and time. After the talk, delete the block and add the talk to `assets/talks.js`.

**Do not put meeting links or passcodes in this repository.** Everything here is public.

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
