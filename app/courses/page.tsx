'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import CoursesPageCard from '@/components/CoursesPageCard';
import FooterCTA from '@/components/FooterCTA';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { DEFAULT_COURSE_IMAGE } from '@/lib/constants';
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
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize Firebase query functions if missing
    if (typeof window === 'undefined') return;
    
    // Check if Firebase is already fully initialized
    if (window.firebaseDb && window.collection && window.query && window.where && window.getDocs) {
      console.log('✅ Firebase already initialized with all functions');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('firebaseReady'));
      }, 100);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[data-firebase-courses-init]');
    if (existingScript) {
      // Script already exists, wait for firebaseReady event
      return;
    }

    // Create script to add query functions
    const script = document.createElement('script');
    script.type = 'module';
    script.setAttribute('data-firebase-courses-init', 'true');
    script.textContent = `
      import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      
      // Wait for firebaseDb to be available (from AuthContext)
      const checkAndSetFunctions = () => {
        if (window.firebaseDb) {
          // Set query functions
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          
          // Verify they're set
          if (window.collection && window.query && window.where && window.getDocs) {
            console.log('✅ Firebase query functions added successfully');
            window.dispatchEvent(new CustomEvent('firebaseReady'));
          } else {
            console.error('❌ Failed to set query functions');
            // Retry after a short delay
            setTimeout(checkAndSetFunctions, 200);
          }
        } else {
          // Retry after a short delay
          setTimeout(checkAndSetFunctions, 200);
        }
      };
      
      checkAndSetFunctions();
    `;
    script.onerror = () => {
      console.error('❌ Failed to load Firebase script');
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    const MAX_RETRIES = 20; // Increased retries
    let retryCount = 0;
    let eventListenerAdded = false;
    let eventHandler: (() => void) | null = null;

    const fetchCourses = async () => {
      // Wait for Firebase to be ready - check ALL required functions
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        // Listen for firebaseReady event on first attempt only
        if (!eventListenerAdded) {
          eventListenerAdded = true;
          eventHandler = () => {
            console.log('✅ firebaseReady event received, retrying fetch...');
            window.removeEventListener('firebaseReady', eventHandler!);
            if (isMounted) {
              retryCount = 0; // Reset retry count when Firebase is ready
              fetchCourses();
            }
          };
          window.addEventListener('firebaseReady', eventHandler);
          console.log('👂 Listening for firebaseReady event...');
        }
        
        // Retry with increasing delay
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(200 * retryCount, 1000); // Max 1 second delay
          if (retryCount % 3 === 0) {
            console.log(`⏳ Waiting for Firebase... (attempt ${retryCount}/${MAX_RETRIES})`, {
              firebaseDb: !!window.firebaseDb,
              collection: !!window.collection,
              query: !!window.query,
              where: !!window.where,
              getDocs: !!window.getDocs
            });
          }
          timeoutId = setTimeout(fetchCourses, delay);
          return;
        } else {
          console.error('❌ Firebase failed to load after maximum retries');
          console.error('Firebase state:', {
            firebaseDb: !!window.firebaseDb,
            collection: !!window.collection,
            query: !!window.query,
            where: !!window.where,
            getDocs: !!window.getDocs
          });
          if (eventHandler) {
            window.removeEventListener('firebaseReady', eventHandler);
          }
          if (isMounted) {
            setLoading(false);
            setApprovedClasses([]);
          }
          return;
        }
      }
      
      // Reset retry count on success
      retryCount = 0;
      if (eventHandler) {
        window.removeEventListener('firebaseReady', eventHandler);
        eventHandler = null;
        eventListenerAdded = false;
      }
      console.log('✅ Firebase is ready, fetching courses...');

      if (!isMounted) return;

      setLoading(true);
      try {
        // Double-check all functions are available before using them
        if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
          console.error('❌ Firebase functions not available when trying to fetch');
          if (isMounted) {
            setLoading(false);
            setApprovedClasses([]);
          }
          return;
        }

        console.log('📦 Fetching approved classes...');
        const startTime = performance.now();
        
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(classesRef, window.where('status', '==', 'approved'));
        
        // Use getDocs for one-time fetch (much faster than onSnapshot)
        const snapshot = await window.getDocs(q);
        
        const classes: ApprovedClass[] = [];
        snapshot.forEach((doc: any) => {
          classes.push({ classId: doc.id, ...doc.data() });
        });
        
        const endTime = performance.now();
        console.log(`✅ Loaded ${classes.length} approved classes in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Sort by creation date (newest first)
        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // Fetch enrollment counts for all classes
        if (classes.length > 0 && window.collection && window.query && window.where && window.getDocs) {
          try {
            const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
            
            // Fetch enrollment counts for all classes in parallel
            const enrollmentPromises = classes.map(async (classItem) => {
              try {
                const enrollmentsQuery = window.query(
                  enrollmentsRef,
                  window.where('classId', '==', classItem.classId)
                );
                const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
                return {
                  classId: classItem.classId,
                  enrollmentCount: enrollmentsSnapshot.size
                };
              } catch (error) {
                console.error(`Error fetching enrollment count for class ${classItem.classId}:`, error);
                return {
                  classId: classItem.classId,
                  enrollmentCount: 0
                };
              }
            });

            const enrollmentCounts = await Promise.all(enrollmentPromises);
            
            // Add enrollment counts to classes
            const enrollmentMap = new Map(
              enrollmentCounts.map(ec => [ec.classId, ec.enrollmentCount])
            );
            
            classes.forEach(classItem => {
              (classItem as any).enrollmentCount = enrollmentMap.get(classItem.classId) || 0;
            });
          } catch (error) {
            console.error('Error fetching enrollment counts:', error);
            // Continue without enrollment counts if fetch fails
            classes.forEach(classItem => {
              (classItem as any).enrollmentCount = 0;
            });
          }
        }
        
        if (isMounted) {
          setApprovedClasses(classes);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('❌ Error fetching classes:', error);
        // Prevent error from propagating to Next.js error boundary
        if (isMounted) {
          try {
            setApprovedClasses([]);
            setLoading(false);
          } catch (setStateError) {
            // Silently handle setState errors during unmount
            console.warn('Component unmounted during error handling');
          }
        }
      }
    };
    
    fetchCourses();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (eventHandler) {
        window.removeEventListener('firebaseReady', eventHandler);
      }
    };
  }, []);

  // Convert approved classes to course format (only real classes, no dummy data)
  const allCourses = approvedClasses.map((classItem) => ({
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
    image: (classItem.videoLink && classItem.videoLink.trim() !== '') ? classItem.videoLink : DEFAULT_COURSE_IMAGE,
    price: classItem.price,
    originalPrice: classItem.price * 1.2,
    sections: classItem.numberSessions, // This is actually sessions, but kept as 'sections' for component compatibility
    duration: classItem.scheduleType === 'one-time' ? 1 : Math.ceil(classItem.numberSessions / 7),
    students: (classItem as any).enrollmentCount || 0, // Use actual enrollment count
    level: 'Beginner' as const,
  }));
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

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
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
              Discover live, interactive classes taught by expert creators. Learn new skills, connect with mentors, and grow in real-time.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-48 bg-gray-700"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                      <div className="flex items-center justify-between pt-4">
                        <div className="h-8 bg-gray-700 rounded w-24"></div>
                        <div className="h-10 bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                    className="h-full"
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
              {currentPage > 1 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handlePrevPage}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity duration-200 shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                </motion.div>
              )}
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
