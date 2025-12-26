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
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle, user, loading } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  // Redirect if already authenticated (with delay to show notifications)
  useEffect(() => {
    if (!loading && user) {
      // Small delay to ensure notifications are visible
      const redirectTimer = setTimeout(() => {
        if (user.role === 'admin') {
          router.push('/admin-dashboard');
        } else if (user.role === 'creator') {
          router.push('/creator-dashboard');
        } else {
          router.push('/student-dashboard');
        }
      }, 2500); // Wait 2.5 seconds to show notification
      
      return () => clearTimeout(redirectTimer);
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
      // Delay redirect to show notification
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      // Delay redirect to show notification
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      // Delay redirect to show notification
      await new Promise(resolve => setTimeout(resolve, 2000));
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

          .password-input-wrapper {
            position: relative;
            width: 100%;
            margin: 8px 0;
          }

          .password-input-wrapper input {
            padding-right: 40px;
            margin: 0;
          }

          .password-toggle-btn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none !important;
            border: none !important;
            cursor: pointer;
            color: #000 !important;
            font-size: 16px;
            padding: 0 !important;
            display: flex;
            align-items: center;
            justify-content: center;
            width: auto !important;
            height: auto !important;
            border-radius: 0 !important;
            transition: opacity 0.2s;
            margin: 0 !important;
          }

          .password-toggle-btn:hover {
            opacity: 0.7;
            background: none !important;
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

          /* Hide mobile toggle links on desktop */
          .form-container form p {
            display: none;
          }

          /* Responsive Styles */
          @media (max-width: 768px) {
            .login-page-section {
              padding: 100px 15px 40px;
            }

            .container {
              width: 100%;
              max-width: 100%;
              min-height: auto;
              border-radius: 20px;
            }

            .form-container {
              position: relative;
              width: 100% !important;
              height: auto;
              opacity: 1 !important;
              transform: none !important;
            }

            .container.active .sign-in {
              transform: none;
              display: none;
            }

            .container.active .sign-up {
              transform: none;
              display: block;
              opacity: 1;
            }

            .sign-in {
              display: block;
            }

            .sign-up {
              display: none;
            }

            .container.active .sign-up {
              display: block;
            }

            .toggle-container {
              display: none;
            }

            .container form {
              padding: 30px 25px;
              min-height: 400px;
            }

            .container h1 {
              font-size: 22px !important;
              margin-bottom: 15px !important;
            }

            .container input {
              font-size: 14px;
              padding: 12px 15px;
            }

            .container button {
              padding: 12px 30px;
              font-size: 13px;
              width: 100%;
            }

            .container span {
              font-size: 11px;
            }

            .social-icons {
              margin: 15px 0;
            }

            .social-icons a {
              width: 45px;
              height: 45px;
            }

            .container form p {
              margin-top: 20px;
            }

            .container form a {
              color: #4e54c8;
              text-decoration: underline;
            }

            .form-container form p {
              display: block;
            }
          }

          @media (max-width: 480px) {
            .login-page-section {
              padding: 80px 10px 30px;
            }

            .container {
              border-radius: 15px;
            }

            .container form {
              padding: 25px 20px;
              min-height: 350px;
            }

            .container h1 {
              font-size: 20px !important;
              margin-bottom: 12px !important;
            }

            .container input {
              font-size: 14px;
              padding: 11px 12px;
            }

            .container button {
              padding: 11px 25px;
              font-size: 12px;
            }

            .container span {
              font-size: 10px;
            }

            .social-icons a {
              width: 40px;
              height: 40px;
            }
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
              <div className="password-input-wrapper">
                <input 
                  type={showSignupPassword ? "text" : "password"} 
                  id="signup-password" 
                  placeholder="Password" 
                  required 
                  autoComplete="new-password" 
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                >
                  <i className={showSignupPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
              <button type="submit" id="emailSignUpBtn" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                Already have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setIsActive(false); }}
                  style={{ color: '#4e54c8', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Sign In
                </a>
              </p>
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
              <div className="password-input-wrapper">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  id="login-password" 
                  placeholder="Password" 
                  required 
                  autoComplete="current-password" 
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  <i className={showLoginPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
              <button type="submit" id="emailLoginBtn" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                Don't have an account?{' '}
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setIsActive(true); }}
                  style={{ color: '#4e54c8', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Sign Up
                </a>
              </p>
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
