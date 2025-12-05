'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    logout: any;
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

export default function AdminDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('admin-dashboard-top');
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
          import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

          const firebaseConfig = {
            apiKey: "AIzaSyA7GQMjPkJZoePTYUieX6icsCNvIxHsdGw",
            authDomain: "zefrix-a92a0.firebaseapp.com",
            projectId: "zefrix-a92a0",
            storageBucket: "zefrix-a92a0.appspot.com",
            messagingSenderId: "316642308627",
            appId: "1:316642308627:web:ae7ff0b5a8d94d81a505e6",
            measurementId: "G-MKKLHPT3KE"
          };

          const app = initializeApp(firebaseConfig);
          window.firebaseAuth = getAuth(app);
          window.firebaseDb = getFirestore(app);

          window.logout = async () => {
            try {
              await signOut(window.firebaseAuth);
              location.replace('/signup-login');
            } catch (error) {
              console.error('Logout failed:', error);
              alert('Logout failed, please try again.');
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

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['admin-dashboard-top', 'show-creators-new', 'approve-classes', 'payouts-new', 'enrollments'];
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(targetId.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          font-family: 'Inter', sans-serif;
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
          color: rgba(255, 255, 255, 0.7);
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
              <h2 className="section-title">All Creators</h2>
              <a href="#" className="button-dark">Add Creator</a>
            </div>
            <div className="search-wrapper">
              <div className="search-box">
                <input type="text" className="search-query" placeholder="Search Class..." />
                <a href="#" className="button-dark">Search</a>
              </div>
            </div>
            <div className="grid-instructor">
              {creators.map((creator) => (
                <Link key={creator.id} href={`/instructor/${creator.name.toLowerCase().replace(' ', '-')}`} className="instructor-item">
                  <div className="instructor-image-wrap">
                    <img src={creator.image} alt={creator.name} className="instructor-image" />
                  </div>
                  <h2 className="heading-h6 no-margin">{creator.name}</h2>
                  <div className="text-block-10">{creator.title}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Approve Classes */}
          <div id="approve-classes" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h2>Total Enrollments</h2>
                <div className="stat-number">50</div>
              </div>
              <div className="stat-card">
                <h2>Total Creators</h2>
                <div className="stat-number">100</div>
              </div>
              <div className="stat-card">
                <h2>Active Classes</h2>
                <div className="stat-number">50</div>
              </div>
            </div>

            <h2 className="section-title" style={{ marginTop: '3rem' }}>Pending Approval</h2>
            <div className="pending-grid">
              {[1, 2, 3].map((item) => (
                <div key={item} className="pending-card">
                  <img 
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg" 
                    alt="Course" 
                    className="pending-card-image" 
                  />
                  <div className="pending-card-content">
                    <div className="pending-card-title">Graphic Design Masterclass</div>
                    <div className="pending-card-meta">
                      <span>140 Sections</span>
                      <span>140 Sections</span>
                      <span>140 Sections</span>
                    </div>
                    <div className="pending-card-actions">
                      <a href="#" className="button-dark">Approve</a>
                      <a href="#" className="button-2">Reject</a>
                    </div>
                    <div className="pending-card-teacher">
                      <img src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b768_avatar-3.jpg" alt="Instructor" />
                      <div>Billy Vasquez</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payouts */}
          <div id="payouts-new" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Creators Payments</h2>
            <div className="search-wrapper">
              <div className="search-box">
                <input type="text" className="search-query" placeholder="Search Creator..." />
                <a href="#" className="button-dark">Search</a>
              </div>
            </div>
            <div className="payment-list">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="payment-item">
                  <div className="payment-info">
                    <img src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg" alt="Creator" />
                    <div>
                      <div className="payment-name">Creator 1</div>
                      <div className="payment-category">Coding</div>
                    </div>
                  </div>
                  <div className="payment-amount">$500</div>
                  <a href="#" className="button-dark">Mark Paid</a>
                </div>
              ))}
            </div>
          </div>

          {/* Enrollments */}
          <div id="enrollments" className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline">
              <h2 className="section-title">All Students</h2>
              <a href="#" className="button-dark">Add Student</a>
            </div>
            <div className="search-wrapper">
              <div className="search-box">
                <input type="text" className="search-query" placeholder="Search Class..." />
                <a href="#" className="button-dark">Search</a>
              </div>
            </div>
            <div className="grid-instructor">
              {creators.map((creator) => (
                <Link key={creator.id} href={`/instructor/${creator.name.toLowerCase().replace(' ', '-')}`} className="instructor-item">
                  <div className="instructor-image-wrap">
                    <img src={creator.image} alt={creator.name} className="instructor-image" />
                  </div>
                  <h2 className="heading-h6 no-margin">{creator.name}</h2>
                  <div className="text-block-10">{creator.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

