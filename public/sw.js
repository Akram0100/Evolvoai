// Service Worker for Push Notifications
// EvolvoAI - https://evolvoai-ysus.onrender.com

const CACHE_NAME = 'evolvoai-v1';
const urlsToCache = [
  '/',
  '/blog',
  '/portfolio',
  '/chatbot',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Push Notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yangi maqola chiqdi!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: '/',
    },
    actions: [
      { action: 'open', title: "O'qish", icon: '/icons/icon-72x72.png' },
      { action: 'close', title: 'Yopish' },
    ],
  };

  // Parse JSON if available
  try {
    const data = event.data?.json();
    if (data) {
      options.body = data.body || options.body;
      options.data.url = data.url || '/';
      event.waitUntil(
        self.registration.showNotification(data.title || 'EvolvoAI', options)
      );
      return;
    }
  } catch (e) {
    // Not JSON, use text
  }

  event.waitUntil(
    self.registration.showNotification('EvolvoAI - Yangi Post!', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('EvolvoAI Service Worker loaded!');
