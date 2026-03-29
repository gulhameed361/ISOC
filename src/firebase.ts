import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let messaging: Messaging | null = null;

export const getMessagingInstance = (): Messaging | null => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn('Firebase Messaging not available:', error);
      }
    }
  }
  return messaging;
};

export const requestFcmToken = async (): Promise<string | null> => {
  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const existingToken = localStorage.getItem('fcmToken');
    if (existingToken) return existingToken;

    const serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    if (token) {
      localStorage.setItem('fcmToken', token);
    }
    return token;
  } catch (error) {
    console.warn('FCM token error:', error);
    return null;
  }
};

export const onFCMMessage = (callback: (payload: any) => void) => {
  const msg = getMessagingInstance();
  if (msg) {
    onMessage(msg, callback);
  }
};
