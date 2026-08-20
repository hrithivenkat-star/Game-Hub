// ============================================================================
// Game Hub — Achievements Engine (shared/gh-achievements.js)
// Load order on any page that wants achievements:
//   <script src="/shared/utils.js"></script>
//   <script type="module" src="/shared/gh-auth.js"></script>
//   <script type="module" src="/shared/gh-achievements.js"></script>
//
// Zero per-game code changes needed for the generic achievements below —
// this file wraps GH.saveScore() and GH.recordPlay(), which every game
// already calls. Games can ALSO fire bespoke ones manually at any time:
//   GH.unlockAchievement('first_win_2p', 'Turf War');
// ============================================================================

import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

window.GH = window.GH || {};
const GH = window.GH;
GH.Achievements = GH.Achievements || {};

// ---- Catalog ----------------------------------------------------------
// type: 'plays' (total plays, all games) | 'games_played' (distinct games tried)
//     | 'score' (best score on `game` >= value, matches gh_best_<game> keys)
//     | 'custom' (manual unlock only, via GH.unlockAchievement)
const CATALOG = [
  { id:'first_blood',   label:'First Blood',   desc:'Play your first game',           icon:'🎮', type:'plays', value:1 },
  { id:'regular',       label:'Regular',       desc:'Play 25 games total',            icon:'🕹️', type:'plays', value:25 },
  { id:'addicted',      label:'Addicted',      desc:'Play 100 games total',           icon:'🔥', type:'plays', value:100 },
  { id:'city_legend',   label:'City Legend',   desc:'Play 500 games total',           icon:'👑', type:'plays', value:500 },
  { id:'explorer',      label:'Explorer',      desc:'Try 5 different games',          icon:'🗺️', type:'games_played', value:5 },
  { id:'completionist', label:'Completionist', desc:'Try 15 different games',         icon:'🏁', type:'games_played', value:15 },
  { id:'city_native',   label:'City Native',   desc:'Try 25 different games',         icon:'🌆', type:'games_played', value:25 },
  { id:'snake_charmer', label:'Snake Charmer', desc:'Score 500+ in Snake',            icon:'🐍', type:'score', game:'snake',   value:500 },
  { id:'line_clearer',  label:'Line Clearer',  desc:'Score 10,000+ in Tetris',        icon:'🧱', type:'score', game:'tetris',  value:10000 },
  { id:'club_2048',     label:'2048 Club',     desc:'Score 2048+ in 2048',            icon:'🔢', type:'score', game:'2048',    value:2048 },
  { id:'sky_pilot',     label:'Sky Pilot',     desc:'Score 20+ in Flappy Bird',       icon:'🐦', type:'score', game:'flappy',  value:20 },
  { id:'ghost_hunter',  label:'Ghost Hunter',  desc:'Score 5,000+ in Pac-Man',        icon:'👻', type:'score', game:'pacman',  value:5000 },
  { id:'night_owl',     label:'Night Owl',     desc:'Play between midnight and 4am',  icon:'🦉', type:'custom' },
  { id:'turf_war',      label:'Turf War',      desc:'Win a 2-Player Turf match',      icon:'⚔️', type:'custom' },
  { id:'gone_under',    label:'Gone Under',    desc:'Enter the Underground district', icon:'🩸', type:'custom' },
];
GH.Achievements.CATALOG = CATALOG;

// ---- Local unlock ledger (mirrors legacy GH.unlockAchievement keys) ---
function localHas(id) { return !!localStorage.getItem('gh_ach_' + id); }
function localUnlock(id) { localStorage.setItem('gh_ach_' + id, String(Date.now())); }
function localAll() {
  return CATALOG.filter(a => localHas(a.id)).map(a => ({ ...a, unlockedAt: Number(localStorage.getItem('gh_ach_' + a.id)) }));
}
GH.Achievements.list = () => CATALOG.map(a => ({ ...a, unlocked: localHas(a.id) }));
GH.Achievements.unlockedCount = () => CATALOG.filter(a => localHas(a.id)).length;

