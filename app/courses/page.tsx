'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import CoursesPageCard from '@/components/CoursesPageCard';
import FooterCTA from '@/components/FooterCTA';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useReliableFetch } from '@/app/hooks/useReliableFetch';
import { isClient } from '@/app/utils/environment';

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

interface ApprovedClass {
  classId: string;
  title: string;
  subtitle?: string;
  category: string;
  subCategory: string;
  creatorName: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  numberSessions: number;
  videoLink?: string;
  createdAt: any;
  [key: string]: any;
}

const COURSES_PER_PAGE = 6;

function CoursesContent() {
  const [currentPage, setCurrentPage] = useState(1);

  // Use reliable fetch hook with retry logic
  const { data: approvedClasses = [], loading } = useReliableFetch<ApprovedClass[]>({
    fetchFn: async () => {
      // Wait for Firebase to be ready
      if (!isClient || typeof window === 'undefined') {
        throw new Error('Client-side only');
      }

      // Wait for Firebase to initialize
      let attempts = 0;
      while (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        if (attempts++ > 50) {
          throw new Error('Firebase initialization timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // If Firebase is not initialized, try to initialize it
      if (!window.firebaseDb) {
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
          import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
          import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
          
          const firebaseConfig = {
            apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
            authDomain: "zefrix-custom.firebaseapp.com",
            projectId: "zefrix-custom",
            storageBucket: "zefrix-custom.firebasestorage.app",
            messagingSenderId: "50732408558",
            appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
            measurementId: "G-27HS1SWB5X"
          };
          
          const app = initializeApp(firebaseConfig);
          window.firebaseDb = getFirestore(app);
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          window.dispatchEvent(new CustomEvent('firebaseReady'));
        `;
        document.head.appendChild(script);
        
        // Wait for Firebase to be ready
        await new Promise<void>((resolve) => {
          const handleReady = () => {
            window.removeEventListener('firebaseReady', handleReady);
            resolve();
          };
          window.addEventListener('firebaseReady', handleReady);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            window.removeEventListener('firebaseReady', handleReady);
            resolve();
          }, 5000);
        });
      }

      // Fetch classes
      console.log('Fetching approved classes from Firestore...');
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('status', '==', 'approved'));
      const querySnapshot = await window.getDocs(q);
      
      const classes: ApprovedClass[] = [];
      querySnapshot.forEach((doc: any) => {
        classes.push({ classId: doc.id, ...doc.data() });
      });
      
      console.log(`Found ${classes.length} approved classes`);
      
      // Sort by creation date (newest first)
      classes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      return classes;
    },
    retries: 2,
    retryDelay: 1000
  });

  // Convert approved classes to course format (only real classes, no dummy data)
  const allCourses = (approvedClasses || []).map((classItem) => {
    const image =
      classItem.videoLink && classItem.videoLink.trim() !== ''
        ? classItem.videoLink
        : 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg';

    console.log('🎨 Course image mapping (courses page)', {
      classId: classItem.classId,
      videoLink: classItem.videoLink,
      finalImage: image,
    });

    return {
      id: classItem.classId,
      slug: classItem.classId,
      title: classItem.title,
      subtitle: classItem.subtitle || '',
      category: classItem.category,
      categorySlug: '',
      subCategory: classItem.subCategory,
      instructor: classItem.creatorName || 'Creator',
      instructorId: '',
      instructorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        classItem.creatorName || 'Creator'
      )}&background=D92A63&color=fff&size=128`,
      image,
      price: classItem.price,
      originalPrice: classItem.price * 1.2,
      sections: classItem.numberSessions,
      duration:
        classItem.scheduleType === 'one-time'
          ? 1
          : Math.ceil(classItem.numberSessions / 7),
      students: 0,
      level: 'Beginner' as const,
    };
  });

  const totalPages = Math.ceil(allCourses.length / COURSES_PER_PAGE);
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
  const endIndex = startIndex + COURSES_PER_PAGE;
  const currentCourses = allCourses.slice(startIndex, endIndex);

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
            
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section className="section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Loading courses...</p>
            </div>
          ) : currentCourses.length > 0 ? (
            <>
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
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">
                No approved classes available yet.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Join over 1,000 satisfied learners today.
              </p>
              <Link
                href="/signup-login"
                className="inline-block bg-gradient-to-r from-[#E91E63] to-[#FF6B9D] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300"
              >
                Signup today!
              </Link>
            </div>
          )}

          {/* Pagination */}
          {allCourses.length > 0 && totalPages > 1 && (
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

// Loading skeleton component
function CoursesLoadingSkeleton() {
  return (
    <>
      <section className="hero-inner pt-32 pb-20 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
        <div className="container relative z-10">
          <div className="text-center position-relative">
            <div className="h-12 bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-96 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
      <section className="section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="text-center py-12">
            <div className="h-6 bg-gray-600 rounded w-48 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
    </>
  );
}

// Main page component with Suspense
export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesLoadingSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}
