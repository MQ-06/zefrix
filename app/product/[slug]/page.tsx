'use client';

import { useState, useEffect } from 'react';
import { courses } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { BookOpen, Clock, Users, Globe, Award } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';

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
  const staticCourse = courses.find((c) => c.slug === params.slug);
  const [course, setCourse] = useState<any>(staticCourse || null);
  const [loading, setLoading] = useState(!staticCourse);
  const [activeTab, setActiveTab] = useState('overview');
  const { addToCart, cart } = useCart();
  const router = useRouter();
  const [isInCart, setIsInCart] = useState(false);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

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
      if (staticCourse) {
        setLoading(false);
        return;
      }

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
          setCourse({
            id: docSnap.id,
            slug: docSnap.id,
            title: data.title || 'Untitled Class',
            price: data.price || 0,
            image: data.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/6920a8850f07fb7c7a783e79_691111ab3e1733ebffd9b861_course-12.jpg",
            instructor: data.creatorName || 'Instructor',
            instructorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.creatorName || 'I')}&background=D92A63&color=fff`,
            description: data.description || 'No description available.',
            sections: data.numberSessions || 1,
            duration: data.duration || 1,
            students: 0,
            originalPrice: data.price || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching class:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.slug, staticCourse]);

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

  const handleAddToCart = () => {
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

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#1A1A2E] to-[#16213E]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gradient-to-b from-[#16213E] to-[#0F3460]">
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
                  onClick={() => setActiveTab('result')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'result'
                    ? 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  Result
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
                <button
                  onClick={() => setActiveTab('faqs')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'faqs'
                    ? 'bg-gradient-to-r from-[#D92A63] to-[#FF654B] text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                >
                  FAQs
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Course Description</h2>
                    <div className="text-gray-300 space-y-4">
                      <p>
                        Anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator.
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>But her ready least set lived spite solid</li>
                        <li>Frequently partiality possession resolution at or appearance</li>
                        <li>No visited raising gravity outward subject my cottage Mr be</li>
                      </ul>
                      <p>
                        Improved own provided blessing may peculiar domestic. Sight house has sex never. No visited raising gravity outward subject my cottage Mr be. Hold do at tore in park feet near my case.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'result' && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Results after course completion</h2>
                    <div className="text-gray-300 space-y-4">
                      <p>
                        Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure.
                      </p>
                      <p>
                        But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'instructor' && (
                  <div>
                    <div className="flex gap-6 items-start">
                      <img
                        src={course.instructorImage}
                        alt={course.instructor}
                        className="w-24 h-24 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">{course.instructor}</h3>
                        <p className="text-gray-400 mb-4">Instructor</p>
                        <p className="text-gray-300 mb-4">
                          But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born.
                        </p>
                        <div className="flex gap-3">
                          <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors">
                            <span className="text-white text-sm">f</span>
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors">
                            <span className="text-white text-sm">in</span>
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#FF654B] transition-colors">
                            <span className="text-white text-sm">tw</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        What should I look for in a course description when choosing an online course?
                      </h3>
                      <p className="text-gray-300">
                        When choosing an online course, look for a detailed course description that outlines the learning objectives, course content, prerequisites, instructor information, and any assessments or assignments.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        How can I determine if a course description aligns with my learning goals?
                      </h3>
                      <p className="text-gray-300">
                        Pay attention to the course objectives and content outlined in the description. Ensure they match your learning objectives and interests. Look for keywords that indicate relevance to your goals.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        Are there specific formats or structures that course descriptions typically follow?
                      </h3>
                      <p className="text-gray-300">
                        While there is no standard format, course descriptions often include an overview of the course, learning outcomes, curriculum breakdown, instructor information, prerequisites, and any additional resources or materials.
                      </p>
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
                  ${course.price.toFixed(2)} USD
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Award className="w-5 h-5" />
                      <span>Certifications</span>
                    </div>
                    <span className="text-white font-semibold">Yes</span>
                  </div>
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
