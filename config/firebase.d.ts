import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

declare module '../config/firebase' {
  export const auth: Auth;
  export const db: Firestore;
}

export {};