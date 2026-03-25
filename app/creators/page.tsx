'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
    onSnapshot: any;
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

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
  authDomain: "zefrix-custom.firebaseapp.com",
  projectId: "zefrix-custom",
  storageBucket: "zefrix-custom.firebasestorage.app",
  messagingSenderId: "50732408558",
  appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
  measurementId: "G-27HS1SWB5X"
};

function CreatorsContent() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const creatorsRef = useRef<Creator[]>([]);
  const classCountRef = useRef<Record<string, number>>({});
  const hasUsersSnapshotRef = useRef(false);
  const hasClassesSnapshotRef = useRef(false);

  // Set mounted flag on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    let isActive = true;
    let retryTimeout: NodeJS.Timeout | null = null;
    let usersUnsubscribe: (() => void) | null = null;
    let classesUnsubscribe: (() => void) | null = null;

    const applyMergedData = () => {
      const merged = creatorsRef.current.map((creator) => ({
        ...creator,
        totalClasses: classCountRef.current[creator.id] || 0,
      }));

      if (isActive) {
        setCreators(merged);
        if (hasUsersSnapshotRef.current && hasClassesSnapshotRef.current) {
          setLoading(false);
        }
      }
    };

    const setupListeners = () => {
      if (!isActive) {
        return;
      }

      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.onSnapshot) {
        retryTimeout = setTimeout(setupListeners, 200);
        return;
      }

      const usersRef = window.collection(window.firebaseDb, 'users');
      const usersQuery = window.query(usersRef, window.where('role', '==', 'creator'));

      const classesRef = window.collection(window.firebaseDb, 'classes');
      const classesQuery = window.query(classesRef, window.where('status', '==', 'approved'));

      usersUnsubscribe = window.onSnapshot(usersQuery, (usersSnapshot: any) => {
        const creatorsData: Creator[] = [];
        usersSnapshot.forEach((doc: any) => {
          const data = doc.data();
          creatorsData.push({
            id: doc.id,
            name: data.name || data.email?.split('@')[0] || 'Creator',
            email: data.email || '',
            photoURL: data.photoURL || data.profileImage || '',
            role: data.role,
            totalClasses: 0,
          });
        });

        creatorsRef.current = creatorsData;
        hasUsersSnapshotRef.current = true;
        applyMergedData();
      }, (error: any) => {
        console.error('Error in creators listener:', error);
        if (isActive) {
          hasUsersSnapshotRef.current = true;
          setCreators([]);
          setLoading(false);
        }
      });

      classesUnsubscribe = window.onSnapshot(classesQuery, (classesSnapshot: any) => {
        const creatorClassCount: Record<string, number> = {};
        classesSnapshot.forEach((doc: any) => {
          const classData = doc.data();
          if (classData.creatorId) {
            creatorClassCount[classData.creatorId] = (creatorClassCount[classData.creatorId] || 0) + 1;
          }
        });

        classCountRef.current = creatorClassCount;
        hasClassesSnapshotRef.current = true;
        applyMergedData();
      }, (error: any) => {
        console.error('Error in approved classes listener:', error);
        if (isActive) {
          hasClassesSnapshotRef.current = true;
          classCountRef.current = {};
          applyMergedData();
        }
      });
    };

    if (window.firebaseDb && window.collection && window.query && window.where && window.onSnapshot) {
      setupListeners();
    } else {
      const existingScript = document.querySelector('script[data-firebase-creators-init]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('data-firebase-creators-init', 'true');
        const firebaseConfigStr = JSON.stringify(FIREBASE_CONFIG);
        script.textContent = `
          try {
            import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
            import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

            const firebaseConfig = ` + firebaseConfigStr + `;
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
            window.firebaseDb = getFirestore(app);
            window.collection = collection;
            window.query = query;
            window.where = where;
            window.getDocs = getDocs;
            window.onSnapshot = onSnapshot;
            window.dispatchEvent(new Event('firebaseReady'));
          } catch (error) {
            console.error('Firebase initialization error:', error);
            window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
          }
        `;
        script.onerror = () => {
          console.error('Failed to load Firebase script');
        };
        document.head.appendChild(script);
      }

      const handleReady = () => {
        setupListeners();
      };

      window.addEventListener('firebaseReady', handleReady);

      return () => {
        isActive = false;
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
        if (usersUnsubscribe) {
          usersUnsubscribe();
        }
        if (classesUnsubscribe) {
          classesUnsubscribe();
        }
        window.removeEventListener('firebaseReady', handleReady);
      };
    }

    return () => {
      isActive = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (usersUnsubscribe) {
        usersUnsubscribe();
      }
      if (classesUnsubscribe) {
        classesUnsubscribe();
      }
    };
  }, [mounted]); // Only re-run when mounted changes from false to true

  // Helper function to get profile image URL with fallback
  const getProfileImageUrl = (creator: Creator): string => {
    if (creator.photoURL && creator.photoURL.trim() !== '') {
      return creator.photoURL;
    }
    // Fallback to avatar API with creator's name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=D92A63&color=fff&size=200`;
  };
  return (
    <>
      {/* Hero Section */}
      <section className="hero-inner pt-24 pb-16 md:pt-32 md:pb-20 relative overflow-hidden">
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

      {/* Creators Grid Section */}
      <section className="instructor-section section-spacing-bottom bg-gradient-to-b from-transparent via-[#1A1A2E] to-[#1A1A2E]">
        <div className="container">
          {loading ? (
            <div className="text-center py-16">
              <div className="text-white text-xl">Loading creators...</div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-white text-xl mb-4">No creators found</div>
              <p className="text-gray-400">Check back soon for amazing creators!</p>
            </div>
          ) : (() => {
            const activeCreators = creators.filter((creator) => (creator.totalClasses || 0) > 0);

            if (activeCreators.length === 0) {
              return (
                <div className="text-center py-16">
                  <div className="text-white text-xl mb-4">No active creators found</div>
                  <p className="text-gray-400">Check back soon for amazing creators!</p>
                </div>
              );
            }

            return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {activeCreators.map((creator, index) => (
                <InstructorCard
                  key={creator.id}
                  instructor={{
                    id: creator.id,
                    slug: creator.name.toLowerCase().replace(/\s+/g, '-'),
                    name: creator.name,
                    title: `${creator.totalClasses || 0} Active Classes`,
                    image: getProfileImageUrl(creator)
                  }}
                  index={index}
                />
              ))}
            </div>
            );
          })()}
        </div>
      </section>

      {/* CTA Section */}
      <div className="cta-section section-spacing-bottom">
        <div className="container">
          <div className="cta-small glass-box bg-[#2D2D44]/50 backdrop-blur-md rounded-2xl p-8 md:p-12 relative overflow-hidden max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <h5 className="no-margin text-white font-bold text-xl md:text-2xl">
                Join over 1,000 satisfied Members today.
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
function CreatorsLoadingSkeleton() {
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
export default function CreatorsPage() {
  return (
    <Suspense fallback={<CreatorsLoadingSkeleton />}>
      <CreatorsContent />
    </Suspense>
  );
}

