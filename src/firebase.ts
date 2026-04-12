import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Use initializeAuth with IndexedDB persistence for better session stability on iOS
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
});

export const googleProvider = new GoogleAuthProvider();

export default app;