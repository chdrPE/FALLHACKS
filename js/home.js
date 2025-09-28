console.log("[home.js] loaded ✅"); 

// Background animation
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

const circles = [];
for (let i = 0; i < 36; i++) {
  const r = 24 + Math.random() * 60;
  circles.push({ x: Math.random() * width, y: Math.random() * height, r, a: Math.random() * Math.PI * 2, s: 0.2 + Math.random() * 0.6 });
}
window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });

function tickBackground() {
  ctx.clearRect(0, 0, width, height);
  for (const c of circles) {
    c.x += Math.cos(c.a) * c.s;
    c.y += Math.sin(c.a) * c.s;
    c.a += (Math.random() - 0.5) * 0.01;
    if (c.x < -100) c.x = width + 100; else if (c.x > width + 100) c.x = -100;
    if (c.y < -100) c.y = height + 100; else if (c.y > height + 100) c.y = -100;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
    g.addColorStop(0, 'rgba(46,230,255,0.25)');
    g.addColorStop(1, 'rgba(46,230,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
  }
  requestAnimationFrame(tickBackground);
}
tickBackground();

// Clock
const clockEl = document.getElementById('clock');
function format12(d) { let h = d.getHours(); const m = d.getMinutes(); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12; h = h ? h : 12; return `${h}:${m.toString().padStart(2, '0')} ${ampm}`; }
function updateClock() { clockEl.textContent = format12(new Date()); }
updateClock(); setInterval(updateClock, 1000);

// Demo state
const state = {
  weeklyGoalHours: 22,
  hoursStudiedThisWeek: 8.5,
  skipsUsedThisMonth: 1,
  streakDays: 12,
  todayNeededHours: 5,
  friends: [
    { name: 'Rodrigo', weeks: [0.9, 0.7, 1.0, 0.8], streak: 15 },
    { name: 'Franco',   weeks: [0.4, 0.6, 0.5, 0.55], streak: 4 },
    { name: 'Diego',    weeks: [0.8, 0.85, 0.9, 1.0], streak: 21 },
    { name: 'Cesar',    weeks: [0.3, 0.45, 0.5, 0.6], streak: 2 },
  ]
};

// Activity rendering + weekly goal fill
function startOfWeek(d = new Date()) { const x = new Date(d); const day = x.getDay(); const diff = (day === 0 ? -6 : 1) - day; x.setDate(x.getDate() + diff); x.setHours(0,0,0,0); return x; }
function endOfWeek(d = new Date()) { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate() + 6); return e; }
function fmtRange() { const s = startOfWeek(); const e = endOfWeek(); const f = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }); return `${f.format(s)} – ${f.format(e)}`; }

function renderActivity() {
  document.getElementById('hours-done').textContent = state.hoursStudiedThisWeek.toString();
  const left = Math.max(0, state.weeklyGoalHours - state.hoursStudiedThisWeek);
  document.getElementById('hours-left').textContent = left.toFixed(1).replace(/\.0$/, '');
  document.getElementById('streak-days').textContent = state.streakDays;
  document.getElementById('skips-used').textContent = state.skipsUsedThisMonth;
  document.getElementById('today-needed').textContent = state.todayNeededHours;
  document.getElementById('week-range').textContent = fmtRange();

  // Weekly goal fill
  const pct = Math.min(100, Math.round((state.hoursStudiedThisWeek / state.weeklyGoalHours) * 100));
  const fill = document.getElementById('weekly-goal-fill');
  const legend = document.getElementById('goal-legend-text');
  if (fill) fill.style.width = pct + '%';
  if (legend) legend.textContent = `${state.hoursStudiedThisWeek} / ${state.weeklyGoalHours} h`;
}
renderActivity();

// Friends 
const friendsList = document.getElementById('friends-list');
function pctFromWeeks(weeks) { const avg = weeks.reduce((a,b)=>a+b,0)/weeks.length; return Math.max(0, Math.min(100, Math.round(avg*100))); }
function makeFriendRow(f) {
  const row = document.createElement('div'); row.className = 'friend';
  const name = document.createElement('div'); name.className = 'friend-name'; name.textContent = f.name;
  const prog = document.createElement('div'); prog.className = 'progress';
  const bar = document.createElement('div'); bar.className = 'bar'; bar.style.width = pctFromWeeks(f.weeks) + '%';
  const ticks = document.createElement('div'); ticks.className = 'ticks'; for (let i=0;i<4;i++) ticks.appendChild(document.createElement('span'));
  prog.appendChild(bar); prog.appendChild(ticks);
  const streak = document.createElement('div'); streak.className = 'streak-count'; streak.textContent = `${f.streak}🔥`;
  row.appendChild(name); row.appendChild(prog); row.appendChild(streak);
  return row;
}
function renderFriends() {
  if (!friendsList) return;
  friendsList.innerHTML = ''; 
  state.friends.forEach(f => friendsList.appendChild(makeFriendRow(f)));
}
renderFriends();

