const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', (evt) => {
    evt.waitUntil(
        caches.open(DATA_CACHE_NAME).then((cache) => cache.add('/api/icons'))
    );

    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
    evt.waitUntil(
        caches.keys().then(keylist => {
            return Promise.all(
                keylist.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
    if (evt.request.url.includes('/api')) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        return cache.match(evt.request);
                    });
            }).catch(err => console.err(err))
        );

        return;
    }
    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.matcfh(evt.request).then(response => {
                return response || fetch(evt.request);
            });
        })
    );
});