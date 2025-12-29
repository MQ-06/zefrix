'use client';

import { useState } from 'react';
import NotificationBadge from '@/components/Notifications/NotificationBadge';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userId?: string;
}

export default function CreatorSidebar({ activeSection, onSectionChange, onLogout, userId }: SidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    onSectionChange(section);
  };

  return (
    <>
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f9_6907f6cf8f1c1a9c8e68ea5c_logo.png" alt="Zefrix" />
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => handleNavClick(e, 'dashboard')} className={`sidebar-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Dashboard</div>
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'notifications')} className={`sidebar-nav-item ${activeSection === 'notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Notifications</div>
            {userId && <NotificationBadge userId={userId} />}
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'analytics')} className={`sidebar-nav-item ${activeSection === 'analytics' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Analytics</div>
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'create-class')} className={`sidebar-nav-item ${activeSection === 'create-class' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Create Class</div>
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'manage-classes')} className={`sidebar-nav-item ${activeSection === 'manage-classes' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Manage Classes</div>
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'enrollments')} className={`sidebar-nav-item ${activeSection === 'enrollments' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>All Enrollments</div>
          </a>
          <a href="#" onClick={(e) => handleNavClick(e, 'profile')} className={`sidebar-nav-item ${activeSection === 'profile' ? 'active' : ''}`}>
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>My Profile</div>
          </a>
        </nav>
        <div className="sidebar-footer">
          <a onClick={onLogout} className="sidebar-nav-item">
            <img src="https://cdn.prod.website-files.com/6923f28a8b0eed43d400c88f/69240445896e5738fe2f22f1_icon-19.svg" alt="" />
            <div>Log Out</div>
          </a>
        </div>
      </div>

      {/* Mobile Hamburger */}
      <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <div className={`hamburger-line ${isMenuOpen ? 'top open' : ''}`}></div>
        <div className={`hamburger-line ${isMenuOpen ? 'mid open' : ''}`}></div>
        <div className={`hamburger-line ${isMenuOpen ? 'bot open' : ''}`}></div>
      </div>

      {/* Overlay to close menu on mobile */}
      {isMenuOpen && (
        <div 
          className="creator-nav-overlay" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </>
  );
}

