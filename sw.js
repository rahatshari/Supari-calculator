const CACHE_NAME = 'supari-calc-v8';

const STATIC_ASSETS = [
  './',
  './index.html',
  './html2canvas.min.js',
  './manifest.json',
  './icon.svg',
  './kacha-paka.html',
  './shukno.html'
];

// Install: Cache all core files for complete offline use
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and take immediate control
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

// Fetch: Serve from cache first; fallback to network; cache runtime requests (fonts, icons)
self.addEventListener('fetch', event => {
  const request = event.request;

  // Handle HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match('./index.html') || caches.match(request);
        })
    );
    return;
  }

  // Handle static assets & Google Fonts: Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        // Cache valid GET responses (like Google Fonts or CDN assets)
        if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is an image or icon
        if (request.destination === 'image') {
          return caches.match('./icon.svg');
        }
      });
    })
  );
});
