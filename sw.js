const CACHE_NAME = "willnapolini-v4";  // Updated version
const BASE_PATH = "/thyshop.github.io";
const OFFLINE_URL = `${BASE_PATH}/offline.html`;

// Precached Core Files
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/assets/icons/icon-192x192.png`,
  `${BASE_PATH}/assets/icons/icon-512x512.png`,
  `${BASE_PATH}/manifest.json`,
  OFFLINE_URL
];

// Dynamic Data Endpoints
const API_CACHE = [
  `${BASE_PATH}/shop/shopIndex.json`,
  `${BASE_PATH}/blog/blogIndex.json`
];

// Install - Cache Core Resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch - Advanced Caching Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // 1. Cache First for Static Assets
  if (isSameOrigin && (
      url.pathname.includes('/assets/') || 
      url.pathname.includes('/favicon.') ||
      url.pathname === '/thyshop.github.io/manifest.json'
  )) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetchAndCache(event.request))
    );
    return;
  }

  // 2. Network First for API/JSON
  if (isSameOrigin && (
      url.pathname.endsWith('.json') ||
      API_CACHE.includes(url.pathname)
  )) {
    event.respondWith(
      fetchAndCache(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Navigation Requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful navigation requests
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Fallback to offline page
          return caches.match(OFFLINE_URL) || 
                 new Response('<h1>Offline</h1><p>Please check your connection</p>', {
                   headers: {'Content-Type': 'text/html'}
                 });
        })
    );
    return;
  }

  // 4. Default Network First
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Activate - Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper Functions
function fetchAndCache(request) {
  return fetch(request).then(response => {
    if (!response.ok) throw Error('Network response was not ok');
    
    const responseClone = response.clone();
    caches.open(CACHE_NAME)
      .then(cache => cache.put(request, responseClone));
    
    return response;
  });
}
