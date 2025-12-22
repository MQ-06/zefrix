'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import CreatorSidebar from '@/components/CreatorDashboard/Sidebar';
import CreatorCourseCard from '@/components/CreatorDashboard/CreatorCourseCard';
import CreateClassForm from '@/components/CreatorDashboard/CreateClassForm';
import EditClassForm from '@/components/CreatorDashboard/EditClassForm';
import ManageClasses from '@/components/CreatorDashboard/ManageClasses';
import ManageBatches from '@/components/CreatorDashboard/ManageBatches';
import ViewClass from '@/components/CreatorDashboard/ViewClass';
import ClassDetails from '@/components/CreatorDashboard/ClassDetails';
import LiveClass from '@/components/CreatorDashboard/LiveClass';
import CreatorProfile from '@/components/CreatorDashboard/Profile';
import EnrollmentList from '@/components/CreatorDashboard/EnrollmentList';
import Analytics from '@/components/CreatorDashboard/Analytics';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    firebaseStorage: any;
    logout: any;
    doc: any;
    getDoc: any;
    addDoc: any;
    Timestamp: any;
    updateProfile: any;
    ref: any;
    uploadBytes: any;
    getDownloadURL: any;
    deleteObject: any;
  }
}

// Mock course data - replace with Firebase data
const mockCourses = [
  {
    id: '1',
    slug: 'graphic-design-masterclass',
    title: 'Graphic Design Masterclass',
    instructor: 'Billy Vasquez',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b851_avatar-9.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg',
    price: 450.00,
    originalPrice: 450.00,
    sections: 140,
    duration: 90,
    students: 40,
  },
  {
    id: '2',
    slug: 'sketch-from-a-to-z-for-app-designer',
    title: 'Sketch From A to Z: For App Designer',
    instructor: 'Dennis Barrett',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83a_avatar-3.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b860_course-11.jpg',
    price: 750.00,
    originalPrice: 750.00,
    sections: 80,
    duration: 40,
    students: 10,
  },
  {
    id: '3',
    slug: 'the-complete-web-development-in-python',
    title: 'The Complete Web Development in Python',
    instructor: 'Jacqueline Miller',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b839_avatar-7.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85f_course-10.jpg',
    price: 450.00,
    originalPrice: 450.00,
    sections: 100,
    duration: 50,
    students: 30,
  },
  {
    id: '4',
    slug: 'bootstrap-5-from-scratch',
    title: 'Bootstrap 5 From Scratch',
    instructor: 'Joan Wallace',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84e_avatar-11.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85e_course-09.jpg',
    price: 230.00,
    originalPrice: 230.00,
    sections: 150,
    duration: 5,
    students: 15,
  },
  {
    id: '5',
    slug: 'figma-to-webflow-full-course-webflow',
    title: 'Figma to Webflow: Full course',
    instructor: 'Judy Nguyen',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b850_avatar-2.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b85d_course-08.jpg',
    price: 800.00,
    originalPrice: 800.00,
    sections: 150,
    duration: 5,
    students: 15,
  },
  {
    id: '6',
    slug: 'build-websites-with-cms',
    title: 'Build Websites With CMS',
    instructor: 'Lori Stevens',
    instructorImage: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83b_avatar-6.jpg',
    image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b862_course-07.jpg',
    price: 680.00,
    originalPrice: 680.00,
    sections: 150,
    duration: 5,
    students: 15,
  },
];

interface ApprovedClass {
  classId: string;
  title: string;
  subtitle?: string;
  category: string;
  subCategory: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  numberSessions: number;
  videoLink?: string;
  createdAt: any;
  [key: string]: any;
}

