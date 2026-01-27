'use client';

import Link from 'next/link';
import { Shield, CheckCircle } from 'lucide-react';

export default function Footer() {
  const marqueeItems = Array(13).fill('Join for Free');

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/batches', label: 'Live Batches' },
    { href: '/categories', label: 'Browse Categories' },
    { href: '/creators', label: 'Expert Creators' },
    { href: '/contact-us', label: 'Contact Us' },
  ];

  const learnLinks = [
    { href: '/batches', label: 'Online Workshops' },
    { href: '/batches', label: 'Live Skill Classes' },
    { href: '/batches', label: 'Interactive Learning' },
    { href: '/creators', label: 'Learn from Experts' },
  ];

  const accountLinks = [
    { href: '/signup-login', label: 'Sign Up / Login' },
    { href: '/user-pages/become-a-creator', label: 'Become a Creator' },
    { href: '/user-pages/dashboard', label: 'My Dashboard' },
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61581972350122',
      icon: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b890_facebook-dark.svg',
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/zefrix_app/',
      icon: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b898_instagram-dark.svg',
    },
    {
      name: 'LinkedIn',
      href: 'https://in.linkedin.com/company/zefrix',
      icon: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b891_linkedin-dark.svg',
    },
    {
      name: 'Twitter',
      href: 'https://x.com/Zefrix_app',
      icon: 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b897_twitter-dark.svg',
    },
  ];

  return (
    <footer className="bg-gradient-to-b from-[#1A1A2E] to-[#1A1A2E] border-t border-gray-800 relative overflow-hidden">
      {/* Marquee at the top */}
      <div className="footer-contact-marquee overflow-hidden py-4 border-b border-gray-800">
        <div className="footer-contact-marquee-items flex gap-4" style={{ width: 'max-content' }}>
          {/* First set */}
          {marqueeItems.map((item, i) => (
            <Link
              key={i}
              href="/signup-login"
              className="footer-contact-marquee-item flex-shrink-0 px-6 py-2 border border-white/30 rounded-lg text-white font-medium text-sm hover:border-[#FF6B9D] hover:text-[#FF6B9D] transition-all duration-300 whitespace-nowrap"
            >
              {item}
            </Link>
          ))}
          {marqueeItems.map((item, i) => (
            <Link
              key={`dup-${i}`}
              href="/signup-login"
              className="footer-contact-marquee-item flex-shrink-0 px-6 py-2 border border-white/30 rounded-lg text-white font-medium text-sm hover:border-[#FF6B9D] hover:text-[#FF6B9D] transition-all duration-300 whitespace-nowrap"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          {/* Logo and Social */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/69111edc833f0aade04d058d_6907f6cf8f1c1a9c8e68ea5c_logo.png"
                alt="Zefrix - Live Skill Sharing Platform"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-sm">
              Join live interactive classes with expert creators. Learn skills in real-time through workshops and online courses.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#FF6B9D] transition-colors duration-200"
                  aria-label={social.name}
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-5 h-5"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#FF6B9D] transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn (SEO-friendly keyword-rich links) */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Learn</h3>
            <ul className="space-y-3">
              {learnLinks.map((link, index) => (
                <li key={`${link.href}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#FF6B9D] transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Account</h3>
            <ul className="space-y-3">
              {accountLinks.map((link, index) => (
                <li key={`${link.href}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#FF6B9D] transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Zefrix. All rights reserved.
              </p>
              
              {/* Trust Badges */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400 text-xs">Secure Platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-xs">Trusted by 1000+</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-[#FF6B9D] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-[#FF6B9D] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

