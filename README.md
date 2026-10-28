# 🌿 Chive Journey 韭菜

Workshop companion site for growing Chinese chives: care guide, 365-day plant tracker, daily check-ins + streak
points, weekly challenges, badges on profiles, community forum, audience polls, leaderboard, user accounts.

## Run locally
1. Install Node.js 18+
2. `npm install` then `npm start`
3. Open http://localhost:3000  (do NOT open index.html directly)

The database is the ready-made file **`data.db`** (SQLite) included in this folder. `schema.sql` shows its tables.
To reset it: delete `data.db`, then run `npm run init-db`.

## Put it on GitHub
```bash
git init && git add . && git commit -m "Chive Journey"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/chive-journey.git
git push -u origin main
```
> GitHub Pages can't run this app (it needs a Node server). Use GitHub for the code, and Render/Railway for the live site.

## Make it live
**Render:** New → Blueprint → pick your repo. `render.yaml` uses a persistent disk (paid `starter` plan) at
`/var/data`. On first deploy, set the Render start command to `npm run init-db && npm start` so the file is created
on the disk. For the free plan: set `plan: free`, delete the `disk:` block and `DB_PATH`; the committed `data.db`
is used, but data resets on redeploy/restart.

## Customize (top of server.js)
`CHALLENGES`, `POINTS`, `BADGES`. Care-guide text is in `public/index.html`.
