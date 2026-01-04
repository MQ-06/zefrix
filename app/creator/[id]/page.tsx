'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Calendar } from 'lucide-react';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    getDoc: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
  }
}

interface CreatorProfile {
  uid: string;
  name: string;
  displayName: string;
  email: string;
  bio: string;
  expertise: string;
  profileImage: string;
  photoURL: string;
  introVideo: string;
  socialHandles: {
    instagram: string;
    youtube: string;
    twitter: string;
    linkedin: string;
  };
}

interface ClassData {
  classId: string;
  title: string;
  subtitle?: string;
  category: string;
  subCategory: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  numberSessions: number;
  videoLink?: string;
  status: string;
  startISO?: string;
  startDate?: string;
  endDate?: string;
  recurringStartTime?: string;
  recurringEndTime?: string;
  createdAt: any;
}

interface Review {
  id: string;
  studentName: string;
  rating: number;
  feedback: string;
  createdAt: any;
}

interface SimilarCreator {
  id: string;
  name: string;
  bio: string;
  expertise: string;
  photoURL: string;
  profileImage: string;
  category: string;
  classCount: number;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarCreators, setSimilarCreators] = useState<SimilarCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Initialize Firebase
    if (typeof window !== 'undefined' && !window.firebaseDb) {
      const script = document.createElement('script');
      script.type = 'module';
      script.innerHTML = `
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
        
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
        window.doc = doc;
        window.getDoc = getDoc;
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.getDocs = getDocs;
        
        // Dispatch event after a small delay to ensure everything is set
        setTimeout(() => {
          window.dispatchEvent(new Event('firebaseReady'));
        }, 100);
      `;
      document.head.appendChild(script);
    }

    let isMounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;
    let eventListenerAdded = false;

    const checkFirebaseAndFetch = () => {
      console.log('🔍 checkFirebaseAndFetch called');
      if (typeof window === 'undefined') {
        console.log('⚠️ Window undefined in checkFirebaseAndFetch');
        return;
      }
      
      const firebaseReady = !!(window.firebaseDb && window.doc && window.getDoc && window.collection && window.query && window.where && window.getDocs);
      
      if (!firebaseReady) {
        console.log('⏳ Firebase not ready in checkFirebaseAndFetch, retrying...');
        // Retry after 200ms if not ready
        retryTimeout = setTimeout(checkFirebaseAndFetch, 200);
        return;
      }

      console.log('✅ Firebase ready in checkFirebaseAndFetch, calling fetchData');
      // Clear any pending retries
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      fetchData();
    };

    const fetchData = async () => {
      console.log('🚀 fetchData called for creatorId:', creatorId);
      console.log('🔍 isMounted:', isMounted, 'window:', typeof window !== 'undefined');
      
      if (!isMounted || typeof window === 'undefined') {
        console.log('⚠️ Returning early - not mounted or window undefined');
        return;
      }

      const firebaseReady = !!(window.firebaseDb && window.doc && window.getDoc && window.collection && window.query && window.where && window.getDocs);
      console.log('🔍 Firebase ready check:', {
        firebaseDb: !!window.firebaseDb,
        doc: !!window.doc,
        getDoc: !!window.getDoc,
        collection: !!window.collection,
        query: !!window.query,
        where: !!window.where,
        getDocs: !!window.getDocs,
        allReady: firebaseReady
      });

      if (!firebaseReady) {
        console.log('⏳ Firebase not ready yet, retrying...');
        retryTimeout = setTimeout(checkFirebaseAndFetch, 200);
        return;
      }

      console.log('✅ Firebase ready, fetching data...');
      try {
        console.log('📡 Fetching creator profile for:', creatorId);
        // Fetch creator profile and classes in parallel for faster loading
        const [userSnap, classesSnapshot] = await Promise.all([
          window.getDoc(window.doc(window.firebaseDb, 'users', creatorId)),
          window.getDocs(window.query(
            window.collection(window.firebaseDb, 'classes'),
            window.where('creatorId', '==', creatorId),
            window.where('status', '==', 'approved')
          ))
        ]);

        console.log('📦 User snapshot exists:', userSnap.exists());
        console.log('📦 Classes snapshot size:', classesSnapshot.size);

        if (!userSnap.exists()) {
          console.error('❌ Creator not found in database for ID:', creatorId);
          setError('Creator not found');
          setLoading(false);
          return;
        }

        // Set creator data immediately
        const userData = userSnap.data();
        console.log('📋 User data received:', {
          name: userData.name,
          displayName: userData.displayName,
          email: userData.email,
          hasBio: !!userData.bio,
          hasExpertise: !!(userData.expertise || userData.skills),
          hasPhoto: !!(userData.profileImage || userData.photoURL)
        });
        
        const creatorData = {
          uid: creatorId,
          name: userData.name || userData.displayName || 'Creator',
          displayName: userData.displayName || userData.name || 'Creator',
          email: userData.email || '',
          bio: userData.bio || '',
          expertise: userData.expertise || userData.skills || '',
          profileImage: userData.profileImage || userData.photoURL || '',
          photoURL: userData.photoURL || userData.profileImage || '',
          introVideo: userData.introVideo || '',
          socialHandles: userData.socialHandles || {
            instagram: '',
            youtube: '',
            twitter: '',
            linkedin: '',
          },
        };
        
        console.log('✅ Setting creator state:', creatorData);
        setCreator(creatorData);

        // Process classes immediately
        const classesList: ClassData[] = [];
        classesSnapshot.forEach((doc: any) => {
          classesList.push({ classId: doc.id, ...doc.data() });
        });

        // Sort by creation date (newest first)
        classesList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        // Set classes immediately (without enrollment counts first)
        console.log('📚 Setting classes:', classesList.length, 'classes');
        setClasses(classesList);
        console.log('✅ Setting loading to false');
        setLoading(false); // Show page immediately

        // Fetch enrollment counts and reviews in background (non-blocking)
        if (classesList.length > 0 && window.collection && window.query && window.where && window.getDocs) {
          // Fetch enrollment counts in parallel batches (Firestore 'in' limit is 10)
          const fetchEnrollmentCounts = async () => {
            try {
              const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
              const classIds = classesList.map(c => c.classId);
              
              // Process in batches of 10 (Firestore 'in' query limit)
              const enrollmentCounts: { classId: string; enrollmentCount: number }[] = [];
              
              for (let i = 0; i < classIds.length; i += 10) {
                const batch = classIds.slice(i, i + 10);
                try {
                  const enrollmentsQuery = window.query(
                    enrollmentsRef,
                    window.where('classId', 'in', batch)
                  );
                  const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
                  
                  // Count enrollments per class
                  const batchCounts = new Map<string, number>();
                  enrollmentsSnapshot.forEach((doc: any) => {
                    const classId = doc.data().classId;
                    batchCounts.set(classId, (batchCounts.get(classId) || 0) + 1);
                  });
                  
                  batch.forEach(classId => {
                    enrollmentCounts.push({
                      classId,
                      enrollmentCount: batchCounts.get(classId) || 0
                    });
                  });
                } catch (error) {
                  console.error(`Error fetching enrollment batch:`, error);
                  // Set 0 for failed batch
                  batch.forEach(classId => {
                    enrollmentCounts.push({ classId, enrollmentCount: 0 });
                  });
                }
              }
              
              // Update classes with enrollment counts
              const enrollmentMap = new Map(
                enrollmentCounts.map(ec => [ec.classId, ec.enrollmentCount])
              );
              
              setClasses(prevClasses => 
                prevClasses.map(classItem => ({
                  ...classItem,
                  enrollmentCount: enrollmentMap.get(classItem.classId) || 0
                }))
              );
            } catch (error) {
              console.error('Error fetching enrollment counts:', error);
            }
          };

          // Fetch reviews in background
          const fetchReviews = async () => {
            try {
              const ratingsRef = window.collection(window.firebaseDb, 'ratings');
              const classIds = classesList.map(c => c.classId).slice(0, 10);
              
              if (classIds.length > 0) {
                const ratingsQuery = window.query(ratingsRef, window.where('classId', 'in', classIds));
                const ratingsSnapshot = await window.getDocs(ratingsQuery);

                const reviewsList: Review[] = [];
                ratingsSnapshot.forEach((doc: any) => {
                  const data = doc.data();
                  if (classesList.some(c => c.classId === data.classId)) {
                    reviewsList.push({
                      id: doc.id,
                      studentName: data.studentName || 'Student',
                      rating: data.rating || 0,
                      feedback: data.feedback || '',
                      createdAt: data.createdAt,
                    });
                  }
                });

                reviewsList.sort((a, b) => {
                  const aTime = a.createdAt?.toMillis?.() || 0;
                  const bTime = b.createdAt?.toMillis?.() || 0;
                  return bTime - aTime;
                });

                setReviews(reviewsList.slice(0, 10));
              }
            } catch (error) {
              console.error('Error fetching reviews:', error);
            }
          };

          // Fetch both in parallel, non-blocking
          Promise.all([fetchEnrollmentCounts(), fetchReviews()]).catch(err => {
            console.error('Error in background data fetch:', err);
          });
        }

        // Fetch similar creators in background
        const fetchSimilarCreators = async () => {
          try {
            console.log('🔍 Fetching similar creators for:', creatorId);
            
            // Get categories from current creator's classes
            const creatorCategories = new Set<string>();
            classesList.forEach(cls => {
              if (cls.category) creatorCategories.add(cls.category);
            });

            // Get expertise keywords
            const expertiseKeywords = (userData.expertise || userData.skills || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
            
            console.log('📊 Creator categories:', Array.from(creatorCategories));
            console.log('🎯 Expertise keywords:', expertiseKeywords);

            // Fetch all creators (excluding current)
            const usersRef = window.collection(window.firebaseDb, 'users');
            const creatorsQuery = window.query(usersRef, window.where('role', '==', 'creator'));
            const creatorsSnapshot = await window.getDocs(creatorsQuery);

            const creatorsData: Array<{ id: string; data: any; matchScore: number; categories: Set<string>; classCount: number }> = [];

            // Fetch all creators and their classes in parallel
            const creatorPromises = Array.from(creatorsSnapshot.docs)
              .filter((doc: any) => doc.id !== creatorId)
              .map(async (doc: any) => {
                const data = doc.data();
                const classesRef = window.collection(window.firebaseDb, 'classes');
                const creatorClassesQuery = window.query(
                  classesRef,
                  window.where('creatorId', '==', doc.id),
                  window.where('status', '==', 'approved')
                );
                const classesSnap = await window.getDocs(creatorClassesQuery);

                const otherCreatorCategories = new Set<string>();
                classesSnap.forEach((classDoc: any) => {
                  const classData = classDoc.data();
                  if (classData.category) otherCreatorCategories.add(classData.category);
                });

                let matchScore = 0;
                // Category match (higher weight)
                creatorCategories.forEach(cat => {
                  if (otherCreatorCategories.has(cat)) matchScore += 2;
                });

                // Expertise match
                const otherExpertise = (data.expertise || data.skills || '').toLowerCase();
                expertiseKeywords.forEach((keyword: string) => {
                  if (keyword && otherExpertise.includes(keyword)) matchScore += 1;
                });

                return {
                  id: doc.id,
                  data,
                  matchScore,
                  categories: otherCreatorCategories,
                  classCount: classesSnap.size
                };
              });

            const results = await Promise.allSettled(creatorPromises);
            
            results.forEach((result) => {
              if (result.status === 'fulfilled' && result.value.matchScore > 0) {
                creatorsData.push(result.value);
              }
            });

            // Sort by match score and take top 6
            creatorsData.sort((a, b) => b.matchScore - a.matchScore);
            const topSimilar = creatorsData.slice(0, 6).map(item => ({
              id: item.id,
              name: item.data.name || item.data.displayName || 'Creator',
              bio: item.data.bio || '',
              expertise: item.data.expertise || item.data.skills || '',
              photoURL: item.data.photoURL || item.data.profileImage || '',
              profileImage: item.data.profileImage || item.data.photoURL || '',
              category: Array.from(item.categories)[0] || '',
              classCount: item.classCount
            }));

            console.log(`✅ Found ${topSimilar.length} similar creators:`, topSimilar.map(c => ({ name: c.name, score: creatorsData.find(d => d.id === c.id)?.matchScore })));
            setSimilarCreators(topSimilar);
          } catch (error) {
            console.error('❌ Error fetching similar creators:', error);
          }
        };

        // Fetch similar creators (non-blocking) - fetch even if no classes (based on expertise)
        fetchSimilarCreators();
      } catch (err) {
        console.error('❌ Error fetching creator profile:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          creatorId,
          errorType: err?.constructor?.name
        });
        if (isMounted) {
          setError('Failed to load creator profile');
          setLoading(false);
        }
      }
    };

    // Only run on client side
    if (typeof window === 'undefined') return;

    // Define event handler outside conditional so it's available for cleanup
    const handleFirebaseReady = () => {
      console.log('📢 firebaseReady event received in creator page');
      if (isMounted) {
        console.log('✅ Component is mounted, calling checkFirebaseAndFetch');
        checkFirebaseAndFetch();
      } else {
        console.log('⚠️ Component not mounted when firebaseReady event received');
      }
    };

    // Try to fetch immediately if Firebase is already loaded
    const firebaseAlreadyReady = !!(window.firebaseDb && window.doc && window.getDoc && window.collection && window.query && window.where && window.getDocs);
    console.log('🔍 Initial Firebase check:', firebaseAlreadyReady);
    
    if (firebaseAlreadyReady) {
      console.log('✅ Firebase already ready, calling checkFirebaseAndFetch immediately');
      checkFirebaseAndFetch();
    } else {
      console.log('⏳ Firebase not ready, setting up event listener and polling');
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
  }, [creatorId, mounted]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return null;
  };

  const isYouTubeUrl = (url: string): boolean => {
    return /youtube\.com|youtu\.be/.test(url);
  };

  // Debug render state
  console.log('🎨 Render state:', {
    loading,
    error,
    hasCreator: !!creator,
    creatorName: creator?.name,
    classesCount: classes.length,
    mounted
  });

  if (loading) {
    return (
      <div style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff'
      }}>
        <div>Loading creator profile...</div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div style={{ 
        minHeight: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div>{error || 'Creator not found'}</div>
        <Link href="/" style={{ color: '#D92A63', textDecoration: 'underline' }}>
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        paddingTop: '6rem', // More space below header
        paddingBottom: '4rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          {/* Creator Header */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '3rem',
            flexWrap: 'wrap',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0
            }}>
              {creator.photoURL ? (
                <img
                  src={creator.photoURL}
                  alt={creator.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '3rem', fontWeight: '700' }}>
                  {creator.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                {creator.name}
              </h1>
              {creator.expertise && (
                <p style={{ 
                  fontSize: '1.125rem', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '1rem'
                }}>
                  {creator.expertise}
                </p>
              )}
              {creator.bio && (
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  {creator.bio}
                </p>
              )}

              {/* Social Handles */}
              {(creator.socialHandles.instagram || creator.socialHandles.youtube || 
                creator.socialHandles.twitter || creator.socialHandles.linkedin) && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {creator.socialHandles.instagram && (
                    <a
                      href={creator.socialHandles.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#fff',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      📷 Instagram
                    </a>
                  )}
                  {creator.socialHandles.youtube && (
                    <a
                      href={creator.socialHandles.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#fff',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      ▶️ YouTube
                    </a>
                  )}
                  {creator.socialHandles.twitter && (
                    <a
                      href={creator.socialHandles.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#fff',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      🐦 Twitter
                    </a>
                  )}
                  {creator.socialHandles.linkedin && (
                    <a
                      href={creator.socialHandles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#fff',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      💼 LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Rating Summary */}
            {reviews.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1.5rem',
                minWidth: '200px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#FFD700', marginBottom: '0.5rem' }}>
                  ⭐ {calculateAverageRating()}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>
            )}
          </div>

          {/* Intro Video */}
          {creator.introVideo && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                About {creator.name}
              </h2>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '16/9',
                maxWidth: '800px',
                position: 'relative'
              }}>
                {isYouTubeUrl(creator.introVideo) ? (
                  (() => {
                    const embedUrl = getYouTubeEmbedUrl(creator.introVideo);
                    return embedUrl ? (
                      <iframe
                        src={embedUrl}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${creator.name}'s Intro Video`}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '2rem'
                      }}>
                        Invalid YouTube URL. Please check the video link.
                      </div>
                    );
                  })()
                ) : (
                  <video
                    src={creator.introVideo}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      console.error('Error loading video:', e);
                      (e.target as HTMLVideoElement).style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.7); padding: 2rem;';
                      errorDiv.textContent = 'Unable to load video. Please check the video URL.';
                      (e.target as HTMLVideoElement).parentElement?.appendChild(errorDiv);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Upcoming Batches/Sessions */}
          <div style={{ 
            marginBottom: '3rem',
            marginTop: '2rem' // Add top margin to separate from previous section
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)' // Add separator line
            }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h2 style={{ 
                  fontSize: '2.25rem', 
                  fontWeight: '700', 
                  marginBottom: '0.75rem',
                  marginTop: 0,
                  background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: '1.2'
                }}>
                  {classes.length > 0 ? `My Batches/Sessions (${classes.length})` : 'My Batches/Sessions'}
                </h2>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '1rem',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  lineHeight: '1.5'
                }}>
                  {classes.length > 0 
                    ? 'Explore all available batches and sessions' 
                    : 'No batches available yet'}
                </p>
              </div>
              {classes.length > 0 && (
                <div style={{
                  padding: '0.875rem 1.75rem',
                  background: 'rgba(217, 42, 99, 0.2)',
                  borderRadius: '12px',
                  border: '1px solid rgba(217, 42, 99, 0.3)',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  alignSelf: 'center'
                }}>
                  {classes.length} {classes.length === 1 ? 'Batch' : 'Batches'} Available
                </div>
              )}
            </div>
            {classes.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                border: '2px dashed rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  opacity: 0.5
                }}>
                  📚
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  No Batches Available Yet
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9375rem'
                }}>
                  This creator hasn't published any batches yet. Check back soon!
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {classes.map((classItem) => (
                  <Link
                    key={classItem.classId}
                    href={`/product/${classItem.classId}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.1)'
                    }}>
                      <img
                        src={(classItem.videoLink && classItem.videoLink.trim() !== '') ? classItem.videoLink : "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg"}
                        alt={classItem.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg";
                        }}
                      />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        {classItem.title}
                      </h3>
                      {classItem.subtitle && (
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}>
                          {classItem.subtitle}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        marginTop: '1rem'
                      }}>
                        {/* Course Meta Info */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.6)' }} />
                            <span>{classItem.numberSessions || 1} {classItem.numberSessions === 1 ? 'Session' : 'Sessions'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.6)' }} />
                            <span>{(classItem as any).enrollmentCount || 0} {(classItem as any).enrollmentCount === 1 ? 'Student' : 'Students'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.6)' }} />
                            <span>{classItem.scheduleType === 'recurring' ? 'Batch' : 'One-time'}</span>
                          </div>
                        </div>
                        
                        {/* Start Date */}
                        {classItem.startDate && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '0.8125rem' 
                          }}>
                            <Calendar style={{ width: '16px', height: '16px', color: 'rgba(255, 255, 255, 0.5)' }} />
                            <span>Starts: {formatDate(classItem.startDate)}</span>
                          </div>
                        )}
                        
                        {/* Price */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.5rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Price:</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFD700' }}>
                            ₹{classItem.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews & Ratings */}
          {reviews.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  marginBottom: '0.5rem',
                  background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Student Reviews & Ratings
                </h2>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '0.9375rem'
                }}>
                  What students are saying about {creator.name}'s batches
                </p>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {review.studentName}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              color: star <= review.rating ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                              fontSize: '1.25rem'
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {review.feedback && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: '1.6',
                        marginTop: '0.75rem'
                      }}>
                        {review.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect Section - About the Creator & Similar Creators */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Connect
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '0.9375rem'
              }}>
                Learn more about {creator.name} and discover similar creators
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem'
            }}>
              {/* About the Creator */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  color: '#fff'
                }}>
                  About {creator.name}
                </h3>
                {creator.bio ? (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: '1.6',
                    marginBottom: '1rem'
                  }}>
                    {creator.bio}
                  </p>
                ) : (
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    No bio available yet.
                  </p>
                )}
                {creator.expertise && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '0.5rem',
                      fontWeight: '600'
                    }}>
                      Expertise
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.9375rem'
                    }}>
                      {creator.expertise}
                    </div>
                  </div>
                )}
              </div>

              {/* Similar Creators */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  color: '#fff'
                }}>
                  Similar Creators
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem'
                }}>
                  Creators teaching similar topics
                </p>
                {similarCreators.length > 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {similarCreators.map((similarCreator) => (
                      <Link
                        key={similarCreator.id}
                        href={`/creator/${similarCreator.id}`}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.3s',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(217, 42, 99, 0.3)';
                          e.currentTarget.style.transform = 'translateX(5px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '2px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {similarCreator.photoURL ? (
                            <img
                              src={similarCreator.photoURL}
                              alt={similarCreator.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          {!similarCreator.photoURL && (
                            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>
                              {similarCreator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                            color: '#fff',
                            fontSize: '1rem'
                          }}>
                            {similarCreator.name}
                          </div>
                          {similarCreator.expertise && (
                            <div style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '0.8125rem',
                              marginBottom: '0.25rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {similarCreator.expertise}
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center',
                            marginTop: '0.25rem'
                          }}>
                            {similarCreator.classCount > 0 && (
                              <span style={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.75rem'
                              }}>
                                {similarCreator.classCount} {similarCreator.classCount === 1 ? 'batch' : 'batches'}
                              </span>
                            )}
                            {similarCreator.category && (
                              <span style={{
                                color: 'rgba(217, 42, 99, 0.8)',
                                fontSize: '0.75rem',
                                background: 'rgba(217, 42, 99, 0.1)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px'
                              }}>
                                {similarCreator.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic'
                  }}>
                    No similar creators found at the moment.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

