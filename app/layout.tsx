import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import LoadingScreen from '@/components/LoadingScreen';

export const metadata: Metadata = {
  title: 'Zefrix — Live Skill Sharing',
  description:
    'Zefrix is a live skill-sharing platform connecting students and creators through interactive, real-time classes. Join, learn, and grow with expert-led sessions designed to make learning simple and engaging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Initialize Firebase immediately before React loads */}
        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `
              import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
              import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
              import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
              
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
                window.doc = doc;
                window.setDoc = setDoc;
                window.getDoc = getDoc;
                window.updateDoc = updateDoc;
                window.serverTimestamp = serverTimestamp;
                
                console.log('✅ Firebase initialized in HTML head - ready immediately');
                console.log('Firebase Auth:', !!window.firebaseAuth);
                console.log('Firebase Firestore:', !!window.firebaseDb);
                
                // Dispatch ready event immediately
                window.dispatchEvent(new CustomEvent('firebaseReady'));
              } catch (error) {
                console.error('❌ Firebase initialization error in HTML head:', error);
                window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
              }
            `,
          }}
        />
      </head>
      <body>
        <LoadingScreen />
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}

