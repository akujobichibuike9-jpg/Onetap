// OneTap Service Worker - Updated for Network-First Strategy
// IMPORTANT: Change the version number below (v1.0.1 -> v1.0.2) whenever you update your code or icons!
const CACHE_VERSION = 'v1.0.1';
const STATIC_CACHE = `onetap-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `onetap-dynamic-${CACHE_VERSION}`;

// Files to cache immediately for offline use
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing New Version...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // Forces the new SW to become active immediately
      .catch((err) => console.log('[SW] Cache failed:', err))
  );
});

// Activate - clean old caches completely
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating and Purging Old Caches...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim()) // Takes control of all open tabs immediately
  );
});

// Fetch - Network First Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests (Logins, Posts, etc.)
  if (request.method !== 'GET') return;

  // 2. Skip API calls - These must always go to the server
  if (url.pathname.startsWith('/api/')) return;

  // 3. Skip external requests (like Google Fonts)
  if (url.origin !== location.origin) return;

  // 4. NETWORK FIRST STRATEGY
  // We try the network first. If it works, we show the update and save it to cache.
  // If the network fails (offline), we show the last cached version.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // If valid response, clone it and save to dynamic cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // NETWORK FAILED: Try to serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If everything fails and it's a page navigation, show offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'OneTap', body: 'You have a new notification' };
  if (event.data) {
    try { data = event.data.json(); } 
    catch (e) { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});