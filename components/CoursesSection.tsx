'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { courses } from '@/lib/data';
import CourseCard from './CourseCard';

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
        
        // Sort by creation date (newest first) and take first 6
        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setApprovedClasses(classes.slice(0, 6));
      } catch (error) {
        console.error('Error fetching approved classes:', error);
        // Fallback to mock data if Firestore fails
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

  // Use approved classes if available, otherwise fallback to mock data
  const featuredCourses = approvedClasses.length > 0 
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
    : courses.slice(0, 6);

  return (
    <section className="section-spacing-bottom">
      <div className="container">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Browse our courses
          </h2>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/courses"
              className="bg-gradient-to-r from-primary to-secondary px-8 py-4 rounded-lg text-white font-semibold text-lg hover:opacity-90 transition-opacity duration-200 shadow-lg"
            >
              View all courses
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course, index) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

