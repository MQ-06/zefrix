'use client';

import { useState } from 'react';
import { courses } from '@/lib/data';
import CoursesPageCard from '@/components/CoursesPageCard';
import FooterCTA from '@/components/FooterCTA';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const COURSES_PER_PAGE = 6;

export default function CoursesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(courses.length / COURSES_PER_PAGE);
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const endIndex = startIndex + COURSES_PER_PAGE;
  const currentCourses = courses.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Hero Section - Matching Original Design */}
      <section className="hero-inner pt-32 pb-20 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Background Gradient matching home page */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
        
        <div className="container relative z-10">
          <div className="text-center position-relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            >
              Browse our courses
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto"
            >
              Also it great have set behold land third he great years midst.
            </motion.p>
            
            {/* Decorative Elements */}
            <motion.img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b74b_Decoration.svg"
              loading="lazy"
              alt=""
              className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 opacity-30 -z-10"
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 0.3, rotate: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            
            {/* Decorative X marks */}
            <div className="absolute top-20 left-10 w-4 h-4 opacity-20">
              <div className="text-green-400 text-2xl font-bold">×</div>
            </div>
            <div className="absolute top-32 right-20 w-4 h-4 opacity-20">
              <div className="text-green-400 text-2xl font-bold">×</div>
            </div>
            <div className="absolute bottom-20 left-20 w-4 h-4 opacity-20">
              <div className="text-green-400 text-2xl font-bold">×</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section className="section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {currentCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <CoursesPageCard course={course} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <div className="text-white text-lg font-medium">
                {currentPage} / {totalPages}
              </div>
              {currentPage < totalPages && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handleNextPage}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity duration-200 shadow-lg"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA Section */}
      <FooterCTA />
    </>
  );
}
