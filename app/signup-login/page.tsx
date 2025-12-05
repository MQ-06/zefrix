'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    createUserWithEmailAndPassword: any;
    signInWithEmailAndPassword: any;
    updateProfile: any;
    GoogleAuthProvider: any;
    signInWithPopup: any;
    doc: any;
    setDoc: any;
    getDoc: any;
    updateDoc: any;
    serverTimestamp: any;
  }
}

export default function SignupLoginPage() {
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!window.firebaseAuth || !window.firebaseDb) {
      alert('Firebase not initialized. Please wait...');
      return;
    }

    const form = e.currentTarget;
    const name = (form.querySelector('#signup-name') as HTMLInputElement)?.value.trim();
    const email = (form.querySelector('#signup-email') as HTMLInputElement)?.value.trim();
    const password = (form.querySelector('#signup-password') as HTMLInputElement)?.value;

    try {
      const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      await window.updateProfile(cred.user, { displayName: name });
      
      const role = email.toLowerCase() === 'kartik@zefrix.com' ? 'admin' : 'student';
      
      await window.setDoc(window.doc(window.firebaseDb, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        photoURL: '',
        role,
        isProfileComplete: false,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      });

      alert('Account created!');
      if (role === 'admin') router.push('/admin-dashboard');
      else router.push('/student-dashboard');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!window.firebaseAuth || !window.firebaseDb) {
      alert('Firebase not initialized. Please wait...');
      return;
    }

    const form = e.currentTarget;
    const email = (form.querySelector('#login-email') as HTMLInputElement)?.value.trim();
    const password = (form.querySelector('#login-password') as HTMLInputElement)?.value;

    try {
      const cred = await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
      const snap = await window.getDoc(window.doc(window.firebaseDb, 'users', cred.user.uid));
      const role = snap.exists() ? snap.data().role : 'student';

      alert('Login successful!');
      if (role === 'admin') router.push('/admin-dashboard');
      else if (role === 'creator') router.push('/creator-dashboard');
      else router.push('/student-dashboard');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    if (!window.firebaseAuth || !window.firebaseDb) {
      alert('Firebase not initialized. Please wait...');
      return;
    }

    const googleProvider = new window.GoogleAuthProvider();
    const googleSignInBtn = document.getElementById('googleSignIn');
    const googleSignUpBtn = document.getElementById('googleSignUp');

    if (googleSignInBtn) googleSignInBtn.setAttribute('disabled', 'true');
    if (googleSignUpBtn) googleSignUpBtn.setAttribute('disabled', 'true');

    try {
      const cred = await window.signInWithPopup(window.firebaseAuth, googleProvider);
      const user = cred.user;
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
        await window.updateDoc(userRef, { lastLogin: window.serverTimestamp() });
      }

      if (role === 'admin') router.push('/admin-dashboard');
      else if (role === 'creator') router.push('/creator-dashboard');
      else router.push('/student-dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        alert(err.message);
      }
    } finally {
      if (googleSignInBtn) googleSignInBtn.removeAttribute('disabled');
      if (googleSignUpBtn) googleSignUpBtn.removeAttribute('disabled');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Firebase is already initialized
    if (window.firebaseAuth && window.firebaseDb) {
      return;
    }

    // Load Firebase initialization script
    const initScript = document.createElement('script');
    initScript.type = 'module';
    initScript.textContent = `
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
      import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      
      const firebaseConfig = {
        apiKey: "AIzaSyA7GQMjPkJZoePTYUieX6icsCNvIxHsdGw",
        authDomain: "zefrix-a92a0.firebaseapp.com",
        projectId: "zefrix-a92a0",
        storageBucket: "zefrix-a92a0.appspot.com",
        messagingSenderId: "316642308627",
        appId: "1:316642308627:web:ae7ff0b5a8d94d81a505e6",
        measurementId: "G-MKKLHPT3KE"
      };
      
      const app = initializeApp(firebaseConfig);
      window.firebaseAuth = getAuth(app);
      window.firebaseDb = getFirestore(app);
      window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
      window.signInWithEmailAndPassword = signInWithEmailAndPassword;
      window.updateProfile = updateProfile;
      window.GoogleAuthProvider = GoogleAuthProvider;
      window.signInWithPopup = signInWithPopup;
      window.doc = doc;
      window.setDoc = setDoc;
      window.getDoc = getDoc;
      window.updateDoc = updateDoc;
      window.serverTimestamp = serverTimestamp;
    `;
    document.head.appendChild(initScript);
  }, []);

  return (
    <>

      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(to right, #0b0d3e, #4e54c8, #d81b60)',
        fontFamily: "'Montserrat', sans-serif"
      }}>
        <style jsx>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          .container {
            background-color: #fff;
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.35);
            position: relative;
            overflow: hidden;
            width: 768px;
            max-width: 90%;
            min-height: 480px;
          }

          .container p {
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0.3px;
            margin: 20px 0;
          }

          .container span {
            font-size: 12px;
          }

          .container a {
            color: #333;
            font-size: 13px;
            text-decoration: none;
            margin: 15px 0 10px;
          }

          .container button {
            background-color: #4e54c8;
            color: #fff;
            font-size: 12px;
            padding: 10px 45px;
            border: 1px solid transparent;
            border-radius: 8px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 10px;
            cursor: pointer;
            font-family: 'Montserrat', sans-serif;
          }

          .container button.hidden {
            background-color: transparent !important;
            border: 2px solid #fff !important;
            color: #fff !important;
            width: auto;
            min-width: 120px;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
          }
          
          .container button.hidden:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }
          
          .toggle-panel button {
            pointer-events: auto !important;
            z-index: 10 !important;
            position: relative;
          }

          .container form {
            background-color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 0 40px;
            height: 100%;
          }

          .container input {
            background-color: #eee;
            border: none;
            margin: 8px 0;
            padding: 10px 15px;
            font-size: 13px;
            border-radius: 8px;
            width: 100%;
            outline: none;
            color: #000;
            font-family: 'Montserrat', sans-serif;
          }

          .form-container {
            position: absolute;
            top: 0;
            height: 100%;
            transition: all 0.6s ease-in-out;
          }

          .sign-in {
            left: 0;
            width: 50%;
            z-index: 2;
          }

          .container.active .sign-in {
            transform: translateX(100%);
          }

          .sign-up {
            left: 0;
            width: 50%;
            opacity: 0;
            z-index: 1;
          }

          .container.active .sign-up {
            transform: translateX(100%);
            opacity: 1;
            z-index: 5;
            animation: move 0.6s;
          }

          @keyframes move {
            0%, 49.99% {
              opacity: 0;
              z-index: 1;
            }
            50%, 100% {
              opacity: 1;
              z-index: 5;
            }
          }

          .social-icons {
            margin: 20px 0;
          }

          .social-icons a {
            border: 1px solid #ccc;
            border-radius: 20%;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            margin: 0 3px;
            width: 40px;
            height: 40px;
          }

          .toggle-container {
            position: absolute;
            top: 0;
            left: 50%;
            width: 50%;
            height: 100%;
            overflow: hidden;
            transition: all 0.6s ease-in-out;
            border-radius: 150px 0 0 150px;
            z-index: 1000;
          }

          .container.active .toggle-container {
            transform: translateX(-100%);
            border-radius: 0 150px 150px 0;
          }

          .toggle {
            background: linear-gradient(to right, #0b0d3e, #4e54c8, #d81b60);
            height: 100%;
            color: #fff;
            position: relative;
            left: -100%;
            width: 200%;
            transform: translateX(0);
            transition: all 0.6s ease-in-out;
          }

          .container.active .toggle {
            transform: translateX(50%);
          }

          .toggle-panel {
            position: absolute;
            width: 50%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 0 30px;
            text-align: center;
            top: 0;
            transform: translateX(0);
            transition: all 0.6s ease-in-out;
          }

          .toggle-left {
            transform: translateX(-200%);
          }

          .container.active .toggle-left {
            transform: translateX(0);
          }

          .toggle-right {
            right: 0;
            transform: translateX(0);
            opacity: 1;
            visibility: visible;
          }

          .container.active .toggle-right {
            transform: translateX(200%);
          }
          
          .toggle-panel button.hidden {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
          }
        `}</style>

        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        <div className={`container ${isActive ? 'active' : ''}`} id="container">
          {/* SIGN UP PANEL */}
          <div className="form-container sign-up">
            <form id="signup-form" onSubmit={handleSignUp}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#000' }}>Create Account</h1>
              <div className="social-icons">
                <a href="#" className="icon" id="googleSignUp" onClick={(e) => { e.preventDefault(); handleGoogleAuth(); }}>
                  <i className="fa-brands fa-google-plus-g"></i>
                </a>
              </div>
              <span style={{ color: '#666' }}>or use your email for registration</span>
              <input type="text" id="signup-name" placeholder="Name" required />
              <input type="email" id="signup-email" placeholder="Email" required />
              <input type="password" id="signup-password" placeholder="Password" required />
              <button type="submit" id="emailSignUpBtn">Sign Up</button>
            </form>
          </div>

          {/* SIGN IN PANEL */}
          <div className="form-container sign-in">
            <form id="login-form" onSubmit={handleSignIn}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#000' }}>Sign In</h1>
              <div className="social-icons">
                <a href="#" className="icon" id="googleSignIn" onClick={(e) => { e.preventDefault(); handleGoogleAuth(); }}>
                  <i className="fa-brands fa-google-plus-g"></i>
                </a>
              </div>
              <span style={{ color: '#666' }}>or use your email password</span>
              <input type="email" id="login-email" placeholder="Email" required />
              <input type="password" id="login-password" placeholder="Password" required />
              <button type="submit" id="emailLoginBtn">Sign In</button>
            </form>
          </div>

          {/* TOGGLE PANELS */}
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-left">
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Welcome Back!</h1>
                <p style={{ color: 'white', fontSize: '14px', marginBottom: '20px' }}>Enter your personal details to use all of site features</p>
                <button className="hidden" id="login" type="button" onClick={() => setIsActive(false)} style={{ cursor: 'pointer' }}>Sign In</button>
              </div>
              <div className="toggle-panel toggle-right">
                <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Hello, Friend!</h1>
                <p style={{ color: 'white', fontSize: '14px', marginBottom: '20px' }}>Register with your personal details to use all of site features</p>
                <button className="hidden" id="register" type="button" onClick={() => setIsActive(true)} style={{ cursor: 'pointer' }}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
