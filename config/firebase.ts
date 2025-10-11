import { initializeApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Your Firebase config — keep this in sync with the JS file you had
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
let auth: Auth;
try {
  // Prefer React Native AsyncStorage persistence when available to persist auth between sessions.
  let initialized = false;
  try {
    // Load persistence helper dynamically so TS won't complain if types aren't available in this env
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reactNativeAuth = require('firebase/auth/react-native');
    if (reactNativeAuth && typeof reactNativeAuth.getReactNativePersistence === 'function') {
      const persistence = reactNativeAuth.getReactNativePersistence(AsyncStorage);
      // @ts-ignore - initializeAuth accepts the persistence option
      auth = initializeAuth(app, { persistence });
      // eslint-disable-next-line no-console
      console.log('Firebase Auth initialized with React Native AsyncStorage persistence');
      initialized = true;
    }
  } catch (innerErr) {
    // Module not available or failed — we'll fall back to default
    // eslint-disable-next-line no-console
    console.warn('React Native persistence not available, falling back to default Auth initialization');
  }

  if (!initialized) {
    // Fallback: use getAuth which returns the Auth instance for the app
    auth = getAuth(app);
    // eslint-disable-next-line no-console
    console.log('Firebase Auth initialized with getAuth (no RN persistence)');
  }
} catch (e) {
  // Final fallback
  auth = getAuth(app);
  // eslint-disable-next-line no-console
  console.warn('Failed to initialize Auth with persistence, using getAuth fallback', e);
}

const db: Firestore = getFirestore(app);

export { auth, db };
