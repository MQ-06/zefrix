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
    doc: any;
    setDoc: any;
    getDoc: any;
    updateDoc: any;
    serverTimestamp: any;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const ADMIN_EMAIL = 'kartik@zefrix.com';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const normalizeEmail = (email?: string | null) => (email || '').toLowerCase();

  // Check if Firebase is already initialized (from HTML head script)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If Firebase is already initialized from HTML head, set up auth listener immediately
    if (window.firebaseAuth && window.firebaseDb && window.onAuthStateChanged) {
      console.log('✅ Firebase already initialized from HTML head');
      setLoading(false);
      return;
    }

    // If not ready, wait for firebaseReady event (from HTML head script)
    const handleFirebaseReady = () => {
      console.log('✅ Firebase ready event received from HTML head');
      setLoading(false);
    };

    window.addEventListener('firebaseReady', handleFirebaseReady);

    // Also poll as fallback (in case event was missed)
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
              const isAdminEmail = normalizeEmail(firebaseUser.email) === ADMIN_EMAIL;
              if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log('📄 User data from Firestore:', userData);
                let role = userData.role || 'student';
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
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: userData.name || firebaseUser.displayName,
                  photoURL: userData.photoURL || firebaseUser.photoURL,
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
      
      const role = email.toLowerCase() === 'kartik@zefrix.com' ? 'admin' : 'student';
      
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
        role = user.email?.toLowerCase() === 'kartik@zefrix.com' ? 'admin' : 'student';
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
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

