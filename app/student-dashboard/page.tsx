'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { courses } from '@/lib/data';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    logout: any;
  }
}

export default function StudentDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState('student-panel-top');
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
  const upcomingCourses = courses.slice(0, 3);
  const completedCourses = courses.slice(0, 3);
  const browseCourses = courses;

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

        .notification-icon {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          cursor: pointer;
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
            <div className="notification-icon">
              🔔
            </div>
          </div>

          {/* Total Classes Enrolled */}
          <div className="section">
            <h2 className="section-title">Total Classes Enrolled</h2>
            <div className="course-grid">
              {enrolledCourses.map((course) => (
                <Link key={course.id} href={`/product/${course.slug}`} className="course-card">
                  <div className="course-image-wrap">
                    <img src={course.image} alt={course.title} className="course-image" />
                    <div className="course-teacher-wrap">
                      <img src={course.instructorImage} alt={course.instructor} className="course-instructor-image-rounded" />
                      <div>{course.instructor}</div>
                    </div>
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                        <div>{course.sections} Sections</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                        <div>{course.duration} Days</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg" alt="" className="course-meta-icon" />
                        <div>{course.students} Students</div>
                      </div>
                    </div>
                  </div>
                  <div className="course-bottom">
                    <div className="course-price-wrap">
                      <h4 className="course-price">$ {course.price.toFixed(2)} USD</h4>
                      {course.comparePrice && (
                        <div className="course-price-compare">$ {course.comparePrice.toFixed(2)} USD</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Upcoming Classes</h2>
            <div className="course-grid">
              {upcomingCourses.map((course) => (
                <Link key={course.id} href={`/product/${course.slug}`} className="course-card">
                  <div className="course-image-wrap">
                    <img src={course.image} alt={course.title} className="course-image" />
                    <div className="course-teacher-wrap">
                      <img src={course.instructorImage} alt={course.instructor} className="course-instructor-image-rounded" />
                      <div>{course.instructor}</div>
                    </div>
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                        <div>{course.sections} Sections</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                        <div>{course.duration} Days</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg" alt="" className="course-meta-icon" />
                        <div>{course.students} Students</div>
                      </div>
                    </div>
                  </div>
                  <div className="course-bottom">
                    <div className="course-price-wrap">
                      <h4 className="course-price">$ {course.price.toFixed(2)} USD</h4>
                      {course.comparePrice && (
                        <div className="course-price-compare">$ {course.comparePrice.toFixed(2)} USD</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Completed Classes */}
          <div className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Completed Classes</h2>
            <div className="course-grid">
              {completedCourses.map((course) => (
                <Link key={course.id} href={`/product/${course.slug}`} className="course-card">
                  <div className="course-image-wrap">
                    <img src={course.image} alt={course.title} className="course-image" />
                    <div className="course-teacher-wrap">
                      <img src={course.instructorImage} alt={course.instructor} className="course-instructor-image-rounded" />
                      <div>{course.instructor}</div>
                    </div>
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                        <div>{course.sections} Sections</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                        <div>{course.duration} Days</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg" alt="" className="course-meta-icon" />
                        <div>{course.students} Students</div>
                      </div>
                    </div>
                  </div>
                  <div className="course-bottom">
                    <div className="course-price-wrap">
                      <h4 className="course-price">$ {course.price.toFixed(2)} USD</h4>
                      {course.comparePrice && (
                        <div className="course-price-compare">$ {course.comparePrice.toFixed(2)} USD</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="section" style={{ marginTop: '4rem' }}>
            <div className="section-title-inline button-inline-flex-style">
              <Link href="/courses" className="button-dark">Browse Classes</Link>
              <Link href="#my-enrollments" className="button-dark">View all Enrollments</Link>
            </div>
          </div>

          {/* My Enrollments */}
          <div id="my-enrollments" className="my-enrollments">
            <h2 className="section-title">My Enrollments</h2>
            <div className="enrollment-list">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="enrollment-item">
                  <img 
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg" 
                    alt="Avatar" 
                    className="enrollment-avatar" 
                  />
                  <div className="enrollment-info">
                    <h1>Title</h1>
                  </div>
                  <div className="enrollment-info">
                    <h1>John Doe</h1>
                  </div>
                  <div className="enrollment-info">
                    <h1>Status</h1>
                  </div>
                  <div className="enrollment-status">
                    next Session Date/Time
                  </div>
                  <div className="enrollment-actions">
                    <button className="button-dark">Join Class</button>
                    <button className="button-dark">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browse Classes */}
          <div id="browse-classes" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">Browse Classes</h2>
            <div className="course-grid">
              {browseCourses.map((course) => (
                <Link key={course.id} href={`/product/${course.slug}`} className="course-card">
                  <div className="course-image-wrap">
                    <img src={course.image} alt={course.title} className="course-image" />
                    <div className="course-teacher-wrap">
                      <img src={course.instructorImage} alt={course.instructor} className="course-instructor-image-rounded" />
                      <div>{course.instructor}</div>
                    </div>
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b857_book.svg" alt="" className="course-meta-icon" />
                        <div>{course.sections} Sections</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7b8_icon-6.svg" alt="" className="course-meta-icon" />
                        <div>{course.duration} Days</div>
                      </div>
                      <div className="course-meta-item">
                        <img src="https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b7a2_icon-7.svg" alt="" className="course-meta-icon" />
                        <div>{course.students} Students</div>
                      </div>
                    </div>
                  </div>
                  <div className="course-bottom">
                    <div className="course-price-wrap">
                      <h4 className="course-price">$ {course.price.toFixed(2)} USD</h4>
                      {course.comparePrice && (
                        <div className="course-price-compare">$ {course.comparePrice.toFixed(2)} USD</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* My Profile */}
          <div id="profile" className="section" style={{ marginTop: '4rem' }}>
            <h2 className="section-title">My Profile</h2>
            <div className="profile-form">
              <form onSubmit={(e) => { e.preventDefault(); alert('Profile updated!'); }}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    className="form-input" 
                    placeholder={user?.displayName || 'Enter your name'} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interests" className="form-label">Interest/Skills</label>
                  <input 
                    type="text" 
                    id="interests" 
                    className="form-input" 
                    placeholder="Enter your interests or skills" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profileImage" className="form-label">Profile Image</label>
                  <input 
                    type="text" 
                    id="profileImage" 
                    className="form-input" 
                    placeholder="Enter image URL" 
                  />
                </div>
                <button type="submit" className="button-dark">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

