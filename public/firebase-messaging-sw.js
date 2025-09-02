// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: "AIzaSyBZrJtVRkcQSeRazVWILkaEAPvEFAHaeHc",
  authDomain: "sablon-4d924.firebaseapp.com",
  projectId: "sablon-4d924",
  storageBucket: "sablon-4d924.firebasestorage.app",
  messagingSenderId: "770265453337",
  appId: "1:770265453337:web:45a22c1b3fc1aaffd8ab88"
};

firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'chat-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon.png'
      }
    ],
    data: {
      url: '/chat',
      ...payload.data
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || '/chat';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Log notification dismissal if needed
  // This could be sent to your analytics or logging service
});
