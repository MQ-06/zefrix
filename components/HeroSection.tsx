'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="hero-section pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
      {/* Background Gradient matching courses page */}
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
            <motion.div 
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
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find suitable courses from the{' '}
              <span className="relative inline-block">
                best
                <motion.div 
                  className="absolute -right-8 top-0 flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b748_avatar-2.jpg"
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-white"
                    whileHover={{ scale: 1.1 }}
                  />
                  <motion.img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b747_avatar-1.jpg"
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-white -ml-4"
                    whileHover={{ scale: 1.1 }}
                  />
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b749_arrow-right.svg"
                    alt="Arrow"
                    className="w-7 h-7 ml-2"
                  />
                </motion.div>
              </span>{' '}
              mentors
            </h1>

            <p className="text-gray-300 text-base md:text-lg mb-10 leading-relaxed">
              The good gathering doesn't bearing day stars over open behold may
              male tree replenish don't blessed beast days earth fifth let
              multiply and he every blessed.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/courses"
                  className="bg-gradient-to-r from-primary to-secondary px-10 py-5 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
                >
                  Start Learning
                </Link>
              </motion.div>
              <motion.a
                href="#"
                className="flex items-center gap-4 text-white hover:text-primary transition-colors duration-200 group"
                whileHover={{ x: 5 }}
              >
                <span className="text-lg font-medium">Watch Video</span>
                <motion.div 
                  className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center group-hover:border-primary transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                >
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </motion.div>
              </motion.a>
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
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b746_hero-image.jpg"
                alt="Hero Image"
                className="w-full h-auto rounded-2xl"
              />
              
              {/* Decorative Elements */}
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74b_Decoration.svg"
                alt="Decoration"
                className="absolute top-0 left-0 w-32 h-32 -z-10"
              />
              
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74c_hero-image-3.jpg"
                alt="Hero Image 3"
                className="absolute top-4 right-4 w-24 h-24 rounded-lg border-2 border-white shadow-lg"
              />
              
              <img
                src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74d_hero-image-2.jpg"
                alt="Hero Image 2"
                className="absolute bottom-4 left-4 w-32 h-32 rounded-lg border-2 border-white shadow-lg"
              />

              {/* Floating Card */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl min-w-[200px]">
                <h3 className="text-dark font-semibold mb-3">UI Design Pattern</h3>
                <div className="flex items-center gap-3">
                  <img
                    src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74f_avatar-3.jpg"
                    alt="Dennis Barrett"
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-dark">Dennis Barrett</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <img
                        src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74e_file.svg"
                        alt="File"
                        className="w-4 h-4"
                      />
                      <span>123 Courses</span>
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

