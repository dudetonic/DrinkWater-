/* Service worker for Hydration Buddy.
   Stage 1: app-shell caching.
   Stage 2 will add push event handling. */

const CACHE_NAME = 'hydration-buddy-v1';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache every file the app needs so it opens instantly, even offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: delete old caches from previous versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: answer from the cache when possible, otherwise go to the network.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

/* --- STAGE 2 NOTE ---
   Push handling (push + notificationclick) will be added here in Stage 2.
   iOS requires a registered service worker before web push works at all,
   so registering it now is required groundwork. */
