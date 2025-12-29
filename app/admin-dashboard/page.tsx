'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import { BookOpen, CheckCircle, Clock, Users, Calendar, Eye, Mail, X, User, CreditCard, FileText, TrendingUp } from 'lucide-react';
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

type AdminPage = 'dashboard' | 'creators' | 'approve-classes' | 'contact-messages' | 'payouts' | 'enrollments' | 'notifications';

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
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);

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
          import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, orderBy, limit, onSnapshot, deleteDoc, writeBatch, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
          window.orderBy = orderBy;
          window.limit = limit;
          window.onSnapshot = onSnapshot;
          window.deleteDoc = deleteDoc;
          window.writeBatch = writeBatch;
          window.addDoc = addDoc;
          window.serverTimestamp = serverTimestamp;

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
      // Trigger initial data fetch when user is loaded
      if (window.firebaseDb && activePage === 'dashboard') {
        setTimeout(() => {
          calculateStats();
        }, 100);
      }
    };
    window.addEventListener('userLoaded', handleUserLoaded);

    return () => {
      window.removeEventListener('userLoaded', handleUserLoaded);
    };
  }, [activePage]);

  // Set up real-time listener for pending classes
  const setupPendingClassesListener = () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
      return () => {};
    }

    setLoadingClasses(true);
    try {
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('status', '==', 'pending'));
      
      const unsubscribe = window.onSnapshot(q, (snapshot: any) => {
        const classes: PendingClass[] = [];
        snapshot.forEach((doc: any) => {
          classes.push({ classId: doc.id, ...doc.data() });
        });

        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setPendingClasses(classes);
        setLoadingClasses(false);
      }, (error: any) => {
        console.error('Error in pending classes listener:', error);
        showError('Failed to load pending classes. Please refresh the page.');
        setLoadingClasses(false);
      });

<<<<<<< HEAD
      classes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      console.log('📥 Pending classes fetched (admin)', classes.map(c => ({
        classId: c.classId,
        status: c.status,
        videoLink: c.videoLink,
      })));

      setPendingClasses(classes);
=======
      return unsubscribe;
