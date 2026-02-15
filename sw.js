const CACHE_NAME = 'your-timer-v2'; // Versi dinaikkan untuk memuat perubahan UI terbaru
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // CDN Eksternal (Penting untuk UI)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  // Ikon Jam (Favicon & Manifest)
  'https://cdn-icons-png.flaticon.com/512/3176/3176373.png'
];

// 1. Install Event: Menyimpan aset ke cache saat pertama kali dibuka
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Memaksa SW baru untuk segera aktif tanpa menunggu tab ditutup
  self.skipWaiting();
});

// 2. Activate Event: Membersihkan cache versi lama agar tidak menumpuk
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Mengambil alih kontrol halaman segera
  self.clients.claim();
});

// 3. Fetch Event: Strategi "Cache First, then Network"
// Jika ada di cache (offline), ambil dari cache. Jika tidak, ambil dari internet lalu simpan.
self.addEventListener('fetch', (event) => {
  // Hanya proses request GET (abaikan POST/PUT dll atau chrome-extension)
  if (event.request.method !== 'GET' || event.request.url.indexOf('http') !== 0) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika aset ditemukan di cache, gunakan itu
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak, ambil dari jaringan
      return fetch(event.request).then((networkResponse) => {
        // Validasi respon jaringan
        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // Kloning respon karena stream hanya bisa dibaca sekali
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback opsional jika offline total dan aset tidak ada di cache
        // (Bisa return halaman offline kustom di sini jika ada)
      });
    })
  );
});
