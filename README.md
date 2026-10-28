# 🥬 Lettuce Journey

Workshop companion site: lettuce care guide, 365-day plant tracker, daily check-ins + streak points,
weekly challenges, badges on profiles, community forum, audience polls, leaderboard, user accounts.

## Run locally
1. Install Node.js 18+
2. `npm install` then `npm start`
3. Open http://localhost:3000  (data saved in `data.db`)

## Put it on GitHub
```bash
git init && git add . && git commit -m "Lettuce Journey"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/lettuce-journey.git
git push -u origin main
```
(Or create an empty repo on github.com and drag-and-drop all files, including the `public` folder.)

> GitHub Pages can't run this app because it needs a Node server. Use GitHub for the code and a host below for the live site.

## Make it live (free-ish, auto-deploys from your GitHub repo)
**Render:** New → Blueprint → pick your repo (it reads `render.yaml`). The `starter` plan keeps `data.db` on a
persistent disk. On the free plan, change `plan: free`, delete the `disk:` block and `DB_PATH`; the site works but
data resets when it redeploys or restarts.
**Railway/Fly.io:** connect the repo, start command `npm start`, add a volume and set `DB_PATH` to a path on it.

Share the URL (or a QR code) at your workshop.

## Customize (top of server.js)
`CHALLENGES` (weekly), `POINTS`, `BADGES`. Care-guide text is in `public/index.html`.
