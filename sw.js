// BOAG Koncernapp - Service Worker för Push-notiser

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', function(event) {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: 'BOAG', body: event.data.text() } }

  const options = {
    body: data.body || '',
    icon: '/src/logo.png',
    badge: '/src/logo.png',
    tag: data.tag || 'boag-notis',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/' },
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'BOAG Koncernapp', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
