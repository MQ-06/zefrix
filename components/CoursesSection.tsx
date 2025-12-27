'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CourseCard from './CourseCard';
import { DEFAULT_COURSE_IMAGE } from '@/lib/constants';

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    onSnapshot: any;
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

export default function CoursesSection() {
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
          import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
          
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
          window.onSnapshot = onSnapshot;
        `;
        document.head.appendChild(script);
      };
      loadFirebase();
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadClasses = () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
        return () => {}; // Return empty cleanup function
      }

      setLoading(true);
      try {
        console.log('Setting up real-time listener for approved classes...');
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(classesRef, window.where('status', '==', 'approved'));
        
        // Set up real-time listener
        const unsub = window.onSnapshot(q, (snapshot: any) => {
          const classes: ApprovedClass[] = [];
          snapshot.forEach((doc: any) => {
            classes.push({ classId: doc.id, ...doc.data() });
          });
          
          console.log(`✅ Real-time update: Found ${classes.length} approved classes`);
          
          // Sort by creation date (newest first) and take first 6
          classes.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          setApprovedClasses(classes.slice(0, 6));
          setLoading(false);
        }, (error: any) => {
          console.error('Error in real-time listener:', error);
          setApprovedClasses([]);
          setLoading(false);
        });

        return unsub; // Return cleanup function
      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        setApprovedClasses([]);
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };

    // Check if Firebase is already ready
    if (window.firebaseDb && window.collection && window.query && window.where && window.onSnapshot) {
      unsubscribe = loadClasses();
    } else {
      // Listen for firebaseReady event
      const handleFirebaseReady = () => {
        if (!unsubscribe) {
          unsubscribe = loadClasses();
        }
      };

      window.addEventListener('firebaseReady', handleFirebaseReady);

      // Fallback: try after a delay if event doesn't fire
      timeoutId = setTimeout(() => {
        if (window.firebaseDb && window.collection && window.query && window.where && window.onSnapshot) {
          if (!unsubscribe) {
            unsubscribe = loadClasses();
          }
        } else {
          console.warn('Firebase not ready after timeout');
          setLoading(false);
        }
      }, 5000);

      return () => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Map approved classes to course format (only real classes, no dummy data)
  const featuredCourses = approvedClasses.map((classItem) => ({
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
    image: classItem.videoLink || DEFAULT_COURSE_IMAGE,
    price: classItem.price,
    originalPrice: classItem.price * 1.2,
    sections: classItem.numberSessions,
    duration: classItem.scheduleType === 'one-time' ? 1 : Math.ceil(classItem.numberSessions / 7),
    students: 0,
    level: 'Beginner' as const,
  }));

  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-8 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Browse our courses
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/courses"
              className="inline-block w-full sm:w-auto text-center bg-gradient-to-r from-primary to-secondary px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-white font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
            >
              View all courses
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading courses...</p>
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              No classes available yet.
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Check back soon for new courses!
            </p>
            <Link
              href="/signup-login"
              className="inline-block bg-gradient-to-r from-[#E91E63] to-[#FF6B9D] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300"
            >
              Signup today!
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

