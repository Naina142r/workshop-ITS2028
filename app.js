const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const api = async (p, m = 'GET', b) => { const r = await fetch('/api/' + p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Something went wrong'); return d; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const toast = t => { const e = $('#toast'); e.textContent = t; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 2800); };
const dlg = $('#dlg'); let me = null, mode = 'in';
const val = id => document.getElementById(id).value;
const fail = e => toast('⚠️ ' + e.message);
const badgesHtml = b => `<div class="badges">${b.map(x => `<div class="badge ${x.earned ? '' : 'off'}" title="${esc(x.desc)}"><span>${x.icon}</span><b>${esc(x.name)}</b><br>${esc(x.desc)}</div>`).join('')}</div>`;

function setMode(m) { mode = m; $('#dt').textContent = m === 'in' ? 'Sign in' : 'Create account'; $('#fn').style.display = m === 'up' ? '' : 'none'; $('#sw').textContent = m === 'in' ? 'New here? Sign up' : 'Have an account? Sign in'; $('#ferr').textContent = ''; }
$('#sw').onclick = () => setMode(mode === 'in' ? 'up' : 'in');
function openAuth(m) { setMode(m); dlg.showModal(); }
$('#authForm').onsubmit = async e => {
  e.preventDefault();
  try { await api(mode === 'in' ? 'login' : 'signup', 'POST', { name: val('fn'), email: val('fe'), password: val('fp') }); dlg.close(); await init(); toast('Welcome! 🌱'); go('me'); }
  catch (x) { $('#ferr').textContent = x.message; }
};
async function logout() { await api('logout', 'POST'); me = null; await init(); go('home'); }
async function init() {
  me = (await api('me')).user;
  $('#auth').innerHTML = me ? `<a class="u" onclick="profile(${me.id})">${esc(me.name)}</a> · ${me.points} pts <button class="link" onclick="logout()">Sign out</button>` : `<button onclick="openAuth('in')">Sign in</button> <button onclick="openAuth('up')">Sign up</button>`;
}
const gate = el => { el.innerHTML = `<div class="card"><h2>Sign in to join in 🌱</h2><p>Create a free account to save your progress, earn points and post.</p><button onclick="openAuth('up')">Sign up</button> <button class="link" onclick="openAuth('in')">I have an account</button></div>`; };

const views = { me: renderMe, forum: renderForum, polls: renderPolls, board: renderBoard };
async function go(v) {
  document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== 'v-' + v);
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if (views[v]) { try { await views[v]($('#v-' + v)); } catch (e) { fail(e); } }
  scrollTo(0, 0);
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => go(b.dataset.v));

async function renderMe(el) {
  if (!me) return gate(el);
  const s = await api('state?d=' + today()), st = s.stats, t = today(), done = s.checkins.some(c => c.day === t);
  if (!s.user.planted) { el.innerHTML = `<h1>Plant your lettuce 🌱</h1><div class="card"><p>When did you plant (or when will you start)? This starts your 365-day journey.</p><input type="date" id="pd" value="${t}"><button onclick="setPlant()">Start my year</button></div>`; return; }
  const set = new Set(s.checkins.map(c => c.day)), start = new Date(s.user.planted + 'T00:00:00'), dots = [];
  for (let i = 0; i < 365; i++) { const d = new Date(start); d.setDate(d.getDate() + i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; dots.push(`<i class="${set.has(k) ? 'on' : ''}" title="${k}"></i>`); }
  el.innerHTML = `<h1>Hi ${esc(s.user.name)}! Day ${Math.min(s.day, 365)} of 365</h1>
  <div class="bar"><i style="width:${Math.min(100, s.day / 3.65)}%"></i></div>
  <div class="row" style="margin-top:12px"><div class="card stat"><b>${st.points}</b>points</div><div class="card stat"><b>${st.streak}🔥</b>day streak</div><div class="card stat"><b>${st.checkins}</b>check-ins</div><div class="card stat"><b>${st.challenges}</b>challenges</div></div>
  <div class="card"><h3>Daily check-in</h3>${done ? '<p>✅ You checked in today. See you tomorrow!</p>' : `<textarea id="cn" rows="2" placeholder="How is your lettuce today? (new leaves, color, problems…)"></textarea><div class="row"><input id="ch" type="number" step="0.1" placeholder="Height (cm), optional"><label><input type="checkbox" id="cw" style="width:auto"> I watered it</label></div><button onclick="checkin()">Check in (+${10 + Math.min(st.streak + 1, 7)} pts)</button>`}</div>
  <div class="card"><h3>🏅 Week ${s.week} challenge: ${esc(s.challenge.title)}</h3><p>${esc(s.challenge.text)}</p>${s.challenge.done ? '<p>✅ Completed this week!</p>' : '<button onclick="doChallenge()">I did it! (+50 pts)</button>'}</div>
  <h2>Your year</h2><div class="dots">${dots.join('')}</div><p class="muted">Planted ${esc(s.user.planted)}. Filled squares are days you checked in. Re-sow lettuce every 3–4 weeks to keep your year going!</p>
  <h2>Badges</h2>${badgesHtml(st.badges)}
  <h2>Journal</h2>${s.checkins.slice(0, 30).map(c => `<div class="card"><b>${esc(c.day)}</b> ${c.watered ? '💧' : ''} ${c.height ? c.height + ' cm' : ''}<br>${esc(c.note)}</div>`).join('') || '<p class="muted">No entries yet.</p>'}`;
}
const setPlant = () => api('plant', 'POST', { planted: val('pd') }).then(() => go('me')).catch(fail);
const checkin = () => api('checkin', 'POST', { day: today(), note: val('cn'), height: val('ch'), watered: $('#cw').checked }).then(async r => { toast(`+${r.pts} points! 🔥 ${r.streak}-day streak`); await init(); go('me'); }).catch(fail);
const doChallenge = () => api('challenge', 'POST').then(async () => { toast('+50 points! 🏅'); await init(); go('me'); }).catch(fail);

async function renderForum(el) {
  const posts = await api('posts');
  el.innerHTML = `<h1>Care Tips Forum 💬</h1>` + (me ? `<div class="card"><h3>Share an idea (+5 pts)</h3><input id="pt" placeholder="Title"><textarea id="pb" rows="3" placeholder="Your lettuce care tip or question…"></textarea><button onclick="newPost()">Post</button></div>` : '<div class="card"><button onclick="openAuth(\'in\')">Sign in to post</button></div>') +
    posts.map(p => `<div class="card"><h3>${esc(p.title)}</h3><p>${esc(p.body).replace(/\n/g, '<br>')}</p><p class="muted">by <a class="u" onclick="profile(${p.user_id})">${esc(p.name)}</a> · ${esc(p.created)}</p>
    ${p.comments.map(c => `<div class="cmt"><b><a class="u" onclick="profile(${c.user_id})">${esc(c.name)}</a></b>: ${esc(c.body)}</div>`).join('')}
    ${me ? `<div class="row"><input id="c${p.id}" placeholder="Reply…"><button style="flex:0" onclick="reply(${p.id})">Reply</button></div>` : ''}</div>`).join('') || '<p>No posts yet. Be the first!</p>';
}
const newPost = () => api('posts', 'POST', { title: val('pt'), body: val('pb') }).then(async () => { toast('+5 points!'); await init(); go('forum'); }).catch(fail);
const reply = id => api(`posts/${id}/comments`, 'POST', { body: val('c' + id) }).then(async () => { await init(); go('forum'); }).catch(fail);

async function renderPolls(el) {
  const polls = await api('polls');
  el.innerHTML = `<h1>Audience Polls 📊</h1>` + (me ? `<div class="card"><h3>Create a poll</h3><input id="pq" placeholder="Question"><textarea id="po" rows="3" placeholder="One option per line (2–6)"></textarea><button onclick="newPoll()">Create poll</button></div>` : '') +
    polls.map(p => { const tot = p.options.reduce((a, o) => a + o.votes, 0); return `<div class="card"><h3>${esc(p.question)}</h3>${p.options.map(o => `<div class="opt"><span style="min-width:110px">${p.myVote === o.id ? '✅ ' : ''}${esc(o.label)}</span><div class="bar"><i style="width:${tot ? o.votes / tot * 100 : 0}%"></i></div><span>${o.votes}</span>${me && !p.myVote ? `<button onclick="vote(${p.id},${o.id})">Vote</button>` : ''}</div>`).join('')}<p class="muted">${tot} vote${tot === 1 ? '' : 's'}${me ? '' : ' · sign in to vote'}</p></div>`; }).join('');
}
const newPoll = () => api('polls', 'POST', { question: val('pq'), options: val('po').split('\n') }).then(() => go('polls')).catch(fail);
const vote = (id, option) => api(`polls/${id}/vote`, 'POST', { option }).then(async () => { toast('+2 points!'); await init(); go('polls'); }).catch(fail);

async function renderBoard(el) {
  const u = await api('leaderboard');
  el.innerHTML = `<h1>Leaderboard 🏆</h1>` + u.map((x, i) => `<div class="card row" style="align-items:center"><b style="flex:0">#${i + 1}</b><a class="u" onclick="profile(${x.id})">${esc(x.name)}</a><span>${x.badges.join(' ')}</span><b style="flex:0;white-space:nowrap">${x.points} pts</b></div>`).join('');
}
async function profile(id) {
  document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== 'v-profile');
  const p = await api('profile/' + id), s = p.stats;
  $('#v-profile').innerHTML = `<h1>🌿 ${esc(p.name)}</h1><p class="muted">Member since ${esc(p.joined)}</p><div class="row"><div class="card stat"><b>${s.points}</b>points</div><div class="card stat"><b>${s.longest}</b>best streak</div><div class="card stat"><b>${s.checkins}</b>check-ins</div><div class="card stat"><b>${s.challenges}</b>challenges</div></div><h2>Badges</h2>${badgesHtml(s.badges)}`;
  scrollTo(0, 0);
}
init().then(() => go('home'));
