const CACHE_NAME = 'supari-calc-cache-v4';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png' // আপনার আইকন ফাইলটি .svg হলে এখানে './icon.svg' লিখে দেবেন
];

// ১. Install Event: বেসিক ফাইলগুলো ক্যাশ করা এবং skipWaiting ব্যবহার
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ২. Activate Event: পুরনো ক্যাশ অটোমেটিক ডিলিট করে নতুন আপডেট নেওয়া
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ৩. Fetch Event: 'Cache First' স্ট্র্যাটেজি এবং অফলাইন ফলব্যাক
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // যদি ক্যাশে ফাইল পাওয়া যায়, তবে সেটি রিটার্ন করবে (Cache First)
        if (response) {
          return response;
        }

        // ক্যাশে না থাকলে নেটওয়ার্ক থেকে কল করবে
        return fetch(event.request).catch(() => {
          // ইন্টারনেট না থাকলে এবং রিকোয়েস্টটি নেভিগেশন (HTML) হলে ডিফল্টভাবে index.html শো করবে
          if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
