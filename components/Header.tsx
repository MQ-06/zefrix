'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const isLoginPage = pathname === '/signup-login';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/categories', label: 'Categories' },
    { href: '/instructors', label: 'Instructor' },
    { href: '/contact-us', label: 'Contact Us' },
  ];

  return (
    <>
      <style jsx global>{`
        header {
          font-family: 'Poppins', sans-serif !important;
        }
        
        header * {
          font-family: 'Poppins', sans-serif !important;
        }
      `}</style>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/69111edc833f0aade04d058d_6907f6cf8f1c1a9c8e68ea5c_logo.png"
              alt="Zefrix Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-primary transition-colors duration-200 font-medium text-base"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-white hover:text-primary transition-colors duration-200"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="text-base font-medium">{user?.name || 'User'}</span>
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-dark/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-800 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-800">
                          <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                          <p className="text-gray-400 text-xs">{user?.email}</p>
                        </div>
                        {user?.role === 'admin' && (
                          <Link
                            href="/admin-dashboard"
                            className="block px-3 py-2 text-white hover:bg-primary/20 transition-colors text-sm"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        {user?.role === 'creator' && (
                          <Link
                            href="/creator-dashboard"
                            className="block px-3 py-2 text-white hover:bg-primary/20 transition-colors text-sm"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Creator Dashboard
                          </Link>
                        )}
                        {user?.role === 'student' && (
                          <Link
                            href="/student-dashboard"
                            className="block px-3 py-2 text-white hover:bg-primary/20 transition-colors text-sm"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Student Dashboard
                          </Link>
                        )}
                        <button
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Sign out error:', error);
                            }
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-white hover:bg-red-500/20 transition-colors text-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {!isLoginPage && (
                  <Link
                    href="/signup-login"
                    className="text-white hover:text-primary transition-colors duration-200 underline text-base"
                  >
                    Login
                  </Link>
                )}
                <Link
                  href="/user-pages/become-a-creator"
                  className="bg-gradient-to-r from-primary to-secondary px-6 py-2.5 rounded-lg text-white font-medium text-base hover:opacity-90 transition-opacity duration-200"
                >
                  Become a Creator
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark/98 backdrop-blur-md border-t border-gray-800"
          >
            <nav className="container py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-white hover:text-primary transition-colors duration-200 font-medium text-base py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-3 border-t border-gray-800">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-800 mb-2">
                      <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin-dashboard"
                        className="block text-white hover:text-primary transition-colors duration-200 text-base py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'creator' && (
                      <Link
                        href="/creator-dashboard"
                        className="block text-white hover:text-primary transition-colors duration-200 text-base py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Creator Dashboard
                      </Link>
                    )}
                    {user?.role === 'student' && (
                      <Link
                        href="/student-dashboard"
                        className="block text-white hover:text-primary transition-colors duration-200 text-base py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Student Dashboard
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        try {
                          await signOut();
                        } catch (error) {
                          console.error('Sign out error:', error);
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg text-white font-medium text-base hover:opacity-90 transition-opacity duration-200 bg-red-500/20 border border-red-500/50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    {!isLoginPage && (
                      <Link
                        href="/signup-login"
                        className="block text-white hover:text-primary transition-colors duration-200 underline text-base py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    )}
                    <Link
                      href="/user-pages/become-a-creator"
                      className="block bg-gradient-to-r from-primary to-secondary px-6 py-2.5 rounded-lg text-white font-medium text-base text-center hover:opacity-90 transition-opacity duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Become a Creator
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}

