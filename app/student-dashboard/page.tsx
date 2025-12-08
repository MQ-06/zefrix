'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
import Link from 'next/link';
import { courses } from '@/lib/data';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    logout: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
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
  const { showError } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('student-panel-top');
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profileInterests, setProfileInterests] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

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
          import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['student-panel-top', 'my-enrollments', 'browse-classes', 'profile'];
      const scrollPosition = window.scrollY + 200; // Offset for better UX

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch enrollments from Firestore
  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        return;
      }

      setLoadingEnrollments(true);
      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const q = window.query(enrollmentsRef, window.where('studentId', '==', user.uid));
        const querySnapshot = await window.getDocs(q);

        const fetchedEnrollments: any[] = [];
        querySnapshot.forEach((doc: any) => {
          fetchedEnrollments.push({ id: doc.id, ...doc.data() });
        });

        // Sort by enrollment date (newest first)
        fetchedEnrollments.sort((a, b) => {
          const aTime = a.enrolledAt?.toMillis?.() || 0;
          const bTime = b.enrolledAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setEnrollments(fetchedEnrollments);
      } catch (error) {
        console.error('Error fetching enrollments:', error);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    if (user) {
      fetchEnrollments();
    }
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
          setProfileImage(userData.photoURL || '');
        } else {
          // Set defaults from Firebase Auth
          setProfileName(user.displayName || '');
          setProfileImage(user.photoURL || '');
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(targetId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const enrolledCourses = courses.slice(0, 3);
  // Use real approved classes instead of dummy data
  const upcomingCourses = approvedClasses.slice(0, 3);
  const completedCourses = courses.slice(0, 3);

  // Fetch approved classes from Firestore
  useEffect(() => {
    const fetchApprovedClasses = async () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        setTimeout(fetchApprovedClasses, 500);
        return;
      }

      setLoadingClasses(true);
      try {
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(classesRef, window.where('status', '==', 'approved'));
        const querySnapshot = await window.getDocs(q);

        const classes: ApprovedClass[] = [];
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
        setLoadingClasses(false);
      }
    };

    if (activeSection === 'browse-classes') {
      fetchApprovedClasses();
    }
  }, [activeSection]);

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
      `}</style>

      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png" alt="Zefrix" />
          </div>
          <nav className="sidebar-nav">
            <a href="#student-panel-top" onClick={(e) => handleNavClick(e, '#student-panel-top')} className={`sidebar-nav-item ${activeSection === 'student-panel-top' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Dashboard</div>
            </a>
            <a href="#my-enrollments" onClick={(e) => handleNavClick(e, '#my-enrollments')} className={`sidebar-nav-item ${activeSection === 'my-enrollments' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>My Enrollments</div>
            </a>
            <a href="#browse-classes" onClick={(e) => handleNavClick(e, '#browse-classes')} className={`sidebar-nav-item ${activeSection === 'browse-classes' ? 'active' : ''}`}>
              <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
              <div>Browse Classes</div>
            </a>
            <a href="#profile" onClick={(e) => handleNavClick(e, '#profile')} className={`sidebar-nav-item ${activeSection === 'profile' ? 'active' : ''}`}>
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

          {/* Dashboard Header */}
          <div id="student-panel-top" className="dashboard-header">
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

          {/* Total Classes Enrolled */}
          <div className="section">
            <h2 className="section-title">Total Classes Enrolled ({enrollments.length})</h2>
            {loadingEnrollments ? (
              <div className="text-white text-center py-8">Loading enrollments...</div>
            ) : enrollments.length > 0 ? (
              <div className="course-grid">
                {enrollments.map((course) => (
                  <Link key={course.id} href={`/product/${course.classId}`} className="course-card">
                    <div className="course-image-wrap">
                      <img
                        src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"
                        alt={course.className}
                        className="course-image"
                      />
                      <div className="course-teacher-wrap">
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', background: '#D92A63',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                        }}>
                          Z
                        </div>
                        <div className="ml-2">Zefrix</div>
                      </div>
                    </div>
                    <div className="course-info">
                      <h3 className="course-title">{course.className}</h3>
                      <div className="course-meta">
                        <div className="course-meta-item">
                          <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                          <div>{course.numberOfSessions || 1} Sessions</div>
                        </div>
                        <div className="course-meta-item">
                          <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                          <div>{course.classType || 'One-time'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="course-bottom">
                      <div className="course-price-wrap">
                        <h4 className="course-price">₹{(course.classPrice || 0).toFixed(2)}</h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 py-8">
                You haven't enrolled in any classes yet. <Link href="#browse-classes" style={{ color: '#D92A63', textDecoration: 'underline' }}>Browse classes</Link> to get started!
              </div>
            )}
          </div>

          {/* Upcoming Classes */}
          <div id="upcoming-classes" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Upcoming Classes ({upcomingCourses.length})</h2>
            {loadingClasses ? (
              <div className="text-white text-center py-8">Loading classes...</div>
            ) : upcomingCourses.length > 0 ? (
              <div className="course-grid">
                {upcomingCourses.map((course) => (
                  <Link key={course.id} href={`/product/${course.id}`} className="course-card">
                    <div className="course-image-wrap">
                      <img src={course.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"} alt={course.title} className="course-image" />
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
                          <div>{course.classType || 'One-time'}</div>
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
            ) : (
              <div className="text-gray-400 py-8 text-center">
                No upcoming classes available at the moment.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline button-inline-flex-style">
              <a href="#upcoming-classes" className="button-dark" style={{ textDecoration: 'none' }}>Browse Classes</a>
              <a href="#my-enrollments" className="button-dark" style={{ textDecoration: 'none' }}>View all Enrollments</a>
            </div>
          </div>

          {/* My Enrollments */}
          {/* My Enrollments */}
          <div id="my-enrollments" className="my-enrollments">
            <h2 className="section-title">My Enrollments</h2>
            {loadingEnrollments ? (
              <div className="text-white text-center py-8">Loading enrollments...</div>
            ) : enrollments.length > 0 ? (
              <div className="enrollment-list">
                {enrollments.map((item) => (
                  <div key={item.id} className="enrollment-item">
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', background: '#D92A63',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold'
                    }}>
                      {item.className ? item.className.charAt(0) : 'C'}
                    </div>
                    <div className="enrollment-info">
                      <h1 style={{ fontSize: '1rem', fontWeight: '600' }}>{item.className}</h1>
                      <div className="enrollment-status">ID: {item.classId}</div>
                    </div>
                    <div className="enrollment-info">
                      <h1 style={{ fontSize: '0.875rem', color: '#aaa' }}>Enrolled On</h1>
                      <div style={{ fontWeight: '600' }}>
                        {item.enrolledAt?.toDate ? item.enrolledAt.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                    </div>
                    <div className="enrollment-info">
                      <h1 style={{ fontSize: '0.875rem', color: '#aaa' }}>Status</h1>
                      <div style={{ color: '#4ade80', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {item.status || 'Active'}
                      </div>
                    </div>
                    <div className="enrollment-status">
                      Check email for schedule
                    </div>
                    <div className="enrollment-actions">
                      <Link href={`/product/${item.classId}`} className="button-dark" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                        View Content
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 py-8 text-center" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                No active enrollments found.
              </div>
            )}
          </div>

          {/* My Profile */}
          <div id="profile" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">My Profile</h2>
            {profileMessage && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                background: profileMessage.includes('success') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                border: `1px solid ${profileMessage.includes('success') ? '#4CAF50' : '#F44336'}`,
                color: profileMessage.includes('success') ? '#4CAF50' : '#F44336'
              }}>
                {profileMessage}
              </div>
            )}
            <div className="profile-form">
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

                  // Update/create user document in Firestore
                  const userRef = window.doc(window.firebaseDb, 'users', user.uid);
                  await window.setDoc(userRef, {
                    displayName: profileName,
                    interests: profileInterests,
                    photoURL: profileImage,
                    email: user.email,
                    role: 'student',
                    updatedAt: new Date()
                  }, { merge: true }); // merge: true creates document if it doesn't exist

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
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interests" className="form-label">Interest/Skills</label>
                  <input
                    type="text"
                    id="interests"
                    className="form-input"
                    value={profileInterests}
                    onChange={(e) => setProfileInterests(e.target.value)}
                    placeholder="Enter your interests or skills (e.g., Photography, Web Development)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profileImage" className="form-label">Profile Image URL</label>
                  <input
                    type="url"
                    id="profileImage"
                    className="form-input"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  {profileImage && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={profileImage}
                        alt="Profile preview"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="button-dark"
                  disabled={profileLoading}
                  style={{ opacity: profileLoading ? 0.6 : 1 }}
                >
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

