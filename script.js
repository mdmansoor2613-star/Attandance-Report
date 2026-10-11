/* ---------- Timetable (from your II MCA I Sem sheet) ---------- */
const SUB = {
  AI: ['Artificial Intelligence', 'S. Thabreez Basha'],
  ML: ['Machine Learning', 'D. Siva Sanjeev Kumar'],
  DO: ['DevOps', 'B. Hari Krishna'],
  FS: ['Full Stack Development', 'P. Kavitha'],
  BC: ['Block Chain Technologies', 'K. Adisekhar Babu'],
  DOL: ['DevOps Lab', 'B. Hari Krishna, Dr. C. Madana Kumar Reddy'],
  MLL: ['Machine Learning Lab', 'D. Siva Sanjeev Kumar, S. Thabreez Basha'],
  FSL: ['Full Stack Lab', 'P. Kavitha, J. Hari Krishna'],
  SEM: ['Technical Seminar', 'P. Kavitha']
};
// day (1=Mon) -> [startPeriod, lengthInPeriods, subject, room?]  (labs = 3 periods)
const TT = {
  1: [[1,1,'AI'],[2,1,'ML'],[3,1,'DO'],[4,1,'FS']],
  2: [[1,1,'DO'],[2,3,'DOL',305],[5,1,'AI'],[6,1,'BC']],
  3: [[1,1,'FS'],[2,1,'BC'],[3,1,'SEM'],[4,1,'ML']],
  4: [[1,1,'DO'],[2,1,'ML'],[4,1,'BC'],[5,3,'FSL',305]],
  5: [[1,1,'ML'],[2,3,'MLL',305],[5,1,'FS'],[6,1,'AI']],
  6: [[1,1,'DO'],[3,1,'FS'],[4,1,'AI'],[6,1,'BC']]
};
// period start/end in minutes: 9:15 10:05 10:55 11:45 | lunch | 1:30 2:20 3:10 -> 4:00
const ST = [555,605,655,705,810,860,910], EN = [605,655,705,755,860,910,960];
const START = new Date(2026, 7, 10);

/* ---------- Helpers & state ---------- */
const $ = s => document.querySelector(s), pad = n => String(n).padStart(2, '0');
const key = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = k => new Date(k + 'T00:00');
const day0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const blocks = d => d < START ? [] : (TT[d.getDay()] || []).map(([s,n,k,r]) => ({ s, n, k, r: r || 402 }));
const fmt = m => { const h = Math.floor(m / 60); return (h > 12 ? h - 12 : h) + ':' + pad(m % 60); };
const msg = t => `<div class="card empty">${t}</div>`;

let S = { target: 75, marks: {}, hol: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem('att-v1'))); } catch {}
const save = () => { try { localStorage.setItem('att-v1', JSON.stringify(S)); } catch {} };
let sel = day0(), vm = new Date(sel.getFullYear(), sel.getMonth(), 1);

/* ---------- Maths ---------- */
function stats(from, to) {
  const r = {};
  for (const k in S.marks) {
    if (S.hol[k]) continue;
    const d = parse(k);
    if (from && (d < from || d > to)) continue;
    for (const b of blocks(d)) {
      const m = S.marks[k][b.s]; if (!m) continue;
      r[b.k] ??= { a: 0, t: 0 };
      r[b.k].t += b.n;
      if (m === 'P') r[b.k].a += b.n;
    }
  }
  return r;
}
const sum = r => Object.values(r).reduce((x, v) => ({ a: x.a + v.a, t: x.t + v.t }), { a: 0, t: 0 });
const pc = (a, t) => t ? a / t * 100 : null;
const lvl = p => p < S.target ? 'bad' : p < S.target + 5 ? 'warn' : 'ok';
const badge = p => { const l = lvl(p); return `<span class="badge ${l}">${l === 'bad' ? 'Below ' + S.target + '%' : l === 'warn' ? 'Close to limit' : 'Safe'}</span>`; };
function advice(a, t) {
  const p = S.target / 100;
  if (!t) return 'No classes marked yet';
  if (a / t >= p) {
    const x = Math.floor(a / p - t + 1e-9);
    return x > 0 ? `You can miss ${x} more period${x > 1 ? 's' : ''}` : 'Right on the limit, don’t miss more';
  }
  const y = Math.ceil((p * t - a) / (1 - p) - 1e-9);
  return `Attend next ${y} period${y > 1 ? 's' : ''} to reach ${S.target}%`;
}
function streak() {
  let c = 0; const today = day0();
  for (let d = new Date(today); d >= START; d.setDate(d.getDate() - 1)) {
    const k = key(d), bs = blocks(d);
    if (!bs.length || S.hol[k]) continue;
    const m = S.marks[k] || {}, v = bs.map(b => m[b.s]).filter(Boolean);
    if (!v.length) { if (+d === +today) continue; break; }
    if (v.includes('A')) break;
    c++;
  }
  return c;
}

