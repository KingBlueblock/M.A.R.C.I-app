
// sw.js - Service Worker for Offline Capabilities

const CACHE_NAME = 'marci-ai-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap',
];

/**
 * On install, cache the core application shell files.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Use a new Request object to handle potential CORS issues with external URLs
        const requests = APP_SHELL_URLS.map(url => new Request(url, { redirect: 'follow' }));
        return cache.addAll(requests);
      })
      .catch(err => {
        console.error("Failed to cache app shell:", err);
      })
  );
});

/**
 * On fetch, serve from cache first. If not in cache, fetch from network,
 * then cache the new resource for future offline use.
 */
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response to cache
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Only cache responses from http or https schemes.
            if (!response.url || !response.url.startsWith('http')) {
              return response;
            }

            // Clone the response because it's a stream that can only be consumed once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(err => {
            console.error('Fetch failed; app may be offline and resource not cached.', err);
            // Optionally, return a fallback offline page here.
        });
      })
  );
});

/**
 * On activate, clean up old caches to ensure the user has the latest version.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
