// Hope Train Service Worker

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// Required for Chrome to consider this site installable as a PWA
self.addEventListener('fetch', () => {})

// Push notification received
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Hope Train'
  const options = {
    body: data.body ?? '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag ?? 'hope-train',
    data: { url: data.url ?? '/volunteer' },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification tapped — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/volunteer'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus()
        }
        return clients.openWindow(url)
      })
  )
})