/* ---------- Render: total ---------- */
function renderTotal() {
  const r = stats(), o = sum(r), p = pc(o.a, o.t);
  $('#overall').innerHTML = `<div class="big ${p == null ? '' : lvl(p)}">${p == null ? '—' : p.toFixed(1) + '%'}</div>
    <div><b>${o.a}</b> of <b>${o.t}</b> periods attended · <b>${o.t - o.a}</b> missed</div>
    <p class="adv">${advice(o.a, o.t)}</p>${p == null ? '' : badge(p)}`;

  const wd = day0(), mon = new Date(wd); mon.setDate(wd.getDate() - ((wd.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const miss = o => Object.entries(o).map(([k, v]) => [k, v.t - v.a]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
  const wk = miss(stats(mon, sun)), wm = wk.reduce((s, x) => s + x[1], 0), all = miss(r)[0];
  $('#insights').innerHTML = `
    <div class="card"><small>Streak</small><b>${streak()} day${streak() === 1 ? '' : 's'} 🔥</b><small>days attended in a row</small></div>
    <div class="card"><small>Most missed</small><b>${all ? SUB[all[0]][0] : 'Nothing yet'}</b><small>${all ? all[1] + ' periods missed' : 'Great start'}</small></div>
    <div class="card"><small>This week</small><b>${wm ? `You missed ${wm} period${wm > 1 ? 's' : ''}, mostly ${SUB[wk[0][0]][0]}.` : 'No missed periods. Keep it up!'}</b></div>`;

  $('#subjects').innerHTML = Object.keys(SUB).map(k => {
    const v = r[k] || { a: 0, t: 0 }, q = pc(v.a, v.t);
    return `<article class="card sub ${q == null ? '' : lvl(q)}"><h3>${SUB[k][0]}</h3>
      <div class="pct">${q == null ? '—' : q.toFixed(0) + '%'}</div>
      <small>${v.a}/${v.t} periods</small>${q == null ? '' : badge(q)}<small>${advice(v.a, v.t)}</small></article>`;
  }).join('');
}

/* ---------- Render: day ---------- */
function renderDay() {
  const k = key(sel), bs = blocks(sel), m = S.marks[k] || {}, isT = +sel === +day0();
  const n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
  $('#dayLabel').textContent = sel.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) + (isT ? ' · Today' : '');
  $('#hol').textContent = S.hol[k] ? 'Remove holiday' : 'Mark holiday';
  $('#periods').innerHTML = S.hol[k] ? msg('🌴 Holiday, not counted')
    : !bs.length ? msg(sel < START ? 'Timetable starts on 10 Aug 2026' : 'No classes today 🎉')
    : bs.map(b => {
        const st = ST[b.s - 1], en = EN[b.s + b.n - 2], cur = isT && mins >= st && mins < en, v = m[b.s];
        return `<article class="card slot ${v === 'P' ? 'present' : v === 'A' ? 'absent' : ''} ${cur ? 'now' : ''}" data-s="${b.s}">
          <div class="time">${fmt(st)} – ${fmt(en)} · ${b.n} period${b.n > 1 ? 's' : ''}${cur ? '<i>NOW</i>' : ''}</div>
          <h3>${SUB[b.k][0]}</h3><p>${SUB[b.k][1]} · Room ${b.r}</p>
          <div class="btns"><button data-m="P" class="${v === 'P' ? 'on' : ''}">Present</button><button data-m="A" class="${v === 'A' ? 'on' : ''}">Absent</button></div></article>`;
      }).join('');
}

/* ---------- Render: calendar ---------- */
function renderCal() {
  const y = vm.getFullYear(), mo = vm.getMonth(), off = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
  const tk = key(day0()), sk = key(sel);
  let h = `<div class="calhead"><button data-n="-1">‹</button><b>${vm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><button data-n="1">›</button></div>
    <div class="grid">${'MTWTFSS'.split('').map(x => `<span class="dow">${x}</span>`).join('')}${'<span></span>'.repeat(off)}`;
  for (let i = 1; i <= days; i++) {
    const d = new Date(y, mo, i), k = key(d), bs = blocks(d), m = S.marks[k] || {}, v = bs.map(b => m[b.s]).filter(Boolean);
    const c = S.hol[k] ? 'c-hol' : !bs.length ? 'c-off' : v.includes('A') ? 'c-a' : v.length === bs.length ? 'c-p' : v.length ? 'c-part' : '';
    h += `<button data-d="${k}" class="${c} ${k === tk ? 'today' : ''} ${k === sk ? 'sel' : ''}">${i}</button>`;
  }
  $('#cal').innerHTML = h + `</div><div class="legend"><span>🟢 Present</span><span>🔴 Missed</span><span>🟡 Partly marked</span><span>🔵 Holiday</span></div>`;
}

/* ---------- Calculator ---------- */
function fill() {
  const r = stats(), v = $('#cSub').value, x = v === 'all' ? sum(r) : r[v] || { a: 0, t: 0 };
  $('#cT').value = x.t; $('#cA').value = x.a; calc();
}
function calc() {
  const t = +$('#cT').value || 0, a = +$('#cA').value || 0;
  if (a > t) { $('#cOut').textContent = 'Attended classes can’t be more than total classes.'; return; }
  const p = t ? a / t * 100 : null;
  $('#cOut').innerHTML = p == null ? 'Enter your total classes.'
    : `<b class="hl ${lvl(p)}" style="font-size:1.8rem">${p.toFixed(1)}%</b> ${badge(p)}<br><small>attended ÷ total × 100 = ${a} ÷ ${t} × 100 · ${advice(a, t)} · target ${S.target}%</small>`;
}

/* ---------- Reminder banner ---------- */
function banner() {
  const k = key(day0()), bs = blocks(day0()), m = S.marks[k] || {}, un = bs.filter(b => !m[b.s]).length;
  const show = new Date().getHours() >= 18 && bs.length && !S.hol[k] && un > 0;
  $('#banner').hidden = !show;
  if (show) $('#banner').textContent = `⏰ ${un} class${un > 1 ? 'es are' : ' is'} still unmarked today. Press P or A, or tap below.`;
}

const render = () => { renderTotal(); renderDay(); renderCal(); calc(); banner(); };

/* ---------- Actions ---------- */
function mark(s, v, force) {
  const k = key(sel); S.marks[k] ??= {};
  if (!force && S.marks[k][s] === v) delete S.marks[k][s]; else S.marks[k][s] = v;
  if (!Object.keys(S.marks[k]).length) delete S.marks[k];
  save(); render();
}
const go = d => { sel = d; vm = new Date(d.getFullYear(), d.getMonth(), 1); render(); };

$('#periods').addEventListener('click', e => {
  const b = e.target.closest('button[data-m]'); if (b) mark(+b.closest('.slot').dataset.s, b.dataset.m);
});
$('#daybar').addEventListener('click', e => {
  const a = e.target.dataset.a, k = key(sel); if (!a) return;
  const d = new Date(sel);
  if (a === 'prev') { d.setDate(d.getDate() - 1); go(d); }
  else if (a === 'next') { d.setDate(d.getDate() + 1); go(d); }
  else if (a === 'today') go(day0());
  else if (a === 'all') { S.marks[k] ??= {}; blocks(sel).forEach(b => S.marks[k][b.s] = 'P'); save(); render(); }
  else if (a === 'hol') { S.hol[k] ? delete S.hol[k] : S.hol[k] = 1; save(); render(); }
});
$('#cal').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.d) go(parse(b.dataset.d));
  else if (b.dataset.n) { vm = new Date(vm.getFullYear(), vm.getMonth() + +b.dataset.n, 1); renderCal(); }
});
$('#target').addEventListener('input', e => {
  S.target = Math.min(99, Math.max(1, +e.target.value || 75)); save(); render();
});
['#cT', '#cA'].forEach(s => $(s).addEventListener('input', calc));
$('#cSub').addEventListener('change', fill);
$('#cFill').addEventListener('click', fill);

// Keyboard: P / A -> current period (today) or next unmarked one
addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const v = { p: 'P', a: 'A' }[e.key.toLowerCase()]; if (!v) return;
  const k = key(sel), bs = blocks(sel); if (S.hol[k] || !bs.length) return;
  const m = S.marks[k] || {}, n = new Date(), mins = n.getHours() * 60 + n.getMinutes();
  const b = (+sel === +day0() && bs.find(b => mins >= ST[b.s - 1] && mins < EN[b.s + b.n - 2])) || bs.find(b => !m[b.s]);
  if (b) mark(b.s, v, true);
});

/* ---------- Init ---------- */
$('#target').value = S.target;
$('#cSub').innerHTML = '<option value="all">Overall</option>' + Object.entries(SUB).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
render();
fill();
setInterval(render, 60000);
