const CACHE_NAME = "willnapolini-icons-v3"; // Updated cache name
const BASE_PATH = "/thyshop.github.io";

const urlsToCache = [
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/shop/shopIndex.json`,
  `${BASE_PATH}/blog/blogIndex.json`,
  `${BASE_PATH}/assets/icons/icon-192x192.png`,
  `${BASE_PATH}/assets/icons/icon-512x512.png`
];

// Install - Cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache addAll error:', err))
  );
});

// Fetch - Custom caching strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // 1. Cache-first for assets
  if (requestUrl.pathname.includes('/assets/icons/')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
  // 2. Network-first for JSON data
  else if (requestUrl.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Update cache in background
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  }
  // 3. Network-first for HTML
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => 
          key !== CACHE_NAME ? caches.delete(key) : null
        )
      )
    )
  );
});
