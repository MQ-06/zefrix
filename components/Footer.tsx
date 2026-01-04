'use client';

import Link from 'next/link';

export default function Footer() {
  const marqueeItems = Array(13).fill('Join for Free');

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/courses', label: 'Courses' },
    { href: '/categories', label: 'Categories' },
    { href: '/instructor', label: 'Creators' },
    { href: '/contact-us', label: 'Contact Us' },
  ];

  const otherLinks = [
    { href: '/signup-login', label: 'Sign Up / Login' },
    { href: '/user-pages/become-a-creator', label: 'Become a Creator' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Logo and Social */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/69111edc833f0aade04d058d_6907f6cf8f1c1a9c8e68ea5c_logo.png"
                alt="Zefrix Logo"
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4 mb-6">
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
            <p className="text-gray-400 text-sm">
              Zefrix @ {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#FF6B9D] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Other Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Other Links</h3>
            <ul className="space-y-3">
              {otherLinks.map((link, index) => (
                <li key={`${link.href}-${link.label}-${index}`}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#FF6B9D] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

