const CACHE_NAME = 'supari-calc-v25';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/pwa-maskable-512x512.png'
];

// Install: Cache core assets and activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: Immediately remove all old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener to trigger immediate skipWaiting
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Network First for all application code, fallback to cache when offline
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  // Network First Strategy
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          if (request.destination === 'image') {
            return caches.match('/icon.svg');
          }
        });
      })
  );
});
