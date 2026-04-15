const CACHE = 'arcade-v2';
const SHELL = ['./', './index.html', './manifest.json', './registry.json', './icon.svg'];

function shouldRefresh(url, request) {
  return request.mode === 'navigate' || url.pathname.endsWith('/registry.json') || url.pathname.includes('/games/');
}

async function updateCache(request) {
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    (async () => {
      const url = new URL(e.request.url);
      if (url.origin !== self.location.origin) {
        return fetch(e.request);
      }

      if (shouldRefresh(url, e.request)) {
        try {
          return await updateCache(e.request);
        } catch {
          return caches.match(e.request).then(cached => cached || caches.match('./index.html'));
        }
      }

      const cached = await caches.match(e.request);
      if (cached) return cached;
      return updateCache(e.request);
    })()
  );
});
