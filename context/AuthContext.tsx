
// // import React, { createContext, useState, useEffect, useContext } from 'react';
// // import { 
// //   createUserWithEmailAndPassword, 
// //   signInWithEmailAndPassword,
// //   signOut,
// //   onAuthStateChanged,
// //   User
// // } from 'firebase/auth';
// // import { auth } from '../config/firebase';
// // import { useRouter, useSegments } from 'expo-router';
// // import { initializeUserDashboard } from '../services/dashboardService';

// // interface AuthContextType {
// //   user: User | null;
// //   loading: boolean;
// //   signup: (email: string, password: string) => Promise<void>;
// //   login: (email: string, password: string) => Promise<void>;
// //   logout: () => Promise<void>;
// // }

// // const AuthContext = createContext<AuthContextType | null>(null);

// // export function useAuth() {
// //   const context = useContext(AuthContext);
// //   if (!context) {
// //     throw new Error('useAuth must be used within AuthProvider');
// //   }
// //   return context;
// // }

// // export function AuthProvider({ children }: { children: React.ReactNode }) {
// //   const [user, setUser] = useState<User | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const router = useRouter();
// //   const segments = useSegments();

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
// //       setUser(currentUser);
// //       setLoading(false);
// //     });
// //     return unsubscribe;
// //   }, []);

// //   // Auto-navigation based on auth state
// //   useEffect(() => {
// //     if (loading) return;

// //     const currentRoute = segments[0];
    
// //     if (user) {
// //       // User is logged in
// //       if (currentRoute === 'login' || currentRoute === 'signup' || currentRoute === 'index') {
// //         router.replace('/landing');
// //       }
// //     } else {
// //       // User is not logged in
// //       if (currentRoute !== 'login' && currentRoute !== 'signup' && currentRoute !== 'index') {
// //         router.replace('/login');
// //       }
// //     }
// //   }, [user, segments, loading]);

// //   const signup = async (email: string, password: string) => {
// //     try {
// //       console.log('Starting signup process...');
// //       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
// //       console.log('User created successfully:', userCredential.user.uid);
      
// //       // Initialize user dashboard data in Firestore
// //       await initializeUserDashboard(userCredential.user.uid);
      
// //       console.log('User dashboard initialized successfully');
// //       router.replace('/landing');
// //     } catch (error: any) {
// //       console.error('Signup error:', error);
// //       throw error;
// //     }
// //   };

// //   const login = async (email: string, password: string) => {
// //     try {
// //       await signInWithEmailAndPassword(auth, email, password);
// //       router.replace('/landing');
// //     } catch (error: any) {
// //       console.error('Login error:', error);
// //       throw error;
// //     }
// //   };

// //   const logout = async () => {
// //     try {
// //       await signOut(auth);
// //       router.replace('/login');
// //     } catch (error: any) {
// //       console.error('Logout error:', error);
// //       throw error;
// //     }
// //   };

// //   const value: AuthContextType = { 
// //     user, 
// //     signup, 
// //     login, 
// //     logout, 
// //     loading 
// //   };

// //   return (
// //     <AuthContext.Provider value={value}>
// //       {!loading && children}
// //     </AuthContext.Provider>
// //   );
// // }

// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { onAuthStateChanged, User } from 'firebase/auth';
// import { auth } from '../config/firebase';

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   loading: true,
// });

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setUser(user);
//       setLoading(false);
//     });

//     return unsubscribe;
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { auth } from '../config/firebase';

// `auth` is exported from a JS file so TS can't infer its type; cast it here
const firebaseAuth = auth as unknown as Auth;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      // Debug logs to help diagnose Firestore permission issues
      // eslint-disable-next-line no-console
      console.log('onAuthStateChanged fired - user:', user ? user.uid : 'no-user');
      if (user) {
        try {
          const token = await user.getIdToken();
          // eslint-disable-next-line no-console
          console.log('Retrieved ID token (first 64 chars):', token ? token.substring(0, 64) + '...' : 'none');
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to fetch ID token:', err);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    // optional: initialize user stats here
    return cred.user;
  };

  const login = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return cred.user;
  };

  const logout = async () => {
  await signOut(firebaseAuth);
  };

  const value: AuthContextType = { user, loading, signup, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};