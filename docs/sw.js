/* Mendday service worker.
 *
 * The app has no backend, so this exists purely to make it work offline once
 * installed. Bump VERSION whenever the shell changes — the old cache is
 * dropped on activate.
 *
 * Note it never caches anything a person has typed: their data lives in
 * localStorage, which this does not touch.
 */
const VERSION = 'mendday-v4';
const SHELL = [
  './',
  './index.html',
  './src/styles.css',
  './src/data/quiz.js',
  './src/data/tasks.js',
  './src/data/lessons.js',
  './src/data/phases.js',
  './src/engine/engine.js',
  './src/store.js',
  './src/backup.js',
  './src/insight.js',
  './src/ui/quiz-ui.js',
  './src/ui/app-ui.js',
  './icons/icon-192.png',
  './icons/apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // One missing file must not fail the whole install.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Same-origin: serve from cache, refresh in the background.
  if (new URL(req.url).origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const live = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || live;
      })
    );
    return;
  }

  // Cross-origin (the webfonts): try the network, fall back to whatever we
  // have. Missing fonts degrade to the fallback stacks, which is fine.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
