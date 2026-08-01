// v3 — never cache the app shell. Only static assets.
const CACHE = 'kounouz-v3';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // App shell + JS: ALWAYS from network. Never serve a stale app.
  const isShell = e.request.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('index.html');
  if (isShell) return; // let the browser handle it normally (no SW cache)

  // Images/icons: cache-first (safe, they're versioned by filename)
  if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return res;
      }).catch(() => hit))
    );
  }
});
