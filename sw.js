const CACHE = 'riocore-journal-v5';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  const isFirebaseSdk =
    url.hostname === 'www.gstatic.com' &&
    url.pathname.startsWith('/firebasejs/10.12.5/');

  const isAppShell =
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/Journal1/') ||
    url.pathname.endsWith('/Journal1');

  // Firebase SDK
  if (isFirebaseSdk) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) return cached;

          return fetch(event.request).then(response => {
            const copy = response.clone();

            caches.open(CACHE).then(cache => {
              cache.put(event.request, copy);
            });

            return response;
          });
        })
    );

    return;
  }

  // Main application
  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            cached => cached || caches.match('./index.html')
          )
        )
    );

    return;
  }

  // Other assets
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request).then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        });
      })
      .catch(() => caches.match('./index.html'))
  );
});
