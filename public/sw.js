// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'New Message';
  const notificationUrl = data.data?.url || '/dashboard';
  const defaultActions = [
    { action: 'open_app', title: 'Open' }
  ];

  const options = {
    body: data.body || 'You received a message',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    tag: notificationUrl,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    silent: false,
    actions: Array.isArray(data.actions) && data.actions.length ? data.actions : defaultActions,
    data: {
      ...(data.data || {}),
      url: notificationUrl,
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.action === 'open_chat'
    ? (event.notification.data?.chatUrl || event.notification.data?.url || '/dashboard')
    : event.action === 'view_post'
      ? (event.notification.data?.postUrl || event.notification.data?.url || '/dashboard')
      : (event.notification.data?.url || '/dashboard');

  const urlToOpen = actionUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === urlToOpen || client.url.includes(urlToOpen)) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});