// Service Worker for SplitKaroBhai PWA
// v4: Added push notification support
const CACHE_NAME = 'splitkarobhai-v4'
const urlsToCache = [
  '/manifest.json',
  // Don't cache pages - they need fresh auth state
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: 'explore', title: 'View' },
      { action: 'close', title: 'Close' },
    ],
  }

  if (event.data) {
    try {
      const data = event.data.json()
      options.body = data.message || data.body || options.body
      options.data = { ...options.data, ...data }
      if (data.title) {
        event.waitUntil(
          self.registration.showNotification(data.title, options)
        )
        return
      }
    } catch (e) {
      options.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification('SplitKaroBhai', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Navigate to the app when notification is clicked
  const urlToOpen = event.notification.data?.url || '/groups'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Fetch event - minimal caching, prioritize network for auth
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // NEVER intercept navigation requests - let them go to the server fresh
  // This ensures cookies are sent and auth state is correct
  if (event.request.mode === 'navigate') {
    return // Let browser handle normally
  }

  // Don't cache API requests
  if (event.request.url.includes('/api/')) {
    return
  }

  // Don't cache Supabase requests
  if (event.request.url.includes('supabase.co')) {
    return
  }

  // Don't cache Next.js data requests (RSC)
  if (event.request.url.includes('_next/') || event.request.url.includes('__next')) {
    return
  }

  // For static assets only, try cache first then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Only cache static assets (images, fonts, etc.)
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse
        }
        
        const contentType = networkResponse.headers.get('content-type') || ''
        const isStaticAsset = contentType.includes('image/') || 
                              contentType.includes('font/') ||
                              contentType.includes('application/javascript') ||
                              contentType.includes('text/css')
        
        if (isStaticAsset) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        
        return networkResponse
      })
    })
  )
})

