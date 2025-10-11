import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PASTE YOUR FIREBASE CONFIG HERE (from Step 4)
const firebaseConfig = {
  apiKey: "AIzaSyDSMrxPgDSr0ihEFpIuw3HY_RZdnchl5nY",
  authDomain: "carbon-footprint-tracker-ca4f8.firebaseapp.com",
  projectId: "carbon-footprint-tracker-ca4f8",
  storageBucket: "carbon-footprint-tracker-ca4f8.firebasestorage.app",
  messagingSenderId: "613745171479",
  appId: "1:613745171479:web:3b3ef37ea5bc7e1ced5052",
  measurementId: "G-02Z8C87RNF"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
/** @type {import('firebase/auth').Auth} */
let auth;
try {
  auth = /** @type {import('firebase/auth').Auth} */ (initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  }));
} catch (error) {
  // If initializeAuth fails (already initialized), use getAuth
  auth = /** @type {import('firebase/auth').Auth} */ (getAuth(app));
}

/** @type {import('firebase/firestore').Firestore} */
const db = getFirestore(app);

export { auth, db };