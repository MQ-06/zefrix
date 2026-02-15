'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="hero-section pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
      {/* Background Gradient matching batches page */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-content"
          >
            {/* <motion.div 
              className="flex items-center gap-2 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-primary text-xl">*</span>
              <motion.div 
                className="bg-primary/10 px-6 py-3 rounded-full border border-primary/20"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-primary text-base font-medium">
                  Get started with Zefrix
                </span>
              </motion.div>
              <span className="text-primary text-xl">*</span>
            </motion.div> */}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Learn Live. Build Skills. Grow Faster.
              <motion.div 
                className="inline-flex items-center gap-2 ml-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
             
                <img
                  src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b749_arrow-right.svg"
                  alt="Arrow"
                  className="w-7 h-7 ml-2"
                />
              </motion.div>
            </h1>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-gray-300 text-base md:text-lg">Live Q&A with experts</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-gray-300 text-base md:text-lg">Small batch sizes</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <p className="text-gray-300 text-base md:text-lg">Real-time feedback</p>
              </div>
            </div>

            {/* Trust Elements - Added social proof near hero */}
            <div className="flex items-center gap-6 mb-10 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b748_avatar-2.jpg"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-[#1A1A2E]"
                  />
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b747_avatar-1.jpg"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-[#1A1A2E]"
                  />
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74f_avatar-3.jpg"
                    alt="Student"
                    className="w-8 h-8 rounded-full border-2 border-[#1A1A2E]"
                  />
                </div>
                <span className="text-white text-sm font-semibold">1,000+ students learning</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <span className="text-white text-sm font-semibold ml-1">4.8/5 rating</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="my-2"
              >
                <Link
                  href="/batches"
                  className="inline-block bg-gradient-to-r from-primary to-secondary px-12 py-6 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
                >
                  Explore Live Batches
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/signup-login"
                  className="bg-transparent border-2 border-white/30 px-10 py-5 rounded-lg text-white font-semibold text-lg hover:border-white/50 hover:bg-white/5 transition-all duration-200"
                >
                  Join Free
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Images */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-images relative"
          >
            <div className="relative">
              <img
                src="/pic.png"
                alt="Hero Image"
                className="w-full h-auto rounded-2xl"
              />
              
             

              {/* Floating Card */}
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl min-w-[200px]">
                <h3 className="text-dark font-semibold mb-3">UI Design Pattern</h3>
                <div className="flex items-center gap-3">
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74f_avatar-3.jpg"
                    alt="Dennis Barrett"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-dark">Annat Mishra</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <img
                        src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74e_file.svg"
                        alt="File"
                        className="w-4 h-4"
                      />
                      <span>123 Batches</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

