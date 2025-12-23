'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { BookOpen, Clock, Users, Globe, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    collection: any;
    doc: any;
    getDoc: any;
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
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [earliestBatchDate, setEarliestBatchDate] = useState<string | null>(null);

  useEffect(() => {
    // Load Firebase if not already loaded
    if (typeof window !== 'undefined' && !window.firebaseDb) {
      const script = document.createElement('script');
      script.type = 'module';
      script.innerHTML = `
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
        import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
        window.firebaseAuth = getAuth(app);
        window.firebaseDb = getFirestore(app);
        window.doc = doc;
        window.getDoc = getDoc;
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.getDocs = getDocs;
      `;
      document.body.appendChild(script);
    }

    const fetchCourse = async () => {
      // Wait for Firebase to load
      if (!window.firebaseDb || !window.doc || !window.getDoc) {
        setTimeout(fetchCourse, 500);
        return;
      }

      try {
        const docRef = window.doc(window.firebaseDb, 'classes', params.slug);
        const docSnap = await window.getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Only show approved classes
          if (data.status === 'approved') {
            setCourse({
              id: docSnap.id,
              slug: docSnap.id,
              title: data.title || 'Untitled Class',
              subtitle: data.subtitle || '',
              price: data.price || 0,
              image: data.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg",
              instructor: data.creatorName || 'Instructor',
              instructorId: data.creatorId || '',
              instructorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.creatorName || 'I')}&background=D92A63&color=fff`,
              description: data.description || 'No description available.',
              whatStudentsWillLearn: data.whatStudentsWillLearn || '',
              level: data.level || '',
              sections: data.numberSessions || 1,
              duration: data.duration || 1,
              students: 0,
              originalPrice: data.price || 0,
              category: data.category || '',
              subCategory: data.subCategory || data.subcategory || '',
              maxSeats: data.maxSeats || undefined,
              scheduleType: data.scheduleType || '',
            });
          } else {
            // Class exists but not approved
            setCourse(null);
          }
        } else {
          // Class not found
          setCourse(null);
        }
      } catch (err) {
        console.error('Error fetching class:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.slug]);

  // Fetch current user
  useEffect(() => {
    const checkUser = () => {
      if (window.firebaseAuth) {
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
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

  // Fetch related courses from Firestore
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
              title: data.title || 'Untitled Class',
              price: data.price || 0,
              image: data.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg",
              instructor: data.creatorName || 'Instructor',
              instructorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.creatorName || 'I')}&background=D92A63&color=fff`,
              sections: data.numberSessions || 1,
              duration: data.duration || 1,
              students: 0,
              originalPrice: data.price || 0,
            });
          }
        });

        // Take only first 3
        setRelatedCourses(classes.slice(0, 3));
      } catch (error) {
        console.error('Error fetching related courses:', error);
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
        <div className="text-white text-xl">Loading class...</div>
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

    // Check max seats if class has maxSeats set
    if (course.maxSeats && window.firebaseDb && window.collection && window.query && window.where && window.getDocs) {
      try {
        const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
        const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', course.id));
        const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
        const currentEnrollments = enrollmentsSnapshot.size;
        
        if (currentEnrollments >= course.maxSeats) {
          showError(`Sorry! This class is full. Maximum ${course.maxSeats} seats are already enrolled.`);
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
                      <img src={user.photoURL} alt={user.displayName || 'Student'} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      userInitial
                    )}
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
              href="/courses" 
              className="text-white font-semibold hover:text-[#FF654B] transition-colors inline-flex items-center gap-2"
            >
              ← Back to Courses
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
                  onClick={() => setActiveTab('instructor')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'instructor'
                    ? 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  Instructor
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {course.description && (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Course Description</h2>
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

                    {/* Testimonials Section - Coming Soon */}
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4">Reviews & Testimonials</h2>
                      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <p className="text-gray-400 italic">
                          Reviews and testimonials will be available soon. Be the first to leave a review after completing this course!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'instructor' && (
                  <div>
                    <div className="flex gap-6 items-start">
                      <img
                        src={creatorProfile?.profileImage || course.instructorImage}
                        alt={creatorProfile?.name || course.instructor}
                        className="w-24 h-24 rounded-full object-cover"
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
                    src={course.image}
                    alt={course.title}
                    className="w-full h-auto"
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
                      <span>Instructor</span>
                    </div>
                    <span className="text-white font-semibold">{course.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-5 h-5" />
                      <span>Students</span>
                    </div>
                    <span className="text-white font-semibold">{course.students} Students</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-5 h-5" />
                      <span>Duration</span>
                    </div>
                    <span className="text-white font-semibold">{course.duration} Days</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <BookOpen className="w-5 h-5" />
                      <span>Lessons</span>
                    </div>
                    <span className="text-white font-semibold">{course.sections} Sections</span>
                  </div>

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

                  {earliestBatchDate ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span>Batch Starts</span>
                      </div>
                      <span className="text-white font-semibold">{earliestBatchDate}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-5 h-5" />
                        <span>Batch Starts</span>
                      </div>
                      <span className="text-gray-500 text-sm">TBA</span>
                    </div>
                  )}

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

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isInCart}
                  className={`w-full px-8 py-4 rounded-lg text-white font-semibold transition-opacity duration-200 shadow-lg ${isInCart
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] hover:opacity-90 shadow-[#D92A63]/30'
                    }`}
                >
                  {isInCart ? 'Already in Cart' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Courses */}
      <section className="py-16 bg-gradient-to-b from-[#0F3460] to-[#1A1A2E]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Our related courses</h2>
            <Link
              href="/courses"
              className="bg-gradient-to-r from-[#D92A63] to-[#FF654B] px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              View all courses
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCourses.map((relatedCourse) => (
              <Link
                key={relatedCourse.id}
                href={`/product/${relatedCourse.slug}`}
                className="bg-white/5 backdrop-blur-lg rounded-xl overflow-hidden border border-white/10 hover:border-[#D92A63]/50 transition-all group"
              >
                <div className="relative">
                  <img
                    src={relatedCourse.image}
                    alt={relatedCourse.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <img
                      src={relatedCourse.instructorImage}
                      alt={relatedCourse.instructor}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-white text-sm">{relatedCourse.instructor}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#FF654B] transition-colors">
                    {relatedCourse.title}
                  </h3>

                  <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{relatedCourse.sections} Sections</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{relatedCourse.duration} Days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{relatedCourse.students} Students</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
