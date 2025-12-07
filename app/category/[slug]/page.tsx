'use client';

import { useState, useEffect } from 'react'; 
import { notFound } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { categoryDetails } from '@/lib/categoriesData';

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

// Helper function to map category slug to category name
const slugToCategoryName: { [key: string]: string } = {
  'dance-performing-arts': 'Dance & Performing Arts',
  'music-singing': 'Music & Singing',
  'design-creativity': 'Design & Creativity',
  'content-creator-skills': 'Content & Creator Skills',
  'communication-confidence': 'Communication & Confidence',
  'wellness-lifestyle': 'Wellness & Lifestyle',
  'tech-digital-skills': 'Tech & Digital Skills',
  'cooking-culinary-arts': 'Cooking & Culinary Arts',
  'fashion-styling-beauty': 'Fashion, Styling & Beauty',
  'business-career-freelancing': 'Business, Career & Freelancing',
  'language-culture': 'Language & Culture',
  'gaming-esports': 'Gaming & Esports',
  'video-photography-filmmaking': 'Video, Photography & Filmmaking',
};

interface PageProps {
  params: {
    slug: string;
  };
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
  startISO: string;
  numberSessions: number;
  videoLink?: string;
  [key: string]: any;
}

export default function CategoryPage({ params }: PageProps) {
  const [approvedClasses, setApprovedClasses] = useState<ApprovedClass[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categoryName = slugToCategoryName[params.slug];
  const category = categoryDetails.find((c) => c.slug === params.slug);

  if (!category || !categoryName) {
    notFound();
  }

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
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        // Wait for Firebase to load
        setTimeout(fetchApprovedClasses, 500);
        return;
      }

      setLoading(true);
      try {
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(
          classesRef,
          window.where('status', '==', 'approved'),
          window.where('category', '==', categoryName)
        );
        const querySnapshot = await window.getDocs(q);
        
        const classes: ApprovedClass[] = [];
        querySnapshot.forEach((doc: any) => {
          classes.push({ classId: doc.id, ...doc.data() });
        });
        
        // Sort by creation date (newest first)
        classes.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setApprovedClasses(classes);
      } catch (error) {
        console.error('Error fetching approved classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedClasses();
  }, [categoryName]);

  return (
    <div className="pt-32 pb-16 min-h-screen">
      <div className="container">
        <div
          className="rounded-2xl p-8 md:p-12 mb-12"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #4e54c8 50%, #d81b60 100%)' }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {category.title}
          </h1>
          <p className="text-white/80 text-lg">
            Explore our {category.title.toLowerCase()} classes and enhance your
            skills.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading classes...</p>
          </div>
        ) : approvedClasses.length > 0 ? (
          <>
            <div className="mb-8 text-gray-400">
              {approvedClasses.length} class
              {approvedClasses.length !== 1 ? 'es' : ''} available
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {approvedClasses.map((classItem) => {
                // Convert Firestore class to course format for CourseCard
                const course = {
                  id: classItem.classId,
                  slug: classItem.classId, // Use classId as slug for now
                  title: classItem.title,
                  subtitle: classItem.subtitle || '',
                  category: classItem.category,
                  categorySlug: params.slug,
                  subCategory: classItem.subCategory,
                  instructor: classItem.creatorName,
                  instructorId: classItem.creatorId || '',
                  instructorImage: '',
                  image: classItem.videoLink || 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg',
                  price: classItem.price,
                  originalPrice: classItem.price * 1.2, // 20% markup for display
                  sections: classItem.numberSessions,
                  duration: classItem.scheduleType === 'one-time' ? 1 : Math.ceil(classItem.numberSessions / 7),
                  students: 0,
                  level: classItem.level as 'Beginner' | 'Intermediate' | 'Advanced' || 'Beginner',
                };
                return <CourseCard key={classItem.classId} course={course} />;
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              No approved classes available in this category yet.
            </p>
            <Link
              href="/courses"
              className="inline-block bg-primary px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity duration-200"
            >
              Browse All Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

