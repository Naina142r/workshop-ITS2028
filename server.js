const express = require('express'), Database = require('better-sqlite3'), crypto = require('crypto');
const fs = require('fs');
const DB_FILE = process.env.DB_PATH || 'data.db';
if (!fs.existsSync(DB_FILE)) { console.error(`Database file "${DB_FILE}" not found. Include data.db in the project folder (or run: npm run init-db).`); process.exit(1); }
const db = new Database(DB_FILE); db.pragma('journal_mode = WAL');

// Edit these freely: weekly challenges cycle through the list across the year.
const CHALLENGES = [
  ['Name your chives', 'Give your chive clump a name and tell it hello. Post the name in the forum!'],
  ['Measure & sketch', 'Measure your tallest blade and draw or photograph your plant.'],
  ['Water like a pro', 'Check the soil daily: water deeply when the top inch is dry. Chives hate soggy roots.'],
  ['Sun spotting', 'Track where the sun hits your chives at 9am, 12pm and 3pm. Aim for 6+ hours.'],
  ['First harvest', 'Once blades are 6-8" tall, snip a handful 1-2" above the soil. Never cut to the ground!'],
  ['Pest patrol', 'Check the leaf bases for aphids, thrips and onion fly. Remove any yellow or mushy blades.'],
  ['Share a tip', 'Post one care tip or question in the forum and reply to someone else.'],
  ['Cook with chives', 'Make jiaozi, scrambled eggs with chives (韭菜炒蛋), pancakes or dumpling filling. Share the recipe!'],
  ['Flower watch', 'Look for flower stalks. Eat the buds or deadhead blooms so your plant keeps making leaves.'],
  ['Feed & mulch', 'Add compost or a light mulch around the clump to feed it and keep the soil moist.'],
  ['Teach a friend', 'Show someone how to grow chives or gift them a division of your clump.'],
  ['Photo day', 'Take a photo of your plant today and compare it with day one.']
];
const POINTS = { checkin: 10, streakMax: 7, challenge: 50, post: 5, comment: 2, vote: 2 };
const BADGES = [
  ['🌱', 'Seedling', 'First check-in', s => s.checkins >= 1],
  ['🔥', 'On a Roll', '7-day streak', s => s.longest >= 7],
  ['🌿', 'Sprout', '100 points', s => s.points >= 100],
  ['🥬', 'Tall Blades', '500 points', s => s.points >= 500],
  ['🏅', 'Challenger', '5 weekly challenges', s => s.challenges >= 5],
  ['💬', 'Community Voice', '3 forum posts', s => s.posts >= 3],
  ['⚡', 'Streak Master', '30-day streak', s => s.longest >= 30],
  ['👑', 'Chive Champion', '1000 points', s => s.points >= 1000],
  ['🏆', 'Year Grower', '365 check-ins', s => s.checkins >= 365]
];

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
const add = (uid, n) => db.prepare('UPDATE users SET points=points+? WHERE id=?').run(n, uid);
const dayNum = d => Math.floor(Date.parse(d + 'T00:00:00Z') / 864e5);
const validDay = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && Math.abs(dayNum(d) - Math.floor(Date.now() / 864e5)) <= 1;

