'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { categoryDetails } from '@/lib/categoriesData';
import { uploadImage, getProfileImagePath, validateFile } from '@/lib/utils/serverStorage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HydrationGuard from '@/components/HydrationGuard';
import SafePhoneInput from '@/components/SafePhoneInput';
import { isClient } from '@/app/utils/environment';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    setDoc: any;
    serverTimestamp: any;
  }
}

// Constants
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
  authDomain: "zefrix-custom.firebaseapp.com",
  projectId: "zefrix-custom",
  storageBucket: "zefrix-custom.firebasestorage.app",
  messagingSenderId: "50732408558",
  appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
  measurementId: "G-27HS1SWB5X"
};

const categories = categoryDetails.map(cat => ({
  value: cat.slug,
  label: cat.title,
}));

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'fa-user' },
  { id: 2, title: 'Category', icon: 'fa-tag' },
  { id: 3, title: 'About You', icon: 'fa-file-text' },
  { id: 4, title: 'Social Links', icon: 'fa-link' },
  { id: 5, title: 'Security', icon: 'fa-lock' },
];

const INITIAL_FORM_DATA = {
  fullname: '',
  email: '',
  whatsapp: '',
  category: '',
  subCategory: '',
  bio: '',
  expertise: '',
  introVideo: '',
  profileImage: '',
  instagram: '',
  youtube: '',
  twitter: '',
  linkedin: '',
  password: '',
};

interface FormData {
  fullname: string;
  email: string;
  whatsapp: string;
  category: string;
  subCategory: string;
  bio: string;
  expertise: string;
  introVideo: string;
  profileImage: string;
  instagram: string;
  youtube: string;
  twitter: string;
  linkedin: string;
  password: string;
}

