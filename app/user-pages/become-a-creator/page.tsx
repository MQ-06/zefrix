'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    createUserWithEmailAndPassword: any;
    GoogleAuthProvider: any;
    signInWithPopup: any;
    doc: any;
    setDoc: any;
    serverTimestamp: any;
  }
}

const categories = [
  { value: 'dance', label: 'Dance & Performing Arts' },
  { value: 'music', label: 'Music & Singing' },
  { value: 'design', label: 'Design & Creativity' },
  { value: 'content', label: 'Content & Creator Skills' },
  { value: 'communication', label: 'Communication & Confidence' },
  { value: 'wellness', label: 'Wellness & Lifestyle' },
  { value: 'tech', label: 'Tech & Digital Skills' },
  { value: 'art', label: 'Art, Craft & DIY' },
  { value: 'cooking', label: 'Cooking & Culinary Arts' },
  { value: 'fashion', label: 'Fashion, Styling & Beauty' },
  { value: 'business', label: 'Business, Career & Freelancing' },
  { value: 'language', label: 'Language & Culture' },
  { value: 'gaming', label: 'Gaming & Esports' },
  { value: 'photography', label: 'Video, Photography & Filmmaking' },
];

export default function BecomeACreatorPage() {
  const router = useRouter();

  useEffect(() => {
    // Load Firebase SDKs dynamically
    const loadFirebaseScripts = () => {
      const firebaseAppScript = document.createElement('script');
      firebaseAppScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      firebaseAppScript.type = "module";
      firebaseAppScript.onload = () => {
        const firebaseAuthConfig = document.createElement('script');
        firebaseAuthConfig.type = "module";
        firebaseAuthConfig.innerHTML = `
          import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
          import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
          import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

          const firebaseConfig = {
            apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
            authDomain: "zefrix-custom.firebaseapp.com",
            projectId: "zefrix-custom",
            storageBucket: "zefrix-custom.firebasestorage.app",
            messagingSenderId: "50732408558",
            appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
            measurementId: "G-27HS1SWB5X"
          };

          const app = initializeApp(firebaseConfig);
          window.firebaseAuth = getAuth(app);
          window.firebaseDb = getFirestore(app);

          window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
          window.GoogleAuthProvider = GoogleAuthProvider;
          window.signInWithPopup = signInWithPopup;
          window.doc = doc;
          window.setDoc = setDoc;
          window.serverTimestamp = serverTimestamp;
        `;
        document.body.appendChild(firebaseAuthConfig);
      };
      document.body.appendChild(firebaseAppScript);
    };

    loadFirebaseScripts();
  }, [router]);

  const handleCreatorSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!window.firebaseAuth || !window.firebaseDb) {
      alert('Firebase not initialized. Please wait...');
      return;
    }

    const form = e.currentTarget;
    const fullName = (form.querySelector('[name="fullname"]') as HTMLInputElement)?.value.trim();
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value.trim();
    const whatsapp = (form.querySelector('[name="whatsapp"]') as HTMLInputElement)?.value.trim();
    const category = (form.querySelector('[name="category"]') as HTMLSelectElement)?.value;
    const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value.trim();

    if (!fullName || !email || !whatsapp || !category || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const cred = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
      
      await window.setDoc(window.doc(window.firebaseDb, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name: fullName,
        whatsapp,
        creatorCategory: category,
        role: 'creator',
        isCreatorApproved: true,
        isProfileComplete: true,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      });

      alert('Creator account created successfully!');
      router.push('/creator-dashboard');
    } catch (err: any) {
      alert('Signup failed: ' + err.message);
    }
  };

  const handleGoogleAuth = async () => {
    if (!window.firebaseAuth || !window.firebaseDb) {
      alert('Firebase not initialized. Please wait...');
      return;
    }

    try {
      const googleProvider = new window.GoogleAuthProvider();
      const result = await window.signInWithPopup(window.firebaseAuth, googleProvider);
      const user = result.user;

      await window.setDoc(window.doc(window.firebaseDb, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'creator',
        isCreatorApproved: true,
        isProfileComplete: false,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      }, { merge: true });

      alert('Creator account created successfully!');
      router.push('/creator-dashboard');
    } catch (err: any) {
      alert('Google signup failed: ' + err.message);
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Montserrat', sans-serif;
          min-height: 100vh;
        }

        .user-page-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: linear-gradient(to right, #0b0d3e, #4e54c8, #d81b60);
        }

        .container.sign-up {
          max-width: 1200px;
          width: 100%;
        }

        .w-container {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .wf-layout-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 650px;
          border-radius: 0;
          overflow: visible;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .w-layout-cell.cell {
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          background: #ffffff;
          border-radius: 20px 0 0 20px;
        }

        .w-layout-cell.cell-2 {
          padding: 60px 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: linear-gradient(to right, #0b0d3e, #4e54c8, #d81b60);
          border-radius: 0 20px 20px 0;
        }

        .heading-13.become-creator {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          margin-bottom: 20px;
          font-family: 'Montserrat', sans-serif;
        }

        .heading-13.dark-bg {
          font-size: 28px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 20px;
          font-family: 'Montserrat', sans-serif;
        }

        .text-block-27 {
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0.3px;
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Montserrat', sans-serif;
        }

        .list {
          list-style: none;
          margin-bottom: 1.5rem;
          padding: 0;
        }

        .list-item {
          display: inline-block;
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
          color: #333;
          text-decoration: none;
        }

        .w-layout-blockcontainer {
          width: 100%;
        }

        .container-5 {
          max-width: 100%;
        }

        .w-embed {
          position: relative;
          width: 100%;
        }

        /* Form Styles - Matching Login Page */
        #zefrix-creator-form-2024 {
          font-family: 'Montserrat', sans-serif;
          box-sizing: border-box;
        }

        #zefrix-creator-form-2024 * {
          box-sizing: border-box;
        }

        #zefrix-creator-form-2024 .zefrix-creator-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 100%;
        }


        #zefrix-creator-form-2024 .zefrix-form-group {
          width: 100%;
        }

        /* Button styling - matching login page */
        #zefrix-creator-form-2024 button,
        #zefrix-creator-form-2024 .zefrix-creator-btn,
        #creator-submit-btn,
        button.zefrix-creator-btn {
          background-color: #4e54c8 !important;
          color: #fff !important;
          font-size: 12px !important;
          padding: 10px 45px !important;
          border: 1px solid transparent !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
          margin-top: 10px !important;
          cursor: pointer !important;
          font-family: 'Montserrat', sans-serif !important;
          width: 100% !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          min-height: 40px !important;
        }

        #zefrix-creator-form-2024 button:hover,
        #zefrix-creator-form-2024 .zefrix-creator-btn:hover,
        #creator-submit-btn:hover,
        button.zefrix-creator-btn:hover {
          opacity: 0.9 !important;
        }

        #zefrix-creator-form-2024 .zefrix-input {
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

        #zefrix-creator-form-2024 .zefrix-select {
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
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.762L10.825 4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 15px center;
          background-size: 12px;
          padding-right: 35px;
          background-color: #eee;
        }

        #zefrix-creator-form-2024 .zefrix-input::placeholder {
          color: #666;
        }

        #zefrix-creator-form-2024 .zefrix-select option {
          color: #000;
          padding: 8px;
          background: #eee;
        }


        .form-separator {
          color: #666;
          font-size: 12px;
          margin: 15px 0 10px;
        }

        @media (max-width: 991px) {
          .wf-layout-layout {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .w-layout-cell {
            padding: 40px 30px;
          }

          .w-layout-cell.cell {
            border-radius: 20px 20px 0 0;
          }

          .w-layout-cell.cell-2 {
            order: -1;
            border-radius: 0 0 20px 20px;
          }

          .heading-13.become-creator {
            font-size: 24px;
          }

          .heading-13.dark-bg {
            font-size: 24px;
          }
        }

        @media (max-width: 767px) {
          .user-page-section {
            padding: 40px 15px;
          }

          .w-layout-cell {
            padding: 30px 20px;
          }
        }
      `}</style>

      <div className="user-page-section">
        <div className="container sign-up w-container">
          <div className="w-layout-layout quick-stack wf-layout-layout">
            <div className="w-layout-cell cell">
              <h1 className="heading-13 become-creator">Become a Creator</h1>
              <div className="social-icons">
                <a href="#" className="icon" id="creatorGoogleBtn" onClick={(e) => { e.preventDefault(); handleGoogleAuth(); }}>
                  <i className="fa-brands fa-google-plus-g"></i>
                </a>
              </div>
              <span className="form-separator">or use your email for registration</span>
              <div className="w-layout-blockcontainer container-5 w-container">
                <div className="w-embed">
                  <div id="zefrix-creator-form-2024" className="zefrix-creator-container">
                    <form className="zefrix-creator-form" autoComplete="off" onSubmit={handleCreatorSignUp}>
                      <input type="text" placeholder="Full Name" required className="zefrix-input" name="fullname" />
                      <input type="email" placeholder="Email" required className="zefrix-input" name="email" />
                      <input type="tel" placeholder="WhatsApp Number" required className="zefrix-input" name="whatsapp" />
                      <select className="zefrix-select" name="category" required defaultValue="">
                        <option value="" disabled>Select Your Category</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <input type="password" placeholder="Password" required className="zefrix-input" name="password" />
                      <button type="submit" className="zefrix-creator-btn" id="creator-submit-btn">Become a Creator</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-layout-cell cell-2">
              <h1 className="heading-13 dark-bg">Hello, Friend!</h1>
              <div className="text-block-27">
                Become a creator and start your teaching career.<br/><br/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
