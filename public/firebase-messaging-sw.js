import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const { title, body, ...rest } = data.notification || {};
  
  const options = {
    body,
    icon: '/images/ISOC.png',
    badge: '/images/ISOC.png',
    vibrate: [200, 100, 200],
    ...rest,
    data: data.data || {},
    actions: [
      { action: 'open_app', title: 'Open App' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title || 'ISOC Prayer Room', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
