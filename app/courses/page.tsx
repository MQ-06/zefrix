'use client';

import { useState, useEffect } from 'react';
import { courses } from '@/lib/data';
import CoursesPageCard from '@/components/CoursesPageCard';
import FooterCTA from '@/components/FooterCTA';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

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

export default function CoursesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase if not already loaded
    if (!window.firebaseDb) {
      const loadFirebase = () => {
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
        `;
        document.head.appendChild(script);
      };
      loadFirebase();
    }
  }, []);

  useEffect(() => {
    const fetchApprovedClasses = async () => {
      // Wait for Firebase to be ready (with timeout)
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds max wait
      while ((!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        console.warn('Firebase not ready after timeout, using fallback data');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
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
        
        setApprovedClasses(classes);
      } catch (error) {
        console.error('Error fetching approved classes:', error);
        setApprovedClasses([]);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for Firebase script to load
    const timer = setTimeout(() => {
      fetchApprovedClasses();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Convert approved classes to course format
  const allCourses = approvedClasses.length > 0 
    ? approvedClasses.map((classItem) => ({
        id: classItem.classId,
        slug: classItem.classId,
        title: classItem.title,
        subtitle: classItem.subtitle || '',
        category: classItem.category,
        categorySlug: '',
        subCategory: classItem.subCategory,
        instructor: classItem.creatorName || 'Creator',
        instructorId: '',
        instructorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(classItem.creatorName || 'Creator')}&background=D92A63&color=fff&size=128`,
        image: classItem.videoLink || 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg',
        price: classItem.price,
        originalPrice: classItem.price * 1.2,
        sections: classItem.numberSessions,
        duration: classItem.scheduleType === 'one-time' ? 1 : Math.ceil(classItem.numberSessions / 7),
        students: 0,
        level: 'Beginner' as const,
      }))
    : courses; // Fallback to mock data if no approved classes

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
            </div>
          )}

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
