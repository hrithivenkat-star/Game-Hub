// ============================================================================
// Game Hub — Account System (shared/gh-auth.js)
// Drop ONE tag on any page, no other markup required:
//   <script type="module" src="/shared/gh-auth.js"></script>
// It will:
//   - keep GH.getPlayer()/GH.setPlayer() in sync with the signed-in account
//   - enhance an existing #nick-pill if the page has one (index.html, multiplayer)
//   - otherwise auto-inject a small floating login/profile pill (every other page)
//   - expose window.GH.Auth for pages/games that want to react to sign-in state
// ============================================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyArIpjo9Rye5S7IQRXu1std4srOcAD7I_Y",
  authDomain: "gamehub234.firebaseapp.com",
  databaseURL: "https://gamehub234-default-rtdb.firebaseio.com",
  projectId: "gamehub234",
  storageBucket: "gamehub234.firebasestorage.app",
  messagingSenderId: "902315908438",
  appId: "1:902315908438:web:7ff2c34487b24c71998af7"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.GH = window.GH || {};
const GH = window.GH;

// Fallback minimal player storage in case shared/utils.js isn't loaded on this page
GH.getPlayer = GH.getPlayer || (() => localStorage.getItem('gh_player') || localStorage.getItem('player_nick') || localStorage.getItem('gamehub_nickname') || 'Player');
GH.setPlayer = GH.setPlayer || ((name) => {
  name = String(name).trim().slice(0, 16) || 'Player';
  localStorage.setItem('gh_player', name);
  localStorage.setItem('player_nick', name);
  localStorage.setItem('gamehub_nickname', name);
  return name;
});

GH.Auth = {};
const listeners = [];
let currentUser = null;
let currentProfile = null;
let resolvedOnce = false;
const readyWaiters = [];

GH.Auth.user = () => currentUser;
GH.Auth.profile = () => currentProfile;
GH.Auth.isSignedIn = () => !!currentUser;
GH.Auth.onChange = (fn) => {
  listeners.push(fn);
  if (resolvedOnce) fn(currentUser, currentProfile);
};
// Resolves once the initial auth state is known — use this before reading GH.Auth.user()
GH.Auth.ready = () => new Promise((res) => {
  if (resolvedOnce) res(currentUser);
  else readyWaiters.push(res);
});

async function ensureProfile(user) {
  const pRef = ref(db, `users/${user.uid}/profile`);
  const snap = await get(pRef);
  if (!snap.exists()) {
    const legacyNick = GH.getPlayer();
    const profile = {
      displayName: user.displayName || legacyNick || 'Player',
      email: user.email || null,
      avatarColor: localStorage.getItem('gh_avatar_color') || '#00e0c6',
      createdAt: Date.now()
    };
    await set(pRef, profile);
    currentProfile = profile;
    if (GH.Achievements && typeof GH.Achievements._migrateLocalToCloud === 'function') {
      GH.Achievements._migrateLocalToCloud(user.uid);
    }
  } else {
    currentProfile = snap.val();
  }
  GH.setPlayer(currentProfile.displayName);
  onValue(pRef, s => { if (s.exists()) { currentProfile = s.val(); renderWidget(); } });
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    try { await ensureProfile(user); } catch (e) { console.error('GH.Auth profile error', e); }
  } else {
    currentProfile = null;
  }
  resolvedOnce = true;
  readyWaiters.splice(0).forEach(fn => fn(currentUser));
  listeners.forEach(fn => fn(currentUser, currentProfile));
  renderWidget();
});

// ---------- Public auth actions ----------
GH.Auth.signup = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred.user;
};
GH.Auth.login = (email, password) => signInWithEmailAndPassword(auth, email, password).then(c => c.user);
GH.Auth.loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider()).then(c => c.user);
GH.Auth.resetPassword = (email) => sendPasswordResetEmail(auth, email);
GH.Auth.logout = () => signOut(auth);
GH.Auth.setDisplayName = async (name) => {
  name = String(name).trim().slice(0, 16) || 'Player';
  if (currentUser) await update(ref(db, `users/${currentUser.uid}/profile`), { displayName: name });
  GH.setPlayer(name);
};
GH.Auth.setAvatarColor = async (color) => {
  localStorage.setItem('gh_avatar_color', color);
  if (currentUser) await update(ref(db, `users/${currentUser.uid}/profile`), { avatarColor: color });
};
GH.Auth._db = db; // exposed so gh-achievements.js can share the same connection

// ---------- Auto-injected / enhanced nav widget ----------
function widgetCSS() {
  if (document.getElementById('gh-auth-style')) return;
  const s = document.createElement('style');
  s.id = 'gh-auth-style';
  s.textContent = `
  .gh-auth-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.14);color:var(--teal,#00e0c6);padding:7px 14px;
    border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;
    font-family:'Barlow Condensed',Segoe UI,sans-serif;text-decoration:none;backdrop-filter:blur(6px)}
  .gh-auth-pill:hover{background:rgba(255,255,255,.12);transform:translateY(-1px)}
  .gh-auth-fixed{position:fixed;top:14px;right:14px;z-index:9999}
  .gh-avatar{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;
    justify-content:center;font-size:11px;font-weight:800;color:#0a0714;flex-shrink:0}
  `;
  document.head.appendChild(s);
}

function renderWidget() {
  widgetCSS();
  const existingPill = document.getElementById('nick-pill');
  let el = document.getElementById('gh-auth-widget');
  if (!el && !existingPill) {
    el = document.createElement('a');
    el.id = 'gh-auth-widget';
    el.className = 'gh-auth-pill gh-auth-fixed';
    document.body.appendChild(el);
  }
  const target = existingPill || el;
  if (!target) return;
  target.style.display = 'inline-flex';
  if (currentUser && currentProfile) {
    const initial = (currentProfile.displayName || '?')[0].toUpperCase();
    target.href = '/profile.html';
    target.innerHTML = `<span class="gh-avatar" style="background:${currentProfile.avatarColor || '#00e0c6'}">${initial}</span><span id="nick-name">${currentProfile.displayName}</span>`;
  } else {
    target.href = '/login.html';
    target.innerHTML = `<span>👤 Log In</span>`;
  }
}

if (document.body) renderWidget();
else document.addEventListener('DOMContentLoaded', renderWidget);
