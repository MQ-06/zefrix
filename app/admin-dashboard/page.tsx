'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import Link from 'next/link';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    logout: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    doc: any;
    updateDoc: any;
    getDoc: any;
  }
}

const creators = [
  { id: 1, name: 'Judy Nguyen', title: 'Professor', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b850_avatar-2.jpg' },
  { id: 2, name: 'Samuel Bishop', title: 'Associate professor', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84f_avatar-4.jpg' },
  { id: 3, name: 'Joan Wallace', title: 'Assistant professor', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b84e_avatar-11.jpg' },
  { id: 4, name: 'Billy Vasquez', title: 'Instructor', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b851_avatar-9.jpg' },
  { id: 5, name: 'Jacqueline Miller', title: 'Lecturer', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b839_avatar-7.jpg' },
  { id: 6, name: 'Louis Crawford', title: 'Academic professional', image: 'https://cdn.prod.website-files.com/658910431119417045c26cf5/658ba9b191a9e3f9f0544ea9_avatar-8.jpg' },
  { id: 7, name: 'Dennis Barrett', title: 'Clinical', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83a_avatar-3.jpg' },
  { id: 8, name: 'Lori Stevens', title: 'Lecturer', image: 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b83b_avatar-6.jpg' },
];

interface PendingClass {
  classId: string;
  title: string;
  subtitle?: string;
  category: string;
  subCategory: string;
  creatorName: string;
  creatorEmail: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  startISO: string;
  numberSessions: number;
  createdAt: any;
  [key: string]: any;
}

interface Creator {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  createdAt: any;
  totalClasses?: number;
}

interface Stats {
  totalEnrollments: number;
  totalCreators: number;
  activeClasses: number;
  totalStudents: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { showSuccess, showError, showInfo } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('admin-dashboard-top');
  const [pendingClasses, setPendingClasses] = useState<PendingClass[]>([]);
  const [approvedClasses, setApprovedClasses] = useState<PendingClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingApproved, setLoadingApproved] = useState(false);
  const [processingClass, setProcessingClass] = useState<string | null>(null);

  // Real stats and creators
  const [realCreators, setRealCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEnrollments: 0,
    totalCreators: 0,
    activeClasses: 0,
    totalStudents: 0,
    totalRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);

  // Search functionality
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');

  // Contact messages
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Enrollments
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Payouts
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

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
          import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
          import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          window.doc = doc;
          window.updateDoc = updateDoc;
          window.getDoc = getDoc;

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
              
              if (role !== 'admin') {
                if (role === 'creator') {
                  location.replace('/creator-dashboard');
                } else {
                  location.replace('/student-dashboard');
                }
                return;
              }
              
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

    const handleUserLoaded = (e: any) => {
      setUser(e.detail.user);
    };
    window.addEventListener('userLoaded', handleUserLoaded);

    return () => {
      window.removeEventListener('userLoaded', handleUserLoaded);
    };
  }, []);

  // Fetch pending classes from Firestore
  const fetchPendingClasses = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingClasses(true);
    try {
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('status', '==', 'pending'));
      const querySnapshot = await window.getDocs(q);

      const classes: PendingClass[] = [];
      querySnapshot.forEach((doc: any) => {
        classes.push({ classId: doc.id, ...doc.data() });
      });

      // Sort by creation date (newest first)
      classes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setPendingClasses(classes);
    } catch (error) {
      console.error('Error fetching pending classes:', error);
      showError('Failed to load pending classes. Please refresh the page.');
    } finally {
      setLoadingClasses(false);
    }
  };

  // Handle approve/reject action
  const handleClassAction = async (classId: string, action: 'approved' | 'rejected') => {
    if (!window.firebaseDb || !window.doc || !window.updateDoc) {
      showError('Firebase not initialized. Please wait...');
      return;
    }

    if (!user) {
      showError('You must be logged in to perform this action');
      return;
    }

    setProcessingClass(classId);

    try {
      // Call n8n webhook (non-blocking - update Firestore even if webhook fails)
      let webhookSuccess = false;
      let webhookErrorDetails: string = '';
      try {
        const webhookUrl = `https://n8n.srv1137454.hstgr.cloud/webhook-test/admin-action?class_id=${encodeURIComponent(classId)}&action=${action}`;

        const response = await fetch(webhookUrl, {
          method: 'GET',
          mode: 'cors', // Explicitly set CORS mode
        });

        if (response.ok) {
          webhookSuccess = true;
          const responseText = await response.text();
        } else {
          const errorText = await response.text();
          webhookErrorDetails = `HTTP ${response.status}: ${response.statusText}`;
          console.warn('⚠️ Webhook returned non-OK status:', response.status, response.statusText);
          console.warn('Response body:', errorText);
        }
      } catch (webhookError: any) {
        // Log detailed error information
        webhookErrorDetails = webhookError.message || 'Unknown error';
        console.error('❌ Webhook call failed (non-blocking):', webhookError);
        console.error('Error type:', webhookError.name);
        console.error('Error message:', webhookError.message);
        console.error('Error stack:', webhookError.stack);

        // Check if it's a CORS error
        if (webhookError.message?.includes('CORS') || webhookError.message?.includes('Failed to fetch')) {
          console.warn('🚫 CORS issue detected. This is a browser security restriction.');
          console.warn('💡 Solution: Configure CORS headers in n8n webhook or use a proxy.');
          webhookErrorDetails = 'CORS error - n8n webhook needs CORS headers configured';
        }
      }

      // Update Firestore
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const classDoc = await window.getDoc(classRef);
      const classData = classDoc.data();

      await window.updateDoc(classRef, {
        status: action === 'approved' ? 'approved' : 'rejected',
        updatedAt: new Date(),
        adminActionedAt: new Date(),
        adminBy: user.email || user.uid,
      });

      // Send to n8n webhook via Next.js API route (avoids CORS issues)
      try {
        // Send via Next.js API route (server-side, no CORS issues)
        fetch(`/api/webhook/admin-action?class_id=${encodeURIComponent(classId)}&action=${encodeURIComponent(action)}`, {
          method: 'GET',
        }).catch(() => { });
      } catch (webhookError) {
      }

      // Remove from pending list
      setPendingClasses(prev => prev.filter(cls => cls.classId !== classId));

      // Show success message
      showSuccess(`Class ${action === 'approved' ? 'approved' : 'rejected'} successfully!`);
    } catch (error: any) {
      console.error('Error processing class action:', error);
      showError(`Failed to ${action} class: ${error.message}`);
    } finally {
      setProcessingClass(null);
    }
  };

  // Fetch approved classes
  const fetchApprovedClasses = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingApproved(true);
    try {
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('status', '==', 'approved'));
      const querySnapshot = await window.getDocs(q);

      const classes: PendingClass[] = [];
      querySnapshot.forEach((doc: any) => {
        classes.push({ classId: doc.id, ...doc.data() });
      });

      // Sort by creation date (newest first)
      classes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setApprovedClasses(classes);
    } catch (error) {
      console.error('Error fetching approved classes:', error);
    } finally {
      setLoadingApproved(false);
    }
  };

  // Fetch real creators from Firestore
  const fetchRealCreators = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingCreators(true);
    try {
      const usersRef = window.collection(window.firebaseDb, 'users');
      const q = window.query(usersRef, window.where('role', '==', 'creator'));
      const querySnapshot = await window.getDocs(q);

      const creatorsData: Creator[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data();
        creatorsData.push({
          uid: doc.id,
          name: data.name || data.email?.split('@')[0] || 'Creator',
          email: data.email || '',
          photoURL: data.photoURL || '',
          role: data.role,
          createdAt: data.createdAt,
          totalClasses: 0 // Will be calculated
        });
      });

      // Calculate total classes for each creator
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const allClassesQuery = await window.getDocs(classesRef);

      const creatorClassCount: { [key: string]: number } = {};
      allClassesQuery.forEach((doc: any) => {
        const classData = doc.data();
        const creatorId = classData.creatorId;
        if (creatorId) {
          creatorClassCount[creatorId] = (creatorClassCount[creatorId] || 0) + 1;
        }
      });

      // Update creators with class count
      creatorsData.forEach(creator => {
        creator.totalClasses = creatorClassCount[creator.uid] || 0;
      });

      // Sort by creation date (newest first)
      creatorsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setRealCreators(creatorsData);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoadingCreators(false);
    }
  };

  // Calculate real statistics
  const calculateStats = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingStats(true);
    try {
      // Fetch all users
      const usersRef = window.collection(window.firebaseDb, 'users');
      const usersSnapshot = await window.getDocs(usersRef);

      let totalCreators = 0;
      let totalStudents = 0;

      usersSnapshot.forEach((doc: any) => {
        const userData = doc.data();
        if (userData.role === 'creator') {
          totalCreators++;
        } else if (userData.role === 'student') {
          totalStudents++;
        }
      });

      // Fetch all approved classes
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const approvedQuery = window.query(classesRef, window.where('status', '==', 'approved'));
      const approvedSnapshot = await window.getDocs(approvedQuery);

      let activeClasses = 0;
      let totalRevenue = 0;

      approvedSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        activeClasses++;
        // Calculate potential revenue (price * max seats if available)
        if (classData.price) {
          totalRevenue += classData.price * (classData.maxSeats || 1);
        }
      });

      // Fetch real enrollments from Firestore
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsSnapshot = await window.getDocs(enrollmentsRef);
      const totalEnrollments = enrollmentsSnapshot.size;

      setStats({
        totalEnrollments,
        totalCreators,
        activeClasses,
        totalStudents,
        totalRevenue
      });


    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch contact messages
  const fetchContactMessages = async () => {
    if (!window.firebaseDb || !window.collection || !window.getDocs) {
      return;
    }

    setLoadingMessages(true);
    try {
      const contactsRef = window.collection(window.firebaseDb, 'contacts');
      const querySnapshot = await window.getDocs(contactsRef);

      const messages: any[] = [];
      querySnapshot.forEach((doc: any) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      // Sort by creation date (newest first)
      messages.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setContactMessages(messages);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch enrollments with retry
  const fetchEnrollments = async () => {
    console.log('🔍 Starting enrollment fetch...');

    // Wait for Firebase with retry
    let retries = 0;
    while ((!window.firebaseDb || !window.collection || !window.getDocs) && retries < 10) {
      console.log(`⏳ Waiting for Firebase... (attempt ${retries + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.firebaseDb || !window.collection || !window.getDocs) {
      console.error('❌ Firebase not ready after retries');
      setLoadingEnrollments(false);
      return;
    }

    console.log('✅ Firebase ready, fetching enrollments...');
    setLoadingEnrollments(true);
    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      console.log('📦 Enrollments collection reference created');

      const querySnapshot = await window.getDocs(enrollmentsRef);
      console.log(`📊 Query complete. Found ${querySnapshot.size} documents`);

      const enrollmentsData: any[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = { id: doc.id, ...doc.data() };
        console.log('📄 Enrollment document:', data);
        enrollmentsData.push(data);
      });

      // Sort by enrollment date (newest first)
      enrollmentsData.sort((a, b) => {
        const aTime = a.enrolledAt?.toMillis?.() || a.enrolledAt?.getTime?.() || 0;
        const bTime = b.enrolledAt?.toMillis?.() || b.enrolledAt?.getTime?.() || 0;
        return bTime - aTime;
      });

      setEnrollments(enrollmentsData);
      console.log(`✅ Fetched ${enrollmentsData.length} enrollments:`, enrollmentsData);
    } catch (error) {
      console.error('❌ Error fetching enrollments:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Calculate payouts from enrollments
  const fetchPayouts = async () => {
    // Wait for Firebase with retry
    let retries = 0;
    while ((!window.firebaseDb || !window.collection || !window.getDocs || !window.query || !window.where) && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.firebaseDb || !window.collection || !window.getDocs) {
      console.error('Firebase not ready after retries');
      return;
    }

    setLoadingPayouts(true);
    try {
      // Fetch all enrollments
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsSnapshot = await window.getDocs(enrollmentsRef);

      // Fetch all creators
      const usersRef = window.collection(window.firebaseDb, 'users');
      const creatorsQuery = window.query(usersRef, window.where('role', '==', 'creator'));
      const creatorsSnapshot = await window.getDocs(creatorsQuery);

      // Fetch all classes to get creator IDs
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const classesSnapshot = await window.getDocs(classesRef);

      // Build class-to-creator mapping
      const classToCreator: { [key: string]: any } = {};
      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        classToCreator[doc.id] = {
          creatorId: classData.creatorId,
          creatorName: classData.creatorName
        };
      });

      // Calculate earnings per creator
      const creatorEarnings: { [key: string]: { name: string; email: string; totalEarnings: number; classCount: number; enrollmentCount: number } } = {};

      enrollmentsSnapshot.forEach((doc: any) => {
        const enrollment = doc.data();
        const classId = enrollment.classId;
        const classInfo = classToCreator[classId];

        if (classInfo && classInfo.creatorId) {
          const creatorId = classInfo.creatorId;
          if (!creatorEarnings[creatorId]) {
            creatorEarnings[creatorId] = {
              name: classInfo.creatorName || 'Unknown',
              email: '',
              totalEarnings: 0,
              classCount: 0,
              enrollmentCount: 0
            };
          }
          creatorEarnings[creatorId].totalEarnings += enrollment.classPrice || 0;
          creatorEarnings[creatorId].enrollmentCount += 1;
        }
      });

      // Get creator emails and class counts
      creatorsSnapshot.forEach((doc: any) => {
        const creatorData = doc.data();
        if (creatorEarnings[doc.id]) {
          creatorEarnings[doc.id].email = creatorData.email || '';
        }
      });

      // Count classes per creator
      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        if (creatorEarnings[classData.creatorId]) {
          creatorEarnings[classData.creatorId].classCount += 1;
        }
      });

      // Convert to array
      const payoutsArray = Object.keys(creatorEarnings).map(creatorId => ({
        creatorId,
        ...creatorEarnings[creatorId],
        status: 'pending' // Manual payout for MVP
      }));

      // Sort by total earnings (highest first)
      payoutsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);

      setPayouts(payoutsArray);
    } catch (error) {
      console.error('Error calculating payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Fetch pending classes when component mounts or when approve-classes section is active
  useEffect(() => {
    if (activeSection === 'approve-classes' && window.firebaseDb) {
      fetchPendingClasses();
      fetchApprovedClasses();
      calculateStats(); // Also calculate stats when on approve-classes section
    }
  }, [activeSection]);

  // Fetch creators when show-creators section is active
  useEffect(() => {
    if (activeSection === 'show-creators-new' && window.firebaseDb) {
      fetchRealCreators();
    }
  }, [activeSection]);

  // Fetch stats on initial load when Firebase is ready
  useEffect(() => {
    if (window.firebaseDb && activeSection === 'admin-dashboard-top') {
      calculateStats();
    }
  }, [activeSection]);

  // Fetch contact messages when section is active
  useEffect(() => {
    if (activeSection === 'contact-messages' && window.firebaseDb) {
      fetchContactMessages();
    }
  }, [activeSection]);

  // Fetch enrollments when section is active
  useEffect(() => {
    if (activeSection === 'enrollments') {
      console.log('✅ Enrollments section active - calling fetchEnrollments...');
      fetchEnrollments().catch(err => console.error('fetchEnrollments error:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Fetch payouts when section is active
  useEffect(() => {
    if (activeSection === 'payouts-new') {
      fetchPayouts();
    }
  }, [activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['admin-dashboard-top', 'show-creators-new', 'approve-classes', 'contact-messages', 'payouts-new', 'enrollments'];
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    if (confirm('Log out of Zefrix?')) {
      if (window.logout) {
        window.logout();
      }
    }
  };

  // Filter creators based on search query
  const filteredCreators = realCreators.filter(creator => {
    const query = creatorSearchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      creator.name.toLowerCase().includes(query) ||
      creator.email.toLowerCase().includes(query)
    );
  });

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const sectionId = targetId.replace('#', '');
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Manually trigger fetch for enrollments section
    if (sectionId === 'enrollments') {
      console.log('🔗 Enrollments link clicked - triggering fetch...');
      setTimeout(() => {
        fetchEnrollments().catch(err => console.error('Manual fetch error:', err));
      }, 500); // Small delay to let scroll complete
    }
  };

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
        }

        .sidebar-logo {
          margin-bottom: 3rem;
        }

        .sidebar-logo img {
          width: 150px;
          height: auto;
        }

        .sidebar-nav {
          flex: 1;
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
          display: inline-block;
        }

        .button-dark:hover {
          transform: scale(1.05);
        }

        .button-2 {
          background: transparent;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.3s;
          border: 2px solid #D92A63;
          cursor: pointer;
          display: inline-block;
        }

        .button-2:hover {
          background: rgba(217, 42, 99, 0.1);
        }

        /* Creator Grid */
        .grid-instructor {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .instructor-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          transition: transform 0.3s;
          text-decoration: none;
          color: inherit;
        }

        .instructor-item:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.1);
        }

        .instructor-image-wrap {
          width: 120px;
          height: 120px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
        }

        .instructor-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .heading-h6 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .text-block-10 {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        /* Statistics Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
        }

        .stat-card h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          color: #FFD700;
        }

        /* Pending Approval Cards */
        .pending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .pending-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
        }

        .pending-card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .pending-card-content {
          padding: 1.5rem;
        }

        .pending-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .pending-card-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          color: #000;
          font-size: 0.875rem;
        }

        .pending-card-actions {
          display: flex;
          gap: 1rem;
        }

        .pending-card-teacher {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pending-card-teacher img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        /* Payment List */
        .payment-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 2rem;
        }

        .payment-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 2rem;
          align-items: center;
        }

        .payment-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .payment-info img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
        }

        .payment-name {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .payment-category {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .payment-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
        }

        /* Search Box */
        .search-wrapper {
          margin-bottom: 2rem;
        }

        .search-box {
          display: flex;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
        }

        .search-query {
          flex: 1;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
        }

        .search-query::placeholder {
          color: rgba(255, 255, 255, 0.5);
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

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .grid-instructor {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .pending-grid {
            grid-template-columns: 1fr;
          }

          .payment-item {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png" alt="Zefrix" />
          </div>
          <nav className="sidebar-nav">
            <a href="#admin-dashboard-top" onClick={(e) => handleNavClick(e, '#admin-dashboard-top')} className={`sidebar-nav-item ${activeSection === 'admin-dashboard-top' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Dashboard</div>
            </a>
            <a href="#show-creators-new" onClick={(e) => handleNavClick(e, '#show-creators-new')} className={`sidebar-nav-item ${activeSection === 'show-creators-new' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Show Creators</div>
            </a>
            <a href="#approve-classes" onClick={(e) => handleNavClick(e, '#approve-classes')} className={`sidebar-nav-item ${activeSection === 'approve-classes' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Approve Classes</div>
            </a>
            <a href="#contact-messages" onClick={(e) => handleNavClick(e, '#contact-messages')} className={`sidebar-nav-item ${activeSection === 'contact-messages' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Contact Messages</div>
            </a>
            <a href="#payouts-new" onClick={(e) => handleNavClick(e, '#payouts-new')} className={`sidebar-nav-item ${activeSection === 'payouts-new' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Payouts</div>
            </a>
            <a href="#enrollments" onClick={(e) => handleNavClick(e, '#enrollments')} className={`sidebar-nav-item ${activeSection === 'enrollments' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Enrollments</div>
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

          {/* Dashboard Header */}
          <div id="admin-dashboard-top" className="dashboard-header">
            <div className="welcome-section">
              <h2>Welcome back, Admin!</h2>
              <p>Continue your learning journey</p>
            </div>
          </div>

          {/* Show Creators */}
          <div id="show-creators-new" className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline">
              <h2 className="section-title">
                All Creators ({realCreators.length})
                {creatorSearchQuery && ` - Showing ${filteredCreators.length} results`}
              </h2>
              <a href="#" className="button-dark">Add Creator</a>
            </div>
            <div className="search-wrapper">
              <div className="search-box">
                <input
                  type="text"
                  className="search-query"
                  placeholder="Search by name or email..."
                  value={creatorSearchQuery}
                  onChange={(e) => setCreatorSearchQuery(e.target.value)}
                />
                {creatorSearchQuery && (
                  <button
                    onClick={() => setCreatorSearchQuery('')}
                    className="button-2"
                    style={{ padding: '0.75rem 1.5rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loadingCreators ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading creators...
              </div>
            ) : realCreators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                No creators found. Creators will appear here once they sign up.
              </div>
            ) : filteredCreators.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No creators match your search</div>
                <div style={{ color: 'rgba(255,255,255,0.6)' }}>Try searching with a different name or email</div>
                <button
                  onClick={() => setCreatorSearchQuery('')}
                  className="button-dark"
                  style={{ marginTop: '1rem' }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid-instructor">
                {filteredCreators.map((creator) => (
                  <div key={creator.uid} className="instructor-item">
                    <div className="instructor-image-wrap">
                      {creator.photoURL ? (
                        <img src={creator.photoURL} alt={creator.name} className="instructor-image" />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #D92A63 0%, #FF6B35 100%)',
                          fontSize: '2.5rem',
                          fontWeight: 'bold',
                          color: '#fff'
                        }}>
                          {creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h2 className="heading-h6 no-margin">{creator.name}</h2>
                    <div className="text-block-10">{creator.email}</div>
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#FFD700',
                      fontWeight: '600'
                    }}>
                      {creator.totalClasses || 0} classes
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approve Classes */}
          <div id="approve-classes" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Statistics</h2>
            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading statistics...
              </div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <h2>Total Enrollments</h2>
                  <div className="stat-number">{stats.totalEnrollments}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                    Coming soon
                  </div>
                </div>
                <div className="stat-card">
                  <h2>Total Creators</h2>
                  <div className="stat-number">{stats.totalCreators}</div>
                </div>
                <div className="stat-card">
                  <h2>Active Classes</h2>
                  <div className="stat-number">{stats.activeClasses}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                    Approved classes
                  </div>
                </div>
                <div className="stat-card">
                  <h2>Total Students</h2>
                  <div className="stat-number">{stats.totalStudents}</div>
                </div>
                <div className="stat-card">
                  <h2>Potential Revenue</h2>
                  <div className="stat-number" style={{ fontSize: '2rem' }}>₹{stats.totalRevenue.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                    Based on class prices
                  </div>
                </div>
              </div>
            )}

            <h2 className="section-title" style={{ marginTop: '3rem' }}>Approved Classes</h2>

            {loadingApproved ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading approved classes...
              </div>
            ) : approvedClasses.length > 0 ? (
              <div className="pending-grid" style={{ marginBottom: '3rem' }}>
                {approvedClasses.map((classItem) => {
                  const startDate = classItem.startISO ? new Date(classItem.startISO).toLocaleDateString() : 'N/A';
                  const sessionInfo = classItem.scheduleType === 'one-time'
                    ? `One-time session on ${startDate}`
                    : `${classItem.numberSessions} sessions starting ${startDate}`;

                  return (
                    <div key={classItem.classId} className="pending-card">
                      <img
                        src={classItem.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"}
                        alt={classItem.title}
                        className="pending-card-image"
                      />
                      <div className="pending-card-content">
                        <div className="pending-card-title">{classItem.title}</div>
                        {classItem.subtitle && (
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            {classItem.subtitle}
                          </div>
                        )}
                        <div className="pending-card-meta">
                          <span>{classItem.category}</span>
                          <span>{classItem.subCategory}</span>
                          <span>₹{classItem.price}</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          {sessionInfo}
                        </div>
                        <div className="pending-card-teacher">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#D92A63',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>
                            {classItem.creatorName?.charAt(0) || 'C'}
                          </div>
                          <div>{classItem.creatorName || 'Creator'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff', marginBottom: '3rem' }}>
                No approved classes yet.
              </div>
            )}

            <h2 className="section-title" style={{ marginTop: '3rem' }}>Pending Approval</h2>

            {loadingClasses ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading pending classes...
              </div>
            ) : pendingClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                No pending classes to approve.
              </div>
            ) : (
              <div className="pending-grid">
                {pendingClasses.map((classItem) => {
                  const isProcessing = processingClass === classItem.classId;
                  const startDate = classItem.startISO ? new Date(classItem.startISO).toLocaleDateString() : 'N/A';
                  const sessionInfo = classItem.scheduleType === 'one-time'
                    ? `One-time session on ${startDate}`
                    : `${classItem.numberSessions} sessions starting ${startDate}`;

                  return (
                    <div key={classItem.classId} className="pending-card">
                      <img
                        src={classItem.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"}
                        alt={classItem.title}
                        className="pending-card-image"
                      />
                      <div className="pending-card-content">
                        <div className="pending-card-title">{classItem.title}</div>
                        {classItem.subtitle && (
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            {classItem.subtitle}
                          </div>
                        )}
                        <div className="pending-card-meta">
                          <span>{classItem.category}</span>
                          <span>{classItem.subCategory}</span>
                          <span>₹{classItem.price}</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          {sessionInfo}
                        </div>
                        <div className="pending-card-actions">
                          <button
                            onClick={() => handleClassAction(classItem.classId, 'approved')}
                            className="button-dark"
                            disabled={isProcessing}
                            style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                          >
                            {isProcessing ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleClassAction(classItem.classId, 'rejected')}
                            className="button-2"
                            disabled={isProcessing}
                            style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                          >
                            {isProcessing ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                        <div className="pending-card-teacher">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#D92A63',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>
                            {classItem.creatorName?.charAt(0) || 'C'}
                          </div>
                          <div>{classItem.creatorName || 'Creator'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Messages */}
          <div id="contact-messages" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Contact Messages ({contactMessages.length})</h2>

            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading messages...
              </div>
            ) : contactMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No contact messages yet</div>
                <div style={{ color: 'rgba(255,255,255,0.6)' }}>Messages from the contact form will appear here</div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Email</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Phone</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Subject</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Message</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactMessages.map((message, index) => (
                        <tr
                          key={message.id}
                          style={{
                            borderBottom: index < contactMessages.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '1rem', color: '#fff' }}>
                            <div style={{ fontWeight: '500' }}>{message.name}</div>
                          </td>
                          <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                            <a href={`mailto:${message.email}`} style={{ color: '#FFD700', textDecoration: 'none' }}>
                              {message.email}
                            </a>
                          </td>
                          <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                            {message.phone || '-'}
                          </td>
                          <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                            {message.subject}
                          </td>
                          <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', maxWidth: '300px' }}>
                            <div style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {message.message}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            {message.createdAt ? new Date(message.createdAt.toDate()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Payouts */}
          <div id="payouts-new" className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline">
              <h2 className="section-title">Creator Payouts (Manual)</h2>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                Total Pending: ₹{payouts.reduce((sum, p) => sum + p.totalEarnings, 0).toFixed(2)}
              </div>
            </div>
            {loadingPayouts ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Calculating payouts...
              </div>
            ) : payouts.length > 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Creator</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Classes</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Enrollments</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Total Earnings</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.creatorId} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>{payout.name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                              {payout.email}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{payout.classCount}</td>
                        <td style={{ padding: '1rem' }}>{payout.enrollmentCount}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFD700' }}>
                            ₹{payout.totalEarnings.toFixed(2)}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            background: payout.status === 'paid' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            color: payout.status === 'paid' ? '#4CAF50' : '#FF9800'
                          }}>
                            {payout.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            className="button-dark"
                            onClick={() => showInfo(`Manual payout for ${payout.name}\n\nAmount: ₹${payout.totalEarnings.toFixed(2)}\n\nPlease process payment via bank transfer and mark as paid in your records.`)}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Process Payout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
                No payouts to process. Enrollments will appear here once students purchase classes.
              </div>
            )}
          </div>

          {/* Enrollments */}
          <div id="enrollments" className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline">
              <h2 className="section-title">All Enrollments ({enrollments.length})</h2>
            </div>
            {loadingEnrollments ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
                Loading enrollments...
              </div>
            ) : enrollments.length > 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Student</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Class</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Price</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Payment ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#FFD700' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>{enrollment.studentName || 'N/A'}</div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                              {enrollment.studentEmail || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>{enrollment.className || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>₹{enrollment.classPrice?.toFixed(2) || '0.00'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                          {enrollment.paymentId || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            background: enrollment.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            color: enrollment.status === 'active' ? '#4CAF50' : '#FF9800'
                          }}>
                            {enrollment.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                          {enrollment.enrolledAt ?
                            new Date(enrollment.enrolledAt.toMillis ? enrollment.enrolledAt.toMillis() : enrollment.enrolledAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
                No enrollments found.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