>>>>>>> ab07d6bfcc8e9018609dd7db73b8a8cdc5e31de6
    } catch (error) {
      console.error('Error setting up pending classes listener:', error);
      setLoadingClasses(false);
      return () => {};
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

      // Get class data for email
      const classSnap = await window.getDoc(classRef);
      if (classSnap.exists()) {
        const classData = classSnap.data();
        
        // Note: Sessions are NOT auto-generated on approval
        // Creators must manually create sessions with Google Meet links using SessionForm
        // The schedule data in the class serves as a template for session creation
        
        // Send approval/rejection email to creator
        try {
          await fetch('/api/email/class-approval', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              creatorName: classData.creatorName || 'Creator',
              creatorEmail: classData.creatorEmail || '',
              creatorId: classData.creatorId, // Pass creatorId for notifications
              className: classData.title || 'Class',
              classId: classId,
              status: action,
              rejectionReason: action === 'rejected' ? 'Please review the class guidelines and resubmit.' : undefined,
            }),
          }).catch(() => {
            // Email failure shouldn't block the action
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
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
  // Set up real-time listener for approved classes
  const setupApprovedClassesListener = () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
      return () => {};
    }

    setLoadingApproved(true);
    try {
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('status', '==', 'approved'));
      
      const unsubscribe = window.onSnapshot(q, (snapshot: any) => {
        const classes: PendingClass[] = [];
        snapshot.forEach((doc: any) => {
          classes.push({ classId: doc.id, ...doc.data() });
        });

        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setApprovedClasses(classes);
        setLoadingApproved(false);
      }, (error: any) => {
        console.error('Error in approved classes listener:', error);
        setLoadingApproved(false);
      });

<<<<<<< HEAD
      classes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      console.log('✅ Approved classes fetched (admin)', classes.map(c => ({
        classId: c.classId,
        status: c.status,
        videoLink: c.videoLink,
      })));

      setApprovedClasses(classes);
=======
      return unsubscribe;
>>>>>>> ab07d6bfcc8e9018609dd7db73b8a8cdc5e31de6
    } catch (error) {
      console.error('Error setting up approved classes listener:', error);
      setLoadingApproved(false);
      return () => {};
    }
  };

  // Fetch real creators from Firestore with enhanced stats (optimized with parallel queries)
  const fetchRealCreators = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingCreators(true);
    try {
      // Run all queries in parallel for maximum performance
      const usersRef = window.collection(window.firebaseDb, 'users');
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');

      const [creatorsSnapshot, allClassesSnapshot, enrollmentsSnapshot] = await Promise.all([
        window.getDocs(window.query(usersRef, window.where('role', '==', 'creator'))),
        window.getDocs(window.query(classesRef)),
        window.getDocs(window.query(enrollmentsRef))
      ]);

      // Initialize creators array
      const creatorsData: Creator[] = [];
      creatorsSnapshot.forEach((doc: any) => {
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

      // Build creator stats and class-to-creator mapping in single pass
      const creatorStats: { [key: string]: { total: number; approved: number; pending: number } } = {};
      const classToCreator: { [key: string]: string } = {};

      allClassesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        const creatorId = classData.creatorId;
        if (creatorId) {
          classToCreator[doc.id] = creatorId;
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

      // Calculate earnings and enrollments in single pass
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

  // Calculate real statistics (optimized with parallel queries)
  const calculateStats = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    setLoadingStats(true);
    try {
      // Run all queries in parallel for better performance
      const usersRef = window.collection(window.firebaseDb, 'users');
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');

      // Parallel queries
      const [usersSnapshot, approvedSnapshot, pendingSnapshot, enrollmentsSnapshot] = await Promise.all([
        window.getDocs(window.query(usersRef)),
        window.getDocs(window.query(classesRef, window.where('status', '==', 'approved'))),
        window.getDocs(window.query(classesRef, window.where('status', '==', 'pending'))),
        window.getDocs(window.query(enrollmentsRef))
      ]);

      // Process results
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

      let activeClasses = 0;
      let totalRevenue = 0;

      approvedSnapshot.forEach((doc: any) => {
        activeClasses++;
        const classData = doc.data();
        // Calculate revenue based on actual enrollments, not maxSeats
        if (classData.price) {
          // This is just an estimate - for accurate revenue, count enrollments per class
          totalRevenue += classData.price;
        }
      });

      // Calculate actual revenue from enrollments
      let actualRevenue = 0;
      enrollmentsSnapshot.forEach((doc: any) => {
        const enrollment = doc.data();
        if (enrollment.classPrice) {
          actualRevenue += enrollment.classPrice;
        }
      });

      setStats({
        totalEnrollments: enrollmentsSnapshot.size,
        totalCreators,
        activeClasses,
        totalStudents,
        totalRevenue: actualRevenue || totalRevenue, // Use actual revenue if available
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

  // Fetch enrollments (optimized - removed unnecessary retry delays)
  const fetchEnrollments = async () => {
    if (!window.firebaseDb || !window.collection || !window.getDocs) {
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

  // Calculate payouts (optimized with parallel queries, removed retry delays)
  const fetchPayouts = async () => {
    if (!window.firebaseDb || !window.collection || !window.getDocs || !window.query || !window.where) {
      return;
    }

    setLoadingPayouts(true);
    try {
      // Run all queries in parallel for maximum performance
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const usersRef = window.collection(window.firebaseDb, 'users');
      const classesRef = window.collection(window.firebaseDb, 'classes');

      const [enrollmentsSnapshot, creatorsSnapshot, classesSnapshot] = await Promise.all([
        window.getDocs(window.query(enrollmentsRef)),
        window.getDocs(window.query(usersRef, window.where('role', '==', 'creator'))),
        window.getDocs(window.query(classesRef))
      ]);

      const classToCreator: { [key: string]: any } = {};
      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        classToCreator[doc.id] = {
          creatorId: classData.creatorId,
          creatorName: classData.creatorName
        };
      });

      const creatorEarnings: { [key: string]: { name: string; email: string; totalEarnings: number; classCount: number; enrollmentCount: number; bankDetails?: any } } = {};

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
              enrollmentCount: 0,
              bankDetails: null
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
          // Fetch bank details
          creatorEarnings[doc.id].bankDetails = {
            accountHolderName: creatorData.bankAccountHolderName || creatorData.accountHolderName || '',
            accountNumber: creatorData.bankAccountNumber || creatorData.accountNumber || '',
            ifscCode: creatorData.bankIFSC || creatorData.ifscCode || '',
            bankName: creatorData.bankName || '',
            upiId: creatorData.upiId || ''
          };
        }
      });

      classesSnapshot.forEach((doc: any) => {
        const classData = doc.data();
        if (creatorEarnings[classData.creatorId]) {
          creatorEarnings[classData.creatorId].classCount += 1;
        }
      });

      // Fetch existing payout records to check paid status
      const payoutsRef = window.collection(window.firebaseDb, 'payouts');
      const payoutsQuery = window.query(
        payoutsRef,
        window.where('status', '==', 'paid')
      );
      const paidPayoutsSnapshot = await window.getDocs(payoutsQuery);
      
      const paidPayoutsMap: { [key: string]: boolean } = {};
      paidPayoutsSnapshot.forEach((doc: any) => {
        const payoutData = doc.data();
        if (payoutData.creatorId) {
          paidPayoutsMap[payoutData.creatorId] = true;
        }
      });

      const payoutsArray = Object.keys(creatorEarnings).map(creatorId => ({
        creatorId,
        ...creatorEarnings[creatorId],
        status: paidPayoutsMap[creatorId] ? 'paid' : 'pending'
      }));

      payoutsArray.sort((a, b) => b.totalEarnings - a.totalEarnings);
      setPayouts(payoutsArray);
    } catch (error) {
      console.error('Error calculating payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  // Mark payout as paid
  const handleMarkPayoutAsPaid = async (payout: any) => {
    if (!window.firebaseDb || !window.collection || !window.addDoc || !window.serverTimestamp) {
      showError('Firebase not initialized');
      return;
    }

    if (!user) {
      showError('You must be logged in to perform this action');
      return;
    }

    setProcessingPayout(payout.creatorId);

    try {
      // Create payout record in Firestore
      const payoutsRef = window.collection(window.firebaseDb, 'payouts');
      await window.addDoc(payoutsRef, {
        creatorId: payout.creatorId,
        creatorName: payout.name,
        creatorEmail: payout.email,
        amount: payout.totalEarnings,
        classCount: payout.classCount,
        enrollmentCount: payout.enrollmentCount,
        bankDetails: payout.bankDetails || {},
        status: 'paid',
        paidBy: user.email || user.uid,
        paidAt: window.serverTimestamp(),
        createdAt: window.serverTimestamp()
      });

      // Update local state
      setPayouts(prev => prev.map(p => 
        p.creatorId === payout.creatorId 
          ? { ...p, status: 'paid' }
          : p
      ));

      showSuccess(`Payout marked as paid for ${payout.name}`);
    } catch (error: any) {
      console.error('Error marking payout as paid:', error);
      showError(`Failed to mark payout as paid: ${error.message}`);
    } finally {
      setProcessingPayout(null);
    }
  };

  // Wait for Firebase and user to be ready, then load initial data
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 30; // 6 seconds max wait (30 * 200ms)
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    let pendingUnsubscribe: (() => void) | null = null;
    let approvedUnsubscribe: (() => void) | null = null;

    const checkAndLoadData = () => {
      if (!isMounted) return;

      if (!window.firebaseDb || !user) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          timeoutId = setTimeout(checkAndLoadData, 200);
          return;
        }
        console.warn('Firebase or user not ready after maximum retries');
        return;
      }

      // Firebase and user are ready, load data for current page
      if (activePage === 'dashboard') {
        calculateStats();
      } else if (activePage === 'creators') {
        fetchRealCreators();
      } else if (activePage === 'approve-classes') {
        // Clean up previous listeners if any
        if (pendingUnsubscribe) pendingUnsubscribe();
        if (approvedUnsubscribe) approvedUnsubscribe();
        pendingUnsubscribe = setupPendingClassesListener();
        approvedUnsubscribe = setupApprovedClassesListener();
        calculateStats();
      } else if (activePage === 'contact-messages') {
        fetchContactMessages();
      } else if (activePage === 'enrollments') {
        fetchEnrollments();
      } else if (activePage === 'payouts') {
        fetchPayouts();
      }
    };

    checkAndLoadData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (pendingUnsubscribe) pendingUnsubscribe();
      if (approvedUnsubscribe) approvedUnsubscribe();
    };
  }, [activePage, user]);


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
        <div className="payouts-total-summary">
          <div className="payouts-total-amount">
            ₹{payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalEarnings, 0).toFixed(2)}
          </div>
          <div className="payouts-total-label">Total Pending</div>
        </div>
      </div>

      {loadingPayouts ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          Calculating payouts...
        </div>
      ) : payouts.length > 0 ? (
        <>
          <div className="payouts-table-wrapper">
            <table className="payouts-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Classes</th>
                  <th>Enrollments</th>
                  <th>Total Earnings</th>
                  <th>Bank Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.creatorId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{payout.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                          {payout.email}
                        </div>
                      </div>
                    </td>
                    <td>{payout.classCount}</td>
                    <td>{payout.enrollmentCount}</td>
                    <td>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFD700' }}>
                        ₹{payout.totalEarnings.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      {payout.bankDetails && (payout.bankDetails.accountNumber || payout.bankDetails.ifscCode || payout.bankDetails.bankName) ? (
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ color: '#fff', marginBottom: '0.25rem' }}>
                            <strong>{payout.bankDetails.accountHolderName || 'N/A'}</strong>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                            {payout.bankDetails.accountNumber ? `A/C: ${payout.bankDetails.accountNumber}` : ''}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                            {payout.bankDetails.ifscCode ? `IFSC: ${payout.bankDetails.ifscCode}` : ''}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                            {payout.bankDetails.bankName || ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255,152,0,0.8)', fontSize: '0.875rem' }}>
                          Not provided
                        </span>
                      )}
                    </td>
                    <td>
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
                    <td>
                      {payout.status === 'paid' ? (
                        <span style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.875rem',
                          color: '#4CAF50',
                          fontWeight: '600'
                        }}>
                          Paid
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <button
                            className="button-dark"
                            onClick={() => {
                              setSelectedPayout(payout);
                            }}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            disabled={processingPayout === payout.creatorId}
                          >
                            View Details
                          </button>
                          <button
                            className="button-dark"
                            onClick={() => {
                              if (confirm(`Mark payout of ₹${payout.totalEarnings.toFixed(2)} as paid for ${payout.name}?`)) {
                                handleMarkPayoutAsPaid(payout);
                              }
                            }}
                            style={{ 
                              padding: '0.5rem 1rem', 
                              fontSize: '0.875rem',
                              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                            }}
                            disabled={processingPayout === payout.creatorId}
                          >
                            {processingPayout === payout.creatorId ? 'Processing...' : 'Mark as Paid'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="payouts-cards-wrapper">
            {payouts.map((payout) => (
              <div key={payout.creatorId} className="payout-card">
                <div className="payout-card-header">
                  <div>
                    <div className="payout-card-name">{payout.name}</div>
                    <div className="payout-card-email">{payout.email}</div>
                  </div>
                  <span className={`payout-card-status ${payout.status === 'paid' ? 'paid' : 'pending'}`}>
                    {payout.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                
                <div className="payout-card-amount">
                  ₹{payout.totalEarnings.toFixed(2)}
                </div>
                
                <div className="payout-card-info">
                  <div className="payout-card-info-item">
                    <span className="payout-card-label">Classes:</span>
                    <span className="payout-card-value">{payout.classCount}</span>
                  </div>
                  <div className="payout-card-info-item">
                    <span className="payout-card-label">Enrollments:</span>
                    <span className="payout-card-value">{payout.enrollmentCount}</span>
                  </div>
                </div>
                
                <div className="payout-card-bank">
                  <div className="payout-card-label">Bank Details:</div>
                  {payout.bankDetails && (payout.bankDetails.accountNumber || payout.bankDetails.ifscCode || payout.bankDetails.bankName) ? (
                    <div className="payout-card-bank-details">
                      <div><strong>{payout.bankDetails.accountHolderName || 'N/A'}</strong></div>
                      {payout.bankDetails.accountNumber && <div>A/C: {payout.bankDetails.accountNumber}</div>}
                      {payout.bankDetails.ifscCode && <div>IFSC: {payout.bankDetails.ifscCode}</div>}
                      {payout.bankDetails.bankName && <div>{payout.bankDetails.bankName}</div>}
                      {payout.bankDetails.upiId && <div>UPI: {payout.bankDetails.upiId}</div>}
                    </div>
                  ) : (
                    <span className="payout-card-warning">Not provided</span>
                  )}
                </div>
                
                {payout.status !== 'paid' && (
                  <div className="payout-card-actions">
                    <button
                      className="button-dark payout-card-btn"
                      onClick={() => {
                        setSelectedPayout(payout);
                      }}
                      disabled={processingPayout === payout.creatorId}
                    >
                      View Details
                    </button>
                    <button
                      className="button-dark payout-card-btn payout-card-btn-primary"
                      onClick={() => {
                        if (confirm(`Mark payout of ₹${payout.totalEarnings.toFixed(2)} as paid for ${payout.name}?`)) {
                          handleMarkPayoutAsPaid(payout);
                        }
                      }}
                      disabled={processingPayout === payout.creatorId}
                    >
                      {processingPayout === payout.creatorId ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
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
      case 'notifications':
        return user?.uid ? <NotificationList userId={user.uid} userRole="admin" /> : <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Loading notifications...</div>;
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

        .hamburger-line.top.open {
          transform: rotate(45deg) translate(8px, 8px);
        }

        .hamburger-line.mid.open {
          opacity: 0;
        }

        .hamburger-line.bot.open {
          transform: rotate(-45deg) translate(7px, -7px);
        }

        .admin-nav-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
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
            padding-top: 80px;
          }

          .hamburger {
            display: flex;
          }

          .admin-nav-overlay {
            display: block;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
          }

          .welcome-section h2 {
            font-size: 1.5rem;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .charts-section {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .pie-chart-container {
            flex-direction: column;
            align-items: center;
          }

          .modal-overlay {
            padding: 1rem;
          }

          .modal-content {
            max-width: 95%;
          }

          .modal-stats-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Payouts Table Styles */
        .payouts-table-wrapper {
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow: hidden;
          display: block;
        }

        .payouts-table {
          width: 100%;
          border-collapse: collapse;
          display: table;
        }

        .payouts-table thead {
          display: table-header-group;
        }

        .payouts-table tbody {
          display: table-row-group;
        }

        .payouts-table tr {
          display: table-row;
        }

        .payouts-table th,
        .payouts-table td {
          display: table-cell;
          padding: 1rem;
          text-align: left;
        }

        .payouts-table th {
          background: rgba(255,255,255,0.1);
          color: #FFD700;
          font-weight: 600;
        }

        .payouts-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .payouts-table tbody tr:hover {
          background: rgba(255,255,255,0.03);
        }

        /* Payouts Mobile Cards */
        .payouts-cards-wrapper {
          display: none;
          flex-direction: column;
          gap: 1rem;
        }

        .payout-card {
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .payout-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .payout-card-name {
          font-weight: 600;
          color: #fff;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .payout-card-email {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
        }

        .payout-card-status {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .payout-card-status.paid {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .payout-card-status.pending {
          background: rgba(255, 152, 0, 0.2);
          color: #FF9800;
        }

        .payout-card-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .payout-card-info {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .payout-card-info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .payout-card-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.7);
        }

        .payout-card-value {
          font-size: 0.9375rem;
          color: #fff;
          font-weight: 600;
        }

        .payout-card-bank {
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .payout-card-bank .payout-card-label {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .payout-card-bank-details {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.9);
        }

        .payout-card-bank-details div {
          margin-bottom: 0.25rem;
        }

        .payout-card-bank-details strong {
          color: #fff;
        }

        .payout-card-warning {
          color: rgba(255,152,0,0.8);
          font-size: 0.875rem;
        }

        .payout-card-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .payout-card-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        .payout-card-btn-primary {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
        }

        .payouts-total-summary {
          color: rgba(255,255,255,0.7);
          font-size: 0.875rem;
          text-align: right;
        }

        .payouts-total-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #FFD700;
        }

        .payouts-total-label {
          font-size: 0.875rem;
        }

        @media (max-width: 767px) {
          .payouts-total-summary {
            text-align: left;
            width: 100%;
          }

          .payouts-total-amount {
            font-size: 1.25rem;
          }
          .payouts-table-wrapper {
            display: none;
          }

          .payouts-cards-wrapper {
            display: flex;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .dashboard-header .welcome-section h2 {
            font-size: 1.25rem;
          }

          .main-content {
            padding: 1rem;
            padding-top: 80px;
          }

          .dashboard-header {
            margin-bottom: 2rem;
          }

          .welcome-section h2 {
            font-size: 1.25rem;
          }

          .welcome-section p {
            font-size: 0.875rem;
          }

          .section-title {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
          }

          .button-dark,
          .button-2 {
            padding: 0.625rem 1.25rem;
            font-size: 0.875rem;
          }

          .stats-grid {
            gap: 0.75rem;
          }

          .stat-card-with-chart {
            padding: 1rem;
          }

          .stat-number {
            font-size: 1.5rem;
          }

          .stat-number.revenue-number {
            font-size: 1.25rem;
          }

          .charts-section {
            gap: 0.75rem;
          }

          .chart-card {
            padding: 1rem;
          }

          .chart-title {
            font-size: 1rem;
            margin-bottom: 1rem;
          }

          .pie-chart {
            width: 150px;
            height: 150px;
          }

          .pie-center {
            width: 80px;
            height: 80px;
          }

          .pie-center-number {
            font-size: 1.25rem;
          }

          .bar-label {
            width: 80px;
            font-size: 0.8125rem;
          }

          .creator-table-wrapper {
            overflow-x: auto;
          }

          .creator-table {
            min-width: 800px;
          }

          .creator-table th,
          .creator-table-row td {
            padding: 0.75rem 0.5rem;
            font-size: 0.8125rem;
          }

          .creator-avatar-small {
            width: 32px;
            height: 32px;
          }

          .creator-name-row {
            font-size: 0.875rem;
          }

          .creator-email-row {
            font-size: 0.75rem;
          }

          .creator-view-btn {
            padding: 0.375rem 0.625rem;
            font-size: 0.75rem;
          }

          .grid-instructor {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .instructor-item {
            padding: 1rem;
          }

          .instructor-image-wrap {
            width: 100px;
            height: 100px;
          }

          .heading-h6 {
            font-size: 1.125rem;
          }

          .pending-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .class-card-image-wrapper {
            height: 160px;
          }

          .class-card-body {
            padding: 0.875rem;
            gap: 0.75rem;
          }

          .class-card-title {
            font-size: 0.9375rem;
          }

          .class-card-subtitle {
            font-size: 0.8125rem;
          }

          .class-card-info-row {
            gap: 0.75rem;
          }

          .class-info-item {
            font-size: 0.75rem;
          }

          .class-card-details {
            padding: 0.625rem;
          }

          .class-detail-text {
            font-size: 0.75rem;
          }

          .class-price {
            font-size: 1rem;
          }

          .class-card-creator {
            padding: 0.625rem;
          }

          .creator-avatar-mini {
            width: 32px;
            height: 32px;
            font-size: 0.8125rem;
          }

          .creator-name-mini {
            font-size: 0.8125rem;
          }

          .creator-email-mini {
            font-size: 0.6875rem;
          }

          .class-card-actions {
            gap: 0.5rem;
          }

          .class-action-btn {
            padding: 0.625rem;
            font-size: 0.8125rem;
          }

          .enrollments-summary {
            gap: 0.75rem;
          }

          .summary-item {
            padding: 0.75rem 1rem;
          }

          .summary-value {
            font-size: 1.25rem;
          }

          .enrollments-table-wrapper {
            margin-top: 1.5rem;
          }

          .enrollments-table th,
          .enrollment-row td {
            padding: 0.75rem 0.5rem;
            font-size: 0.8125rem;
          }

          .student-avatar-small {
            width: 32px;
            height: 32px;
            font-size: 0.8125rem;
          }

          .student-name {
            font-size: 0.8125rem;
          }

          .student-email {
            font-size: 0.75rem;
          }

          .enrollment-class-cell,
          .enrollment-price-cell {
            font-size: 0.8125rem;
          }

          .modal-overlay {
            padding: 0.5rem;
          }

          .modal-content {
            max-width: 100%;
            max-height: 95vh;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-title {
            font-size: 1.25rem;
          }

          .modal-avatar-large {
            width: 50px;
            height: 50px;
          }

          .modal-initial-large {
            font-size: 1.25rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .modal-section-title {
            font-size: 1rem;
          }

          .modal-stats-grid {
            gap: 0.75rem;
          }

          .modal-stat-card {
            padding: 0.75rem;
          }

          .modal-stat-number {
            font-size: 1.25rem;
          }

          .modal-metric-item {
            padding: 0.75rem;
          }

          .modal-metric-label {
            font-size: 0.8125rem;
          }

          .modal-metric-value {
            font-size: 0.875rem;
          }

          .modal-metric-value.earnings {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            width: 100%;
            max-width: 320px;
          }

          .sidebar-logo img {
            width: 120px;
          }

          .hamburger {
            top: 0.75rem;
            left: 0.75rem;
            padding: 0.375rem;
          }

          .hamburger-line {
            width: 22px;
            height: 2.5px;
          }

          .main-content {
            padding: 0.75rem;
            padding-top: 70px;
          }

          .welcome-section h2 {
            font-size: 1.125rem;
          }

          .welcome-section p {
            font-size: 0.8125rem;
          }

          .section-title {
            font-size: 1.125rem;
            margin-bottom: 1rem;
          }

          .button-dark,
          .button-2 {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
            width: 100%;
          }

          .stats-grid {
            gap: 0.5rem;
          }

          .stat-card-with-chart {
            padding: 0.875rem;
          }

          .stat-card-header h2 {
            font-size: 0.8125rem;
          }

          .stat-number {
            font-size: 1.25rem;
          }

          .stat-number.revenue-number {
            font-size: 1.125rem;
          }

          .chart-card {
            padding: 0.875rem;
          }

          .chart-title {
            font-size: 0.9375rem;
            margin-bottom: 0.75rem;
          }

          .pie-chart {
            width: 120px;
            height: 120px;
          }

          .pie-center {
            width: 60px;
            height: 60px;
          }

          .pie-center-text {
            font-size: 0.6875rem;
          }

          .pie-center-number {
            font-size: 1rem;
          }

          .legend-item {
            font-size: 0.8125rem;
          }

          .bar-label {
            width: 70px;
            font-size: 0.75rem;
          }

          .bar-wrapper {
            height: 32px;
          }

          .creator-table th,
          .creator-table-row td {
            padding: 0.5rem 0.375rem;
            font-size: 0.75rem;
          }

          .creator-avatar-small {
            width: 28px;
            height: 28px;
          }

          .creator-initial-small {
            font-size: 0.875rem;
          }

          .creator-name-row {
            font-size: 0.8125rem;
          }

          .creator-email-row {
            font-size: 0.6875rem;
          }

          .stat-number {
            font-size: 0.8125rem;
          }

          .stat-breakdown {
            font-size: 0.6875rem;
          }

          .creator-view-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.6875rem;
          }

          .grid-instructor {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .instructor-item {
            padding: 0.875rem;
          }

          .instructor-image-wrap {
            width: 80px;
            height: 80px;
          }

          .heading-h6 {
            font-size: 1rem;
          }

          .text-block-10 {
            font-size: 0.8125rem;
          }

          .pending-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .class-card-image-wrapper {
            height: 140px;
          }

          .class-card-status-badge {
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.3rem 0.625rem;
            font-size: 0.6875rem;
          }

          .class-card-body {
            padding: 0.75rem;
            gap: 0.625rem;
          }

          .class-card-title {
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
          }

          .class-card-subtitle {
            font-size: 0.75rem;
          }

          .class-card-info-row {
            gap: 0.5rem;
          }

          .class-info-item {
            font-size: 0.6875rem;
          }

          .class-card-details {
            padding: 0.5rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .class-detail-item {
            width: 100%;
          }

          .class-detail-text {
            font-size: 0.6875rem;
          }

          .class-price {
            font-size: 0.9375rem;
          }

          .class-card-creator {
            padding: 0.5rem;
          }

          .creator-avatar-mini {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .creator-name-mini {
            font-size: 0.75rem;
          }

          .creator-email-mini {
            font-size: 0.625rem;
          }

          .class-card-actions {
            gap: 0.5rem;
          }

          .class-action-btn {
            padding: 0.5rem;
            font-size: 0.75rem;
          }

          .enrollments-summary {
            gap: 0.5rem;
          }

          .summary-item {
            padding: 0.625rem 0.875rem;
          }

          .summary-icon {
            width: 20px;
            height: 20px;
          }

          .summary-value {
            font-size: 1.125rem;
          }

          .summary-label {
            font-size: 0.6875rem;
          }

          .enrollments-table th,
          .enrollment-row td {
            padding: 0.5rem 0.375rem;
            font-size: 0.75rem;
          }

          .student-avatar-small {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }

          .student-name {
            font-size: 0.75rem;
          }

          .student-email {
            font-size: 0.6875rem;
          }

          .enrollment-class-cell,
          .enrollment-price-cell {
            font-size: 0.75rem;
          }

          .modal-header {
            padding: 0.875rem;
          }

          .modal-title {
            font-size: 1.125rem;
          }

          .modal-subtitle {
            font-size: 0.8125rem;
          }

          .modal-avatar-large {
            width: 40px;
            height: 40px;
          }

          .modal-initial-large {
            font-size: 1rem;
          }

          .modal-close-btn {
            width: 32px;
            height: 32px;
          }

          .modal-body {
            padding: 0.875rem;
          }

          .modal-section {
            margin-bottom: 1.5rem;
          }

          .modal-section-title {
            font-size: 0.9375rem;
            margin-bottom: 0.75rem;
          }

          .modal-info-label {
            font-size: 0.6875rem;
          }

          .modal-info-value {
            font-size: 0.8125rem;
          }

          .modal-stats-grid {
            gap: 0.5rem;
          }

          .modal-stat-card {
            padding: 0.625rem;
          }

          .modal-stat-number {
            font-size: 1.125rem;
          }

          .modal-stat-label {
            font-size: 0.6875rem;
          }

          .modal-metric-item {
            padding: 0.625rem;
          }

          .modal-metric-label {
            font-size: 0.75rem;
          }

          .modal-metric-value {
            font-size: 0.8125rem;
          }

          .modal-metric-value.earnings {
            font-size: 0.9375rem;
          }
        }

        /* Payout Modal Styles */
        .payout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .payout-modal-content {
          background: linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 100%);
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: payoutModalSlideIn 0.3s ease-out;
        }

        @keyframes payoutModalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .payout-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .payout-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .payout-modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          font-size: 1.75rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          line-height: 1;
        }

        .payout-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        .payout-modal-body {
          padding: 1.5rem;
        }

        .payout-info-section {
          margin-bottom: 1.5rem;
        }

        .payout-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .payout-info-item:last-child {
          border-bottom: none;
        }

        .payout-amount-item {
          background: rgba(217, 42, 99, 0.1);
          padding: 1rem;
          border-radius: 12px;
          margin-top: 0.5rem;
          border: 1px solid rgba(217, 42, 99, 0.3);
        }

        .payout-info-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .payout-info-value {
          font-size: 0.9375rem;
          color: #fff;
          font-weight: 600;
          text-align: right;
        }

        .payout-amount {
          font-size: 1.5rem;
          color: #FFD700;
          font-weight: 700;
        }

        .payout-bank-section {
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .payout-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 1rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(217, 42, 99, 0.3);
        }

        .payout-bank-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .payout-warning {
          display: flex;
          align-items: flex-start;
          padding: 1rem;
          background: rgba(255, 152, 0, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .payout-instruction {
          padding: 1rem;
          background: rgba(217, 42, 99, 0.1);
          border-radius: 12px;
          border-left: 4px solid #D92A63;
          margin-bottom: 1.5rem;
        }

        .payout-instruction p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.6;
        }

        .payout-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .payout-modal-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .payout-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .payout-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .payout-btn-primary {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: #fff;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }

        .payout-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        }

        .payout-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 767px) {
          .payout-modal-content {
            max-width: 100%;
            margin: 1rem;
            border-radius: 16px;
          }

          .payout-modal-header {
            padding: 1.25rem;
          }

          .payout-modal-title {
            font-size: 1.125rem;
          }

          .payout-modal-body {
            padding: 1.25rem;
          }

          .payout-modal-actions {
            flex-direction: column;
          }

          .payout-modal-btn {
            width: 100%;
          }

          .payout-info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .payout-info-value {
            text-align: left;
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
            <a onClick={() => handleNavClick('notifications')} className={`sidebar-nav-item ${activePage === 'notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Notifications</div>
              {user?.uid && <NotificationBadge userId={user.uid} />}
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
            <div className={`hamburger-line ${isMenuOpen ? 'top open' : ''}`}></div>
            <div className={`hamburger-line ${isMenuOpen ? 'mid open' : ''}`}></div>
            <div className={`hamburger-line ${isMenuOpen ? 'bot open' : ''}`}></div>
          </div>

          {/* Overlay to close menu on mobile */}
          {isMenuOpen && (
            <div 
              className="admin-nav-overlay" 
              onClick={() => setIsMenuOpen(false)}
            ></div>
          )}

          {renderCurrentPage()}
        </div>
      </div>

      {/* Payout Details Modal */}
      {selectedPayout && (
        <div className="payout-modal-overlay" onClick={() => setSelectedPayout(null)}>
          <div className="payout-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="payout-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(217, 42, 99, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#D92A63'
                }}>
                  ℹ
                </div>
                <h2 className="payout-modal-title">Manual Payout Details Creator:</h2>
              </div>
              <button 
                className="payout-modal-close"
                onClick={() => setSelectedPayout(null)}
              >
                ×
              </button>
            </div>

            <div className="payout-modal-body">
              <div className="payout-info-section">
                <div className="payout-info-item">
                  <span className="payout-info-label">Creator:</span>
                  <span className="payout-info-value">{selectedPayout.name}</span>
                </div>
                <div className="payout-info-item">
                  <span className="payout-info-label">Email:</span>
                  <span className="payout-info-value">{selectedPayout.email}</span>
                </div>
                <div className="payout-info-item payout-amount-item">
                  <span className="payout-info-label">Amount:</span>
                  <span className="payout-info-value payout-amount">₹{selectedPayout.totalEarnings.toFixed(2)}</span>
                </div>
              </div>

              <div className="payout-bank-section">
                <h3 className="payout-section-title">Bank Details</h3>
                {selectedPayout.bankDetails && (selectedPayout.bankDetails.accountNumber || selectedPayout.bankDetails.ifscCode || selectedPayout.bankDetails.bankName) ? (
                  <div className="payout-bank-details">
                    <div className="payout-info-item">
                      <span className="payout-info-label">Account Holder:</span>
                      <span className="payout-info-value">{selectedPayout.bankDetails.accountHolderName || 'N/A'}</span>
                    </div>
                    <div className="payout-info-item">
                      <span className="payout-info-label">Account Number:</span>
                      <span className="payout-info-value">{selectedPayout.bankDetails.accountNumber || 'N/A'}</span>
                    </div>
                    <div className="payout-info-item">
                      <span className="payout-info-label">IFSC Code:</span>
                      <span className="payout-info-value">{selectedPayout.bankDetails.ifscCode || 'N/A'}</span>
                    </div>
                    <div className="payout-info-item">
                      <span className="payout-info-label">Bank Name:</span>
                      <span className="payout-info-value">{selectedPayout.bankDetails.bankName || 'N/A'}</span>
                    </div>
                    {selectedPayout.bankDetails.upiId && (
                      <div className="payout-info-item">
                        <span className="payout-info-label">UPI ID:</span>
                        <span className="payout-info-value">{selectedPayout.bankDetails.upiId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="payout-warning">
                    <span style={{ color: '#FF9800', fontSize: '1rem', marginRight: '0.5rem' }}>⚠️</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Bank details not provided by creator. Please contact {selectedPayout.email} to get bank account information.
                    </span>
                  </div>
                )}
              </div>

              <div className="payout-instruction">
                <p>Please process payment via bank transfer and then click "Mark as Paid".</p>
              </div>

              <div className="payout-modal-actions">
                <button
                  className="payout-modal-btn payout-btn-secondary"
                  onClick={() => setSelectedPayout(null)}
                >
                  Close
                </button>
                <button
                  className="payout-modal-btn payout-btn-primary"
                  onClick={() => {
                    if (confirm(`Mark payout of ₹${selectedPayout.totalEarnings.toFixed(2)} as paid for ${selectedPayout.name}?`)) {
                      handleMarkPayoutAsPaid(selectedPayout);
                      setSelectedPayout(null);
                    }
                  }}
                  disabled={processingPayout === selectedPayout.creatorId}
                >
                  {processingPayout === selectedPayout.creatorId ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
