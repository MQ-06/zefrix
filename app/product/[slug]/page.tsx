'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { BookOpen, Clock, Users, Globe, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';
import { DEFAULT_COURSE_IMAGE, getAvatarUrl } from '@/lib/constants';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    collection: any;
    doc: any;
    getDoc: any;
    query: any;
    where: any;
    getDocs: any;
    orderBy: any;
    limit: any;
    onSnapshot: any;
  }
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: PageProps) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { addToCart, cart } = useCart();
  const { showError } = useNotification();
  const router = useRouter();
  const [isInCart, setIsInCart] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [earliestBatchDate, setEarliestBatchDate] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  const [relatedImageErrors, setRelatedImageErrors] = useState<{ [key: string]: boolean }>({});
  const [instructorImageError, setInstructorImageError] = useState(false);
  const [relatedInstructorImageErrors, setRelatedInstructorImageErrors] = useState<{ [key: string]: boolean }>({});

  const handleCourseImageError = () => {
    if (!imageError && course) {
      setImageError(true);
      setCourse({ ...course, image: DEFAULT_COURSE_IMAGE });
    }
  };

  const handleInstructorImageError = () => {
    if (!instructorImageError && course) {
      setInstructorImageError(true);
      setCourse({ ...course, instructorImage: getAvatarUrl(course.instructor || 'Instructor', 200) });
    }
  };

  const handleRelatedImageError = (courseId: string) => {
    if (!relatedImageErrors[courseId]) {
      setRelatedImageErrors({ ...relatedImageErrors, [courseId]: true });
      setRelatedCourses(relatedCourses.map(rc => 
        rc.id === courseId ? { ...rc, image: DEFAULT_COURSE_IMAGE } : rc
      ));
    }
  };

  const handleRelatedInstructorImageError = (courseId: string) => {
    if (!relatedInstructorImageErrors[courseId]) {
      setRelatedInstructorImageErrors({ ...relatedInstructorImageErrors, [courseId]: true });
      setRelatedCourses(relatedCourses.map(rc => 
        rc.id === courseId ? { ...rc, instructorImage: getAvatarUrl(rc.instructor || 'Instructor', 128) } : rc
      ));
    }
  };

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 20; // Increased retries for hard refresh scenarios
    let retryTimeout: NodeJS.Timeout | null = null;

    // Load Firebase if not already loaded
    const initializeFirebase = () => {
      if (typeof window !== 'undefined' && !window.firebaseDb) {
        // Check if script is already being loaded
        const existingScript = document.querySelector('script[data-firebase-product-init]');
        if (existingScript) {
          // Script is loading, wait for it
          return;
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.setAttribute('data-firebase-product-init', 'true');
        script.innerHTML = `
          import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
          import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
          import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
          
          const firebaseConfig = {
            apiKey: "AIzaSyDnj-_1jW6g2p7DoJvOPKtPIWPwe42csRw",
            authDomain: "zefrix-custom.firebaseapp.com",
            projectId: "zefrix-custom",
            storageBucket: "zefrix-custom.firebasestorage.app",
            messagingSenderId: "50732408558",
            appId: "1:50732408558:web:3468d17b9c5b7e1cccddff",
            measurementId: "G-27HS1SWB5X"
          };

          const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
          window.firebaseAuth = getAuth(app);
          window.firebaseDb = getFirestore(app);
          window.doc = doc;
          window.getDoc = getDoc;
          window.collection = collection;
          window.query = query;
          window.where = where;
          window.getDocs = getDocs;
          window.orderBy = orderBy;
          window.limit = limit;
          window.onSnapshot = onSnapshot;
          window.Timestamp = Timestamp;
          
          // Dispatch event when Firebase is ready
          window.dispatchEvent(new CustomEvent('firebaseProductReady'));
        `;
        script.onerror = () => {
          console.error('Failed to load Firebase script');
          if (isMounted && retryCount < MAX_RETRIES) {
            retryCount++;
            retryTimeout = setTimeout(initializeFirebase, 1000);
          }
        };
        document.head.appendChild(script);
      }
    };

    initializeFirebase();

    const fetchCourse = async () => {
      if (!isMounted) return;

      // Wait for Firebase to load with better retry logic
      if (!window.firebaseDb || !window.doc || !window.getDoc || !window.collection || !window.query || !window.where || !window.getDocs) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          retryTimeout = setTimeout(fetchCourse, 300);
          return;
        } else {
          console.error('Firebase failed to initialize after maximum retries');
          if (isMounted) {
            setLoading(false);
            setCourse(null);
          }
          return;
        }
      }

      retryCount = 0; // Reset retry count on success

      try {
        const docRef = window.doc(window.firebaseDb, 'classes', params.slug);
        const docSnap = await window.getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only show approved classes
          if (data.status === 'approved') {
            // Fetch enrollment count
            let enrollmentCount = 0;
            if (window.collection && window.query && window.where && window.getDocs) {
              try {
                const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
                const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', docSnap.id));
                const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
                enrollmentCount = enrollmentsSnapshot.size;
              } catch (error) {
                console.error('Error fetching enrollment count:', error);
              }
            }

            setCourse({
              id: docSnap.id,
              slug: docSnap.id,
              title: data.title || 'Untitled Batch',
              subtitle: data.subtitle || '',
              price: data.price || 0,
              image: (data.videoLink && data.videoLink.trim() !== '') ? data.videoLink : DEFAULT_COURSE_IMAGE,
              instructor: data.creatorName || 'Instructor',
              instructorId: data.creatorId || '',
              instructorImage: getAvatarUrl(data.creatorName || 'Instructor', 200),
              description: data.description || 'No description available.',
              whatStudentsWillLearn: data.whatStudentsWillLearn || '',
              level: data.level || '',
              sections: data.numberSessions || 1,
              duration: data.duration || 1,
              students: 0,
              enrollmentCount: enrollmentCount,
              originalPrice: data.price || 0,
              // Schedule information
              scheduleType: data.scheduleType || 'one-time',
              startISO: data.startISO || '',
              startDate: data.startDate || data.date || '',
              endDate: data.endDate || '',
              startTime: data.recurringStartTime || data.startTime || '',
              endTime: data.recurringEndTime || data.endTime || '',
              sessionLengthMinutes: data.sessionLengthMinutes || 60,
              maxSeats: data.maxSeats || null,
              days: data.days || [],
              category: data.category || '',
              subCategory: data.subCategory || data.subcategory || '',
            });
          } else {
            setCourse(null);
          }
        } else {
          // Batch not found
          setCourse(null);
        }
      } catch (err) {
        console.error('Error fetching batch:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    // Listen for Firebase ready event
    const handleFirebaseReady = () => {
      if (isMounted) {
        fetchCourse();
      }
    };
    window.addEventListener('firebaseProductReady', handleFirebaseReady);

    // Try fetching immediately if Firebase is already loaded
    if (window.firebaseDb && window.doc && window.getDoc) {
      fetchCourse();
    } else {
      // Otherwise, start retry loop
      fetchCourse();
    }

    return () => {
      isMounted = false;
      window.removeEventListener('firebaseProductReady', handleFirebaseReady);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [params.slug]);

  // Fetch current user and listen for auth changes
  useEffect(() => {
    const checkUser = () => {
      if (window.firebaseAuth) {
        const currentUser = window.firebaseAuth.currentUser;
        setUser(currentUser || null);
        
        // Listen for auth state changes
        if (window.firebaseAuth.onAuthStateChanged) {
          const unsubscribe = window.firebaseAuth.onAuthStateChanged((user: any) => {
            setUser(user);
          });
          return () => unsubscribe();
        }
      } else {
        setTimeout(checkUser, 500);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (course) {
      setIsInCart(cart.some((item) => item.id === course.id));
    }
  }, [cart, course]);

  // Check if user is enrolled in this batch
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !course || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        setIsEnrolled(false);
        return;
      }

      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const q = window.query(
          enrollmentsRef,
          window.where('studentId', '==', user.uid),
          window.where('classId', '==', course.id)
        );
        const querySnapshot = await window.getDocs(q);
        setIsEnrolled(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking enrollment:', error);
        setIsEnrolled(false);
      }
    };

    checkEnrollment();
  }, [user, course]);

  // Fetch related batches from Firestore
  useEffect(() => {
    const fetchRelatedCourses = async () => {
      if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        setTimeout(fetchRelatedCourses, 500);
        return;
      }

      try {
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const q = window.query(classesRef, window.where('status', '==', 'approved'));
        const querySnapshot = await window.getDocs(q);

        const classes: any[] = [];
        querySnapshot.forEach((doc: any) => {
          // Exclude the current class
          if (doc.id !== params.slug) {
            const data = doc.data();
            classes.push({
              id: doc.id,
              slug: doc.id,
              title: data.title || 'Untitled Batch',
              price: data.price || 0,
              image: data.videoLink || DEFAULT_COURSE_IMAGE,
            instructor: data.creatorName || 'Instructor',
            instructorImage: getAvatarUrl(data.creatorName || 'Instructor', 128),
            sections: data.numberSessions || 1,
            duration: data.duration || 1,
            students: 0, // Will be updated below
            originalPrice: data.price || 0,
          });
          }
        });

        // Fetch enrollment counts for related batches
        if (classes.length > 0 && window.collection && window.query && window.where && window.getDocs) {
          try {
            const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
            
            // Fetch enrollment counts for all related classes in parallel
            const enrollmentPromises = classes.map(async (classItem) => {
              try {
                const enrollmentsQuery = window.query(
                  enrollmentsRef,
                  window.where('classId', '==', classItem.id)
                );
                const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
                return {
                  classId: classItem.id,
                  enrollmentCount: enrollmentsSnapshot.size
                };
              } catch (error) {
                console.error(`Error fetching enrollment count for related batch ${classItem.id}:`, error);
                return {
                  classId: classItem.id,
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
              classItem.students = enrollmentMap.get(classItem.id) || 0;
            });
          } catch (error) {
            console.error('Error fetching enrollment counts for related batches:', error);
            // Continue without enrollment counts if fetch fails
          }
        }

        // Take only first 3
        setRelatedCourses(classes.slice(0, 3));
      } catch (error) {
        console.error('Error fetching related batches:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedCourses();
  }, [params.slug]);

  // Fetch creator profile data
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (!course?.instructorId || !window.firebaseDb || !window.doc || !window.getDoc) {
        return;
      }

      try {
        const userRef = window.doc(window.firebaseDb, 'users', course.instructorId);
        const userSnap = await window.getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setCreatorProfile({
            name: userData.name || course.instructor,
            bio: userData.bio || '',
            expertise: userData.expertise || '',
            profileImage: userData.profileImage || course.instructorImage,
            instagram: userData.instagram || '',
            youtube: userData.youtube || '',
            twitter: userData.twitter || '',
            linkedin: userData.linkedin || '',
          });
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
      }
    };

    if (course) {
      fetchCreatorProfile();
    }
  }, [course]);

  // Fetch reviews/ratings for this batch
  useEffect(() => {
    const fetchReviews = async () => {
      if (!course || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs || !window.orderBy) {
        return;
      }

      setLoadingReviews(true);
      try {
        const ratingsRef = window.collection(window.firebaseDb, 'ratings');
        // Try with orderBy first, fallback to just where if index not available
        let querySnapshot;
        try {
          const q = window.query(
            ratingsRef,
            window.where('classId', '==', course.id),
            window.orderBy('createdAt', 'desc')
          );
          querySnapshot = await window.getDocs(q);
        } catch (orderByError: any) {
          // If orderBy fails (index not created), use simple where query and sort in memory
          console.warn('OrderBy index not available, sorting in memory:', orderByError);
          const q = window.query(
            ratingsRef,
            window.where('classId', '==', course.id)
          );
          querySnapshot = await window.getDocs(q);
        }
        
        const fetchedReviews: any[] = [];
        let totalRating = 0;
        let ratingCount = 0;

        querySnapshot.forEach((doc: any) => {
          const reviewData = { id: doc.id, ...doc.data() };
          fetchedReviews.push(reviewData);
          if (reviewData.rating) {
            totalRating += reviewData.rating;
            ratingCount++;
          }
        });

        // Sort by createdAt in descending order (newest first) if not already sorted
        fetchedReviews.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return bTime - aTime;
        });

        setReviews(fetchedReviews);
        setAverageRating(ratingCount > 0 ? totalRating / ratingCount : null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
        setAverageRating(null);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (course) {
      fetchReviews();
    }
  }, [course]);

  // Fetch batches to get earliest batch date
  useEffect(() => {
    const fetchBatches = async () => {
      if (!course?.id || !window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
        return;
      }

      try {
        const batchesRef = window.collection(window.firebaseDb, 'batches');
        const q = window.query(batchesRef, window.where('classId', '==', course.id));
        const querySnapshot = await window.getDocs(q);

        const batches: any[] = [];
        querySnapshot.forEach((doc: any) => {
          const batchData = doc.data();
          batches.push({ id: doc.id, ...batchData });
        });

        console.log(`Found ${batches.length} batches for course ${course.id}`);

        // Find earliest batch (upcoming preferred, but show any if no upcoming)
        const now = new Date();
        let earliestUpcomingDate: Date | null = null;
        let earliestAnyDate: Date | null = null;

        batches.forEach((batch: any) => {
          let batchDate: Date | null = null;
          if (batch.batchDate) {
            batchDate = batch.batchDate.toDate ? batch.batchDate.toDate() : new Date(batch.batchDate);
          } else if (batch.date) {
            batchDate = batch.date.toDate ? batch.date.toDate() : new Date(batch.date);
          } else if (batch.startDate) {
            batchDate = batch.startDate.toDate ? batch.startDate.toDate() : new Date(batch.startDate);
          }

          if (batchDate) {
            // Track earliest upcoming
            if (batchDate >= now) {
              if (!earliestUpcomingDate || batchDate < earliestUpcomingDate) {
                earliestUpcomingDate = batchDate;
              }
            }
            // Track earliest any
            if (!earliestAnyDate || batchDate < earliestAnyDate) {
              earliestAnyDate = batchDate;
            }
          }
        });

        // Prefer upcoming, but show earliest if no upcoming batches
        const dateToShow = earliestUpcomingDate || earliestAnyDate;
        if (dateToShow) {
          const date = dateToShow as Date;
          const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          setEarliestBatchDate(formattedDate);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };

    if (course) {
      fetchBatches();
    }
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#0F3460] flex items-center justify-center">
        <div className="text-white text-xl">Loading batch...</div>
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (typeof window !== 'undefined' && window.firebaseAuth) {
      const user = window.firebaseAuth.currentUser;
      if (!user) {
        // Redirect to login with return URL
        router.push(`/signup-login?redirect=/product/${params.slug}`);
        return;
      }
    } else {
      // Firebase not loaded yet, redirect to login
      router.push(`/signup-login?redirect=/product/${params.slug}`);
      return;
    }

    // Check max seats if batch has maxSeats set
    if (course.maxSeats && window.firebaseDb && window.collection && window.query && window.where && window.getDocs) {
      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', course.id));
        const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
        const currentEnrollments = enrollmentsSnapshot.size;
        
        if (currentEnrollments >= course.maxSeats) {
          showError(`Sorry! This batch is full. Maximum ${course.maxSeats} seats are already enrolled.`);
          return;
        }
      } catch (error) {
        console.error('Error checking enrollment count:', error);
        // Continue with enrollment even if check fails (non-blocking)
      }
    }

    // Add to cart
    addToCart({
      id: course.id,
      slug: course.slug,
      title: course.title,
      price: course.price,
      image: course.image,
      instructor: course.instructor,
    });

    // Redirect to checkout
    router.push('/checkout');
  };

  const userInitial = user ? ((user.displayName || user.email || 'S')[0] || 'S').toUpperCase() : '';

  return (
    <>
      {/* Student Header - Show if logged in */}
      {user && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1A1A2E] to-[#2D1B3D] border-b border-white/10 shadow-lg">
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/student-dashboard" className="text-white font-semibold hover:text-[#FF654B] transition-colors">
                ← Back to Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D92A63] to-[#FF654B] flex items-center justify-center text-white font-bold">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Student'} 
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!user.photoURL && userInitial}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {user.displayName || user.email?.split('@')[0] || 'Student'}
                    </div>
                    <div className="text-gray-300 text-xs">
                      {user.email || 'Student account'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button - Show if not logged in or for all users */}
      {!user && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1A1A2E] to-[#2D1B3D] border-b border-white/10 shadow-lg">
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <Link 
              href="/batches" 
              className="text-white font-semibold hover:text-[#FF654B] transition-colors inline-flex items-center gap-2"
            >
              ← Back to Batches
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className={`${user ? 'pt-24' : 'pt-24'} pb-12 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E] via-[#2D1B3D] to-[#E91E63]"></div>
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {course.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gradient-to-b from-[#1A1A2E] to-[#16213E]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content - Tabs */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'overview'
                    ? 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('creator')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'creator'
                    ? 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  Creator
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {course.description && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Batch Description</h2>
                        <div className="text-gray-300 whitespace-pre-wrap">
                          {course.description}
                        </div>
                      </div>
                    )}
                    
                    {course.whatStudentsWillLearn && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">What Students Will Learn</h2>
                        <div className="text-gray-300 whitespace-pre-wrap">
                          {course.whatStudentsWillLearn}
                        </div>
                      </div>
                    )}

                    {course.level && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Level</h2>
                        <div className="text-gray-300">
                          {course.level}
                        </div>
                      </div>
                    )}

                    {/* Reviews & Ratings Section */}
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4">Reviews & Ratings</h2>
                      {loadingReviews ? (
                        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                          <p className="text-gray-400">Loading reviews...</p>
                        </div>
                      ) : reviews.length > 0 ? (
                        <>
                          {/* Average Rating Summary */}
                          <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
                            <div className="flex items-center gap-4">
                              <div className="text-4xl font-bold text-white">
                                {averageRating?.toFixed(1)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-2xl ${star <= Math.round(averageRating || 0) ? 'text-yellow-400' : 'text-gray-600'}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <p className="text-gray-400 text-sm">
                                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Reviews List */}
                          <div className="space-y-4">
                            {reviews.map((review) => (
                              <div key={review.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#D92A63] to-[#FF654B] flex items-center justify-center text-white font-bold text-sm">
                                        {(review.studentName || 'S')[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-white">
                                          {review.studentName || 'Anonymous'}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                          {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          }) : 'Recently'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {review.feedback && (
                                  <p className="text-gray-300 whitespace-pre-wrap">
                                    {review.feedback}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                          <p className="text-gray-400 italic">
                            No reviews yet. Be the first to leave a review after completing this batch!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'creator' && (
                  <div>
                    <div className="flex gap-6 items-start">
                      <img
                        src={creatorProfile?.profileImage || course.instructorImage || getAvatarUrl(course.instructor || 'Instructor', 200)}
                        alt={creatorProfile?.name || course.instructor}
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getAvatarUrl(course.instructor || 'Instructor', 200);
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {creatorProfile?.name || course.instructor}
                        </h3>
                        {creatorProfile?.expertise && (
                          <p className="text-gray-400 mb-4">{creatorProfile.expertise}</p>
                        )}
                        {creatorProfile?.bio && (
                          <p className="text-gray-300 mb-4">
                            {creatorProfile.bio}
                          </p>
                        )}
                        {(creatorProfile?.instagram || creatorProfile?.youtube || creatorProfile?.twitter || creatorProfile?.linkedin) && (
                          <div className="flex gap-3">
                            {creatorProfile.instagram && (
                              <a 
                                href={creatorProfile.instagram} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors"
                                title="Instagram"
                              >
                                <span className="text-white text-sm">IG</span>
                              </a>
                            )}
                            {creatorProfile.youtube && (
                              <a 
                                href={creatorProfile.youtube} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors"
                                title="YouTube"
                              >
                                <span className="text-white text-sm">YT</span>
                              </a>
                            )}
                            {creatorProfile.twitter && (
                              <a 
                                href={creatorProfile.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors"
                                title="Twitter"
                              >
                                <span className="text-white text-sm">TW</span>
                              </a>
                            )}
                            {creatorProfile.linkedin && (
                              <a 
                                href={creatorProfile.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors"
                                title="LinkedIn"
                              >
                                <span className="text-white text-sm">LI</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Course Info */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 sticky top-24">
                {/* Course Image */}
                <div className="rounded-xl overflow-hidden mb-6">
                  <img
                    src={course.image || DEFAULT_COURSE_IMAGE}
                    alt={course.title}
                    className="w-full h-auto object-cover"
                    onError={handleCourseImageError}
                  />
                </div>

                {/* Price */}
                <h3 className="text-3xl font-bold text-white mb-6">
                  ₹{course.price.toFixed(2)} INR
                </h3>

                {/* Course Meta */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <BookOpen className="w-5 h-5" />
                      <span>Creator</span>
                    </div>
                    <span className="text-white font-semibold">{course.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-5 h-5" />
                      <span>Students</span>
                    </div>
                    <span className="text-white font-semibold">{course.enrollmentCount || 0} Students</span>
                  </div>

                  {course.startISO && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-5 h-5" />
                        <span>Starting Date</span>
                      </div>
                      <span className="text-white font-semibold">
                        {(() => {
                          try {
                            const startDate = course.startISO ? new Date(course.startISO) : null;
                            if (startDate && !isNaN(startDate.getTime())) {
                              return startDate.toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              });
                            }
                            return course.startDate || 'TBA';
                          } catch {
                            return course.startDate || 'TBA';
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  {course.scheduleType && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-5 h-5" />
                        <span>Schedule Type</span>
                      </div>
                      <span className="text-white font-semibold">
                        {course.scheduleType === 'one-time' ? 'One-time Session' : 'Recurring Classes'}
                      </span>
                    </div>
                  )}

                  {course.startTime && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-5 h-5" />
                        <span>Batch Time</span>
                      </div>
                      <span className="text-white font-semibold">
                        {(() => {
                          const formatTime = (time: string) => {
                            if (!time) return '';
                            if (time.includes('AM') || time.includes('PM')) return time;
                            try {
                              const [hours, minutes] = time.split(':');
                              const hour = parseInt(hours);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const hour12 = hour % 12 || 12;
                              return `${hour12}:${minutes || '00'} ${ampm}`;
                            } catch {
                              return time;
                            }
                          };
                          const start = formatTime(course.startTime);
                          const end = course.endTime ? formatTime(course.endTime) : '';
                          return end ? `${start} - ${end}` : start;
                        })()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-5 h-5" />
                      <span>Sessions</span>
                    </div>
                    <span className="text-white font-semibold">{course.sections} {course.sections === 1 ? 'Session' : 'Sessions'}</span>
                  </div>

                  {course.sessionLengthMinutes && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-5 h-5" />
                        <span>Session Duration</span>
                      </div>
                      <span className="text-white font-semibold">
                        {course.sessionLengthMinutes < 60 
                          ? `${course.sessionLengthMinutes} minutes`
                          : `${Math.floor(course.sessionLengthMinutes / 60)}h ${course.sessionLengthMinutes % 60 > 0 ? `${course.sessionLengthMinutes % 60}m` : ''}`}
                      </span>
                    </div>
                  )}

                  {course.maxSeats && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-5 h-5" />
                        <span>Max Students</span>
                      </div>
                      <span className="text-white font-semibold">{course.maxSeats} Students</span>
                    </div>
                  )}

                  {course.days && course.days.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-5 h-5" />
                        <span>Days</span>
                      </div>
                      <span className="text-white font-semibold">{course.days.join(', ')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Globe className="w-5 h-5" />
                      <span>Language</span>
                    </div>
                    <span className="text-white font-semibold">English</span>
                  </div>

                  {course.category && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Tag className="w-5 h-5" />
                        <span>Category</span>
                      </div>
                      <span className="text-white font-semibold">{course.category}</span>
                    </div>
                  )}

                  {course.subCategory && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Tag className="w-5 h-5" />
                        <span>Sub Category</span>
                      </div>
                      <span className="text-white font-semibold">{course.subCategory}</span>
                    </div>
                  )}

                  {course.scheduleType === 'recurring' && course.startDate ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span>Batch Starts</span>
                      </div>
                      <span className="text-white font-semibold">
                        {(() => {
                          try {
                            const date = new Date(course.startDate);
                            return date.toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            });
                          } catch {
                            return course.startDate;
                          }
                        })()}
                      </span>
                    </div>
                  ) : course.scheduleType === 'recurring' ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span>Batch Starts</span>
                      </div>
                      <span className="text-gray-500 text-sm">TBA</span>
                    </div>
                  ) : null}

                  {course.maxSeats && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-5 h-5" />
                        <span>Max Seats</span>
                      </div>
                      <span className="text-white font-semibold">{course.maxSeats}</span>
                    </div>
                  )}
                </div>

                {!isEnrolled && (
                  <>
                    {!user ? (
                      <div className="space-y-3">
                        <p className="text-center text-blue-300 font-medium text-base">
                          Login Required to Enroll
                        </p>
                        <Link
                          href={`/signup-login?redirect=/product/${params.slug}`}
                          className="w-full px-8 py-4 rounded-lg text-white font-semibold transition-all duration-200 shadow-lg bg-gradient-to-r from-[#6C63FF] to-[#D92A63] hover:opacity-90 shadow-[#6C63FF]/30 flex items-center justify-center"
                        >
                          Login / Sign Up to Continue
                        </Link>
                        <p className="text-center text-gray-400 text-sm">
                          Create an account to enroll in this batch
                        </p>
                      </div>
                    ) : isInCart ? (
                      <Link
                        href="/checkout"
                        className="w-full px-8 py-4 rounded-lg text-white font-semibold transition-all duration-200 shadow-lg bg-gradient-to-r from-[#D92A63] to-[#FF654B] hover:opacity-90 shadow-[#D92A63]/30 flex items-center justify-center"
                      >
                        View Cart & Checkout
                      </Link>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className="w-full px-8 py-4 rounded-lg text-white font-semibold transition-opacity duration-200 shadow-lg bg-gradient-to-r from-[#D92A63] to-[#FF654B] hover:opacity-90 shadow-[#D92A63]/30"
                      >
                        Add to Cart
                      </button>
                    )}
                  </>
                )}
                {isEnrolled && (
                  <div className="w-full px-8 py-4 rounded-lg text-white font-semibold bg-green-600/20 border border-green-500/50 text-center">
                    ✓ You're enrolled in this batch
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-16 bg-gradient-to-b from-[#0F3460] to-[#1A1A2E]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Our related batches</h2>
            <Link
              href="/batches"
              className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              View all batches
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCourses.map((relatedCourse) => (
              <div key={relatedCourse.id} className="h-full">
                <Link
                  href={`/product/${relatedCourse.slug}`}
                  className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-[#D92A63]/50 transition-all group h-full flex flex-col block"
                >
                <div className="relative flex-shrink-0">
                  <img
                    src={relatedCourse.image || DEFAULT_COURSE_IMAGE}
                    alt={relatedCourse.title}
                    className="w-full h-48 object-cover"
                    onError={() => handleRelatedImageError(relatedCourse.id)}
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <img
                      src={relatedCourse.instructorImage || getAvatarUrl(relatedCourse.instructor || 'Instructor', 128)}
                      alt={relatedCourse.instructor}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={() => handleRelatedInstructorImageError(relatedCourse.id)}
                    />
                    <span className="text-white text-sm">{relatedCourse.instructor}</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#FF654B] transition-colors line-clamp-2 min-h-[3.5rem]">
                    {relatedCourse.title}
                  </h3>

                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{relatedCourse.sections} {relatedCourse.sections === 1 ? 'Session' : 'Sessions'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{relatedCourse.duration} Days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{relatedCourse.students} {relatedCourse.students === 1 ? 'Student' : 'Students'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <h4 className="text-2xl font-bold text-white">
                      ₹{relatedCourse.price.toFixed(2)}
                    </h4>
                    {relatedCourse.originalPrice !== relatedCourse.price && (
                      <span className="text-gray-500 line-through">
                        ₹{relatedCourse.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
