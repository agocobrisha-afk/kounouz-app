const CACHE = 'kounouz-v2';
const ASSETS = [
  './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Network-first for the app shell (index.html) so admin edits and code
// updates always show immediately when online. Falls back to cache only
// when offline. Other static assets (icons, manifest) stay cache-first.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const isShell = e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/');

  if (isShell) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
      return res;
    }))
  );
});
