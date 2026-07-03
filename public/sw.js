const CACHE_NAME = 'bmd-cache-1783071727470';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/login',
  '/dashboard',
  '/dashboard/create',
  '/katzen'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

const IMAGE_CACHE_NAME = 'bmd-images-cache';
const MAX_IMAGES = 80;

function limitCacheSize(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(cacheName, maxItems);
        });
      }
    });
  });
}

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isImage = url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) || 
                  url.href.includes('/storage/v1/object/public/media/');

  if (isImage) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          if (response && (response.status === 200 || response.status === 0)) {
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              limitCacheSize(IMAGE_CACHE_NAME, MAX_IMAGES);
            });
          }
          return response;
        }).catch(() => {
          return null;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache new successful GET requests
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Return cached page or custom offline fallback if network fails
        return caches.match('/offline');
      });
    })
  );
});

// Support manual skipWaiting messaging from client to force activation of new builds
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
