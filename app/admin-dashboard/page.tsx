'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import { BookOpen, CheckCircle, Clock, Users, Calendar, Eye, Mail, X, User, CreditCard, FileText, TrendingUp } from 'lucide-react';

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
  approvedClasses?: number;
  pendingClasses?: number;
  totalEnrollments?: number;
  totalEarnings?: number;
}

interface Stats {
  totalEnrollments: number;
  totalCreators: number;
  activeClasses: number;
  totalStudents: number;
  totalRevenue: number;
  pendingClasses: number;
}

type AdminPage = 'dashboard' | 'creators' | 'approve-classes' | 'contact-messages' | 'payouts' | 'enrollments';

export default function AdminDashboard() {
  const { showSuccess, showError, showInfo } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
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
    totalRevenue: 0,
    pendingClasses: 0
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

  // Modal state
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [classBankDetails, setClassBankDetails] = useState<any>(null);
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);

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
              // Small delay to ensure notification is visible before redirect
              setTimeout(() => {
                location.replace('/signup-login');
              }, 300);
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

  // Fetch pending classes
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

  // Handle view class details
  const handleViewClassDetails = async (classId: string) => {
    if (!window.firebaseDb || !window.collection || !window.doc || !window.getDoc || !window.query || !window.where || !window.getDocs) {
      showError('Firebase not initialized');
      return;
    }

    setLoadingClassDetails(true);
    try {
      // Get class data
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const classSnap = await window.getDoc(classRef);
      if (classSnap.exists()) {
        setSelectedClassDetails({ classId, ...classSnap.data() });
      }

      // Get sessions
      const sessionsRef = window.collection(window.firebaseDb, 'sessions');
      const sessionsQuery = window.query(sessionsRef, window.where('classId', '==', classId));
      const sessionsSnapshot = await window.getDocs(sessionsQuery);
      const sessions: any[] = [];
      sessionsSnapshot.forEach((doc: any) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      sessions.sort((a, b) => {
        const aDate = a.sessionDate?.toDate ? a.sessionDate.toDate() : new Date(a.sessionDate);
        const bDate = b.sessionDate?.toDate ? b.sessionDate.toDate() : new Date(b.sessionDate);
        return aDate.getTime() - bDate.getTime();
      });
      setClassSessions(sessions);

      // Get bank details from class creator
      if (classSnap.exists()) {
        const classData = classSnap.data();
        const creatorRef = window.doc(window.firebaseDb, 'users', classData.creatorId);
        const creatorSnap = await window.getDoc(creatorRef);
        if (creatorSnap.exists()) {
          const creatorData = creatorSnap.data();
          setClassBankDetails({
            accountHolderName: creatorData.bankAccountHolderName || creatorData.accountHolderName,
            accountNumber: creatorData.bankAccountNumber || creatorData.accountNumber,
            ifscCode: creatorData.bankIFSC || creatorData.ifscCode,
            bankName: creatorData.bankName
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching class details:', error);
      showError('Failed to load class details');
    } finally {
      setLoadingClassDetails(false);
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
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      await window.updateDoc(classRef, {
        status: action === 'approved' ? 'approved' : 'rejected',
        updatedAt: new Date(),
        adminActionedAt: new Date(),
        adminBy: user.email || user.uid,
      });

      // Send to webhook via Next.js API route
      try {
        fetch(`/api/webhook/admin-action?class_id=${encodeURIComponent(classId)}&action=${encodeURIComponent(action)}`, {
          method: 'GET',
        }).catch(() => { });
      } catch (webhookError) {
      }

      setPendingClasses(prev => prev.filter(cls => cls.classId !== classId));
      showSuccess(`Class ${action === 'approved' ? 'approved' : 'rejected'} successfully!`);
      
      // Refresh stats
      calculateStats();
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

  // Fetch real creators from Firestore with enhanced stats
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
          totalClasses: 0,
          approvedClasses: 0,
          pendingClasses: 0,
          totalEnrollments: 0,
          totalEarnings: 0
        });
      });

      // Fetch all classes
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const allClassesQuery = await window.getDocs(classesRef);

      const creatorStats: { [key: string]: { total: number; approved: number; pending: number } } = {};
      allClassesQuery.forEach((doc: any) => {
        const classData = doc.data();
        const creatorId = classData.creatorId;
        if (creatorId) {
          if (!creatorStats[creatorId]) {
            creatorStats[creatorId] = { total: 0, approved: 0, pending: 0 };
          }
          creatorStats[creatorId].total++;
          if (classData.status === 'approved') {
            creatorStats[creatorId].approved++;
          } else if (classData.status === 'pending') {
            creatorStats[creatorId].pending++;
          }
        }
      });

      // Fetch enrollments to calculate earnings and enrollment counts
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsSnapshot = await window.getDocs(enrollmentsRef);

      // Build class to creator mapping
      const classToCreator: { [key: string]: string } = {};
      allClassesQuery.forEach((doc: any) => {
        const classData = doc.data();
        if (classData.creatorId) {
          classToCreator[doc.id] = classData.creatorId;
        }
      });

      const creatorEarnings: { [key: string]: { enrollments: number; earnings: number } } = {};
      enrollmentsSnapshot.forEach((doc: any) => {
        const enrollment = doc.data();
        const classId = enrollment.classId;
        const creatorId = classToCreator[classId];
        if (creatorId) {
          if (!creatorEarnings[creatorId]) {
            creatorEarnings[creatorId] = { enrollments: 0, earnings: 0 };
          }
          creatorEarnings[creatorId].enrollments++;
          creatorEarnings[creatorId].earnings += enrollment.classPrice || 0;
        }
      });

      // Update creators with stats
      creatorsData.forEach(creator => {
        const stats = creatorStats[creator.uid] || { total: 0, approved: 0, pending: 0 };
        const earnings = creatorEarnings[creator.uid] || { enrollments: 0, earnings: 0 };
        
        creator.totalClasses = stats.total;
        creator.approvedClasses = stats.approved;
        creator.pendingClasses = stats.pending;
        creator.totalEnrollments = earnings.enrollments;
        creator.totalEarnings = earnings.earnings;
      });

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

      const classesRef = window.collection(window.firebaseDb, 'classes');
      const approvedQuery = window.query(classesRef, window.where('status', '==', 'approved'));
      const approvedSnapshot = await window.getDocs(approvedQuery);

      const pendingQuery = window.query(classesRef, window.where('status', '==', 'pending'));
      const pendingSnapshot = await window.getDocs(pendingQuery);

      let activeClasses = 0;
      let totalRevenue = 0;

      approvedSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        activeClasses++;
        if (classData.price) {
          totalRevenue += classData.price * (classData.maxSeats || 1);
        }
      });

      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsSnapshot = await window.getDocs(enrollmentsRef);
      const totalEnrollments = enrollmentsSnapshot.size;

      setStats({
        totalEnrollments,
        totalCreators,
        activeClasses,
        totalStudents,
        totalRevenue,
        pendingClasses: pendingSnapshot.size
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

  // Fetch enrollments
  const fetchEnrollments = async () => {
    let retries = 0;
    while ((!window.firebaseDb || !window.collection || !window.getDocs) && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.firebaseDb || !window.collection || !window.getDocs) {
      setLoadingEnrollments(false);
      return;
    }

    setLoadingEnrollments(true);
    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const querySnapshot = await window.getDocs(enrollmentsRef);

      const enrollmentsData: any[] = [];
      querySnapshot.forEach((doc: any) => {
        enrollmentsData.push({ id: doc.id, ...doc.data() });
      });

      enrollmentsData.sort((a, b) => {
        const aTime = a.enrolledAt?.toMillis?.() || a.enrolledAt?.getTime?.() || 0;
        const bTime = b.enrolledAt?.toMillis?.() || b.enrolledAt?.getTime?.() || 0;
        return bTime - aTime;
      });

      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Calculate payouts
  const fetchPayouts = async () => {
    let retries = 0;
    while ((!window.firebaseDb || !window.collection || !window.getDocs || !window.query || !window.where) && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.firebaseDb || !window.collection || !window.getDocs) {
      return;
    }

    setLoadingPayouts(true);
    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsSnapshot = await window.getDocs(enrollmentsRef);

      const usersRef = window.collection(window.firebaseDb, 'users');
      const creatorsQuery = window.query(usersRef, window.where('role', '==', 'creator'));
      const creatorsSnapshot = await window.getDocs(creatorsQuery);

      const classesRef = window.collection(window.firebaseDb, 'classes');
      const classesSnapshot = await window.getDocs(classesRef);

      const classToCreator: { [key: string]: any } = {};
      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        classToCreator[doc.id] = {
          creatorId: classData.creatorId,
          creatorName: classData.creatorName
        };
      });

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

      creatorsSnapshot.forEach((doc: any) => {
        const creatorData = doc.data();
        if (creatorEarnings[doc.id]) {
          creatorEarnings[doc.id].email = creatorData.email || '';
        }
      });

      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        if (creatorEarnings[classData.creatorId]) {
          creatorEarnings[classData.creatorId].classCount += 1;
        }
      });

      const payoutsArray = Object.keys(creatorEarnings).map(creatorId => ({
        creatorId,
        ...creatorEarnings[creatorId],
        status: 'pending'
      }));

      payoutsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);
      setPayouts(payoutsArray);
    } catch (error) {
      console.error('Error calculating payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Load data based on active page
  useEffect(() => {
    if (!window.firebaseDb) return;

    if (activePage === 'dashboard') {
      calculateStats();
    } else if (activePage === 'creators') {
      fetchRealCreators();
    } else if (activePage === 'approve-classes') {
      fetchPendingClasses();
      fetchApprovedClasses();
      calculateStats();
    } else if (activePage === 'contact-messages') {
      fetchContactMessages();
    } else if (activePage === 'enrollments') {
      fetchEnrollments();
    } else if (activePage === 'payouts') {
      fetchPayouts();
    }
  }, [activePage]);

  const handleLogout = () => {
    if (confirm('Log out of Zefrix?')) {
      // Show notification first
      showSuccess('Logging out...', 2000);
      // Wait for notification to appear, then logout
      setTimeout(() => {
        if (window.logout) {
          window.logout();
        }
      }, 800);
    }
  };

  const filteredCreators = realCreators.filter(creator => {
    const query = creatorSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      creator.name.toLowerCase().includes(query) ||
      creator.email.toLowerCase().includes(query)
    );
  });

  const handleNavClick = (page: AdminPage) => {
    setIsMenuOpen(false);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render Dashboard Page
  const renderDashboard = () => {
    const maxValue = Math.max(
      stats.totalEnrollments,
      stats.totalCreators,
      stats.activeClasses,
      stats.totalStudents,
      stats.pendingClasses,
      stats.totalRevenue / 1000
    ) || 1;

    const enrollmentPercent = (stats.totalEnrollments / maxValue) * 100;
    const creatorsPercent = (stats.totalCreators / maxValue) * 100;
    const classesPercent = (stats.activeClasses / maxValue) * 100;
    const studentsPercent = (stats.totalStudents / maxValue) * 100;
    const pendingPercent = (stats.pendingClasses / maxValue) * 100;
    const revenuePercent = Math.min((stats.totalRevenue / 1000) / maxValue * 100, 100);

    return (
      <div>
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>Welcome back, Admin!</h2>
            <p>Platform Analytics & Overview</p>
          </div>
        </div>

        {loadingStats ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
            Loading statistics...
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card-with-chart">
                <div className="stat-card-header">
                  <h2>Total Enrollments</h2>
                  <div className="stat-number">{stats.totalEnrollments}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${enrollmentPercent}%`, background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">All time enrollments</div>
              </div>

              <div className="stat-card-with-chart">
                <div className="stat-card-header">
                  <h2>Total Creators</h2>
                  <div className="stat-number">{stats.totalCreators}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${creatorsPercent}%`, background: 'linear-gradient(90deg, #2196F3 0%, #1976D2 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">Active creators</div>
              </div>

              <div className="stat-card-with-chart">
                <div className="stat-card-header">
                  <h2>Active Classes</h2>
                  <div className="stat-number">{stats.activeClasses}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${classesPercent}%`, background: 'linear-gradient(90deg, #9C27B0 0%, #7B1FA2 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">Approved classes</div>
              </div>

              <div className="stat-card-with-chart">
                <div className="stat-card-header">
                  <h2>Total Students</h2>
                  <div className="stat-number">{stats.totalStudents}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${studentsPercent}%`, background: 'linear-gradient(90deg, #FF9800 0%, #F57C00 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">Registered students</div>
              </div>

              <div className="stat-card-with-chart">
                <div className="stat-card-header">
                  <h2>Pending Approval</h2>
                  <div className="stat-number" style={{ color: '#FF9800' }}>{stats.pendingClasses}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${pendingPercent}%`, background: 'linear-gradient(90deg, #FF9800 0%, #F57C00 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">Classes awaiting review</div>
              </div>

              <div className="stat-card-with-chart revenue-card">
                <div className="stat-card-header">
                  <h2>Total Revenue</h2>
                  <div className="stat-number revenue-number">₹{stats.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="stat-chart-container">
                  <div className="stat-bar-chart">
                    <div 
                      className="stat-bar-fill" 
                      style={{ width: `${revenuePercent}%`, background: 'linear-gradient(90deg, #FFD700 0%, #FFC107 100%)' }}
                    ></div>
                  </div>
                </div>
                <div className="stat-footer">Potential revenue</div>
              </div>
            </div>

            {/* Visual Charts Section */}
            <div className="charts-section">
              <div className="chart-card">
                <h3 className="chart-title">Platform Overview</h3>
                <div className="pie-chart-container">
                  <div className="pie-chart">
                    <div className="pie-segment" style={{
                      background: `conic-gradient(
                        #4CAF50 0deg ${(stats.totalEnrollments / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg,
                        #2196F3 ${(stats.totalEnrollments / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg ${((stats.totalEnrollments + stats.totalCreators) / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg,
                        #9C27B0 ${((stats.totalEnrollments + stats.totalCreators) / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg ${((stats.totalEnrollments + stats.totalCreators + stats.activeClasses) / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg,
                        #FF9800 ${((stats.totalEnrollments + stats.totalCreators + stats.activeClasses) / (stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents) * 360)}deg 360deg
                      )`
                    }}></div>
                    <div className="pie-center">
                      <div className="pie-center-text">Total</div>
                      <div className="pie-center-number">{stats.totalEnrollments + stats.totalCreators + stats.activeClasses + stats.totalStudents}</div>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: '#4CAF50' }}></div>
                      <span>Enrollments ({stats.totalEnrollments})</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: '#2196F3' }}></div>
                      <span>Creators ({stats.totalCreators})</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: '#9C27B0' }}></div>
                      <span>Classes ({stats.activeClasses})</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: '#FF9800' }}></div>
                      <span>Students ({stats.totalStudents})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Class Status Distribution</h3>
                <div className="bar-chart-container">
                  <div className="bar-chart-item">
                    <div className="bar-label">Approved</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar-fill approved-bar" 
                        style={{ width: `${stats.activeClasses > 0 ? (stats.activeClasses / (stats.activeClasses + stats.pendingClasses) * 100) : 0}%` }}
                      >
                        <span className="bar-value">{stats.activeClasses}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bar-chart-item">
                    <div className="bar-label">Pending</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar-fill pending-bar" 
                        style={{ width: `${stats.pendingClasses > 0 ? (stats.pendingClasses / (stats.activeClasses + stats.pendingClasses) * 100) : 0}%` }}
                      >
                        <span className="bar-value">{stats.pendingClasses}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleNavClick('approve-classes')} className="button-dark">
            Review Pending Classes ({stats.pendingClasses})
          </button>
          <button onClick={() => handleNavClick('enrollments')} className="button-2">
            View All Enrollments
          </button>
          <button onClick={() => handleNavClick('payouts')} className="button-2">
            Manage Payouts
          </button>
        </div>
      </div>
    );
  };

  // Render Creators Page
  const renderCreators = () => (
    <div>
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>All Creators</h2>
          <p>Manage creator accounts and profiles</p>
        </div>
        <button className="button-dark">Add Creator</button>
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
          <button
            onClick={() => setCreatorSearchQuery('')}
            className="button-dark"
            style={{ marginTop: '1rem' }}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="creator-table-wrapper">
          <table className="creator-table">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Classes</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Earnings</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCreators.map((creator) => {
                const joinDate = creator.createdAt?.toDate ? creator.createdAt.toDate() : (creator.createdAt ? new Date(creator.createdAt) : null);
                const formattedDate = joinDate ? joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                
                return (
                  <tr key={creator.uid} className="creator-table-row">
                    <td>
                      <div className="creator-info-cell">
                        <div className="creator-avatar-small">
                          {creator.photoURL ? (
                            <img src={creator.photoURL} alt={creator.name} />
                          ) : (
                            <div className="creator-initial-small">
                              {creator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="creator-details">
                          <div className="creator-name-row">{creator.name}</div>
                          <div className="creator-email-row">{creator.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="creator-stat-cell">
                        <div className="stat-item-row">
                          <BookOpen size={16} className="stat-icon-row" />
                          <span className="stat-number">{creator.totalClasses || 0}</span>
                        </div>
                        <div className="stat-breakdown">
                          <span className="stat-approved">{creator.approvedClasses || 0} approved</span>
                          {(creator.pendingClasses || 0) > 0 && (
                            <span className="stat-pending">, {creator.pendingClasses} pending</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="creator-status-cell">
                        <div className="status-badge approved">
                          <CheckCircle size={14} />
                          <span>{creator.approvedClasses || 0}</span>
                        </div>
                        {(creator.pendingClasses || 0) > 0 && (
                          <div className="status-badge pending">
                            <Clock size={14} />
                            <span>{creator.pendingClasses}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="creator-enrollment-cell">
                        <Users size={16} className="cell-icon" />
                        <span>{creator.totalEnrollments || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="creator-earnings-cell">
                        <span className="earnings-amount">₹{(creator.totalEarnings || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="creator-date-cell">
                        <Calendar size={16} className="cell-icon" />
                        <span>{formattedDate}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="creator-view-btn"
                        onClick={() => {
                          setSelectedCreator(creator);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Approve Classes Page
  const renderApproveClasses = () => (
    <div>
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>Approve Classes</h2>
          <p>Review and approve pending class submissions</p>
        </div>
      </div>

      <h2 className="section-title">Pending Approval ({pendingClasses.length})</h2>
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
              <div key={classItem.classId} className="class-card-modern">
                <div className="class-card-image-wrapper">
                  <img
                    src={(classItem.videoLink && classItem.videoLink.trim() !== '') ? classItem.videoLink : "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"}
                    alt={classItem.title}
                    className="class-card-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                    }}
                  />
                  <div className="class-card-status-badge pending-badge">
                    <Clock size={14} />
                    <span>Pending</span>
                  </div>
                </div>
                <div className="class-card-body">
                  <div className="class-card-header-section">
                    <h3 className="class-card-title">{classItem.title}</h3>
                    {classItem.subtitle && (
                      <p className="class-card-subtitle">{classItem.subtitle}</p>
                    )}
                  </div>

                  <div className="class-card-info-row">
                    <div className="class-info-item">
                      <BookOpen size={16} className="class-info-icon" />
                      <span className="class-info-text">{classItem.category}</span>
                    </div>
                    <div className="class-info-item">
                      <span className="class-info-text">{classItem.subCategory}</span>
                    </div>
                  </div>

                  <div className="class-card-details">
                    <div className="class-detail-item">
                      <Calendar size={16} className="class-detail-icon" />
                      <span className="class-detail-text">{sessionInfo}</span>
                    </div>
                    <div className="class-detail-item">
                      <span className="class-price">₹{classItem.price}</span>
                    </div>
                  </div>

                  <div className="class-card-creator">
                    <div className="creator-avatar-mini">
                      {classItem.creatorName?.charAt(0) || 'C'}
                    </div>
                    <div className="creator-info-mini">
                      <div className="creator-name-mini">{classItem.creatorName || 'Creator'}</div>
                      <div className="creator-email-mini">{classItem.creatorEmail || ''}</div>
                    </div>
                  </div>

                  <div className="class-card-actions">
                    <button
                      onClick={() => handleClassAction(classItem.classId, 'approved')}
                      className="class-action-btn approve-btn"
                      disabled={isProcessing}
                    >
                      <CheckCircle size={16} />
                      <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                    </button>
                    <button
                      onClick={() => handleClassAction(classItem.classId, 'rejected')}
                      className="class-action-btn reject-btn"
                      disabled={isProcessing}
                    >
                      <X size={16} />
                      <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: '3rem' }}>Approved Classes ({approvedClasses.length})</h2>
      {loadingApproved ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          Loading approved classes...
        </div>
      ) : approvedClasses.length > 0 ? (
        <div className="pending-grid">
          {approvedClasses.map((classItem) => {
            const startDate = classItem.startISO ? new Date(classItem.startISO).toLocaleDateString() : 'N/A';
            const sessionInfo = classItem.scheduleType === 'one-time'
              ? `One-time session on ${startDate}`
              : `${classItem.numberSessions} sessions starting ${startDate}`;

            return (
              <div key={classItem.classId} className="class-card-modern approved">
                <div className="class-card-image-wrapper">
                  <img
                    src={(classItem.videoLink && classItem.videoLink.trim() !== '') ? classItem.videoLink : "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"}
                    alt={classItem.title}
                    className="class-card-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                    }}
                  />
                  <div className="class-card-status-badge approved-badge">
                    <CheckCircle size={14} />
                    <span>Approved</span>
                  </div>
                </div>
                <div className="class-card-body">
                  <div className="class-card-header-section">
                    <h3 className="class-card-title">{classItem.title}</h3>
                    {classItem.subtitle && (
                      <p className="class-card-subtitle">{classItem.subtitle}</p>
                    )}
                  </div>

                  <div className="class-card-info-row">
                    <div className="class-info-item">
                      <BookOpen size={16} className="class-info-icon" />
                      <span className="class-info-text">{classItem.category}</span>
                    </div>
                    <div className="class-info-item">
                      <span className="class-info-text">{classItem.subCategory}</span>
                    </div>
                  </div>

                  <div className="class-card-details">
                    <div className="class-detail-item">
                      <Calendar size={16} className="class-detail-icon" />
                      <span className="class-detail-text">{sessionInfo}</span>
                    </div>
                    <div className="class-detail-item">
                      <span className="class-price">₹{classItem.price}</span>
                    </div>
                  </div>

                  <div className="class-card-creator">
                    <div className="creator-avatar-mini">
                      {classItem.creatorName?.charAt(0) || 'C'}
                    </div>
                    <div className="creator-info-mini">
                      <div className="creator-name-mini">{classItem.creatorName || 'Creator'}</div>
                      <div className="creator-email-mini">{classItem.creatorEmail || ''}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewClassDetails(classItem.classId)}
                    className="class-action-btn"
                    style={{ marginTop: '1rem', width: '100%', background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          No approved classes yet.
        </div>
      )}

      {/* Class Details Modal */}
      {selectedClassDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            background: '#1A1A2E',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.5rem' }}>{selectedClassDetails.title}</h2>
              <button
                onClick={() => {
                  setSelectedClassDetails(null);
                  setClassSessions([]);
                  setClassBankDetails(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {loadingClassDetails ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>Loading...</div>
            ) : (
              <>
                {/* Sessions */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.25rem' }}>Sessions ({classSessions.length})</h3>
                  {classSessions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {classSessions.map((session, idx) => (
                        <div key={idx} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <div style={{ color: '#fff', marginBottom: '0.5rem', fontWeight: '600' }}>
                            Session {idx + 1}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            Date: {session.sessionDate?.toDate ? new Date(session.sessionDate.toDate()).toLocaleString() : 'N/A'}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            Time: {session.sessionTime || session.startTime || 'N/A'}
                          </div>
                          {session.meetingLink && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                                color: '#D92A63',
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                              }}>
                                Meeting Link →
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                      No sessions configured yet
                    </div>
                  )}
                </div>

                {/* Bank Details */}
                <div>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.25rem' }}>Bank Details</h3>
                  {classBankDetails ? (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>Account Holder:</strong> {classBankDetails.accountHolderName || 'N/A'}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>Account Number:</strong> {classBankDetails.accountNumber || 'N/A'}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>IFSC:</strong> {classBankDetails.ifscCode || 'N/A'}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#fff' }}>Bank Name:</strong> {classBankDetails.bankName || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                      Bank details not provided yet
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render Contact Messages Page
  const renderContactMessages = () => (
    <div>
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>Contact Messages</h2>
          <p>View and manage customer inquiries</p>
        </div>
      </div>

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
  );

  // Render Payouts Page
  const renderPayouts = () => (
    <div>
      <div className="dashboard-header">
        <div className="welcome-section">
          <h2>Creator Payouts</h2>
          <p>Manage manual payouts to creators</p>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFD700' }}>
            ₹{payouts.reduce((sum, p) => sum + p.totalEarnings, 0).toFixed(2)}
          </div>
          <div>Total Pending</div>
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
  );

  // Render Enrollments Page
  const renderEnrollments = () => {
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.classPrice || 0), 0);
    
    return (
      <div>
        <div className="dashboard-header">
          <div className="welcome-section">
            <h2>All Enrollments</h2>
            <p>Track student enrollments and payments</p>
          </div>
          {enrollments.length > 0 && (
            <div className="enrollments-summary">
              <div className="summary-item">
                <TrendingUp size={20} className="summary-icon" />
                <div>
                  <div className="summary-value">{enrollments.length}</div>
                  <div className="summary-label">Total Enrollments</div>
                </div>
              </div>
              <div className="summary-item">
                <CreditCard size={20} className="summary-icon earnings-icon" />
                <div>
                  <div className="summary-value earnings">₹{totalRevenue.toFixed(2)}</div>
                  <div className="summary-label">Total Revenue</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loadingEnrollments ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
            Loading enrollments...
          </div>
        ) : enrollments.length > 0 ? (
          <div className="enrollments-table-wrapper">
            <table className="enrollments-table">
              <thead>
                <tr>
                  <th>
                    <User size={16} className="table-header-icon" />
                    Student
                  </th>
                  <th>
                    <BookOpen size={16} className="table-header-icon" />
                    Class
                  </th>
                  <th>
                    <CreditCard size={16} className="table-header-icon" />
                    Price
                  </th>
                  <th>
                    <FileText size={16} className="table-header-icon" />
                    Payment ID
                  </th>
                  <th>Status</th>
                  <th>
                    <Calendar size={16} className="table-header-icon" />
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const enrollDate = enrollment.enrolledAt 
                    ? new Date(enrollment.enrolledAt.toMillis ? enrollment.enrolledAt.toMillis() : enrollment.enrolledAt)
                    : null;
                  const formattedDate = enrollDate 
                    ? enrollDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';
                  
                  return (
                    <tr key={enrollment.id} className="enrollment-row">
                      <td>
                        <div className="enrollment-student-cell">
                          <div className="student-avatar-small">
                            {(enrollment.studentName || 'N')[0].toUpperCase()}
                          </div>
                          <div className="student-info">
                            <div className="student-name">{enrollment.studentName || 'N/A'}</div>
                            <div className="student-email">{enrollment.studentEmail || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="enrollment-class-cell">{enrollment.className || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="enrollment-price-cell">₹{enrollment.classPrice?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td>
                        <div className="enrollment-payment-cell">
                          {enrollment.paymentId ? (
                            <span className="payment-id">{enrollment.paymentId.substring(0, 12)}...</span>
                          ) : (
                            <span className="payment-id-na">N/A</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`enrollment-status-badge ${enrollment.status === 'active' ? 'active' : 'pending'}`}>
                          {enrollment.status === 'active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          <span>{enrollment.status || 'pending'}</span>
                        </span>
                      </td>
                      <td>
                        <div className="enrollment-date-cell">{formattedDate}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <h3>No enrollments found</h3>
            <p>Enrollments will appear here once students purchase classes.</p>
          </div>
        )}
      </div>
    );
  };

  // Render current page
  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return renderDashboard();
      case 'creators':
        return renderCreators();
      case 'approve-classes':
        return renderApproveClasses();
      case 'contact-messages':
        return renderContactMessages();
      case 'payouts':
        return renderPayouts();
      case 'enrollments':
        return renderEnrollments();
      default:
        return renderDashboard();
    }
  };

  // Render Creator Details Modal
  const renderCreatorModal = () => {
    if (!selectedCreator || !isModalOpen) return null;

    const joinDate = selectedCreator.createdAt?.toDate ? selectedCreator.createdAt.toDate() : (selectedCreator.createdAt ? new Date(selectedCreator.createdAt) : null);
    const formattedDate = joinDate ? joinDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';

    return (
      <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title-section">
              <div className="modal-avatar-large">
                {selectedCreator.photoURL ? (
                  <img src={selectedCreator.photoURL} alt={selectedCreator.name} />
                ) : (
                  <div className="modal-initial-large">
                    {selectedCreator.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="modal-title">{selectedCreator.name}</h2>
                <div className="modal-subtitle">{selectedCreator.email}</div>
              </div>
            </div>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <h3 className="modal-section-title">Account Information</h3>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-info-label">Creator ID</span>
                  <span className="modal-info-value">{selectedCreator.uid}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Role</span>
                  <span className="modal-info-value">{selectedCreator.role}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-info-label">Joined Date</span>
                  <span className="modal-info-value">{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Class Statistics</h3>
              <div className="modal-stats-grid">
                <div className="modal-stat-card">
                  <BookOpen size={24} className="modal-stat-icon" />
                  <div className="modal-stat-content">
                    <div className="modal-stat-number">{selectedCreator.totalClasses || 0}</div>
                    <div className="modal-stat-label">Total Classes</div>
                  </div>
                </div>
                <div className="modal-stat-card approved">
                  <CheckCircle size={24} className="modal-stat-icon" />
                  <div className="modal-stat-content">
                    <div className="modal-stat-number">{selectedCreator.approvedClasses || 0}</div>
                    <div className="modal-stat-label">Approved</div>
                  </div>
                </div>
                <div className="modal-stat-card pending">
                  <Clock size={24} className="modal-stat-icon" />
                  <div className="modal-stat-content">
                    <div className="modal-stat-number">{selectedCreator.pendingClasses || 0}</div>
                    <div className="modal-stat-label">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Performance Metrics</h3>
              <div className="modal-metrics-list">
                <div className="modal-metric-item">
                  <div className="modal-metric-label">
                    <Users size={20} className="modal-metric-icon" />
                    <span>Total Enrollments</span>
                  </div>
                  <div className="modal-metric-value">{selectedCreator.totalEnrollments || 0}</div>
                </div>
                <div className="modal-metric-item">
                  <div className="modal-metric-label">
                    <span>Total Earnings</span>
                  </div>
                  <div className="modal-metric-value earnings">₹{(selectedCreator.totalEarnings || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderCreatorModal()}
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

        /* Creator Table - Professional Dashboard Style */
        .creator-table-wrapper {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 2rem;
        }

        .creator-table {
          width: 100%;
          border-collapse: collapse;
        }

        .creator-table thead {
          background: rgba(255, 255, 255, 0.1);
        }

        .creator-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .creator-table-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s;
        }

        .creator-table-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .creator-table-row:last-child {
          border-bottom: none;
        }

        .creator-table-row td {
          padding: 1rem;
          vertical-align: middle;
        }

        .creator-info-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .creator-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .creator-avatar-small img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .creator-initial-small {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #D92A63 0%, #FF6B35 100%);
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }

        .creator-details {
          flex: 1;
          min-width: 0;
        }

        .creator-name-row {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.25rem;
        }

        .creator-email-row {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.15rem;
        }


        .creator-stat-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-item-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-icon-row {
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        .stat-number {
          font-weight: 600;
          color: #fff;
          font-size: 0.9rem;
        }

        .stat-breakdown {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .stat-approved {
          color: #4CAF50;
        }

        .stat-pending {
          color: #FF9800;
        }

        .creator-status-cell {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          width: fit-content;
        }

        .status-badge.approved {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .status-badge.pending {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }

        .creator-enrollment-cell,
        .creator-earnings-cell,
        .creator-date-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .cell-icon {
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        .earnings-icon {
          color: #FFD700;
        }

        .earnings-amount {
          color: #FFD700;
          font-weight: 600;
        }

        .creator-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(217, 42, 99, 0.2);
          color: #fff;
          border: 1px solid rgba(217, 42, 99, 0.3);
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .creator-view-btn:hover {
          background: rgba(217, 42, 99, 0.3);
          border-color: rgba(217, 42, 99, 0.5);
        }

        /* Creator Details Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 2rem;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .modal-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .modal-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-initial-large {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #D92A63 0%, #FF6B35 100%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #fff;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: #fff;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-section {
          margin-bottom: 2rem;
        }

        .modal-section:last-child {
          margin-bottom: 0;
        }

        .modal-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-info-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modal-info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .modal-info-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modal-info-value {
          font-size: 0.9rem;
          color: #fff;
          font-weight: 500;
          word-break: break-all;
        }

        .modal-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .modal-stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-stat-card.approved {
          border-color: rgba(76, 175, 80, 0.3);
        }

        .modal-stat-card.pending {
          border-color: rgba(255, 152, 0, 0.3);
        }

        .modal-stat-icon {
          color: rgba(255, 255, 255, 0.7);
          flex-shrink: 0;
        }

        .modal-stat-card.approved .modal-stat-icon {
          color: #4CAF50;
        }

        .modal-stat-card.pending .modal-stat-icon {
          color: #FF9800;
        }

        .modal-stat-content {
          flex: 1;
        }

        .modal-stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }

        .modal-stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .modal-metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .modal-metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .modal-metric-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .modal-metric-icon {
          color: rgba(255, 255, 255, 0.6);
        }

        .modal-metric-icon.earnings-icon {
          color: #FFD700;
        }

        .modal-metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }

        .modal-metric-value.earnings {
          color: #FFD700;
          font-size: 1.25rem;
        }

        /* Legacy styles for backward compatibility */
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

        /* Statistics Cards with Charts */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card-with-chart {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
        }

        .stat-card-with-chart:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          border-color: rgba(217, 42, 99, 0.3);
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .stat-card-header h2 {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #FFD700;
          line-height: 1;
        }

        .stat-number.revenue-number {
          font-size: 1.5rem;
        }

        .stat-chart-container {
          margin: 1rem 0;
        }

        .stat-bar-chart {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .stat-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s ease-out;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }

        .stat-footer {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.5rem;
        }

        .revenue-card .stat-number {
          color: #FFD700;
        }

        /* Charts Section */
        .charts-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Pie Chart */
        .pie-chart-container {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .pie-chart {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }

        .pie-segment {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        .pie-chart:hover .pie-segment {
          transform: scale(1.05);
        }

        .pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .pie-center-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pie-center-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          margin-top: 0.25rem;
        }

        .chart-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        /* Bar Chart */
        .bar-chart-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .bar-chart-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bar-label {
          width: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          flex-shrink: 0;
        }

        .bar-wrapper {
          flex: 1;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .bar-fill {
          height: 100%;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.75rem;
          transition: width 0.8s ease-out;
          position: relative;
        }

        .bar-fill.approved-bar {
          background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
        }

        .bar-fill.pending-bar {
          background: linear-gradient(90deg, #FF9800 0%, #F57C00 100%);
        }

        .bar-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Modern Class Cards */
        .pending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .class-card-modern {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
        }

        .class-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          border-color: rgba(217, 42, 99, 0.3);
        }

        .class-card-image-wrapper {
          position: relative;
          width: 100%;
          height: 180px;
          overflow: hidden;
        }

        .class-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .class-card-status-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }

        .class-card-status-badge.pending-badge {
          background: rgba(255, 152, 0, 0.9);
          color: #fff;
        }

        .class-card-status-badge.approved-badge {
          background: rgba(76, 175, 80, 0.9);
          color: #fff;
        }

        .class-card-body {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .class-card-header-section {
          margin-bottom: 0.5rem;
        }

        .class-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.4rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .class-card-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .class-card-info-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .class-info-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .class-info-icon {
          color: rgba(255, 255, 255, 0.5);
          flex-shrink: 0;
        }

        .class-card-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .class-detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .class-detail-icon {
          color: rgba(255, 255, 255, 0.5);
          flex-shrink: 0;
        }

        .class-detail-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .class-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFD700;
        }

        .class-card-creator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .creator-avatar-mini {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D92A63 0%, #FF6B35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .creator-info-mini {
          flex: 1;
          min-width: 0;
        }

        .creator-name-mini {
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.15rem;
        }

        .creator-email-mini {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .class-card-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: auto;
        }

        .class-action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .class-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .class-action-btn.approve-btn {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: #fff;
        }

        .class-action-btn.approve-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }

        .class-action-btn.reject-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .class-action-btn.reject-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Enrollments Table Improvements */
        .enrollments-summary {
          display: flex;
          gap: 1.5rem;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-icon {
          color: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        .summary-icon.earnings-icon {
          color: #FFD700;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }

        .summary-value.earnings {
          color: #FFD700;
        }

        .summary-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .enrollments-table-wrapper {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 2rem;
        }

        .enrollments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .enrollments-table thead {
          background: rgba(255, 255, 255, 0.1);
        }

        .enrollments-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .table-header-icon {
          margin-right: 0.5rem;
          vertical-align: middle;
          color: rgba(255, 255, 255, 0.6);
        }

        .enrollment-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s;
        }

        .enrollment-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .enrollment-row:last-child {
          border-bottom: none;
        }

        .enrollment-row td {
          padding: 1rem;
          vertical-align: middle;
        }

        .enrollment-student-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .student-avatar-small {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D92A63 0%, #FF6B35 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .student-info {
          flex: 1;
          min-width: 0;
        }

        .student-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.2rem;
        }

        .student-email {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .enrollment-class-cell {
          font-size: 0.9rem;
          color: #fff;
          font-weight: 500;
        }

        .enrollment-price-cell {
          font-size: 0.95rem;
          font-weight: 600;
          color: #FFD700;
        }

        .enrollment-payment-cell {
          font-size: 0.8rem;
        }

        .payment-id {
          color: rgba(255, 255, 255, 0.7);
          font-family: monospace;
        }

        .payment-id-na {
          color: rgba(255, 255, 255, 0.5);
        }

        .enrollment-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .enrollment-status-badge.active {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .enrollment-status-badge.pending {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }

        .enrollment-date-cell {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .empty-icon {
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
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

          .charts-section {
            grid-template-columns: 1fr;
          }

          .pie-chart-container {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 767px) {
          .creator-table-wrapper {
            overflow-x: auto;
          }

          .creator-table {
            min-width: 800px;
          }

          .grid-instructor {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .pending-grid {
            grid-template-columns: 1fr;
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
            <a onClick={() => handleNavClick('dashboard')} className={`sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Dashboard</div>
            </a>
            <a onClick={() => handleNavClick('creators')} className={`sidebar-nav-item ${activePage === 'creators' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Creators</div>
            </a>
            <a onClick={() => handleNavClick('approve-classes')} className={`sidebar-nav-item ${activePage === 'approve-classes' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Approve Classes</div>
            </a>
            <a onClick={() => handleNavClick('contact-messages')} className={`sidebar-nav-item ${activePage === 'contact-messages' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Contact Messages</div>
            </a>
            <a onClick={() => handleNavClick('payouts')} className={`sidebar-nav-item ${activePage === 'payouts' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Payouts</div>
            </a>
            <a onClick={() => handleNavClick('enrollments')} className={`sidebar-nav-item ${activePage === 'enrollments' ? 'active' : ''}`}>
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

          {renderCurrentPage()}
        </div>
      </div>
    </>
  );
}
