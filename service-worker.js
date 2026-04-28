/**
 * GameHub Service Worker
 * Caches all hub pages and shared assets for offline access.
 * Individual game pages are cached on first visit (cache-then-network).
 */

const CACHE = 'gamehub-v1';

// Shell: always available offline
const SHELL = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json',
  '/shared/utils.js',
  '/shared/sounds.js',
  '/minigames/index.html',
  '/timed-challenge/index.html',
  '/multiplayer/index.html',
  '/2player/index.html',
  '/leaderboard/index.html',
];

// ─── INSTALL: cache the shell ──────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE: remove old caches ─────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── FETCH: cache-first for shell, network-first for game pages ───
self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Firebase and Google Fonts: always network, never cache
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // Shell assets: serve from cache immediately
      if (cached && SHELL.includes(url.pathname)) {
        return cached;
      }

      // Game pages and assets: network first, fall back to cache
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline fallback
        if (cached) return cached;
        if (e.request.headers.get('accept').includes('text/html')) {
          return caches.match('/404.html');
        }
      });
    })
  );
});
