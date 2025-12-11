'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { uploadImage, getProfileImagePath, validateFile } from '@/lib/utils/firebaseStorage';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    getDoc: any;
    setDoc: any;
    serverTimestamp: any;
  }
}

export default function CreatorProfile() {
  const { showSuccess, showError } = useNotification();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: '',
    phone: '',
    whatsapp: '',
    profileImage: '',
    introVideo: '',
    instagram: '',
    youtube: '',
    twitter: '',
    linkedin: '',
  });

  // File upload state
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Wait for Firebase and load user data
  useEffect(() => {
    const checkFirebase = () => {
      if (window.firebaseAuth && window.firebaseDb && window.doc && window.getDoc && window.setDoc && window.serverTimestamp) {
        setFirebaseReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkFirebase()) {
      loadUserData();
      return;
    }

    // Listen for firebaseReady event
    const handleFirebaseReady = () => {
      setFirebaseReady(true);
      loadUserData();
    };
    window.addEventListener('firebaseReady', handleFirebaseReady);

    // Also poll in case event is missed
    const interval = setInterval(() => {
      if (checkFirebase()) {
        clearInterval(interval);
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        loadUserData();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      window.removeEventListener('firebaseReady', handleFirebaseReady);
    };
  }, []);

  const loadUserData = async () => {
    if (!window.firebaseAuth || !window.firebaseDb) return;

    try {
      // Get current user
      const currentUser = window.firebaseAuth.currentUser;
      if (!currentUser) {
        // Listen for auth state change
        const unsubscribe = window.firebaseAuth.onAuthStateChanged(async (user: any) => {
          if (user) {
            setUser(user);
            await fetchProfileData(user.uid);
          } else {
            setLoading(false);
          }
        });
        return () => unsubscribe();
      }

      setUser(currentUser);
      await fetchProfileData(currentUser.uid);
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const fetchProfileData = async (uid: string) => {
    if (!window.firebaseDb || !window.doc || !window.getDoc) {
      setLoading(false);
      return;
    }

    try {
      const userRef = window.doc(window.firebaseDb, 'users', uid);
      const userSnap = await window.getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setFormData({
          name: data.name || data.displayName || '',
          bio: data.bio || '',
          expertise: data.expertise || data.skills || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          profileImage: data.profileImage || data.photoURL || '',
          introVideo: data.introVideo || '',
          instagram: data.socialHandles?.instagram || '',
          youtube: data.socialHandles?.youtube || '',
          twitter: data.socialHandles?.twitter || '',
          linkedin: data.socialHandles?.linkedin || '',
        });
      } else {
        // Set defaults from Firebase Auth
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.displayName || user.email?.split('@')[0] || '',
            profileImage: user.photoURL || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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
    };
    reader.readAsDataURL(file);

    // Upload image immediately
    if (user) {
      setUploadingImage(true);
      try {
        const path = getProfileImagePath(user.uid, file.name);
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
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user || !firebaseReady) {
      showError('Please wait for the system to initialize');
      return;
    }

    if (!window.firebaseDb || !window.doc || !window.setDoc || !window.serverTimestamp) {
      showError('Firebase not ready. Please refresh the page.');
      return;
    }

    setSaving(true);

    try {
      const userRef = window.doc(window.firebaseDb, 'users', user.uid);
      
      // Update user document with profile data
      await window.setDoc(userRef, {
        name: formData.name.trim(),
        displayName: formData.name.trim(),
        bio: formData.bio.trim(),
        expertise: formData.expertise.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        profileImage: formData.profileImage.trim(),
        photoURL: formData.profileImage.trim(),
        introVideo: formData.introVideo.trim(),
        socialHandles: {
          instagram: formData.instagram.trim(),
          youtube: formData.youtube.trim(),
          twitter: formData.twitter.trim(),
          linkedin: formData.linkedin.trim(),
        },
        role: 'creator',
        updatedAt: window.serverTimestamp(),
        isProfileComplete: true,
      }, { merge: true });

      // Also update Firebase Auth profile
      if (window.firebaseAuth && window.firebaseAuth.currentUser && window.updateProfile) {
        try {
          await window.updateProfile(window.firebaseAuth.currentUser, {
            displayName: formData.name.trim(),
            photoURL: formData.profileImage.trim() || undefined,
          });
        } catch (authError) {
          console.log('Auth profile update failed (non-critical):', authError);
        }
      }

      showSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="creator-profile" style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="creator-profile">
      <form onSubmit={handleSubmit} className="creator-form">
        <div className="creator-form-group">
          <label htmlFor="profile-name" className="creator-field-label">Name *</label>
          <input
            type="text"
            id="profile-name"
            name="name"
            className="creator-form-input"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Your full name"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-bio" className="creator-field-label">Bio</label>
          <textarea
            id="profile-bio"
            name="bio"
            className="creator-form-input creator-textarea"
            rows={4}
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell students about yourself..."
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-expertise" className="creator-field-label">Expertise / Skills</label>
          <input
            type="text"
            id="profile-expertise"
            name="expertise"
            className="creator-form-input"
            value={formData.expertise}
            onChange={handleInputChange}
            placeholder="e.g., Graphic Design, Web Development, Photography"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-phone" className="creator-field-label">Phone Number</label>
          <input
            type="tel"
            id="profile-phone"
            name="phone"
            className="creator-form-input"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+91 1234567890"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-whatsapp" className="creator-field-label">WhatsApp Number</label>
          <input
            type="tel"
            id="profile-whatsapp"
            name="whatsapp"
            className="creator-form-input"
            value={formData.whatsapp}
            onChange={handleInputChange}
            placeholder="+91 1234567890"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-image" className="creator-field-label">Profile Image</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                id="profile-image"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                disabled={uploadingImage}
                style={{ 
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer'
                }}
              />
              <small style={{ display: 'block', marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                Max size: 5MB. Formats: JPEG, PNG, WebP, GIF. Image will be automatically optimized.
              </small>
              {uploadingImage && (
                <div style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  ⏳ Uploading and optimizing image...
                </div>
              )}
            </div>
            {(profileImagePreview || formData.profileImage) && (
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                border: '2px solid rgba(217, 42, 99, 0.5)',
                flexShrink: 0
              }}>
                <img
                  src={profileImagePreview || formData.profileImage}
                  alt="Profile preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-intro-video" className="creator-field-label">Intro Video URL</label>
          <input
            type="url"
            id="profile-intro-video"
            name="introVideo"
            className="creator-form-input"
            value={formData.introVideo}
            onChange={handleInputChange}
            placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            Share a video introducing yourself to students
          </p>
        </div>

        <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.25rem' }}>Social Handles</h3>
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-instagram" className="creator-field-label">Instagram</label>
          <input
            type="url"
            id="profile-instagram"
            name="instagram"
            className="creator-form-input"
            value={formData.instagram}
            onChange={handleInputChange}
            placeholder="https://instagram.com/yourhandle"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-youtube" className="creator-field-label">YouTube</label>
          <input
            type="url"
            id="profile-youtube"
            name="youtube"
            className="creator-form-input"
            value={formData.youtube}
            onChange={handleInputChange}
            placeholder="https://youtube.com/@yourchannel"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-twitter" className="creator-field-label">Twitter / X</label>
          <input
            type="url"
            id="profile-twitter"
            name="twitter"
            className="creator-form-input"
            value={formData.twitter}
            onChange={handleInputChange}
            placeholder="https://twitter.com/yourhandle"
          />
        </div>

        <div className="creator-form-group">
          <label htmlFor="profile-linkedin" className="creator-field-label">LinkedIn</label>
          <input
            type="url"
            id="profile-linkedin"
            name="linkedin"
            className="creator-form-input"
            value={formData.linkedin}
            onChange={handleInputChange}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <button 
          type="submit" 
          className="creator-submit-btn"
          disabled={saving || !firebaseReady}
          style={{ opacity: (saving || !firebaseReady) ? 0.6 : 1, cursor: (saving || !firebaseReady) ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

