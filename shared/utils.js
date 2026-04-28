/**
 * GameHub Shared Utilities
 * Usage: <script src="/shared/utils.js"></script>
 * Then: GH.saveScore('snake', 420) / GH.getBest('snake') / GH.getPlayer()
 */
window.GH = window.GH || {};

(function(GH) {

  // ─── SCORE STORAGE ───────────────────────────────────────────────
  // Replaces ad-hoc keys like 'snake_best', 'tetris_best', etc.
  // Unified key format: gh_best_<gameId>

  GH.saveScore = function(gameId, score) {
    score = parseInt(score, 10);
    if (isNaN(score)) return;
    const key = 'gh_best_' + gameId;
    const prev = GH.getBest(gameId);
    if (score > prev) {
      localStorage.setItem(key, score);
      return true; // new record
    }
    return false;
  };

  GH.getBest = function(gameId) {
    return parseInt(localStorage.getItem('gh_best_' + gameId) || '0', 10);
  };

  GH.formatScore = function(score) {
    if (score >= 1000000) return (score / 1000000).toFixed(1) + 'M';
    if (score >= 1000) return (score / 1000).toFixed(1) + 'K';
    return String(score);
  };

  // ─── PLAYER PROFILE ─────────────────────────────────────────────
  // One nickname + colour across every game. Shown on leaderboards.

  GH.getPlayer = function() {
    return localStorage.getItem('gh_player') || localStorage.getItem('gamehub_nickname') || 'Player';
  };

  GH.setPlayer = function(name) {
    name = String(name).trim().slice(0, 16) || 'Player';
    localStorage.setItem('gh_player', name);
    localStorage.setItem('gamehub_nickname', name); // keep old key working
    return name;
  };

  GH.getAvatarColor = function() {
    return localStorage.getItem('gh_avatar_color') || '#00f5ff';
  };

  GH.setAvatarColor = function(color) {
    localStorage.setItem('gh_avatar_color', color);
  };

  // ─── AI DIFFICULTY MEMORY ───────────────────────────────────────
  // Saves chosen difficulty per game so it persists on revisit.

  GH.saveDiff = function(gameId, level) {
    localStorage.setItem('gh_diff_' + gameId, level);
  };

  GH.getDiff = function(gameId, fallback) {
    return localStorage.getItem('gh_diff_' + gameId) || fallback || 'medium';
  };

  // ─── SESSION STATS ──────────────────────────────────────────────
  // Track total games played (for achievements in Stage 5)

  GH.recordPlay = function(gameId) {
    const key = 'gh_plays_' + gameId;
    const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, count);
    const total = parseInt(localStorage.getItem('gh_total_plays') || '0', 10) + 1;
    localStorage.setItem('gh_total_plays', total);
    return count;
  };

  GH.getPlays = function(gameId) {
    return parseInt(localStorage.getItem('gh_plays_' + gameId) || '0', 10);
  };

  GH.getTotalPlays = function() {
    return parseInt(localStorage.getItem('gh_total_plays') || '0', 10);
  };

  // ─── ACHIEVEMENTS (stub — fully wired in Stage 5) ────────────────

  GH.unlockAchievement = function(id, label) {
    const key = 'gh_ach_' + id;
    if (localStorage.getItem(key)) return false; // already unlocked
    localStorage.setItem(key, Date.now());
    // Stage 5 will hook into this to show a toast notification
    if (typeof GH._onAchievement === 'function') GH._onAchievement(id, label);
    return true;
  };

  GH.hasAchievement = function(id) {
    return !!localStorage.getItem('gh_ach_' + id);
  };

  // ─── THEME ──────────────────────────────────────────────────────
  // Three neon themes (Stage 5 will wire the toggle UI)
  // Applied immediately on script load so no flash-of-wrong-theme.

  const THEMES = {
    synthwave: { c0:'#00f5ff', c1:'#bf00ff', c2:'#ff006e', c3:'#00ff88', c4:'#ffe600', c5:'#ff6b00', bg:'#04020c' },
    cyberpunk: { c0:'#00ff88', c1:'#ffe600', c2:'#ff6b00', c3:'#00f5ff', c4:'#bf00ff', c5:'#ff006e', bg:'#030d04' },
    retrowave: { c0:'#ff69b4', c1:'#ff006e', c2:'#ff6b00', c3:'#ffe600', c4:'#bf00ff', c5:'#00f5ff', bg:'#0d0308' }
  };

  GH.getTheme = function() {
    return localStorage.getItem('gh_theme') || 'synthwave';
  };

  GH.setTheme = function(name) {
    if (!THEMES[name]) return;
    localStorage.setItem('gh_theme', name);
    GH.applyTheme(name);
  };

  GH.applyTheme = function(name) {
    const t = THEMES[name || GH.getTheme()];
    if (!t) return;
    const r = document.documentElement.style;
    r.setProperty('--c0', t.c0);
    r.setProperty('--c1', t.c1);
    r.setProperty('--c2', t.c2);
    r.setProperty('--c3', t.c3);
    r.setProperty('--c4', t.c4);
    r.setProperty('--c5', t.c5);
  };

  // Apply saved theme immediately (avoids flash)
  GH.applyTheme(GH.getTheme());

  // ─── UTILITY HELPERS ────────────────────────────────────────────

  GH.clamp = function(val, min, max) {
    return Math.min(Math.max(val, min), max);
  };

  GH.lerp = function(a, b, t) {
    return a + (b - a) * t;
  };

  GH.randomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  GH.shuffle = function(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ─── DAILY SEED (Stage 5 — daily challenge) ─────────────────────
  // Returns a deterministic number seeded by today's date.

  GH.dailySeed = function() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  };

  GH.seededRandom = function(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  };

})(window.GH);