function stats(uid) {
  const days = db.prepare('SELECT day FROM checkins WHERE user_id=? ORDER BY day').all(uid).map(r => dayNum(r.day));
  let longest = 0, run = 0;
  days.forEach((d, i) => { run = i && d === days[i - 1] + 1 ? run + 1 : 1; longest = Math.max(longest, run); });
  let streak = 0; const last = days[days.length - 1], now = dayNum(new Date().toISOString().slice(0, 10));
  if (last !== undefined && now - last <= 1) streak = run;
  const c = t => db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE user_id=?`).get(uid).n;
  const points = db.prepare('SELECT points FROM users WHERE id=?').get(uid).points;
  const s = { checkins: days.length, streak, longest, challenges: c('completions'), posts: c('posts'), points };
  s.badges = BADGES.map(([icon, name, desc, f]) => ({ icon, name, desc, earned: f(s) }));
  return s;
}

const app = express(); app.use(express.json({ limit: '50kb' })); app.use(express.static('public'));
const cookie = (req, k) => (req.headers.cookie || '').split(/;\s*/).map(c => c.split('=')).find(c => c[0] === k)?.[1];
app.use((req, res, next) => {
  const t = cookie(req, 'sid');
  req.uid = t ? db.prepare('SELECT user_id FROM sessions WHERE token=?').get(t)?.user_id : null; next();
});
const need = (req, res, next) => req.uid ? next() : res.status(401).json({ error: 'Please sign in first.' });
const clean = (s, n) => String(s || '').trim().slice(0, n);
const login = (res, uid) => {
  const t = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?)').run(t, uid);
  res.setHeader('Set-Cookie', `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000`);
};

app.post('/api/signup', (req, res) => {
  const name = clean(req.body.name, 30), email = clean(req.body.email, 100).toLowerCase(), pw = String(req.body.password || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || pw.length < 6) return res.status(400).json({ error: 'Enter a name, valid email and a password of 6+ characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return res.status(400).json({ error: 'That email is already registered.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const id = db.prepare('INSERT INTO users(name,email,hash,salt) VALUES(?,?,?,?)').run(name, email, hash(pw, salt), salt).lastInsertRowid;
  login(res, id); res.json({ ok: true });
});
app.post('/api/login', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(clean(req.body.email, 100).toLowerCase());
  const ok = u && crypto.timingSafeEqual(Buffer.from(hash(String(req.body.password || ''), u.salt)), Buffer.from(u.hash));
  if (!ok) return res.status(400).json({ error: 'Wrong email or password.' });
  login(res, u.id); res.json({ ok: true });
});
app.post('/api/logout', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token=?').run(cookie(req, 'sid'));
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.uid) return res.json({ user: null });
  res.json({ user: db.prepare('SELECT id,name,planted,points FROM users WHERE id=?').get(req.uid) });
});
app.post('/api/plant', need, (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.planted || '')) return res.status(400).json({ error: 'Pick a valid date.' });
  db.prepare('UPDATE users SET planted=? WHERE id=?').run(req.body.planted, req.uid); res.json({ ok: true });
});

app.get('/api/state', need, (req, res) => {
  const u = db.prepare('SELECT id,name,planted,points FROM users WHERE id=?').get(req.uid), s = stats(req.uid);
  const d = req.query.d; const day = u.planted ? Math.max(1, dayNum(validDay(d) ? d : new Date().toISOString().slice(0, 10)) - dayNum(u.planted) + 1) : null;
  const week = day ? Math.floor((day - 1) / 7) + 1 : null, ch = week ? CHALLENGES[(week - 1) % CHALLENGES.length] : null;
  res.json({
    user: u, stats: s, day, week,
    challenge: ch && { title: ch[0], text: ch[1], done: !!db.prepare('SELECT 1 FROM completions WHERE user_id=? AND week=?').get(req.uid, week) },
    checkins: db.prepare('SELECT day,note,height,watered FROM checkins WHERE user_id=? ORDER BY day DESC').all(req.uid),
    rules: POINTS
  });
});
app.post('/api/checkin', need, (req, res) => {
  const { day, note, height, watered } = req.body;
  if (!validDay(day)) return res.status(400).json({ error: 'Invalid date.' });
  const r = db.prepare('INSERT OR IGNORE INTO checkins VALUES(?,?,?,?,?)').run(req.uid, day, clean(note, 300), Number(height) || null, watered ? 1 : 0);
  if (!r.changes) return res.status(400).json({ error: 'Already checked in today!' });
  const s = stats(req.uid), pts = POINTS.checkin + Math.min(s.streak, POINTS.streakMax);
  add(req.uid, pts); res.json({ ok: true, pts, streak: s.streak });
});
app.post('/api/challenge', need, (req, res) => {
  const u = db.prepare('SELECT planted FROM users WHERE id=?').get(req.uid);
  if (!u.planted) return res.status(400).json({ error: 'Set your planting date first.' });
  const week = Math.floor((dayNum(new Date().toISOString().slice(0, 10)) - dayNum(u.planted)) / 7) + 1;
  if (!db.prepare('INSERT OR IGNORE INTO completions VALUES(?,?)').run(req.uid, week).changes) return res.status(400).json({ error: 'Already done this week.' });
  add(req.uid, POINTS.challenge); res.json({ ok: true });
});

app.get('/api/posts', (req, res) => {
  const posts = db.prepare('SELECT p.*,u.name FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.id DESC LIMIT 100').all();
  const cq = db.prepare('SELECT c.*,u.name FROM comments c JOIN users u ON u.id=c.user_id WHERE post_id=? ORDER BY c.id');
  res.json(posts.map(p => ({ ...p, comments: cq.all(p.id) })));
});
app.post('/api/posts', need, (req, res) => {
  const title = clean(req.body.title, 100), body = clean(req.body.body, 2000);
  if (!title || !body) return res.status(400).json({ error: 'Add a title and your tip.' });
  db.prepare('INSERT INTO posts(user_id,title,body) VALUES(?,?,?)').run(req.uid, title, body); add(req.uid, POINTS.post); res.json({ ok: true });
});
app.post('/api/posts/:id/comments', need, (req, res) => {
  const body = clean(req.body.body, 1000); if (!body) return res.status(400).json({ error: 'Write something first.' });
  db.prepare('INSERT INTO comments(post_id,user_id,body) VALUES(?,?,?)').run(req.params.id, req.uid, body); add(req.uid, POINTS.comment); res.json({ ok: true });
});

app.get('/api/polls', (req, res) => {
  res.json(db.prepare('SELECT * FROM polls ORDER BY id DESC').all().map(p => ({
    ...p, myVote: req.uid ? db.prepare('SELECT option_id FROM votes WHERE user_id=? AND poll_id=?').get(req.uid, p.id)?.option_id : null,
    options: db.prepare('SELECT o.id,o.label,(SELECT COUNT(*) FROM votes v WHERE v.option_id=o.id) votes FROM poll_options o WHERE poll_id=?').all(p.id)
  })));
});
app.post('/api/polls', need, (req, res) => {
  const q = clean(req.body.question, 150), opts = (req.body.options || []).map(o => clean(o, 80)).filter(Boolean).slice(0, 6);
  if (!q || opts.length < 2) return res.status(400).json({ error: 'Add a question and at least 2 options.' });
  const id = db.prepare('INSERT INTO polls(question,user_id) VALUES(?,?)').run(q, req.uid).lastInsertRowid;
  opts.forEach(o => db.prepare('INSERT INTO poll_options(poll_id,label) VALUES(?,?)').run(id, o)); res.json({ ok: true });
});
app.post('/api/polls/:id/vote', need, (req, res) => {
  const o = db.prepare('SELECT 1 FROM poll_options WHERE id=? AND poll_id=?').get(req.body.option, req.params.id);
  if (!o || !db.prepare('INSERT OR IGNORE INTO votes VALUES(?,?,?)').run(req.uid, req.params.id, req.body.option).changes) return res.status(400).json({ error: 'You already voted.' });
  add(req.uid, POINTS.vote); res.json({ ok: true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(db.prepare('SELECT id,name,points FROM users ORDER BY points DESC LIMIT 20').all().map(u => ({ ...u, badges: stats(u.id).badges.filter(b => b.earned).map(b => b.icon) })));
});
app.get('/api/profile/:id', (req, res) => {
  const u = db.prepare('SELECT id,name,planted,joined FROM users WHERE id=?').get(req.params.id);
  u ? res.json({ ...u, stats: stats(u.id) }) : res.status(404).json({ error: 'Not found' });
});

app.listen(process.env.PORT || 3000, () => console.log('Chive Journey running on http://localhost:' + (process.env.PORT || 3000)));
