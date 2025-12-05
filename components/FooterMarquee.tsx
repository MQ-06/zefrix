'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FooterMarquee() {
  const items = Array(13).fill('Join for Free');

  return (
    <div className="footer-contact-marquee overflow-hidden py-8">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="inline-block"
            initial={{ x: 0 }}
            animate={{ x: '-50%' }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Link
              href="/signup-login"
              className="inline-block mx-4 px-8 py-4 border-2 border-white/30 rounded-lg text-white font-semibold text-lg hover:border-primary hover:text-primary transition-all duration-300 whitespace-nowrap"
            >
              {item}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