export default function CreatorDashboard() {
  const { showError } = useNotification();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [viewingEnrollmentsClassId, setViewingEnrollmentsClassId] = useState<string | null>(null);
  const [viewingEnrollmentsClassName, setViewingEnrollmentsClassName] = useState<string | null>(null);
  const [liveClassData, setLiveClassData] = useState<{classId: string; sessionId: string; sessionData: any} | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load Firebase SDKs dynamically
    const loadFirebaseScripts = () => {
      // Check if already loaded with ALL required dependencies
      if (window.firebaseAuth && window.firebaseDb && window.serverTimestamp &&
        window.collection && window.query && window.where && window.getDocs &&
        window.doc && window.deleteDoc && window.updateDoc) {
        console.log('✅ Firebase and all dependencies already initialized');
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        return;
      }

      console.log('🔄 Loading Firebase scripts...');
      const firebaseAppScript = document.createElement('script');
      firebaseAppScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      firebaseAppScript.type = "module";
      firebaseAppScript.onerror = () => {
        console.error('❌ Failed to load Firebase app script');
      };
      firebaseAppScript.onload = () => {
        console.log('✅ Firebase app script loaded');
        const firebaseAuthConfig = document.createElement('script');
        firebaseAuthConfig.type = "module";
        firebaseAuthConfig.innerHTML = `
          import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
          import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
          import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
          import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

          const firebaseConfig = {
            apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
            authDomain: "zefrix-custom.firebaseapp.com",
            projectId: "zefrix-custom",
            storageBucket: "zefrix-custom.firebasestorage.app",
            messagingSenderId: "50732408558",
            appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
            measurementId: "G-27HS1SWB5X"
          };

          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
          window.firebaseAuth = getAuth(app);
          window.firebaseDb = getFirestore(app);
          window.firebaseStorage = getStorage(app);
          window.doc = doc;
          window.getDoc = getDoc;
          window.setDoc = setDoc;
          window.updateDoc = updateDoc;
          window.deleteDoc = deleteDoc;
          window.serverTimestamp = serverTimestamp;
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          window.addDoc = addDoc;
          window.Timestamp = Timestamp;
          window.updateProfile = updateProfile;
          window.ref = ref;
          window.uploadBytes = uploadBytes;
          window.getDownloadURL = getDownloadURL;
          window.deleteObject = deleteObject;

          console.log('✅ Firebase initialized - serverTimestamp available:', typeof window.serverTimestamp);
          console.log('✅ Firebase objects:', {
            firebaseAuth: !!window.firebaseAuth,
            firebaseDb: !!window.firebaseDb,
            doc: !!window.doc,
            setDoc: !!window.setDoc,
            serverTimestamp: typeof window.serverTimestamp
          });

          // Dispatch event when Firebase is ready
          window.dispatchEvent(new CustomEvent('firebaseReady', { 
            detail: { 
              firebaseAuth: window.firebaseAuth,
              firebaseDb: window.firebaseDb,
              serverTimestamp: window.serverTimestamp 
            } 
          }));
          console.log('📢 firebaseReady event dispatched');

          window.logout = async () => {
            try {
              await signOut(window.firebaseAuth);
              location.replace('/signup-login');
            } catch (error) {
              console.error('Logout failed:', error);
              showError('Logout failed, please try again.');
            }
          };

          onAuthStateChanged(window.firebaseAuth, async (user) => {
            if (!user) {
              location.replace('/signup-login');
              return;
            }
            
            try {
              const userRef = doc(window.firebaseDb, 'users', user.uid);
              const snap = await getDoc(userRef);
              const role = snap.exists() ? snap.data().role : 'student';
              
              if (role !== 'creator') {
                if (role === 'admin') {
                  location.replace('/admin-dashboard');
                } else {
                  location.replace('/student-dashboard');
                }
                return;
              }
              
              window.dispatchEvent(new CustomEvent('userLoaded', { detail: { user, role } }));
            } catch (err) {
              console.error('Auth check error:', err);
              // Still dispatch user event even if role check fails
              window.dispatchEvent(new CustomEvent('userLoaded', { detail: { user, role: 'creator' } }));
            }
          });
        `;
        document.body.appendChild(firebaseAuthConfig);
      };
      document.body.appendChild(firebaseAppScript);
    };

    loadFirebaseScripts();

    // Listen for user loaded event
    const handleUserLoaded = (e: any) => {
      console.log('User loaded event received:', e.detail);
      setUser(e.detail.user);
    };
    window.addEventListener('userLoaded', handleUserLoaded as EventListener);

    // Also check for current user immediately if Firebase is already loaded
    const checkCurrentUser = () => {
      if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        setUser(window.firebaseAuth.currentUser);
      }
    };

    // Check immediately and also set up interval
    checkCurrentUser();
    const userCheckInterval = setInterval(checkCurrentUser, 1000);

    return () => {
      window.removeEventListener('userLoaded', handleUserLoaded as EventListener);
      clearInterval(userCheckInterval);
    };
  }, []);

  const handleLogout = () => {
    if (window.logout) {
      if (confirm('Log out of Zefrix?')) {
        window.logout();
      }
    }
  };

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  // Fetch approved classes for dashboard
  useEffect(() => {
    const fetchApprovedClasses = async () => {
      // Wait for Firebase with retry logic
      let retries = 0;
      while (retries < 10) {
        const currentUser = user || (window.firebaseAuth?.currentUser);

        if (window.firebaseDb && window.collection && window.query && window.where && window.getDocs && currentUser) {
          // Firebase is ready!
          console.log('✅ Firebase ready, fetching classes for creator:', currentUser.uid);
          break;
        }

        console.log(`⏳ Waiting for Firebase... (attempt ${retries + 1}/10)`, {
          firebaseDb: !!window.firebaseDb,
          collection: !!window.collection,
          query: !!window.query,
          where: !!window.where,
          getDocs: !!window.getDocs,
          user: !!currentUser
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      // Final check after retries
      const currentUser = user || (window.firebaseAuth?.currentUser);

      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs || !currentUser) {
        console.error('❌ Firebase not ready after retries:', {
          firebaseDb: !!window.firebaseDb,
          collection: !!window.collection,
          query: !!window.query,
          where: !!window.where,
          getDocs: !!window.getDocs,
          user: !!currentUser
        });
        return;
      }

      setLoadingClasses(true);
      try {
        console.log('📦 Fetching approved classes for creator:', currentUser.uid);
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(
          classesRef,
          window.where('creatorId', '==', currentUser.uid),
          window.where('status', '==', 'approved')
        );
        const querySnapshot = await window.getDocs(q);

        const classes: ApprovedClass[] = [];
        querySnapshot.forEach((doc: any) => {
          classes.push({ classId: doc.id, ...doc.data() });
        });

        console.log(`✅ Found ${classes.length} approved classes for creator`);

        // Sort by creation date (newest first)
        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setApprovedClasses(classes);
      } catch (error) {
        console.error('❌ Error fetching approved classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };

    if (activeSection === 'dashboard') {
      fetchApprovedClasses();
    }
  }, [activeSection, user]);

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(180deg, #1a0f2e 0%, #2d1b4e 30%, #4a2c5e 60%, #6b3d6e 100%);
          min-height: 100vh;
          color: #fff;
        }

        .creator-content-wrapper {
          background: transparent;
        }


        /* Creator Dashboard Layout */
        .creator-dashboard-container {
          display: flex;
          min-height: 100vh;
          position: relative;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        /* Mobile Navigation */
        .creator-mobile-nav {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(26, 15, 46, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo-link-responsive {
          display: flex;
          align-items: center;
        }

        .creator-logo-img {
          height: 40px;
          width: auto;
        }

        .creator-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          z-index: 1001;
        }

        .creator-hamburger-line {
          width: 25px;
          height: 3px;
          background: #fff;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .creator-hamburger-line.top.open {
          transform: rotate(45deg) translate(8px, 8px);
        }

        .creator-hamburger-line.mid.open {
          opacity: 0;
        }

        .creator-hamburger-line.bot.open {
          transform: rotate(-45deg) translate(7px, -7px);
        }

        /* Sidebar - Matching Student Dashboard Design */
        .sidebar {
          width: 280px;
          background: #0f0f1e;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          left: 0;
          top: 0;
          z-index: 1000;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .sidebar-logo {
          margin-bottom: 3rem;
          flex-shrink: 0;
        }

        .sidebar-logo img {
          width: 150px;
          height: auto;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(217, 42, 99, 0.5);
          border-radius: 10px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: rgba(217, 42, 99, 0.7);
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          color: #fff;
          text-decoration: none;
          transition: all 0.3s;
          cursor: pointer;
        }

        .sidebar-nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .sidebar-nav-item.active {
          background: rgba(217, 42, 99, 0.2);
          border-left: 3px solid #D92A63;
        }

        .sidebar-nav-item img {
          width: 20px;
          height: 20px;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .sidebar-footer .sidebar-nav-item {
          background: rgba(217, 42, 99, 0.1);
          border-left: 3px solid #D92A63;
        }

        .sidebar-footer .sidebar-nav-item:hover {
          background: rgba(217, 42, 99, 0.2);
        }

        /* Hamburger for mobile */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 0.5rem;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1001;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
        }

        .hamburger-line {
          width: 25px;
          height: 3px;
          background: #fff;
          border-radius: 3px;
          transition: all 0.3s;
        }

        /* Main Content */
        .main-content {
          margin-left: 280px;
          flex: 1;
          padding: 2rem;
          min-height: 100vh;
        }

        .creator-content-wrapper {
          margin-left: 280px;
          flex: 1;
          padding: 1.5rem;
          min-height: 100vh;
          width: calc(100% - 280px);
        }

        .creator-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Dashboard Header */
        .creator-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .creator-welcome-section h2 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .creator-welcome-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }


        /* Section Titles */
        .creator-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        /* Course Grid */
        .creator-course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        /* Course Card */
        .creator-course-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          border-color: rgba(217, 42, 99, 0.3);
        }

        .creator-course-image-wrap {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .creator-course-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .creator-course-teacher-wrap {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.6);
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }

        .creator-course-instructor-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .creator-course-info {
          padding: 1.25rem;
        }

        .creator-course-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: #fff;
          line-height: 1.4;
        }

        .creator-course-meta {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .creator-course-meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .creator-course-meta-icon {
          width: 16px;
          height: 16px;
        }

        .creator-course-meta-text {
          font-size: 0.875rem;
        }

        .creator-course-bottom {
          padding: 0.875rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-course-price-wrap {
          display: flex;
          flex-direction: column;
        }

        .creator-course-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: #FFD700;
        }

        .creator-course-price-compare {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: line-through;
        }

        /* Section Container */
        .creator-section {
          margin-bottom: 3rem;
          scroll-margin-top: 2rem;
        }

        /* Form Styles */
        .creator-form-container {
          background: rgba(255, 255, 255, 0.05);
          padding: 2.5rem;
          border-radius: 16px;
          max-width: 900px;
          margin: 0 auto;
        }

        .creator-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .creator-form-section {
          margin-bottom: 3rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 2rem;
        }

        .creator-form-heading {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(217, 42, 99, 0.3);
        }

        .creator-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .creator-form-grid {
            grid-template-columns: 1fr;
          }
        }

        .creator-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .creator-field-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.3px;
        }

        .creator-field-hint {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: -0.5rem;
          font-style: italic;
        }

        .creator-form-input,
        .creator-textarea {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: all 0.3s;
        }

        .creator-select {
          width: 100%;
          padding: 12px 16px;
          background: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #000;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: all 0.3s;
        }

        .creator-form-input:focus,
        .creator-textarea:focus {
          outline: none;
          border-color: #D92A63;
          background: rgba(255, 255, 255, 0.15);
        }

        .creator-select:focus {
          outline: none;
          border-color: #D92A63;
          background: #fff;
        }

        .creator-form-input::placeholder,
        .creator-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .creator-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.762L10.825 4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 12px;
          padding-right: 40px;
        }

        .creator-select option {
          background: #fff;
          color: #000;
          padding: 8px;
        }

        .creator-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .creator-radio-group {
          display: flex;
          gap: 2.5rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .creator-radio-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .creator-radio-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .creator-radio-label {
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
        }

        .creator-one-time-fields,
        .creator-recurring-fields {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .creator-pill-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 0.875rem;
          margin-top: 0.5rem;
        }

        .creator-pill-item {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .creator-pill-checkbox {
          display: none;
        }

        .creator-pill-label {
          padding: 0.625rem 1.25rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s;
          cursor: pointer;
        }

        .creator-pill-checkbox:checked + .creator-pill-label {
          background: rgba(217, 42, 99, 0.15);
          border-color: #D92A63;
          color: #fff;
        }

        .creator-form-actions {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-submit-btn {
          background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%);
          color: white;
          border: none;
          padding: 16px 40px;
          border-radius: 10px;
          font-size: 1.0625rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          width: 100%;
          max-width: 300px;
        }

        .creator-message {
          margin-top: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9375rem;
        }

        .creator-message-success {
          background-color: rgba(212, 237, 218, 0.15);
          color: #d4edda;
          border: 1px solid rgba(195, 230, 203, 0.3);
        }

        .creator-message-error {
          background-color: rgba(248, 215, 218, 0.15);
          color: #f8d7da;
          border: 1px solid rgba(245, 198, 203, 0.3);
        }

        .creator-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(217, 42, 99, 0.3);
        }

        .creator-submit-btn:active {
          transform: translateY(0);
        }

        /* Manage Classes Styles - Matching Webflow HTML */
        .creator-manage-classes {
          background: transparent;
          padding: 0;
          width: 100%;
        }

        .creator-manage-classes.main-content {
          margin-left: 0;
          padding: 0;
        }

        .div-block-6 {
          margin-bottom: 1.5rem;
        }

        .heading-3.upcoming-classes-title.pending-approvals-classes {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .creator-payments-list {
          width: 100%;
        }

        .creator-payments-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .creator-payments-list-item {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
        }

        .creator-payments-list-item.glass-bg {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .glass-bg {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .div-block-14.payment-info.grid {
          display: grid;
          grid-template-columns: auto 1fr 1fr auto auto auto auto auto;
          gap: 1rem;
          align-items: center;
          width: 100%;
        }

        .payment-info {
          display: grid;
        }

        .payment-info.grid {
          grid-template-columns: auto 1fr 1fr auto auto auto auto auto;
        }

        .thumbnail {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          display: block;
        }

        .creator-pay-info-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          white-space: nowrap;
          display: block;
        }

        h1.creator-pay-info-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .text-block-31 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
          display: block;
        }

        .button-dark.button-new-style {
          background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(217, 42, 99, 0.3);
          text-decoration: none;
          display: inline-block;
        }

        .button-dark.button-new-style:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(217, 42, 99, 0.4);
        }

        .w-button {
          display: inline-block;
        }

        /* Manage Batches Styles */
        .creator-manage-batches {
          background: transparent;
          padding: 0;
        }

        .creator-batches-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .creator-batch-item {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-batch-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 1rem;
          align-items: center;
        }

        .creator-batch-datetime,
        .creator-batch-status {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }

        .creator-batch-btn {
          padding: 6px 12px;
          font-size: 0.75rem;
        }

        .creator-batch-create {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-create-btn {
          background: linear-gradient(135deg, #D92A63 0%, #FF654B 100%);
        }

        /* Class Details Styles */
        .creator-class-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .creator-details-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1.5rem;
        }

        .creator-details-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-details-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .creator-details-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .creator-details-chart {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.5rem;
          min-height: 180px;
          position: relative;
        }

        .creator-chart-wrapper {
          position: relative;
          width: 100%;
          max-width: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .creator-chart-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          z-index: 2;
          margin-top: -8px;
        }

        .creator-chart-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          z-index: 2;
          margin-top: 12px;
        }

        .creator-chart-image {
          width: 100%;
          height: auto;
          opacity: 0.9;
        }

        .creator-details-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .creator-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .creator-info-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
        }

        .creator-info-value {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .creator-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }

        .creator-students-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-students-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .creator-students-title {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .creator-students-table {
          margin-bottom: 1.5rem;
        }

        .creator-table-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 0.75rem;
        }

        .creator-table-col {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .creator-table-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .creator-table-row .creator-table-col {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }

        .creator-add-student-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .creator-class-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Live Class Styles */
        .creator-live-class {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .creator-live-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1.5rem;
        }

        .creator-live-students {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-live-students .creator-students-title {
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
        }

        .creator-students-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .creator-students-list .creator-table-header {
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-student-item {
          padding: 0.75rem 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .creator-student-item:last-child {
          border-bottom: none;
        }

        .creator-live-video {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .creator-video-wrapper {
          width: 100%;
          position: relative;
        }

        .creator-video-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          border-radius: 8px;
        }

        .creator-video-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }

        .creator-live-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Profile Styles */
        .creator-profile {
          background: rgba(255, 255, 255, 0.05);
          padding: 2rem;
          border-radius: 16px;
        }

        /* Responsive adjustments */
        @media (max-width: 991px) {
          .creator-class-item-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .creator-batch-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .creator-details-grid,
          .creator-live-grid {
            grid-template-columns: 1fr;
          }

          .creator-class-actions,
          .creator-live-actions {
            flex-direction: column;
          }

          .creator-action-btn {
            width: 100%;
          }
        }

        /* Responsive */
        @media (max-width: 991px) {
          .creator-sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s;
          }

          .creator-sidebar.mobile-open {
            transform: translateX(0);
          }

          .creator-content-wrapper {
            margin-left: 0;
            padding-top: 80px;
          }

          .main-content {
            margin-left: 0;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .hamburger {
            display: flex;
          }

          .creator-nav-overlay {
            display: block;
          }

          .creator-course-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }

        @media (max-width: 767px) {
          .creator-course-grid {
            grid-template-columns: 1fr;
          }

          .creator-dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <CreatorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />

        <div className="main-content">
          <div className="creator-content">
            {/* Dashboard Header */}
            <div className="creator-dashboard-header">
              <div className="creator-welcome-section">
                <h2>Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Creator'}!</h2>
                <p>Continue your teaching journey</p>
              </div>
            </div>

            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <div id="dashboard" className="creator-section">
                <h2 className="creator-section-title">My Approved Classes</h2>
                {loadingClasses ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                    Loading classes...
                  </div>
                ) : approvedClasses.length > 0 ? (
                  <div className="creator-course-grid">
                    {approvedClasses.map((classItem) => {
                      const course = {
                        id: classItem.classId,
                        slug: classItem.classId,
                        title: classItem.title,
                        instructor: classItem.creatorName || 'Creator',
                        instructorImage: '',
                        image: classItem.videoLink || 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg',
                        price: classItem.price,
                        originalPrice: classItem.price,
                        sections: classItem.numberSessions,
                        duration: classItem.scheduleType === 'one-time' ? 1 : Math.ceil(classItem.numberSessions / 7),
                        students: 0,
                      };
                      return <CreatorCourseCard key={classItem.classId} course={course} />;
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                    No approved classes yet. Create a class and wait for admin approval.
                  </div>
                )}
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div id="notifications" className="creator-section">
                <h2 className="creator-section-title">Notifications</h2>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#fff' }}>Notifications Center</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
                    Class reminders and updates are sent via email and WhatsApp through n8n automation.
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                    You'll receive notifications about class approvals, student enrollments, and important updates.
                  </p>
                </div>
              </div>
            )}

            {/* Analytics Section */}
            {activeSection === 'analytics' && (
              <div id="analytics" className="creator-section">
                <Analytics />
              </div>
            )}

            {/* Create Class Section */}
            {activeSection === 'create-class' && (
              <div id="create-class" className="creator-section">
                <h2 className="creator-section-title">Create a New Class</h2>
                <div className="creator-form-container">
                  <CreateClassForm />
                </div>
              </div>
            )}

            {/* Manage Classes Section */}
            {activeSection === 'manage-classes' && (
              <div id="manage-classes" className="creator-section">
                {viewingEnrollmentsClassId ? (
                  <EnrollmentList
                    classId={viewingEnrollmentsClassId}
                    className={viewingEnrollmentsClassName || undefined}
                    onBack={() => {
                      setViewingEnrollmentsClassId(null);
                      setViewingEnrollmentsClassName(null);
                    }}
                  />
                ) : viewingClassId ? (
                  <ViewClass
                    classId={viewingClassId}
                    onBack={() => setViewingClassId(null)}
                    onEdit={() => {
                      setEditingClassId(viewingClassId);
                      setViewingClassId(null);
                    }}
                    onStartLiveClass={(classId, sessionId, sessionData) => {
                      setLiveClassData({ classId, sessionId, sessionData });
                      setActiveSection('live-class');
                      setViewingClassId(null);
                    }}
                  />
                ) : editingClassId ? (
                  <EditClassForm
                    classId={editingClassId}
                    onCancel={() => setEditingClassId(null)}
                    onSuccess={() => {
                      setEditingClassId(null);
                      // Optionally refresh the class list
                    }}
                  />
                ) : selectedClassId ? (
                  <ManageBatches
                    classId={selectedClassId}
                    className={selectedClassName || undefined}
                    onBack={() => {
                      setSelectedClassId(null);
                      setSelectedClassName(null);
                    }}
                  />
                ) : (
                  <ManageClasses
                    onEditClass={(classId) => setEditingClassId(classId)}
                    onViewClass={(classId) => setViewingClassId(classId)}
                    onManageBatches={(classId, className) => {
                      setSelectedClassId(classId);
                      setSelectedClassName(className);
                    }}
                    onViewEnrollments={(classId, className) => {
                      setViewingEnrollmentsClassId(classId);
                      setViewingEnrollmentsClassName(className);
                    }}
                  />
                )}
              </div>
            )}

            {activeSection === 'enrollments' && (
              <div id="enrollments" className="creator-section">
                <EnrollmentList />
              </div>
            )}

            {/* Manage Batches Section */}
            {activeSection === 'manage-batches' && (
              <div id="manage-batches" className="creator-section">
                <ManageBatches />
              </div>
            )}

            {/* Class Details Section */}
            {activeSection === 'class-details' && viewingClassId && (
              <div id="class-details" className="creator-section">
                <ClassDetails classId={viewingClassId} onBack={() => setViewingClassId(null)} />
              </div>
            )}

            {/* Live Class Section */}
            {activeSection === 'live-class' && liveClassData && (
              <div id="live-class" className="creator-section">
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => {
                      setLiveClassData(null);
                      setActiveSection('manage-classes');
                      setViewingClassId(liveClassData.classId);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '1rem'
                    }}
                  >
                    ← Back to Class
                  </button>
                </div>
                <LiveClass
                  classId={liveClassData.classId}
                  sessionId={liveClassData.sessionId}
                  sessionNumber={liveClassData.sessionData.sessionNumber}
                  meetingLink={liveClassData.sessionData.meetingLink || liveClassData.sessionData.meetLink || ''}
                  className={liveClassData.sessionData.className || 'Class'}
                  onEndClass={() => {
                    setLiveClassData(null);
                    setActiveSection('manage-classes');
                    setViewingClassId(liveClassData.classId);
                  }}
                />
              </div>
            )}

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div id="profile" className="creator-section">
                <h2 className="creator-section-title">My Profile</h2>
                <div className="creator-form-container">
                  <CreatorProfile />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

