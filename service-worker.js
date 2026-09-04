const CACHE = 'schedule-shell-2026.09.04.5';
const asset = (path = '') => new URL(path, self.registration.scope).href;
const SHELL = [
  asset(''),
  asset('index.html'),
  asset('manifest.webmanifest'),
  asset('icon-192.png'),
  asset('icon-512.png'),
  asset('apple-touch-icon.png'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map(url => new Request(url, {cache:'reload'})))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('schedule-shell-') && key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname === new URL('version.json', self.registration.scope).pathname) {
    event.respondWith(fetch(request, {cache:'no-store'}));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, {cache:'no-store'})
        .then((response) => {
          if (!response.ok) throw new Error('Page unavailable');
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(asset('index.html'), copy)));
          return response;
        })
        .catch(() => caches.open(CACHE).then((cache) => cache.match(asset('index.html')))),
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
