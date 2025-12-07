'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SignupLoginPage() {
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔄 Redirect check - loading:', loading, 'user:', user ? `${user.email} (${user.role})` : 'null');
    if (!loading && user) {
      console.log('🚀 Redirecting user to dashboard...');
      if (user.role === 'admin') {
        console.log('→ Redirecting to admin-dashboard');
        router.push('/admin-dashboard');
      } else if (user.role === 'creator') {
        console.log('→ Redirecting to creator-dashboard');
        router.push('/creator-dashboard');
      } else {
        console.log('→ Redirecting to student-dashboard');
        router.push('/student-dashboard');
      }
    }
  }, [user, loading, router]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.querySelector('#signup-name') as HTMLInputElement)?.value.trim();
    const email = (form.querySelector('#signup-email') as HTMLInputElement)?.value.trim();
    const password = (form.querySelector('#signup-password') as HTMLInputElement)?.value;

    // Validation
    if (!name || !email || !password) {
      showError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      await signUp(email, password, name);
      showSuccess('Account created successfully! Redirecting...');
      // Navigation will be handled by useEffect when user state updates
    } catch (err: any) {
      let errorMessage = 'Signup failed. ';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage += 'This email is already registered. Please use a different email or try logging in.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address. Please check your email format.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak. Please use a stronger password (at least 6 characters).';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage += 'Email/password accounts are not enabled. Please contact support.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      showError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = e.currentTarget;
    const email = (form.querySelector('#login-email') as HTMLInputElement)?.value.trim();
    const password = (form.querySelector('#login-password') as HTMLInputElement)?.value;

    if (!email || !password) {
      showError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      await signIn(email, password);
      showSuccess('Login successful! Redirecting...');
      // Navigation will be handled by useEffect when user state updates
    } catch (err: any) {
      let errorMessage = 'Login failed. ';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage += 'No account found with this email. Please sign up first.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage += 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage += 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage += 'This account has been disabled. Please contact support.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      showError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const googleSignInBtn = document.getElementById('googleSignIn');
    const googleSignUpBtn = document.getElementById('googleSignUp');

    if (googleSignInBtn) googleSignInBtn.setAttribute('disabled', 'true');
    if (googleSignUpBtn) googleSignUpBtn.setAttribute('disabled', 'true');

    try {
      await signInWithGoogle();
      showSuccess('Google authentication successful! Redirecting...');
      // Navigation will be handled by useEffect when user state updates
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        let errorMessage = 'Google authentication failed. ';
        if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += 'Please try again.';
        }
        showError(errorMessage);
      }
      setIsSubmitting(false);
    } finally {
      if (googleSignInBtn) googleSignInBtn.removeAttribute('disabled');
      if (googleSignUpBtn) googleSignUpBtn.removeAttribute('disabled');
    }
  };


  return (
    <>
      <Header />
      <div className="login-page-section">
        <style jsx>{`
          .login-page-section {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 120px 20px 40px;
            background: #0A0A1A;
            position: relative;
            overflow: hidden;
          }

          .login-page-section::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 50%, rgba(78, 84, 200, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(216, 27, 96, 0.1) 0%, transparent 50%);
            top: 0;
            left: 0;
          }
        `}</style>
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
            z-index: 1;
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
            font-family: 'Poppins', sans-serif;
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
            font-family: 'Poppins', sans-serif;
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
              <input type="text" id="signup-name" placeholder="Name" required autoComplete="name" />
              <input type="email" id="signup-email" placeholder="Email" required autoComplete="email" />
              <input type="password" id="signup-password" placeholder="Password" required autoComplete="new-password" />
              <button type="submit" id="emailSignUpBtn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
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
              <input type="email" id="login-email" placeholder="Email" required autoComplete="email" />
              <input type="password" id="login-password" placeholder="Password" required autoComplete="current-password" />
              <button type="submit" id="emailLoginBtn" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
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
      <Footer />
    </>
  );
}