// ---- Toast UI -----------------------------------------------------------
function toastCSS() {
  if (document.getElementById('gh-ach-style')) return;
  const s = document.createElement('style');
  s.id = 'gh-ach-style';
  s.textContent = `
  #gh-ach-stack{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10000;
    display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
  .gh-ach-toast{display:flex;align-items:center;gap:12px;background:rgba(10,7,20,.95);
    border:1px solid rgba(255,210,63,.5);box-shadow:0 4px 24px rgba(0,0,0,.5),0 0 20px rgba(255,210,63,.15);
    border-radius:10px;padding:10px 18px 10px 12px;min-width:220px;max-width:92vw;
    font-family:'Barlow Condensed',Segoe UI,sans-serif;color:#fff;
    animation:gh-ach-in .35s cubic-bezier(.2,.9,.3,1.3),gh-ach-out .4s ease-in 3.6s forwards}
  .gh-ach-icon{font-size:26px;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(255,210,63,.6))}
  .gh-ach-eyebrow{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#ffd23f;font-weight:800}
  .gh-ach-label{font-size:16px;font-weight:700;line-height:1.15}
  .gh-ach-desc{font-size:11px;color:#a696c2}
  @keyframes gh-ach-in{from{opacity:0;transform:translateY(-14px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes gh-ach-out{to{opacity:0;transform:translateY(-10px) scale(.97)}}
  `;
  document.head.appendChild(s);
}

function showToast(ach) {
  toastCSS();
  let stack = document.getElementById('gh-ach-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'gh-ach-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'gh-ach-toast';
  el.innerHTML = `<div class="gh-ach-icon">${ach.icon || '🏆'}</div>
    <div><div class="gh-ach-eyebrow">Achievement Unlocked</div>
    <div class="gh-ach-label">${ach.label}</div>
    <div class="gh-ach-desc">${ach.desc || ''}</div></div>`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
  try { new AudioContext(); } catch (e) {}
}

// ---- Core unlock (keeps old GH.unlockAchievement signature working) ---
const prevUnlock = GH.unlockAchievement; // legacy stub from utils.js, if present
GH.unlockAchievement = function (id, labelFallback) {
  if (localHas(id)) return false;
  localUnlock(id);
  const meta = CATALOG.find(a => a.id === id) || { id, label: labelFallback || id, icon: '🏆' };
  showToast(meta);
  syncToCloud(id);
  return true;
};
GH.hasAchievement = (id) => localHas(id);

function syncToCloud(id) {
  const auth = GH.Auth;
  if (!auth || !auth.isSignedIn() || !auth._db) return;
  const uid = auth.user().uid;
  update(ref(auth._db, `users/${uid}/achievements`), { [id]: Date.now() }).catch(() => {});
}

// ---- Auto-detection: wrap saveScore / recordPlay, no per-game edits ---
const _saveScore = GH.saveScore;
if (typeof _saveScore === 'function') {
  GH.saveScore = function (gameId, score) {
    const isRecord = _saveScore(gameId, score);
    checkScoreAchievements(gameId, score);
    return isRecord;
  };
}
const _recordPlay = GH.recordPlay;
if (typeof _recordPlay === 'function') {
  GH.recordPlay = function (gameId) {
    const count = _recordPlay(gameId);
    checkPlayAchievements(gameId);
    return count;
  };
}

function checkScoreAchievements(gameId, score) {
  CATALOG.filter(a => a.type === 'score' && a.game === gameId && score >= a.value)
    .forEach(a => GH.unlockAchievement(a.id));
}

function distinctGamesPlayed() {
  return Object.keys(localStorage).filter(k => k.startsWith('gh_plays_')).length;
}

function checkPlayAchievements(gameId) {
  const total = GH.getTotalPlays ? GH.getTotalPlays() : 0;
  CATALOG.filter(a => a.type === 'plays' && total >= a.value).forEach(a => GH.unlockAchievement(a.id));
  const distinct = distinctGamesPlayed();
  CATALOG.filter(a => a.type === 'games_played' && distinct >= a.value).forEach(a => GH.unlockAchievement(a.id));
  const hr = new Date().getHours();
  if (hr >= 0 && hr < 4) GH.unlockAchievement('night_owl');
}

// ---- Cloud migration on first sign-in ----------------------------------
GH.Achievements._migrateLocalToCloud = async function (uid) {
  const db = GH.Auth._db;
  const local = localAll();
  if (!local.length) return;
  const updates = {};
  local.forEach(a => { updates[a.id] = a.unlockedAt || Date.now(); });
  try { await update(ref(db, `users/${uid}/achievements`), updates); } catch (e) {}
};

// ---- Pull cloud achievements down on sign-in (cross-device sync) -------
if (GH.Auth && typeof GH.Auth.onChange === 'function') {
  GH.Auth.onChange(async (user) => {
    if (!user) return;
    try {
      const snap = await get(ref(GH.Auth._db, `users/${user.uid}/achievements`));
      if (snap.exists()) {
        Object.keys(snap.val()).forEach(id => { if (!localHas(id)) localUnlock(id); });
      }
    } catch (e) {}
  });
}
