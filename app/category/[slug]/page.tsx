'use client';

import { useState, useEffect } from 'react'; 
import { notFound, usePathname } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, BookOpen, Users, Clock, Award } from 'lucide-react';
import { categoryDetails } from '@/lib/categoriesData';

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

// Helper function to map category slug to category name
const slugToCategoryName: { [key: string]: string } = {
  'dance-performing-arts': 'Dance & Performing Arts',
  'music-singing': 'Music & Singing',
  'design-creativity': 'Design & Creativity',
  'content-creator-skills': 'Content & Creator Skills',
  'communication-confidence': 'Communication & Confidence',
  'wellness-lifestyle': 'Wellness & Lifestyle',
  'tech-digital-skills': 'Tech & Digital Skills',
  'art-craft-diy': 'Art, Craft & DIY',
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
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupListener = () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
        retryTimeout = setTimeout(setupListener, 500);
        return;
      }

      setLoading(true);
      try {
        console.log(`📦 Setting up listener for category: "${categoryName}" (slug: ${params.slug})`);
        const classesRef = window.collection(window.firebaseDb, 'classes');
        
        // Query only for approved status, then filter by category in memory
        // This helps with debugging and handles case sensitivity issues
        const q = window.query(
          classesRef,
          window.where('status', '==', 'approved')
        );
        
        unsubscribe = window.onSnapshot(q, (snapshot: any) => {
          const allClasses: ApprovedClass[] = [];
          const categoryClasses: ApprovedClass[] = [];
          
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            const classData = { classId: doc.id, ...data };
            allClasses.push(classData);
            
            // Case-insensitive category matching
            if (data.category && data.category.toLowerCase() === categoryName.toLowerCase()) {
              categoryClasses.push(classData);
              console.log(`✅ Matched class: "${data.title}" in category "${data.category}"`);
            }
          });
          
          console.log(`📊 Total approved classes: ${allClasses.length}`);
          console.log(`📊 Classes in "${categoryName}": ${categoryClasses.length}`);
          
          if (categoryClasses.length === 0 && allClasses.length > 0) {
            console.log(`⚠️ Available categories in database:`, [...new Set(allClasses.map(c => c.category))]);
          }
          
          // Sort by creation date (newest first)
          categoryClasses.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          setApprovedClasses(categoryClasses);
          setLoading(false);
        }, (error: any) => {
          console.error('❌ Error in real-time listener:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('❌ Error setting up real-time listener:', error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [categoryName, params.slug]);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.seoTitle,
    "description": category.seoDescription,
    "url": `https://zefrix.com/category/${params.slug}`,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Zefrix",
      "url": "https://zefrix.com"
    },
    "about": {
      "@type": "Course",
      "name": category.title,
      "description": category.seoDescription,
      "provider": {
        "@type": "Organization",
        "name": "Zefrix"
      }
    }
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{category.seoTitle}</title>
        <meta name="description" content={category.seoDescription} />
        <meta name="keywords" content={category.keywords.join(', ')} />
        <meta property="og:title" content={category.seoTitle} />
        <meta property="og:description" content={category.seoDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://zefrix.com/category/${params.slug}`} />
      </Head>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="pt-32 pb-20 min-h-screen bg-gradient-to-b from-dark via-dark to-dark-light">
        <div className="container">
        {/* Modern Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden mb-20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-dark-light to-dark"></div>
          <div className="absolute inset-0 bg-[url('https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7a8_divider-2.svg')] opacity-5"></div>
          <div className="absolute inset-0 border border-gray-800 rounded-3xl"></div>
          
          <div className="relative p-10 md:p-16 lg:p-20">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
              <span className="text-primary font-semibold text-lg">Featured Category</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl">
              {category.seoTitle}
            </h1>
            
            <p className="text-gray-300 text-xl md:text-2xl leading-relaxed max-w-3xl mb-10">
              {category.seoDescription}
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 mb-12">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-white font-bold text-2xl">1000+</p>
                  <p className="text-gray-400 text-sm">Active Students</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary" />
                <div>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-700 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-white font-bold text-2xl">{approvedClasses.length}</p>
                  )}
                  <p className="text-gray-400 text-sm">Live Batches</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-white font-bold text-2xl">Expert</p>
                  <p className="text-gray-400 text-sm">Instructors</p>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {category.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 bg-dark-light/50 backdrop-blur-sm border border-gray-800 rounded-xl p-5 hover:border-primary/50 transition-all duration-300"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-white text-base leading-relaxed">{benefit}</p>
                </motion.div>
              ))}
            </div>

            {/* Keywords Pills */}
            <div className="flex flex-wrap gap-3">
              {category.keywords.slice(0, 5).map((keyword, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-full text-white text-sm font-medium hover:from-primary/30 hover:to-secondary/30 transition-all duration-300"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-lg">Loading amazing batches...</p>
          </div>
        ) : approvedClasses.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Available Batches
              </h2>
              <p className="text-gray-400 text-lg">
                {approvedClasses.length} live {approvedClasses.length !== 1 ? 'classes' : 'class'} ready to join
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {approvedClasses.map((classItem) => {
                // Fix image URL - ensure it uses correct protocol
                let imageUrl = 'https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg';
                
                if (classItem.videoLink && classItem.videoLink.trim() !== '') {
                  const videoLink = classItem.videoLink.trim();
                  // If it's a relative path starting with /uploads, convert to http://localhost:3000
                  if (videoLink.startsWith('/uploads')) {
                    imageUrl = `http://localhost:3000${videoLink}`;
                  } else if (videoLink.startsWith('http://') || videoLink.startsWith('https://')) {
                    imageUrl = videoLink;
                  } else {
                    imageUrl = videoLink;
                  }
                }

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
                  image: imageUrl,
                  price: classItem.price,
                  originalPrice: classItem.price * 1.2, // 20% markup for display
                  comparePrice: classItem.price * 1.2, // Add comparePrice for "Save" display
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-gradient-to-br from-dark-light/50 to-dark/50 backdrop-blur-sm rounded-3xl border border-gray-800"
          >
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse"></div>
                <BookOpen className="w-12 h-12 text-primary relative z-10" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">No Batches Available Yet</h3>
              <p className="text-gray-400 text-lg mb-2">
                We're currently preparing exciting {category.title.toLowerCase()} classes for you!
              </p>
              <p className="text-gray-500 text-base">
                Check back soon or explore other categories
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/batches"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary px-8 py-4 rounded-xl text-white font-semibold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse All Batches
                <span>→</span>
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center gap-2 bg-dark-light border border-gray-700 px-8 py-4 rounded-xl text-white font-semibold hover:border-primary transition-all duration-300"
              >
                View All Categories
              </Link>
            </div>
          </motion.div>
        )}

        {/* SEO Content Section - Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="bg-gradient-to-br from-dark-light to-dark border border-gray-800 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Why Choose Us?
                </h2>
              </div>
              
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Discover the best {category.title.toLowerCase()} classes online with Zefrix. Our platform connects you with expert instructors who bring real-world experience and passion to every live session.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Whether you're a beginner or looking to advance your skills, our interactive workshops provide personalized guidance, immediate feedback, and a supportive learning community.
              </p>
            </div>

            {/* Right Column */}
            <div className="bg-gradient-to-br from-dark-light to-dark border border-gray-800 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  What You'll Learn
                </h3>
              </div>
              
              <div className="space-y-3">
                {category.subcategories.map((sub, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300 text-base">{sub}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-10 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-3xl p-10 md:p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Join Thousands of Learners
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto mb-8">
              Our students come from diverse backgrounds and skill levels. With small batch sizes, flexible schedules, and affordable pricing, learning {category.title.toLowerCase()} has never been more accessible.
            </p>
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary px-8 py-4 rounded-xl text-white font-semibold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Your Journey Today
              <span>→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}

