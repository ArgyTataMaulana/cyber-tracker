const CACHE_NAME = 'studyhub-v4';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/data.js',
    './js/gamification.js',
    './js/components.js',
    './js/app.js',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/images/lofi_cozy_room.png',
    './assets/images/cyberpunk_bg.png',
    './assets/images/sakura_bg.png'
];

// Install — cache semua assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching assets...');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            );
        })
    );
    self.clients.claim();
});

// Fetch — cache first, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // Cache new requests dynamically
                if (event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        }).catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
