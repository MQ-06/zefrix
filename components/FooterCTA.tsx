'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FooterCTA() {
  return (
    <div className="cta-section section-spacing-bottom">
      <div className="container">
        <div className="cta-small glass-box bg-[#2D2D44]/50 backdrop-blur-md rounded-2xl p-8 md:p-12 relative overflow-hidden max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <h5 className="no-margin text-white font-bold text-xl md:text-2xl">
              Join over 1,000 satisfied learners today.
            </h5>
            <Link
              href="/user-pages/sign-up"
              className="button-dark lg bg-gradient-to-r from-[#E91E63] to-[#FF6B9D] text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300 whitespace-nowrap"
            >
              Signup today!
            </Link>
          </div>
          <img
            src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7dd_element-9.svg"
            loading="lazy"
            alt=""
            className="element-images-fifteen absolute top-0 left-0 w-24 h-24 opacity-20 -z-0"
          />
        </div>
      </div>
    </div>
  );
}
