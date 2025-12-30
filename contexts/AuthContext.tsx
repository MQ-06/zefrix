'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  role: 'student' | 'creator' | 'admin';
  isProfileComplete?: boolean;
  isCreatorApproved?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    createUserWithEmailAndPassword: any;
    signInWithEmailAndPassword: any;
    signOut: any;
    updateProfile: any;
    GoogleAuthProvider: any;
    signInWithPopup: any;
    onAuthStateChanged: any;
    sendPasswordResetEmail: any;
    doc: any;
    setDoc: any;
    getDoc: any;
    updateDoc: any;
    serverTimestamp: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const ADMIN_EMAILS = ['kartik@zefrix.com', 'mariamqadeem181@gmail.com'];
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const normalizeEmail = (email?: string | null) => (email || '').toLowerCase();

  // Initialize Firebase immediately on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Firebase is already initialized
    if (window.firebaseAuth && window.firebaseDb && window.onAuthStateChanged) {
      console.log('✅ Firebase already initialized');
      setLoading(false);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[data-firebase-init]')) {
      // Script already exists, wait for it
      const handleFirebaseReady = () => {
        console.log('✅ Firebase ready event received');
        setLoading(false);
      };
      window.addEventListener('firebaseReady', handleFirebaseReady);
      return () => window.removeEventListener('firebaseReady', handleFirebaseReady);
    }

    // Load Firebase initialization script immediately
    const initScript = document.createElement('script');
    initScript.setAttribute('data-firebase-init', 'true');
    initScript.type = 'module';
    initScript.textContent = `
      import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
      import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      
      const firebaseConfig = {
        apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
        authDomain: "zefrix-custom.firebaseapp.com",
        projectId: "zefrix-custom",
        storageBucket: "zefrix-custom.firebasestorage.app",
        messagingSenderId: "50732408558",
        appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
        measurementId: "G-27HS1SWB5X"
      };
      
      try {
        // Check if app is already initialized
        const existingApps = getApps();
        const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
        
        window.firebaseAuth = getAuth(app);
        window.firebaseDb = getFirestore(app);
        window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
        window.signInWithEmailAndPassword = signInWithEmailAndPassword;
        window.signOut = signOut;
        window.updateProfile = updateProfile;
        window.GoogleAuthProvider = GoogleAuthProvider;
        window.signInWithPopup = signInWithPopup;
        window.onAuthStateChanged = onAuthStateChanged;
        window.sendPasswordResetEmail = sendPasswordResetEmail;
        window.doc = doc;
        window.setDoc = setDoc;
        window.getDoc = getDoc;
        window.updateDoc = updateDoc;
        window.serverTimestamp = serverTimestamp;
        
        // Add Firestore query functions for instructors page and other components
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.getDocs = getDocs;
        
        console.log('✅ Firebase initialized successfully');
        console.log('Firebase Auth:', !!window.firebaseAuth);
        console.log('Firebase Firestore:', !!window.firebaseDb);
        console.log('Firestore Query Functions:', !!window.collection, !!window.query, !!window.where, !!window.getDocs);
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('firebaseReady'));
      } catch (error) {
        console.error('Firebase initialization error:', error);
        window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
      }
    `;
    document.head.appendChild(initScript);

    // Wait for Firebase to initialize
    const handleFirebaseReady = () => {
      console.log('✅ Firebase ready event received');
      setLoading(false);
    };

    window.addEventListener('firebaseReady', handleFirebaseReady);

    // Also poll as fallback
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb && window.onAuthStateChanged) {
        clearInterval(checkFirebase);
        console.log('✅ Firebase detected via polling');
        setLoading(false);
      }
    }, 100);

    // Cleanup after 5 seconds if still not ready
    const timeout = setTimeout(() => {
      clearInterval(checkFirebase);
      if (!window.firebaseAuth || !window.firebaseDb) {
        console.warn('⚠️ Firebase not ready after 5 seconds, but continuing...');
        setLoading(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('firebaseReady', handleFirebaseReady);
      clearInterval(checkFirebase);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    // Wait for Firebase to be ready
    const setupAuthListener = () => {
      if (!window.firebaseAuth || !window.onAuthStateChanged) {
        console.log('⏳ Waiting for Firebase Auth to be ready...');
        return null;
      }

      console.log('🔐 Setting up auth state listener...');

      // Listen for auth state changes
      const unsubscribe = window.onAuthStateChanged(window.firebaseAuth, async (firebaseUser: any) => {
        console.log('👤 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');

        if (firebaseUser) {
          try {
            // Fetch user data from Firestore
            if (window.firebaseDb && window.doc && window.getDoc) {
              const userDoc = await window.getDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid));
              const isAdminEmail = ADMIN_EMAILS.some(adminEmail => normalizeEmail(firebaseUser.email) === normalizeEmail(adminEmail));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('📄 User data from Firestore:', userData);
                let role = userData.role || 'student';

                // Sync photoURL from Firebase Auth to Firestore if it exists and is different
                const authPhotoURL = firebaseUser.photoURL || '';
                const firestorePhotoURL = userData.photoURL || '';
                if (authPhotoURL && authPhotoURL !== firestorePhotoURL && window.updateDoc) {
                  try {
                    await window.updateDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), {
                      photoURL: authPhotoURL,
                      profileImage: authPhotoURL // Also update profileImage to keep them in sync
                    });
                    console.log('📸 Synced photoURL from Firebase Auth to Firestore');
                  } catch (err) {
                    console.error('Failed to sync photoURL to Firestore:', err);
                  }
                }

                if (isAdminEmail) {
                  role = 'admin';
                  if (userData.role !== 'admin' && window.updateDoc) {
                    try {
                      await window.updateDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), { role: 'admin' });
                      console.log('🔒 Elevated admin role in Firestore for', firebaseUser.email);
                    } catch (err) {
                      console.error('Failed to update admin role in Firestore:', err);
                    }
                  }
                }

                // Use synced photoURL (from Auth if available, otherwise from Firestore)
                const finalPhotoURL = authPhotoURL || firestorePhotoURL || userData.profileImage || '';

                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: userData.name || firebaseUser.displayName,
                  photoURL: finalPhotoURL,
                  role,
                  isProfileComplete: userData.isProfileComplete || false,
                  isCreatorApproved: userData.isCreatorApproved || false,
                });
                console.log('✅ User state updated with role:', role);
              } else {
                // User exists in auth but not in Firestore - create basic record
                console.log('⚠️ User not found in Firestore, using default role');
                const role = isAdminEmail ? 'admin' : 'student';
                if (window.setDoc) {
                  try {
                    await window.setDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), {
                      email: firebaseUser.email,
                      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                      photoURL: firebaseUser.photoURL || '',
                      role,
                      createdAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
                    }, { merge: true });
                    console.log('🆕 Created user record in Firestore with role:', role);
                  } catch (err) {
                    console.error('Failed to seed user record in Firestore:', err);
                  }
                }
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  role,
                  isProfileComplete: false,
                });
              }
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: 'student',
                isProfileComplete: false,
              });
            }
          } catch (error) {
            console.error('❌ Error fetching user data:', error);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'student',
              isProfileComplete: false,
            });
          }
        } else {
          console.log('🚪 User signed out');
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    // Try to set up immediately
    let unsubscribe: (() => void) | null = setupAuthListener();

    // If not ready, listen for firebaseReady event and poll as fallback
    if (!unsubscribe) {
      const handleFirebaseReady = () => {
        console.log('📢 Firebase ready event received, setting up auth listener...');
        const newUnsubscribe = setupAuthListener();
        if (newUnsubscribe) {
          unsubscribe = newUnsubscribe;
        }
      };

      window.addEventListener('firebaseReady', handleFirebaseReady);

      // Poll as fallback in case event is missed
      const pollInterval = setInterval(() => {
        if (window.firebaseAuth && window.onAuthStateChanged && !unsubscribe) {
          const newUnsubscribe = setupAuthListener();
          if (newUnsubscribe) {
            unsubscribe = newUnsubscribe;
            clearInterval(pollInterval);
          }
        }
      }, 100);

      // Clear polling after 10 seconds
      const pollTimeout = setTimeout(() => {
        clearInterval(pollInterval);
      }, 10000);

      return () => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        clearInterval(pollInterval);
        clearTimeout(pollTimeout);
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const waitForFirebase = async (maxWait = 10000): Promise<void> => {
    const startTime = Date.now();
    while (!window.firebaseAuth || !window.signInWithEmailAndPassword) {
      if (Date.now() - startTime > maxWait) {
        throw new Error('Firebase initialization timeout. Please refresh the page.');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Starting sign in process...');
    await waitForFirebase();

    try {
      console.log('🔐 Calling signInWithEmailAndPassword...');
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email.trim(), password);
      console.log('✅ Sign in successful, user:', cred.user.email);

      // Fetch user role from Firestore
      if (window.firebaseDb && window.doc && window.getDoc) {
        const userDoc = await window.getDoc(window.doc(window.firebaseDb, 'users', cred.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📄 User role from Firestore:', userData.role);
          if (window.updateDoc && window.serverTimestamp) {
            await window.updateDoc(window.doc(window.firebaseDb, 'users', cred.user.uid), {
              lastLogin: window.serverTimestamp(),
            });
          }
        }
      }
      // Note: onAuthStateChanged will automatically update the user state
      console.log('⏳ Waiting for auth state listener to update user state...');
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    await waitForFirebase();

    if (!window.createUserWithEmailAndPassword || !window.updateProfile) {
      throw new Error('Firebase Auth methods not available. Please refresh the page.');
    }

    try {
      const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email.trim(), password);
      await window.updateProfile(cred.user, { displayName: name });

      const isAdminEmail = ADMIN_EMAILS.some(adminEmail => normalizeEmail(email) === normalizeEmail(adminEmail));
      const role = isAdminEmail ? 'admin' : 'student';

      // Wait for Firestore to be ready
      let attempts = 0;
      while (!window.firebaseDb || !window.doc || !window.setDoc || !window.serverTimestamp) {
        if (attempts++ > 50) {
          throw new Error('Firestore initialization timeout. Please refresh the page.');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await window.setDoc(window.doc(window.firebaseDb, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: email.trim(),
        name: name.trim(),
        photoURL: '',
        role,
        isProfileComplete: false,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      });
    } catch (error: any) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    await waitForFirebase();

    if (!window.GoogleAuthProvider || !window.signInWithPopup) {
      throw new Error('Firebase Auth methods not available. Please refresh the page.');
    }

    try {
      const googleProvider = new window.GoogleAuthProvider();
      const cred = await window.signInWithPopup(window.firebaseAuth, googleProvider);
      const user = cred.user;

      // Wait for Firestore to be ready
      let attempts = 0;
      while (!window.firebaseDb || !window.doc || !window.getDoc || !window.setDoc || !window.updateDoc || !window.serverTimestamp) {
        if (attempts++ > 50) {
          throw new Error('Firestore initialization timeout. Please refresh the page.');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const userRef = window.doc(window.firebaseDb, 'users', user.uid);
      const snap = await window.getDoc(userRef);

      let role = 'student';
      if (!snap.exists()) {
        const isAdminEmailForGoogle = ADMIN_EMAILS.some(adminEmail => normalizeEmail(user.email) === normalizeEmail(adminEmail));
        role = isAdminEmailForGoogle ? 'admin' : 'student';
        await window.setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || '',
          role,
          isProfileComplete: false,
          createdAt: window.serverTimestamp(),
          lastLogin: window.serverTimestamp(),
        });
      } else {
        role = snap.data().role;
        await window.updateDoc(userRef, {
          lastLogin: window.serverTimestamp(),
          photoURL: user.photoURL || snap.data().photoURL || '',
        });
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
    }
  };

  const signOut = async () => {
    await waitForFirebase();

    if (!window.signOut) {
      throw new Error('Firebase Auth methods not available. Please refresh the page.');
    }

    try {
      await window.signOut(window.firebaseAuth);
      setUser(null);
      router.push('/');
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await waitForFirebase();

    if (!window.sendPasswordResetEmail) {
      throw new Error('Firebase Auth methods not available. Please refresh the page.');
    }

    try {
      await window.sendPasswordResetEmail(window.firebaseAuth, email.trim());
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

