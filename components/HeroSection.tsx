'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f0a1e]" style={{ minHeight: '100vh' }}>
      {/* Background Video (left side backdrop) */}
      <video
        src="/uploads/hero_page_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Dark overlay over the whole section */}
      <div
        className="absolute inset-0 z-[1]"
        style={{ background: 'rgba(10,6,24,0.72)' }}
      />

      {/* Main layout */}
      <div
        className="relative z-10 flex flex-col lg:flex-row"
        style={{ minHeight: '100vh' }}
      >
        {/* LEFT: Text content */}
        <div
          className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24"
          style={{ paddingTop: '110px', paddingBottom: '64px' }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-extrabold text-white leading-tight mb-5 whitespace-nowrap"
            style={{ fontSize: 'clamp(1rem, 3.2vw, 3.5rem)' }}
          >
            Learn Dance Live. From Real Performers.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-gray-200 mb-6 leading-relaxed"
            style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', maxWidth: '520px' }}
          >
            Join small live batches in Bollywood, Hip-Hop &amp; Freestyle.
            Get real-time feedback. Perform with confidence in weeks.
          </motion.p>

          {/* Bullet points */}
          <motion.ul
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="space-y-3 mb-10"
          >
            {[
              'Live dance sessions (not recorded)',
              'Beginner to advanced batches',
              'Real-time feedback',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white" style={{ fontSize: 'clamp(0.9rem, 1.6vw, 1rem)' }}>
                <span
                  className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#E91E63' }}
                />
                {item}
              </li>
            ))}
          </motion.ul>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/batches"
              className="inline-block font-semibold text-white rounded-xl shadow-lg hover:opacity-90 transition-opacity duration-200"
              style={{
                padding: '14px 32px',
                fontSize: 'clamp(0.9rem, 1.6vw, 1rem)',
                background: 'linear-gradient(90deg, #E91E63 0%, #f97316 100%)',
              }}
            >
              Explore Live Batches
            </Link>
            <Link
              href="/signup-login"
              className="inline-block font-semibold text-white rounded-xl border border-white/40 hover:bg-white/10 transition-all duration-200"
              style={{
                padding: '14px 32px',
                fontSize: 'clamp(0.9rem, 1.6vw, 1rem)',
                background: 'rgba(255,255,255,0.07)',
              }}
            >
              Join Free
            </Link>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
