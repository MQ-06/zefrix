'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { courses } from '@/lib/data';
import { categoryDetails } from '@/lib/categoriesData';
import NotificationList from '@/components/Notifications/NotificationList';
import NotificationBadge from '@/components/Notifications/NotificationBadge';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    logout: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    onSnapshot: any;
    doc: any;
    getDoc: any;
    setDoc: any;
    updateDoc: any;
    addDoc: any;
    Timestamp: any;
    orderBy: any;
    limit: any;
    deleteDoc: any;
    writeBatch: any;
  }
}

interface ApprovedClass {
  classId: string;
  title: string;
  subtitle?: string;
  category: string;
  subCategory: string;
  creatorName: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  numberSessions: number;
  videoLink?: string;
  createdAt: any;
  [key: string]: any;
}

export default function StudentDashboard() {
  const { showError, showSuccess } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollmentClasses, setEnrollmentClasses] = useState<Record<string, any>>({});
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // New features state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedClassForRating, setSelectedClassForRating] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const router = useRouter();
  const userInitial = ((user?.displayName || user?.email || 'S')[0] || 'S').toUpperCase();

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
          import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
          import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
          window.doc = doc;
          window.getDoc = getDoc;
          window.setDoc = setDoc;
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          window.addDoc = addDoc;
          window.updateDoc = updateDoc;
          window.orderBy = orderBy;
          window.limit = limit;
          window.onSnapshot = onSnapshot;
          window.deleteDoc = deleteDoc;
          window.writeBatch = writeBatch;

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
              
              if (role === 'admin') {
                location.replace('/admin-dashboard');
                return;
              }
              if (role === 'creator') {
                location.replace('/creator-dashboard');
                return;
              }
              
              // Dispatch custom event with user data
              window.dispatchEvent(new CustomEvent('userLoaded', { detail: { user, role } }));
            } catch (err) {
              console.error('Auth check error:', err);
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
      setUser(e.detail.user);
    };
    window.addEventListener('userLoaded', handleUserLoaded);

    return () => {
      window.removeEventListener('userLoaded', handleUserLoaded);
    };
  }, []);


  // Fetch enrollments from Firestore with real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListener = async () => {
      if (!user || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot || !window.doc || !window.getDoc) {
        retryTimeout = setTimeout(setupListener, 500);
        return;
      }

      setLoadingEnrollments(true);
      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const q = window.query(enrollmentsRef, window.where('studentId', '==', user.uid));
        
        unsubscribe = window.onSnapshot(q, async (snapshot: any) => {
          const fetchedEnrollments: any[] = [];
          snapshot.forEach((doc: any) => {
            fetchedEnrollments.push({ id: doc.id, ...doc.data() });
          });

          // Sort by enrollment date (newest first)
          fetchedEnrollments.sort((a, b) => {
            const aTime = a.enrolledAt?.toMillis?.() || 0;
            const bTime = b.enrolledAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          // Fetch class data for each enrollment
          const classesData: Record<string, any> = {};
          const classPromises = fetchedEnrollments.map(async (enrollment) => {
            try {
              const classRef = window.doc(window.firebaseDb, 'classes', enrollment.classId);
              const classSnap = await window.getDoc(classRef);
              if (classSnap.exists()) {
                classesData[enrollment.classId] = classSnap.data();
              }
            } catch (error) {
              console.error(`Error fetching class ${enrollment.classId}:`, error);
            }
          });

          await Promise.all(classPromises);

          setEnrollments(fetchedEnrollments);
          setEnrollmentClasses(classesData);
          setLoadingEnrollments(false);
        }, (error: any) => {
          console.error('Error in enrollments listener:', error);
          setLoadingEnrollments(false);
        });
      } catch (error) {
        console.error('Error setting up enrollments listener:', error);
        setLoadingEnrollments(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [user]);

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user || !window.firebaseDb || !window.doc || !window.getDoc) {
        return;
      }

      try {
        const userRef = window.doc(window.firebaseDb, 'users', user.uid);
        const userSnap = await window.getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfileName(userData.displayName || user.displayName || '');
          setProfileInterests(userData.interests || '');
          setProfileImage(userData.photoURL || user.photoURL || '');
          setProfileImagePreview(userData.photoURL || user.photoURL || '');
        } else {
          // Set defaults from Firebase Auth
          setProfileName(user.displayName || '');
          setProfileImage(user.photoURL || '');
          setProfileImagePreview(user.photoURL || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user]);

  const handleLogout = () => {
    if (confirm('Log out of Zefrix?')) {
      if (window.logout) {
        window.logout();
      }
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, view: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setActiveView(view);
    // Scroll to top when switching views
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Fetch approved classes from Firestore with real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListener = () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
        retryTimeout = setTimeout(setupListener, 500);
        return;
      }

      setLoadingClasses(true);
      try {
        console.log('📦 Setting up real-time listener for approved classes...');
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(classesRef, window.where('status', '==', 'approved'));
        
        unsubscribe = window.onSnapshot(q, (snapshot: any) => {
          const classes: ApprovedClass[] = [];
          snapshot.forEach((doc: any) => {
            classes.push({ classId: doc.id, ...doc.data() });
          });

          console.log(`✅ Real-time update: Found ${classes.length} approved classes`);

          // Sort by creation date (newest first)
          classes.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          setApprovedClasses(classes);
          setLoadingClasses(false);
        }, (error: any) => {
          console.error('Error in real-time listener:', error);
          setLoadingClasses(false);
        });
      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        setLoadingClasses(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // Fetch upcoming sessions for enrolled classes
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        console.log('📋 Cannot fetch sessions - missing Firebase or user');
        return;
      }

      if (enrollments.length === 0) {
        console.log('📋 No enrollments found, skipping session fetch');
        setUpcomingSessions([]);
        return;
      }

      try {
        console.log('🔍 Fetching sessions for enrollments:', enrollments.map(e => e.classId));
        const sessions: any[] = [];
        const now = new Date();

        // Fetch from sessions collection
        const sessionsRef = window.collection(window.firebaseDb, 'sessions');
        const sessionsSnapshot = await window.getDocs(sessionsRef);
        
        console.log(`📊 Found ${sessionsSnapshot.size} total sessions in collection`);
        
        sessionsSnapshot.forEach((doc: any) => {
          const session = { id: doc.id, ...doc.data() };
          console.log('📅 Processing session:', {
            classId: session.classId,
            className: session.className,
            sessionDate: session.sessionDate,
            hasDate: !!session.sessionDate
          });
          
          // Handle different date formats
          let sessionDate: Date;
          if (session.sessionDate?.toDate) {
            sessionDate = session.sessionDate.toDate();
          } else if (session.sessionDate) {
            sessionDate = new Date(session.sessionDate);
          } else {
            console.log('⚠️ Session missing date, skipping:', session.id);
            return; // Skip if no date
          }
          
          // Only include future sessions (or past sessions within last hour for debugging)
          const isFuture = sessionDate > now;
          const isRecent = (now.getTime() - sessionDate.getTime()) < 3600000; // Last hour
          
          if (isFuture || isRecent) {
            // Check if student is enrolled in this class
            const enrollmentIds = enrollments.map(e => e.classId);
            const isEnrolled = enrollmentIds.includes(session.classId);
            
            console.log('✅ Session check:', {
              classId: session.classId,
              isEnrolled,
              enrollmentIds,
              isFuture,
              isRecent
            });
            
            if (isEnrolled) {
              sessions.push({
                ...session,
                className: session.className || 'Class',
                sessionDate: sessionDate,
                sessionTime: session.sessionTime || session.startTime || '',
                meetingLink: session.meetingLink || session.meetLink,
                recordingLink: session.recordingLink || session.recording || null,
                status: session.status || 'scheduled',
                sessionNumber: session.sessionNumber,
                classId: session.classId
              });
            }
          }
        });

        // Also fetch from batches (for backward compatibility)
        const batchesRef = window.collection(window.firebaseDb, 'batches');
        const allBatchesSnapshot = await window.getDocs(batchesRef);
        
        console.log(`📊 Found ${allBatchesSnapshot.size} total batches`);
        
        allBatchesSnapshot.forEach((doc: any) => {
          const batch = { id: doc.id, ...doc.data() };
          const batchDate = batch.batchDate?.toDate ? batch.batchDate.toDate() : new Date(batch.batchDate);
          
          // Only include future sessions
          if (batchDate > now && batch.status === 'scheduled') {
            // Check if student is enrolled in this class
            const isEnrolled = enrollments.some(e => e.classId === batch.classId);
            if (isEnrolled) {
              sessions.push({
                ...batch,
                className: batch.className || 'Class',
                sessionDate: batchDate,
                sessionTime: batch.batchTime,
                meetingLink: batch.meetingLink
              });
            }
          }
        });

        // Sort by date (earliest first)
        sessions.sort((a, b) => {
          const aTime = a.sessionDate?.getTime() || 0;
          const bTime = b.sessionDate?.getTime() || 0;
          return aTime - bTime;
        });

        console.log(`✅ Found ${sessions.length} upcoming sessions for enrolled classes`);
        setUpcomingSessions(sessions.slice(0, 10)); // Limit to 10 upcoming
      } catch (error) {
        console.error('❌ Error fetching upcoming sessions:', error);
      }
    };

    if (user) {
      fetchUpcomingSessions();
    }
  }, [user, enrollments]);

  // Filter classes based on search and category
  const filteredClasses = approvedClasses.filter((cls) => {
    const matchesSearch = !searchQuery || 
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || cls.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!selectedClassForRating || !rating || !user) return;

    const classId = selectedClassForRating.classId || selectedClassForRating.id;

    try {
      if (!window.firebaseDb || !window.collection || !window.addDoc || !window.query || !window.where || !window.getDocs || !window.updateDoc || !window.doc) {
        showError('Firebase not ready. Please try again.');
        return;
      }

      // 1. Validate: Check if student is enrolled in this class
      const enrollment = enrollments.find(e => e.classId === classId);
      if (!enrollment) {
        showError('You must be enrolled in this class to submit a rating.');
        return;
      }

      // 2. Check for duplicate rating (prevent multiple ratings)
      const ratingsRef = window.collection(window.firebaseDb, 'ratings');
      const existingRatingQuery = window.query(
        ratingsRef,
        window.where('classId', '==', classId),
        window.where('studentId', '==', user.uid)
      );
      const existingRatingSnapshot = await window.getDocs(existingRatingQuery);
      
      if (!existingRatingSnapshot.empty) {
        // Rating already exists - update it instead of creating new one
        const existingRatingDoc = existingRatingSnapshot.docs[0];
        await window.updateDoc(existingRatingDoc.ref, {
          rating: rating,
          feedback: feedback,
          updatedAt: new Date()
        });
        showSuccess('Rating updated successfully!');
      } else {
        // Create new rating
        await window.addDoc(ratingsRef, {
          classId: classId,
          studentId: user.uid,
          studentName: user.displayName || user.email?.split('@')[0] || 'Student',
          rating: rating,
          feedback: feedback,
          createdAt: new Date()
        });
        showSuccess('Rating submitted successfully!');
      }

      // 3. Update enrollment document for quick access (keep in sync)
      const enrollmentRef = window.doc(window.firebaseDb, 'enrollments', enrollment.id);
      await window.updateDoc(enrollmentRef, {
        rating: rating,
        feedback: feedback,
        ratedAt: new Date()
      });

      setShowRatingModal(false);
      setRating(0);
      setFeedback('');
      setSelectedClassForRating(null);
      
      // Refresh enrollments (this will also refresh class data via the useEffect)
      if (user) {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const q = window.query(enrollmentsRef, window.where('studentId', '==', user.uid));
        const querySnapshot = await window.getDocs(q);
        const fetchedEnrollments: any[] = [];
        querySnapshot.forEach((doc: any) => {
          fetchedEnrollments.push({ id: doc.id, ...doc.data() });
        });
        fetchedEnrollments.sort((a, b) => {
          const aTime = a.enrolledAt?.toMillis?.() || 0;
          const bTime = b.enrolledAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // Fetch class data for each enrollment
        const classesData: Record<string, any> = {};
        const classPromises = fetchedEnrollments.map(async (enrollment) => {
          try {
            const classRef = window.doc(window.firebaseDb, 'classes', enrollment.classId);
            const classSnap = await window.getDoc(classRef);
            if (classSnap.exists()) {
              classesData[enrollment.classId] = classSnap.data();
            }
          } catch (error) {
            console.error(`Error fetching class ${enrollment.classId}:`, error);
          }
        });
        await Promise.all(classPromises);

        setEnrollments(fetchedEnrollments);
        setEnrollmentClasses(classesData);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Failed to submit rating. Please try again.');
    }
  };

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Format time helper
  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  // Check if class is live (within 30 minutes of start time)
  const isClassLive = (sessionDate: Date, sessionTime: string) => {
    if (!sessionDate || !sessionTime) return false;
    const now = new Date();
    const [hours, minutes] = sessionTime.split(':');
    const sessionDateTime = new Date(sessionDate);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const diffMinutes = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes >= -30 && diffMinutes <= 120; // Live if within 30 min before to 2 hours after
  };

  const dashboardStyles = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          overflow-x: hidden;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        /* Sidebar */
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

        /* Main Content */
        .main-content {
          margin-left: 280px;
          flex: 1;
          padding: 2rem;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .welcome-section h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .welcome-section p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
        }

        .user-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          min-width: 220px;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D92A63, #6C63FF);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #fff;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          color: #fff;
          font-weight: 700;
          line-height: 1.1;
        }

        .user-email {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.1;
        }

        /* Course Grid */
        .course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .course-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }

        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .course-image-wrap {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .course-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .course-teacher-wrap {
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

        .course-instructor-image-rounded {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .course-info {
          padding: 1.5rem;
        }

        .course-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .course-meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }

        .course-meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .course-meta-icon {
          width: 16px;
          height: 16px;
        }

        .course-bottom {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .course-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #FFD700;
        }

        .course-price-compare {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: line-through;
          margin-left: 0.5rem;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .section-title-inline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .button-dark {
          background: linear-gradient(135deg, #D92A63 0%, #FF6B35 100%);
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s;
          border: none;
          cursor: pointer;
        }

        .button-dark:hover {
          transform: scale(1.05);
        }

        .button-inline-flex-style {
          display: flex;
          gap: 1rem;
        }

        /* My Enrollments */
        .my-enrollments {
          margin-top: 4rem;
        }

        .enrollment-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .enrollment-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: auto 1fr 1fr 1fr auto auto;
          gap: 1.5rem;
          align-items: center;
        }

        .enrollment-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .enrollment-info h1 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .enrollment-status {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .enrollment-actions {
          display: flex;
          gap: 1rem;
        }

        /* Profile Form */
        .profile-form {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          max-width: 600px;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .form-input:focus {
          outline: none;
          border-color: #D92A63;
        }

        /* Select dropdown styling */
        select.form-input {
          color: #000 !important;
          background: #fff !important;
          cursor: pointer;
        }

        select.form-input:focus {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }

        select.form-input option {
          color: #000 !important;
          background: #fff !important;
          padding: 0.5rem;
        }

        /* When select is open (active), show white text */
        select.form-input:active,
        select.form-input:focus {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }

        /* Responsive */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 0.5rem;
        }

        .hamburger-line {
          width: 25px;
          height: 3px;
          background: #fff;
          border-radius: 3px;
          transition: all 0.3s;
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 991px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0;
          }

          .hamburger {
            display: flex;
          }

          .course-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }

        @media (max-width: 767px) {
          .course-grid {
            grid-template-columns: 1fr;
          }

          .enrollment-item {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .enrollment-actions {
            flex-direction: column;
          }
        }

        /* Rating Modal */
        .rating-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .rating-modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-height: 90vh;
          overflow: auto;
        }

        /* Search and Filter */
        .search-filter-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-input {
          flex: 1;
          min-width: 250px;
          max-width: 400px;
        }

        .filter-select {
          min-width: 150px;
        }

        /* Session Card */
        .session-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .session-card.live {
          background: rgba(217, 42, 99, 0.2);
          border: 2px solid #D92A63;
        }

        .live-badge {
          background: #D92A63;
          color: #fff;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dashboard-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: dashboardStyles}} />

      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png" alt="Zefrix" />
          </div>
          <nav className="sidebar-nav">
            <a href="#" onClick={(e) => handleNavClick(e, 'dashboard')} className={`sidebar-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Dashboard</div>
            </a>
            <a href="#" onClick={(e) => handleNavClick(e, 'notifications')} className={`sidebar-nav-item ${activeView === 'notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Notifications</div>
              {user?.uid && <NotificationBadge userId={user.uid} />}
            </a>
            <a href="#" onClick={(e) => handleNavClick(e, 'upcoming-sessions')} className={`sidebar-nav-item ${activeView === 'upcoming-sessions' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Upcoming Sessions</div>
            </a>
            <a href="#" onClick={(e) => handleNavClick(e, 'my-enrollments')} className={`sidebar-nav-item ${activeView === 'my-enrollments' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>My Enrollments</div>
            </a>
            <a href="#" onClick={(e) => handleNavClick(e, 'browse-classes')} className={`sidebar-nav-item ${activeView === 'browse-classes' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Browse Classes</div>
            </a>
            <a href="#" onClick={(e) => handleNavClick(e, 'profile')} className={`sidebar-nav-item ${activeView === 'profile' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>My Profile</div>
            </a>
          </nav>
          <div className="sidebar-footer">
            <a onClick={handleLogout} className="sidebar-nav-item">
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Log Out</div>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Mobile Hamburger */}
          <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>

          {/* Render Active View */}
          {activeView === 'dashboard' && (
            <>
              {/* Dashboard Header */}
              <div className="dashboard-header">
                <div className="welcome-section">
                  <h2>Welcome back, {user?.displayName || 'Student'}!</h2>
                  <p>Continue your learning journey</p>
                </div>
                <div className="user-summary">
                  <div className="user-avatar">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user?.displayName || 'Student'} />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="user-meta">
                    <div className="user-name">{user?.displayName || user?.email?.split('@')[0] || 'Student'}</div>
                    <div className="user-email">{user?.email || 'Student account'}</div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="dashboard-stats-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#D92A63', marginBottom: '0.5rem' }}>
                    {enrollments.length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Enrolled Classes
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#FF654B', marginBottom: '0.5rem' }}>
                    {upcomingSessions.length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Upcoming Sessions
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4CAF50', marginBottom: '0.5rem' }}>
                    {upcomingSessions.filter(s => isClassLive(s.sessionDate, s.sessionTime) || s.status === 'live').length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Live Now
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2196F3', marginBottom: '0.5rem' }}>
                    {approvedClasses.length}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Available Classes
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                flexWrap: 'wrap'
              }}>
                <a
                  href="#"
                  onClick={(e) => handleNavClick(e, 'my-enrollments')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)',
                    borderRadius: '8px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  View My Enrollments
                </a>
                <a
                  href="#"
                  onClick={(e) => handleNavClick(e, 'browse-classes')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Browse All Classes
                </a>
                <a
                  href="#"
                  onClick={(e) => handleNavClick(e, 'upcoming-sessions')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  View Upcoming Sessions
                </a>
              </div>

              {/* Two Column Layout */}
              <div className="dashboard-two-col" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                {/* Upcoming Sessions Widget */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Upcoming Sessions
                    </h3>
                    <a
                      href="#"
                      onClick={(e) => handleNavClick(e, 'upcoming-sessions')}
                      style={{
                        color: '#D92A63',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      View All →
                    </a>
                  </div>
                  {upcomingSessions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {upcomingSessions.slice(0, 3).map((session) => {
                        const isLiveFromStatus = session.status === 'live';
                        const isLive = isLiveFromStatus || isClassLive(session.sessionDate, session.sessionTime);
                        return (
                          <div key={session.id} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '1rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <div style={{
                              fontSize: '0.9375rem',
                              fontWeight: '600',
                              color: '#fff',
                              marginBottom: '0.5rem'
                            }}>
                              {session.className}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.7)',
                              marginBottom: '0.5rem'
                            }}>
                              📅 {formatDate(session.sessionDate)} at {formatTime(session.sessionTime)}
                            </div>
                            {isLive && session.meetingLink && (
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  padding: '0.5rem 1rem',
                                  background: '#D92A63',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: '500'
                                }}
                              >
                                Join Now
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                      No upcoming sessions
                    </div>
                  )}
                </div>

                {/* Recent Enrollments Widget */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                      Recent Enrollments
                    </h3>
                    <a
                      href="#"
                      onClick={(e) => handleNavClick(e, 'my-enrollments')}
                      style={{
                        color: '#D92A63',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      View All →
                    </a>
                  </div>
                  {enrollments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {enrollments.slice(0, 3).map((enrollment) => {
                        const classData = enrollmentClasses[enrollment.classId] || {};
                        const className = enrollment.className || classData.title || 'Class';
                        const enrollmentDate = enrollment.enrolledAt?.toDate ? enrollment.enrolledAt.toDate() : (enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : null);
                        
                        return (
                          <Link
                            key={enrollment.id}
                            href={`/product/${enrollment.classId}`}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '1rem',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'block',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          >
                            <div style={{
                              fontSize: '0.9375rem',
                              fontWeight: '600',
                              color: '#fff',
                              marginBottom: '0.5rem'
                            }}>
                              {className}
                            </div>
                            {enrollmentDate && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.7)'
                              }}>
                                Enrolled: {formatDate(enrollmentDate)}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                      No enrollments yet. <a href="#" onClick={(e) => handleNavClick(e, 'browse-classes')} style={{ color: '#D92A63', textDecoration: 'underline' }}>Browse classes</a> to get started!
                    </div>
                  )}
                </div>
              </div>

            </>
          )}

          {activeView === 'notifications' && (
            <>
              {user?.uid ? (
                <NotificationList userId={user.uid} userRole="student" />
              ) : (
                <div className="section" style={{ marginTop: '2rem' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading notifications...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeView === 'upcoming-sessions' && (
            <>
              {/* Upcoming Sessions */}
              <div className="section" style={{ marginTop: '2rem' }}>
                <h2 className="section-title">Upcoming Sessions ({upcomingSessions.length})</h2>
                {upcomingSessions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {upcomingSessions.map((session) => {
                      const isLiveFromStatus = session.status === 'live';
                      const isCompleted = session.status === 'completed';
                      const isLive = isLiveFromStatus || isClassLive(session.sessionDate, session.sessionTime);
                      return (
                        <div key={session.id} style={{
                          background: isLive ? 'rgba(217, 42, 99, 0.2)' : isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          border: isLive ? '2px solid #D92A63' : isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                              {session.className} {session.sessionNumber && `- Session ${session.sessionNumber}`}
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                              <span>📅 {formatDate(session.sessionDate)}</span>
                              <span>🕐 {formatTime(session.sessionTime)}</span>
                              {session.duration && <span>⏱️ {session.duration} min</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {isLive && (
                              <span style={{
                                background: '#D92A63',
                                color: '#fff',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                🔴 LIVE NOW
                              </span>
                            )}
                            {isCompleted && (
                              <span style={{
                                background: '#4CAF50',
                                color: '#fff',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                ✓ Completed
                              </span>
                            )}
                            {isCompleted && session.recordingLink ? (
                              <a
                                href={session.recordingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-dark"
                                style={{ 
                                  fontSize: '0.875rem', 
                                  padding: '0.75rem 1.5rem', 
                                  textDecoration: 'none',
                                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                                }}
                              >
                                📹 Watch Recording
                              </a>
                            ) : session.meetingLink ? (
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button-dark"
                                style={{ 
                                  fontSize: '0.875rem', 
                                  padding: '0.75rem 1.5rem', 
                                  textDecoration: 'none',
                                  background: isLive ? '#D92A63' : 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)'
                                }}
                              >
                                {isLive ? 'Join Live Class' : 'Join Session'}
                              </a>
                            ) : (
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                {isCompleted ? 'Recording coming soon' : 'Link will be sent via email'}
                              </span>
                            )}
                            {isCompleted && (
                              <button
                                onClick={() => {
                                  setSelectedClassForRating({ classId: session.classId, className: session.className });
                                  setShowRatingModal(true);
                                }}
                                style={{
                                  fontSize: '0.875rem',
                                  padding: '0.75rem 1.5rem',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: '#fff',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                              >
                                ⭐ Rate & Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    No upcoming sessions scheduled. Check your email for class schedules.
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'my-enrollments' && (
            <>
              {/* My Enrollments */}
              <div className="my-enrollments" style={{ marginTop: '2rem' }}>
                <h2 className="section-title">My Enrollments</h2>
            {loadingEnrollments ? (
              <div className="text-white text-center py-8">Loading enrollments...</div>
            ) : enrollments.length > 0 ? (
              <div className="course-grid">
                {enrollments.map((enrollment) => {
                  const classData = enrollmentClasses[enrollment.classId] || {};
                  const classImage = classData.videoLink || classData.thumbnail || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                  const creatorName = classData.creatorName || enrollment.creatorName || 'Creator';
                  const category = classData.category || enrollment.category || '';
                  const scheduleType = classData.scheduleType || enrollment.classType || 'one-time';
                  const numberOfSessions = classData.numberSessions || enrollment.numberOfSessions || 1;
                  const enrollmentDate = enrollment.enrolledAt?.toDate ? enrollment.enrolledAt.toDate() : (enrollment.enrolledAt ? new Date(enrollment.enrolledAt) : null);
                  const nextSession = upcomingSessions.find(s => s.classId === enrollment.classId);
                  const creatorInitial = (creatorName[0] || 'C').toUpperCase();
                  
                  // Calculate attendance stats
                  const sessionAttendance = enrollment.sessionAttendance || {};
                  const totalSessions = Object.keys(sessionAttendance).length;
                  const attendedSessions = Object.values(sessionAttendance).filter((s: any) => s.attended).length;
                  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

                  return (
                    <Link key={enrollment.id} href={`/product/${enrollment.classId}`} className="course-card">
                      <div className="course-image-wrap">
                        <img
                          src={classImage}
                          alt={enrollment.className || classData.title || 'Class'}
                          className="course-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                          }}
                        />
                        <div className="course-teacher-wrap">
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: '#D92A63',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            color: '#fff', fontSize: '0.875rem'
                          }}>
                            {creatorInitial}
                          </div>
                          <div className="ml-2" style={{ color: '#fff', fontSize: '0.875rem', fontWeight: '500' }}>
                            {creatorName}
                          </div>
                        </div>
                        {category && (
                          <div style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            color: '#fff',
                            fontWeight: '500'
                          }}>
                            {category}
                          </div>
                        )}
                      </div>
                      <div className="course-info">
                        <h3 className="course-title">{enrollment.className || classData.title || 'Class'}</h3>
                        <div className="course-meta" style={{ marginBottom: '0.75rem' }}>
                          <div className="course-meta-item">
                            <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                            <div>{numberOfSessions} {numberOfSessions === 1 ? 'Session' : 'Sessions'}</div>
                          </div>
                          <div className="course-meta-item">
                            <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                            <div>{scheduleType === 'recurring' ? 'Recurring' : 'One-time'}</div>
                          </div>
                        </div>
                        {enrollmentDate && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '0.5rem'
                          }}>
                            Enrolled: {formatDate(enrollmentDate)}
                          </div>
                        )}
                        {totalSessions > 0 && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: attendanceRate >= 75 ? '#4CAF50' : attendanceRate >= 50 ? '#FF9800' : 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '0.5rem',
                            fontWeight: '500'
                          }}>
                            Attendance: {attendedSessions}/{totalSessions} sessions ({attendanceRate.toFixed(0)}%)
                          </div>
                        )}
                        {nextSession && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#D92A63',
                            fontWeight: '500',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span>📅</span>
                            <span>Next: {formatDate(nextSession.sessionDate)} {nextSession.sessionTime && `at ${formatTime(nextSession.sessionTime)}`}</span>
                          </div>
                        )}
                      </div>
                      <div className="course-bottom">
                        <div className="course-price-wrap">
                          <h4 className="course-price">₹{(enrollment.classPrice || classData.price || 0).toFixed(2)}</h4>
                        </div>
                        {enrollment.rating !== undefined && enrollment.rating !== null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#FFD700', fontSize: '0.875rem' }}>
                            ⭐ {enrollment.rating?.toFixed(1)} Rating
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-400 py-8">
                You haven't enrolled in any classes yet. <Link href="#browse-classes" style={{ color: '#D92A63', textDecoration: 'underline' }}>Browse classes</Link> to get started!
              </div>
            )}
              </div>
            </>
          )}

          {activeView === 'browse-classes' && (
            <>
              {/* Browse Classes with Search/Filter */}
              <div className="section" style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Browse Classes</h2>
            
            {/* Search and Filter */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search by title, creator, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ flex: '1', minWidth: '250px', maxWidth: '400px' }}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
                style={{ minWidth: '150px' }}
              >
                <option value="">All Categories</option>
                {categoryDetails.map(cat => (
                  <option key={cat.slug} value={cat.title}>{cat.title}</option>
                ))}
              </select>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="button-dark"
                  style={{ fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {loadingClasses ? (
              <div className="text-white text-center py-8">Loading classes...</div>
            ) : filteredClasses.length > 0 ? (
              <>
                <div style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Showing {filteredClasses.length} of {approvedClasses.length} classes
                </div>
                <div className="course-grid">
                  {filteredClasses.map((course) => (
                    <Link key={course.classId} href={`/product/${course.classId}`} className="course-card">
                      <div className="course-image-wrap">
                        <img 
                          src={(course.videoLink && course.videoLink.trim() !== '') ? course.videoLink : "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"} 
                          alt={course.title} 
                          className="course-image"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                          }}
                        />
                        <div className="course-teacher-wrap">
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: '#D92A63',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white'
                          }}>
                            {course.creatorName ? course.creatorName.charAt(0).toUpperCase() : 'Z'}
                          </div>
                          <div>{course.creatorName || 'Instructor'}</div>
                        </div>
                      </div>
                      <div className="course-info">
                        <h3 className="course-title">{course.title}</h3>
                        <div className="course-meta">
                          <div className="course-meta-item">
                            <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                            <div>{course.numberSessions || 1} Sessions</div>
                          </div>
                          <div className="course-meta-item">
                            <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                            <div>{course.scheduleType === 'recurring' ? 'Batch' : 'One-time'}</div>
                          </div>
                          <div className="course-meta-item">
                            <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg" alt="" className="course-meta-icon" />
                            <div>{course.category || 'General'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="course-bottom">
                        <div className="course-price-wrap">
                          <h4 className="course-price">₹{(course.price || 0).toFixed(2)}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-400 py-8 text-center" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem' }}>
                {searchQuery || selectedCategory ? (
                  <>
                    No classes found matching your filters.
                    <br />
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                      }}
                      className="button-dark"
                      style={{ marginTop: '1rem', fontSize: '0.875rem', padding: '0.75rem 1.5rem' }}
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  'No classes available at the moment.'
                )}
              </div>
            )}
          </div>
            </>
          )}

          {activeView === 'profile' && (
            <>
              {/* My Profile */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                minHeight: '80vh',
                padding: '2rem 1rem',
                marginTop: '2rem'
              }}>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '600px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px',
                  padding: '3rem 2.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <h2 style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    marginBottom: '2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #D92A63 0%, #FF6B35 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    My Profile
                  </h2>
                  
                  {profileMessage && (
                    <div style={{
                      padding: '1rem',
                      marginBottom: '2rem',
                      borderRadius: '12px',
                      background: profileMessage.includes('success') ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                      border: `2px solid ${profileMessage.includes('success') ? '#4CAF50' : '#F44336'}`,
                      color: profileMessage.includes('success') ? '#4CAF50' : '#F44336',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      {profileMessage}
                    </div>
                  )}

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setProfileLoading(true);
                    setProfileMessage('');

                    try {
                      if (!user) {
                        throw new Error('User not logged in');
                      }

                      // Wait for Firebase to be ready (with retry)
                      let retries = 0;
                      while ((!window.firebaseDb || !window.doc || !window.setDoc) && retries < 6) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        retries++;
                      }

                      if (!window.firebaseDb || !window.doc || !window.setDoc) {
                        throw new Error('Firebase not initialized. Please refresh the page.');
                      }

                      let finalImageUrl = profileImage;

                      // Handle image upload if file is selected
                      if (profileImageFile) {
                        // Convert file to base64 for storage (or upload to Firebase Storage if available)
                        const reader = new FileReader();
                        finalImageUrl = await new Promise((resolve, reject) => {
                          reader.onloadend = () => {
                            resolve(reader.result as string);
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(profileImageFile);
                        });
                      }

                      // Update/create user document in Firestore
                      const userRef = window.doc(window.firebaseDb, 'users', user.uid);
                      await window.setDoc(userRef, {
                        displayName: profileName,
                        interests: profileInterests,
                        photoURL: finalImageUrl,
                        email: user.email,
                        role: 'student',
                        updatedAt: new Date()
                      }, { merge: true });

                      // Update local state
                      setProfileImage(finalImageUrl);
                      setProfileImagePreview(finalImageUrl);
                      setProfileImageFile(null);

                      setProfileMessage('✅ Profile updated successfully!');
                      setTimeout(() => setProfileMessage(''), 3000);
                    } catch (error) {
                      console.error('Error updating profile:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
                      setProfileMessage(`❌ ${errorMessage}`);
                    } finally {
                      setProfileLoading(false);
                    }
                  }}>
                    {/* Profile Image Upload Section */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      marginBottom: '2.5rem' 
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        overflow: 'hidden',
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 4px 20px rgba(217, 42, 99, 0.3)'
                      }}>
                        {profileImagePreview ? (
                          <img
                            src={profileImagePreview}
                            alt="Profile"
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                            onError={(e) => { 
                              (e.target as HTMLImageElement).style.display = 'none';
                              setProfileImagePreview('');
                            }}
                          />
                        ) : (
                          <div style={{ 
                            fontSize: '3rem', 
                            fontWeight: '700', 
                            color: '#fff' 
                          }}>
                            {userInitial}
                          </div>
                        )}
                      </div>
                      
                      <label
                        htmlFor="profileImageUpload"
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '2px dashed rgba(255, 255, 255, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.3s',
                          textAlign: 'center',
                          minWidth: '200px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(217, 42, 99, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                      >
                        📷 {profileImageFile ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <input
                        type="file"
                        id="profileImageUpload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setProfileMessage('❌ Image size must be less than 5MB');
                              return;
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              setProfileMessage('❌ Please select a valid image file');
                              return;
                            }
                            setProfileImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                            setProfileMessage('');
                          }
                        }}
                      />
                      {profileImageFile && (
                        <p style={{ 
                          marginTop: '0.5rem', 
                          fontSize: '0.875rem', 
                          color: 'rgba(255, 255, 255, 0.7)' 
                        }}>
                          {profileImageFile.name}
                        </p>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                      <label htmlFor="name" className="form-label" style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        display: 'block'
                      }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="form-input"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem 1.25rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '1rem',
                          transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#D92A63';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                      <label htmlFor="interests" className="form-label" style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        display: 'block'
                      }}>
                        Interests & Skills
                      </label>
                      <input
                        type="text"
                        id="interests"
                        className="form-input"
                        value={profileInterests}
                        onChange={(e) => setProfileInterests(e.target.value)}
                        placeholder="e.g., Photography, Web Development, Design"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1.25rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '1rem',
                          transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#D92A63';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }}
                      />
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: 'rgba(255, 255, 255, 0.5)' 
                      }}>
                        Separate multiple interests with commas
                      </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                      <label htmlFor="email" className="form-label" style={{ 
                        fontSize: '0.95rem', 
                        fontWeight: '600',
                        marginBottom: '0.75rem',
                        display: 'block'
                      }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={user?.email || ''}
                        disabled
                        style={{
                          width: '100%',
                          padding: '0.875rem 1.25rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '1rem',
                          cursor: 'not-allowed'
                        }}
                      />
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.8rem', 
                        color: 'rgba(255, 255, 255, 0.5)' 
                      }}>
                        Email cannot be changed
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="button-dark"
                      disabled={profileLoading}
                      style={{ 
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginTop: '1rem',
                        opacity: profileLoading ? 0.6 : 1,
                        cursor: profileLoading ? 'not-allowed' : 'pointer',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #D92A63 0%, #FF6B35 100%)',
                        color: '#fff',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        if (!profileLoading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 42, 99, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {profileLoading ? '⏳ Updating Profile...' : ' Save Changes'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* Rating Modal - Always visible when open */}
          {showRatingModal && selectedClassForRating && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '1rem'
            }}
            onClick={() => {
              setShowRatingModal(false);
              setSelectedClassForRating(null);
              setRating(0);
              setFeedback('');
            }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  borderRadius: '16px',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '100%',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
                  Rate & Review: {selectedClassForRating.className || 'Class'}
                </h2>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Rating *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '2rem',
                          color: star <= rating ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (star > rating) {
                            e.currentTarget.style.color = 'rgba(255, 215, 0, 0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (star > rating) {
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
                          }
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="feedback" className="form-label">Feedback (Optional)</label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="form-input"
                    placeholder="Share your experience with this class..."
                    rows={4}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRatingModal(false);
                      setSelectedClassForRating(null);
                      setRating(0);
                      setFeedback('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRatingSubmit}
                    disabled={!rating}
                    className="button-dark"
                    style={{
                      opacity: rating ? 1 : 0.5,
                      cursor: rating ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

