'use client';

import { useState, useEffect, Suspense } from 'react';
import InstructorCard from '@/components/InstructorCard';
import { motion } from 'framer-motion';
import Link from 'next/link';

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

interface Creator {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: string;
  totalClasses?: number;
}

function InstructorContent() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;
    let eventListenerAdded = false;

    // Load Firebase if not already loaded
    if (typeof window !== 'undefined' && !window.firebaseDb) {
      // Check if script is already being loaded to prevent duplicates
      const existingScript = document.querySelector('script[data-firebase-instructor-init]');
      if (existingScript) {
        // Script already exists, wait for it
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.setAttribute('data-firebase-instructor-init', 'true');
      script.textContent = `
        try {
          import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
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
          
          // Use existing app if already initialized
          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
          window.firebaseDb = getFirestore(app);
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          
          // Dispatch event after a small delay to ensure everything is set
          setTimeout(() => {
            window.dispatchEvent(new Event('firebaseReady'));
          }, 100);
        } catch (error) {
          console.error('Firebase initialization error:', error);
          window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
        }
      `;
      script.onerror = () => {
        console.error('❌ Failed to load Firebase script');
        window.dispatchEvent(new CustomEvent('firebaseError', { detail: new Error('Script load failed') }));
      };
      document.head.appendChild(script);
    }

    // Define event handler outside conditional so it's accessible in cleanup
    const handleFirebaseReady = () => {
      if (isMounted) {
        checkFirebaseAndFetch();
      }
    };

    const checkFirebaseAndFetch = () => {
      if (typeof window === 'undefined') return;
      
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        // Retry after 200ms if not ready
        retryTimeout = setTimeout(checkFirebaseAndFetch, 200);
        return;
      }

      // Clear any pending retries
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      fetchCreators();
    };

    const fetchCreators = async () => {
      if (!isMounted || typeof window === 'undefined') return;

      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        console.log('Firebase not ready yet, retrying...');
        retryTimeout = setTimeout(checkFirebaseAndFetch, 200);
        return;
      }

      try {
        console.log('Fetching creators from Firestore...');
        const usersRef = window.collection(window.firebaseDb, 'users');
        const q = window.query(usersRef, window.where('role', '==', 'creator'));
        const querySnapshot = await window.getDocs(q);

        console.log(`Found ${querySnapshot.size} creators in query`);

        if (!isMounted) return;

        const creatorsData: Creator[] = [];
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          console.log('Creator data:', { id: doc.id, name: data.name, role: data.role, photoURL: data.photoURL, profileImage: data.profileImage });
          // Prefer photoURL, then profileImage, then empty string (will fallback to avatar API in component)
          const imageUrl = data.photoURL || data.profileImage || '';
          creatorsData.push({
            id: doc.id,
            name: data.name || data.email?.split('@')[0] || 'Creator',
            email: data.email || '',
            photoURL: imageUrl,
            role: data.role,
            totalClasses: 0
          });
        });

        // Get class count for each creator (only approved classes)
        // Wrap in try-catch to handle potential errors gracefully
        try {
          const classesRef = window.collection(window.firebaseDb, 'classes');
          const classesQuery = window.query(classesRef, window.where('status', '==', 'approved'));
          const classesSnapshot = await window.getDocs(classesQuery);

          const creatorClassCount: { [key: string]: number } = {};
          classesSnapshot.forEach((doc: any) => {
            const classData = doc.data();
            if (classData.creatorId && classData.status === 'approved') {
              creatorClassCount[classData.creatorId] = (creatorClassCount[classData.creatorId] || 0) + 1;
            }
          });

          creatorsData.forEach(creator => {
            creator.totalClasses = creatorClassCount[creator.id] || 0;
          });
        } catch (classCountError: any) {
          console.warn('Error fetching class counts (non-blocking):', classCountError);
          // Continue without class counts - set all to 0
          creatorsData.forEach(creator => {
            creator.totalClasses = 0;
          });
        }

        if (!isMounted) return;

        console.log(`Setting ${creatorsData.length} creators`);
        setCreators(creatorsData);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching creators:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        // Show error to user
        if (error.code === 'permission-denied') {
          console.error('Permission denied - check Firestore rules');
        } else if (error.message?.includes('404') || error.message?.includes('QUIC')) {
          console.warn('Network/Firestore connection error - this may be temporary');
        }
        if (isMounted) {
          setCreators([]);
          setLoading(false);
        }
      }
    };

    // Only run on client side
    if (typeof window === 'undefined') return;

    // Define event handler outside conditional so it's available for cleanup
    const handleFirebaseReady = () => {
      if (isMounted) {
        checkFirebaseAndFetch();
      }
    };

    // Try to fetch immediately if Firebase is already loaded
    if (window.firebaseDb && window.collection && window.query && window.where && window.getDocs) {
      fetchCreators();
    } else {
      // Wait for firebaseReady event
      window.addEventListener('firebaseReady', handleFirebaseReady);
      eventListenerAdded = true;
      
      // Also start polling as fallback (in case event doesn't fire)
      checkFirebaseAndFetch();
    }

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (eventListenerAdded && typeof window !== 'undefined') {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
      }
    };
  }, [mounted]);
  return (
    <>
      {/* Hero Section */}
      <section className="hero-inner pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>

        <div className="container relative z-10">
          <div className="text-center position-relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              From the Zefrix community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto"
            >
              Meet our talented creators who are sharing their expertise and passion with students worldwide.
            </motion.p>

            {/* Decorative Element */}
            <motion.img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b765_element-3.svg"
              loading="lazy"
              alt=""
              className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 opacity-30 -z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      </section>

      {/* Instructors Grid Section */}
      <section className="instructor-section section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-white text-xl">Loading creators...</div>
            </div>
          ) : (creators || []).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-white text-xl mb-4">No creators found</div>
              <p className="text-gray-400">Check back soon for amazing instructors!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {creators.map((creator, index) => {
                // Use photoURL if available, otherwise fallback to avatar API with initials
                const photoURL = creator.photoURL || '';
                const hasImage = photoURL.trim() !== '';
                const profileImageUrl = hasImage 
                  ? photoURL
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=D92A63&color=fff&size=200`;
                
                // Debug logging
                if (!hasImage) {
                  console.log(`Creator "${creator.name}" (${creator.id}) - No profile image found. photoURL:`, creator.photoURL);
                }
                
                return (
                  <InstructorCard
                    key={creator.id}
                    instructor={{
                      id: creator.id,
                      slug: creator.name.toLowerCase().replace(/\s+/g, '-'),
                      name: creator.name,
                      title: `${creator.totalClasses || 0} Active Classes`,
                      image: profileImageUrl
                    }}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <div className="cta-section section-spacing-bottom">
        <div className="container">
          <div className="cta-small glass-box bg-[#2D2D44]/50 backdrop-blur-md rounded-2xl p-8 md:p-12 relative overflow-hidden max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <h5 className="no-margin text-white font-bold text-xl md:text-2xl">
                Join over 1,000 satisfied learners today.
              </h5>
              <Link
                href="/signup-login"
                className="button-dark lg bg-gradient-to-r from-[#E91E63] to-[#FF6B9D] text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-300 whitespace-nowrap"
              >
                Signup today!
              </Link>
            </div>
            <img
              src="https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7dd_element-9.svg"
              loading="lazy"
              alt=""
              className="element-images-fifteen absolute top-0 left-0 w-24 h-24 opacity-20 -z-0"
            />
          </div>
        </div>
      </div>
    </>
  );
}

// Loading skeleton component
function InstructorLoadingSkeleton() {
  return (
    <>
      <section className="hero-inner pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
        <div className="container relative z-10">
          <div className="text-center position-relative">
            <div className="h-12 bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-96 mx-auto animate-pulse"></div>
          </div>
        </div>
      </section>
      <section className="instructor-section section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          <div className="text-center py-16">
            <div className="text-white text-xl">Loading creators...</div>
          </div>
        </div>
      </section>
    </>
  );
}

// Main page component with Suspense
export default function InstructorPage() {
  return (
    <Suspense fallback={<InstructorLoadingSkeleton />}>
      <InstructorContent />
    </Suspense>
  );
}
