const CACHE_NAME = 'video-notes-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('Error caching static assets:', err);
      })
  );
});

// Activate Service Worker
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
    })
  );
});

// Fetch Event Strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }

        // Not in cache - return the result from the live server
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            // Add the new response to the cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache POST requests or file downloads
                if (event.request.method !== 'POST' && !event.request.url.includes('/download/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // If the network request fails, try to return any cached response
            // This is particularly important for the form page
            return caches.match(event.request);
          });
      })
  );
});

// Handle offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(
      // Get pending notes from IndexedDB and try to sync them
      syncPendingNotes()
    );
  }
});

// Background sync function for pending notes
async function syncPendingNotes() {
  // This would be implemented if we need to sync with a backend server
  console.log('Background sync triggered');
}

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const notification = event.data.json();
    const title = 'Video Recovery Notes';
    const options = {
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/favicon.ico'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});