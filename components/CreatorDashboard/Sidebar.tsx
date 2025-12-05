'use client';

import { useState } from 'react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🎓' },
  { id: 'create-class', label: 'Create Class', icon: '🎓' },
  { id: 'manage-classes', label: 'Manage Classes', icon: '🎓' },
  { id: 'manage-batches', label: 'Manage Batches', icon: '🎓' },
  { id: 'class-details', label: 'Class Detail', icon: '🎓' },
  { id: 'live-class', label: 'Live Class', icon: '🎓' },
  { id: 'profile', label: 'My Profile', icon: '🎓' },
];

export default function CreatorSidebar({ activeSection, onSectionChange, onLogout }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <div className={styles.mobileNav}>
        <a href="#" className={styles.logoLinkResponsive}>
          <img
            width="200"
            loading="lazy"
            alt="Zefrix Logo"
            src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png"
            className={styles.logoImg}
          />
        </a>
        <button
          className={styles.hamburger}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          <div className={`${styles.hamburgerLine} ${styles.top} ${isMobileOpen ? styles.open : ''}`}></div>
          <div className={`${styles.hamburgerLine} ${styles.mid} ${isMobileOpen ? styles.open : ''}`}></div>
          <div className={`${styles.hamburgerLine} ${styles.bot} ${isMobileOpen ? styles.open : ''}`}></div>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <a href="#" className={styles.logoLink}>
            <div className={styles.sidebarHeader}>
              <img
                width="200"
                loading="lazy"
                alt="Zefrix Logo"
                src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png"
                className={styles.sidebarLogo}
              />
            </div>
          </a>
          <div className={styles.sidebarMenu}>
            <div className={styles.navList}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${activeSection === item.id ? styles.active : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <img
                    loading="lazy"
                    src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg"
                    alt=""
                    className={styles.navIcon}
                  />
                  <div className={styles.navText}>{item.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          id="logout-btn"
          className={`${styles.navItem} ${styles.logoutBtn}`}
          onClick={onLogout}
        >
          <img
            loading="lazy"
            src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg"
            alt=""
            className={styles.navIcon}
          />
          <div className={styles.navText}>Log Out</div>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className={styles.navOverlay}
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}
    </>
  );
}

