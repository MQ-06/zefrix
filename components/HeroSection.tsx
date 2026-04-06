'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, GraduationCap, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Background Video */}
      <video
        src="/uploads/hero_page_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(to bottom, rgba(15,10,30,0.72) 0%, rgba(20,10,35,0.78) 50%, rgba(15,10,30,0.90) 100%)'
      }} />
      {/* Subtle pink accent on right */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'radial-gradient(ellipse at 80% 50%, rgba(233,30,99,0.18) 0%, transparent 60%)'
      }} />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6"
        style={{ minHeight: '100vh', paddingTop: '96px', paddingBottom: '64px' }}
      >

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-pulse inline-block"></span>
            Live Batches Now Open
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-bold text-white leading-tight mb-5 max-w-4xl"
          style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}
        >
          Learn Dance Live.{' '}
          <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
            From Real Performers.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 max-w-xl mb-8 leading-relaxed"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)' }}
        >
          Join small live batches in Bollywood, Hip-Hop &amp; Freestyle.
          Get real-time feedback. Perform with confidence in weeks.
        </motion.p>

        {/* Pill tags */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {[
            { icon: <Video className="w-3.5 h-3.5 text-[#FACC15]" />, label: 'Live sessions only' },
            { icon: <GraduationCap className="w-3.5 h-3.5 text-[#FACC15]" />, label: 'Beginner to Advanced' },
            { icon: <Zap className="w-3.5 h-3.5 text-[#FACC15]" />, label: 'Real-time feedback' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-xs sm:text-sm px-4 py-2 rounded-full"
            >
              {icon}
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/batches"
              className="inline-block bg-gradient-to-r from-[#E91E63] to-[#f97316] text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition-opacity duration-200"
              style={{ padding: '14px 36px', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}
            >
              Explore Live Batches
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/signup-login"
              className="inline-block bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
              style={{ padding: '14px 36px', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}
            >
              Join Free
            </Link>
          </motion.div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {[
              'https://i.pravatar.cc/40?img=1',
              'https://i.pravatar.cc/40?img=5',
              'https://i.pravatar.cc/40?img=9',
              'https://i.pravatar.cc/40?img=12',
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Student"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-white/40 object-cover"
              />
            ))}
          </div>
          <p className="text-white/70 text-sm">
            <span className="text-[#FACC15] font-semibold">500+</span> students already learning
          </p>
        </motion.div>

      </div>
    </section>
  );
}
