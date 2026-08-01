const CACHE = 'grocery-shell-v4';

self.addEventListener('install', e => {
  // take over immediately rather than waiting for all tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  // Only handle same-origin. Google Fonts and the Apps Script sync calls
  // always go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Network-first: always try for the freshest version of the app, and fall
  // back to cache only when offline. This means a new deploy shows up on the
  // next load instead of being hidden behind a stale cache.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
