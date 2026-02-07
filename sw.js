const CACHE_NAME = 'fokusflow-pro-v2'; // Versi cache dinaikkan
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Cache CDN Eksternal agar tetap jalan offline
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Event: Caching aset awal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate Event: Membersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// Fetch Event: Strategi Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  // Abaikan request selain GET atau chrome-extension
  if (event.request.method !== 'GET' || event.request.url.indexOf('http') !== 0) return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika ada di cache, gunakan itu
        if (response) {
          return response;
        }
        // Jika tidak, ambil dari jaringan
        return fetch(event.request).then(
          (response) => {
            // Cek jika response valid
            if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // Clone response karena stream hanya bisa dikonsumsi sekali
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache request baru secara dinamis
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