export default function BecomeACreatorPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string>('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // Set mounted flag on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Firestore
  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || typeof document === 'undefined') return;

    // Check if Firestore is already initialized
    if (window.firebaseDb && window.doc && window.setDoc && window.serverTimestamp) {
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-firebase-creator-init]');
    if (existingScript) return;

    // Load Firestore initialization script
    const initScript = document.createElement('script');
    initScript.type = 'module';
    initScript.setAttribute('data-firebase-creator-init', 'true');
    initScript.textContent = `
      import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      
      const firebaseConfig = ${JSON.stringify(FIREBASE_CONFIG)};
      
      const app = initializeApp(firebaseConfig);
      window.firebaseDb = getFirestore(app);
      window.doc = doc;
      window.setDoc = setDoc;
      window.serverTimestamp = serverTimestamp;
    `;
    document.head.appendChild(initScript);
  }, [mounted]);

  // Sync profileImage URL with preview
  useEffect(() => {
    const trimmedImage = formData.profileImage?.trim() || '';
    if (trimmedImage && trimmedImage.startsWith('http')) {
      if (profileImagePreview !== trimmedImage) {
        setProfileImagePreview(trimmedImage);
        setProfileImageError(false);
      }
    } else if (!trimmedImage && profileImagePreview) {
      setProfileImagePreview('');
      setProfileImageError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.profileImage]);

  // WhatsApp validation side effects
  useEffect(() => {
    if (!formData.whatsapp || typeof formData.whatsapp !== 'string' || !formData.whatsapp.trim()) {
      setWhatsappError('');
      return;
    }

    try {
      const validation = validateWhatsAppNumber(formData.whatsapp);
      if (!validation.valid) {
        setWhatsappError(validation.error || 'Invalid WhatsApp number');
      } else {
        setWhatsappError('');
      }
    } catch (error) {
      console.error('Error validating WhatsApp number:', error);
      setWhatsappError('');
    }
  }, [formData.whatsapp]);

  // WhatsApp number validation utility
  const validateWhatsAppNumber = (phoneNumber: string): { valid: boolean; error?: string; formatted?: string } => {
    try {
      if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
        return { valid: false, error: 'WhatsApp number is required' };
      }

      let cleaned = phoneNumber.trim().replace(/\s+/g, '');

      if (!cleaned.startsWith('+')) {
        return { valid: false, error: 'WhatsApp number must start with + (country code). Example: +1234567890' };
      }

      const digitsOnly = cleaned.substring(1);
      
      if (!digitsOnly || digitsOnly.length === 0) {
        return { valid: false, error: 'WhatsApp number must include digits after the country code.' };
      }

      if (!/^\d+$/.test(digitsOnly)) {
        return { valid: false, error: 'WhatsApp number can only contain digits after the country code. Please remove any letters or special characters.' };
      }

      if (digitsOnly.length < 7) {
        return { valid: false, error: 'WhatsApp number is too short. Please include country code and number. Example: +1234567890' };
      }

      if (digitsOnly.length > 15) {
        return { valid: false, error: 'WhatsApp number is too long. Maximum 15 digits allowed.' };
      }

      const countryCodeLength = Math.min(4, digitsOnly.length);
      const countryCode = digitsOnly.substring(0, countryCodeLength);
      
      if (countryCode && countryCode.length > 0 && countryCode.startsWith('0')) {
        return { valid: false, error: 'Country code cannot start with 0. Please use the correct format: +[country code][number]' };
      }

      return { valid: true, formatted: '+' + digitsOnly };
    } catch (error) {
      console.error('Error in validateWhatsAppNumber:', error);
      return { valid: false, error: 'Invalid WhatsApp number format. Please check and try again.' };
    }
  };

  // Filter WhatsApp input value
  const filterWhatsAppValue = (value: string): string => {
    if (value.length === 0) return value;

    let filteredValue = value;
    
    if (!value.startsWith('+')) {
      if (/^\d/.test(value)) {
        filteredValue = '+' + value.replace(/[^\d]/g, '');
      } else {
        filteredValue = '+' + value.replace(/[^\d]/g, '');
      }
    } else {
      filteredValue = '+' + value.substring(1).replace(/[^\d]/g, '');
    }
    
    if (filteredValue.length > 16) {
      filteredValue = filteredValue.substring(0, 16);
    }

    return filteredValue;
  };

  // Handler for WhatsApp input from SafePhoneInput
  const handleWhatsAppChange = (value: string) => {
    try {
      const filteredValue = filterWhatsAppValue(value);
      
      if (filteredValue !== formData.whatsapp) {
        setFormData(prev => ({ ...prev, whatsapp: filteredValue }));
      }
    } catch (error) {
      console.error('Error filtering WhatsApp number:', error);
      setFormData(prev => ({ ...prev, whatsapp: value }));
    }
  };

  // Handle general input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    try {
      const { name, value } = e.target;
      
      if (name === 'category') {
        setFormData(prev => ({ ...prev, [name]: value || '', subCategory: '' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value || '' }));
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error);
    }
  };

  // Handle profile image file upload
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      showError(validation.error || 'Invalid file');
      return;
    }

    setProfileImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
      setProfileImageError(false);
    };
    reader.readAsDataURL(file);

    // Upload image immediately
    setUploadingImage(true);
    try {
      const currentUser = window.firebaseAuth?.currentUser;
      const userId = currentUser?.uid || user?.uid || 'temp-' + Date.now();
      const path = getProfileImagePath(userId, file.name);
      const downloadURL = await uploadImage(file, path, true);
      setFormData(prev => ({ ...prev, profileImage: downloadURL }));
      showSuccess('Profile image uploaded successfully!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      showError(error.message || 'Failed to upload image');
      setProfileImageFile(null);
      setProfileImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  // PURE validation function - no side effects, no setState calls
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullname || !formData.email || !formData.whatsapp) {
          return false;
        }
        try {
          const whatsappValidation = validateWhatsAppNumber(formData.whatsapp);
          return whatsappValidation.valid;
        } catch (error) {
          console.error('Error validating WhatsApp in validateStep:', error);
          return false;
        }
      case 2:
        return !!formData.category;
      case 3:
        return !!(formData.bio && formData.expertise);
      case 4:
        return true; // Optional step
      case 5:
        return !!formData.password && formData.password.length >= 6;
      default:
        return false;
    }
  };

  // Navigation handlers
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Check if Firebase is ready
  const isFirebaseReady = (): boolean => {
    return !!(
      isClient &&
      typeof window !== 'undefined' &&
      window.firebaseDb &&
      window.doc &&
      window.setDoc &&
      window.serverTimestamp
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (!isFirebaseReady()) {
      showError('Firebase not initialized. Please wait...');
      setIsSubmitting(false);
      return;
    }

    if (!validateStep(5)) {
      showError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    const isGoogleUser = window.firebaseAuth?.currentUser?.providerData?.some(
      (provider: any) => provider.providerId === 'google.com'
    );
    
    if (!isGoogleUser && formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      let currentUser = window.firebaseAuth?.currentUser;
      
      if (!currentUser) {
        await signUp(formData.email.trim(), formData.password, formData.fullname.trim());
        
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
          showError('User creation successful, but could not update profile. Please try logging in.');
          router.push('/signup-login');
          return;
        }

        currentUser = window.firebaseAuth.currentUser;
      }

      const whatsappValidation = validateWhatsAppNumber(formData.whatsapp);
      if (!whatsappValidation.valid) {
        showError(whatsappValidation.error || 'Invalid WhatsApp number');
        setIsSubmitting(false);
        return;
      }

      const profileImageUrl = formData.profileImage?.trim() || currentUser.photoURL || '';
      
      await window.setDoc(window.doc(window.firebaseDb, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: formData.email.trim(),
        name: formData.fullname.trim(),
        whatsapp: whatsappValidation.formatted || formData.whatsapp.trim(),
        creatorCategory: formData.category,
        subCategory: formData.subCategory?.trim() || '',
        role: 'creator',
        bio: formData.bio?.trim() || '',
        expertise: formData.expertise?.trim() || '',
        introVideo: formData.introVideo?.trim() || '',
        profileImage: profileImageUrl,
        photoURL: profileImageUrl,
        socialHandles: {
          instagram: formData.instagram?.trim() || '',
          youtube: formData.youtube?.trim() || '',
          twitter: formData.twitter?.trim() || '',
          linkedin: formData.linkedin?.trim() || '',
        },
        isCreatorApproved: false,
        isProfileComplete: true,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      }, { merge: true });

      showSuccess('Creator account created successfully!');
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/creator-dashboard');
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

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (!isFirebaseReady()) {
      showError('Firebase not initialized. Please wait...');
      setIsSubmitting(false);
      return;
    }

    try {
      await signInWithGoogle();
      
      if (!isClient || typeof window === 'undefined' || !window.firebaseAuth || !window.firebaseAuth.currentUser) {
        showError('Google authentication successful, but could not update profile. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const currentUser = window.firebaseAuth.currentUser;
      const googlePhotoURL = currentUser.photoURL || '';
      
      setFormData(prev => ({
        ...prev,
        fullname: currentUser.displayName || prev.fullname || '',
        email: currentUser.email || prev.email || '',
        profileImage: googlePhotoURL || prev.profileImage || '',
      }));
      
      if (googlePhotoURL) {
        setProfileImagePreview(googlePhotoURL);
      }

      await window.setDoc(window.doc(window.firebaseDb, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName || '',
        photoURL: currentUser.photoURL || '',
        profileImage: currentUser.photoURL || '',
        role: 'creator',
        isCreatorApproved: false,
        isProfileComplete: false,
        createdAt: window.serverTimestamp(),
        lastLogin: window.serverTimestamp(),
      }, { merge: true });

      showSuccess('Google signup successful! Please complete the form below to finish your creator profile.');
      setIsSubmitting(false);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        let errorMessage = 'Google signup failed. ';
        if (err.message) {
          errorMessage += err.message;
        } else {
          errorMessage += 'Please try again.';
        }
        showError(errorMessage);
      }
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Let's Start with Your Basic Information</h2>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>WhatsApp Number *</label>
              <SafePhoneInput
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="+1234567890"
                required
                pattern="^\+[1-9]\d{6,14}$"
                maxLength={16}
                suppressHydrationWarning
                style={{
                  borderColor: whatsappError ? '#ef4444' : undefined,
                  borderWidth: whatsappError ? '2px' : undefined
                }}
              />
              {whatsappError && (
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: '12px', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '12px' }}></i>
                  {whatsappError}
                </div>
              )}
              {!whatsappError && formData.whatsapp && (
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '12px', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '12px' }}></i>
                  Valid WhatsApp number
                </div>
              )}
              <div style={{ 
                color: '#6b7280', 
                fontSize: '11px', 
                marginTop: '4px' 
              }}>
                Format: +[country code][number]. Example: +919876543210, +11234567890
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h2>Choose Your Category</h2>
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Your Category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub-Category (optional)</label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
                disabled={!formData.category}
              >
                <option value="">Select Sub-Category</option>
                {formData.category && categoryDetails
                  .find(cat => cat.slug === formData.category)
                  ?.subcategories.map((subcat, index) => (
                    <option key={index} value={subcat}>
                      {subcat}
                    </option>
                  ))}
              </select>
              {!formData.category && (
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: '11px', 
                  marginTop: '4px' 
                }}>
                  Please select a category first
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h2>Tell Us About Yourself</h2>
            <div className="form-group">
              <label>Bio *</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself and your expertise..."
                rows={4}
                required
              />
            </div>
            <div className="form-group">
              <label>Expertise / Skills *</label>
              <textarea
                name="expertise"
                value={formData.expertise}
                onChange={handleInputChange}
                placeholder="e.g., Graphic Design, Video Editing, Music Production"
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Intro Video URL (optional)</label>
              <input
                type="url"
                name="introVideo"
                value={formData.introVideo}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div className="form-group">
              <label>Profile Image (optional)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexDirection: 'column' }}>
                <div style={{ width: '100%' }}>
                  <input
                    type="file"
                    id="profile-image-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleProfileImageChange}
                    disabled={uploadingImage}
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      background: '#eee',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'Poppins, sans-serif',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer'
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    marginTop: '0.5rem', 
                    color: '#999', 
                    fontSize: '11px' 
                  }}>
                    Max size: 5MB. Formats: JPEG, PNG, WebP, GIF.
                  </small>
                  {uploadingImage && (
                    <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '12px' }}>
                      ⏳ Uploading image...
                    </div>
                  )}
                </div>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  border: '2px solid rgba(217, 42, 99, 0.5)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (profileImagePreview || formData.profileImage) ? 'transparent' : 'rgba(255, 255, 255, 0.1)'
                }}>
                  {(profileImagePreview || formData.profileImage) && !profileImageError ? (
                    <img
                      src={profileImagePreview || formData.profileImage}
                      alt="Profile preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onLoad={() => {
                        console.log('✅ Profile image loaded successfully');
                        setProfileImageError(false);
                      }}
                      onError={() => { 
                        console.error('❌ Profile image failed to load:', profileImagePreview || formData.profileImage);
                        setProfileImageError(true);
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '48px'
                    }}>
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                </div>
                <div style={{ width: '100%', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '12px', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Or enter image URL:
                  </label>
                  <input
                    type="url"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/profile.jpg"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'Poppins, sans-serif',
                      background: '#eee',
                      color: '#000'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h2>Connect Your Social Profiles</h2>
            <p className="step-description">Help students find you on social media (all optional)</p>
            <div className="social-grid">
              <div className="form-group">
                <label>Instagram</label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="@instagram"
                />
              </div>
              <div className="form-group">
                <label>YouTube</label>
                <input
                  type="text"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleInputChange}
                  placeholder="@youtube"
                />
              </div>
              <div className="form-group">
                <label>Twitter</label>
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="@twitter"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  type="text"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="LinkedIn username"
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="step-content">
            <h2>Create Your Password</h2>
            <p className="step-description">Choose a strong password to secure your account</p>
            <div className="form-group">
              <label>Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                </button>
              </div>
            </div>
            <div className="form-summary">
              <h3>Review Your Information</h3>
              <div className="summary-item">
                <span>Name:</span>
                <strong>{formData.fullname || 'Not provided'}</strong>
              </div>
              <div className="summary-item">
                <span>Email:</span>
                <strong>{formData.email || 'Not provided'}</strong>
              </div>
              <div className="summary-item">
                <span>Category:</span>
                <strong>{categories.find(c => c.value === formData.category)?.label || 'Not selected'}</strong>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Prevent SSR/hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <HydrationGuard>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
        }

        .creator-page-section {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 20px 40px;
          background: #0A0A1A;
          position: relative;
          overflow: hidden;
        }

        .creator-page-section::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 50%, rgba(78, 84, 200, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(216, 27, 96, 0.1) 0%, transparent 50%);
          top: 0;
          left: 0;
        }

        .creator-container {
          background-color: #fff;
          border-radius: 30px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.35);
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 750px;
          z-index: 1;
        }

        .creator-header {
          background: linear-gradient(135deg, #4e54c8 0%, #d81b60 100%);
          padding: 30px 40px;
          color: white;
          text-align: center;
        }

        .creator-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .creator-header p {
          font-size: 14px;
          opacity: 0.9;
        }

        .progress-container {
          padding: 30px 40px 20px;
          background: #f8f9fa;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          margin-bottom: 20px;
        }

        .progress-line {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 3px;
          background: #e0e0e0;
          z-index: 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4e54c8, #d81b60);
          transition: width 0.5s ease;
          border-radius: 3px;
        }

        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 3px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.3s ease;
          margin-bottom: 8px;
          color: #666;
        }

        .step-indicator.active .step-circle {
          background: linear-gradient(135deg, #4e54c8, #d81b60);
          border-color: #4e54c8;
          color: white;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(78, 84, 200, 0.4);
        }

        .step-indicator.completed .step-circle {
          background: #4caf50;
          border-color: #4caf50;
          color: white;
        }

        .step-title {
          font-size: 11px;
          color: #666;
          font-weight: 600;
          text-align: center;
        }

        .step-indicator.active .step-title {
          color: #4e54c8;
        }

        .form-container {
          padding: 40px;
          min-height: 400px;
        }

        .step-content {
          animation: slideIn 0.4s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .step-content h2 {
          font-size: 24px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .step-description {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 15px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
          background-color: #eee;
          color: #000;
          margin: 8px 0;
          outline: none;
        }

        .password-input-wrapper {
          position: relative;
          width: 100%;
        }

        .password-input-wrapper input {
          padding-right: 40px;
          margin: 8px 0;
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

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #999;
        }

        .form-group select {
          color: #000;
        }

        .form-group select option {
          color: #333;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          background-color: #f5f5f5;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }

        .form-summary h3 {
          font-size: 18px;
          margin-bottom: 15px;
          color: #333;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-item span {
          color: #666;
          font-size: 14px;
        }

        .summary-item strong {
          color: #333;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 30px 40px;
          background: #f8f9fa;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          padding: 14px 30px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4e54c8, #d81b60);
          color: white;
          flex: 1;
          box-shadow: 0 4px 15px rgba(78, 84, 200, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(78, 84, 200, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #4e54c8;
          border: 2px solid #4e54c8;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-submit {
          background: linear-gradient(135deg, #4caf50, #45a049);
          color: white;
          width: 100%;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }
        
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .social-auth {
          text-align: center;
          padding: 20px 40px;
          border-bottom: 1px solid #e0e0e0;
        }

        .social-auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          padding: 0;
          background: #000;
          border: 2px solid #000;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          color: #fff;
          font-size: 20px;
        }

        .social-auth-btn:hover:not(:disabled) {
          border-color: #333;
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .social-auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .creator-container {
            max-width: 100%;
            border-radius: 20px;
          }

          .creator-header,
          .form-container,
          .form-actions {
            padding: 20px;
          }

          .progress-steps {
            flex-wrap: wrap;
            gap: 10px;
          }

          .step-indicator {
            flex: 0 0 calc(20% - 8px);
          }

          .step-title {
            font-size: 10px;
          }

          .social-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>

      <Header />
      <div className="creator-page-section">
        <div className="creator-container">
          <div className="creator-header">
            <h1>Become a Creator</h1>
            <p>Join Zefrix and start sharing your skills with eager learners</p>
          </div>

          <div className="social-auth">
            <button 
              className="social-auth-btn" 
              onClick={handleGoogleAuth} 
              title="Continue with Google"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-brands fa-google"></i>
              )}
            </button>
          </div>

          <div className="progress-container">
            <div className="progress-steps">
              <div className="progress-line">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`step-indicator ${
                    currentStep === step.id ? 'active' : currentStep > step.id ? 'completed' : ''
                  }`}
                >
                  <div className="step-circle">
                    {currentStep > step.id ? (
                      <i className="fa-solid fa-check"></i>
                    ) : (
                      <i className={`fa-solid ${step.icon}`}></i>
                    )}
                  </div>
                  <div className="step-title">{step.title}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-container">
              {renderStepContent()}
            </div>

            <div className="form-actions">
              {currentStep > 1 && (
                <button type="button" className="btn btn-secondary" onClick={prevStep}>
                  <i className="fa-solid fa-arrow-left"></i> Previous
                </button>
              )}
              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next <i className="fa-solid fa-arrow-right"></i>
                </button>
              ) : (
                <button type="submit" className="btn btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Submit Application
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </HydrationGuard>
  );
}
