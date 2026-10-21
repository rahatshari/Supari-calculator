const CACHE_NAME = 'supari-calc-v101';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/pwa-maskable-512x512.png'
];

// Install: Cache static icons and skip waiting immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// Activate: Immediately purge all old caches
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

// Message listener
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Ignore Vite dev requests, network first for assets
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  // Never intercept dev server internals
  if (
    url.includes('/@vite/') ||
    url.includes('/@react-refresh') ||
    url.includes('/node_modules/') ||
    url.includes('.hot-update.') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Network First Strategy
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          // Only cache successful static assets
          if (!url.includes('/src/') && !url.includes('?')) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone).catch(() => {});
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.destination === 'image') {
            return caches.match('/icon.svg');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
