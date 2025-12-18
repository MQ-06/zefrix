'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Firebase
    if (!window.firebaseDb) {
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
      `;
      document.head.appendChild(script);
    }

    const fetchData = async () => {
      if (!window.firebaseDb || !window.doc || !window.getDoc) {
        setTimeout(fetchData, 500);
        return;
      }

      try {
        // Fetch creator profile
        const userRef = window.doc(window.firebaseDb, 'users', creatorId);
        const userSnap = await window.getDoc(userRef);

        if (!userSnap.exists()) {
          setError('Creator not found');
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        setCreator({
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
        });

        // Fetch approved classes
        const classesRef = window.collection(window.firebaseDb, 'classes');
        const classesQuery = window.query(
          classesRef,
          window.where('creatorId', '==', creatorId),
          window.where('status', '==', 'approved')
        );
        const classesSnapshot = await window.getDocs(classesQuery);

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

        setClasses(classesList);

        // Fetch reviews/ratings
        const ratingsRef = window.collection(window.firebaseDb, 'ratings');
        const ratingsQuery = window.query(ratingsRef, window.where('classId', 'in', classesList.map(c => c.classId).slice(0, 10)));
        const ratingsSnapshot = await window.getDocs(ratingsQuery);

        const reviewsList: Review[] = [];
        ratingsSnapshot.forEach((doc: any) => {
          const data = doc.data();
          // Only include reviews for this creator's classes
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

        // Sort by date (newest first)
        reviewsList.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setReviews(reviewsList.slice(0, 10)); // Limit to 10 most recent
      } catch (err) {
        console.error('Error fetching creator profile:', err);
        setError('Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [creatorId]);

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

  if (loading) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  if (error || !creator) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        paddingTop: '2rem'
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
                About {creator.name}
              </h2>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '16/9',
                maxWidth: '800px'
              }}>
                {creator.introVideo.includes('youtube.com') || creator.introVideo.includes('youtu.be') ? (
                  <iframe
                    src={creator.introVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={creator.introVideo}
                    controls
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Upcoming Classes */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              Upcoming Classes & Batches
            </h2>
            {classes.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                No upcoming classes available at the moment.
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
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem'
                      }}>
                        <div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            {classItem.scheduleType === 'recurring' ? 'Batch' : 'One-time'} • {classItem.numberSessions} Sessions
                          </div>
                          {classItem.startDate && (
                            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              Starts: {formatDate(classItem.startDate)}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFD700' }}>
                          ₹{classItem.price.toFixed(2)}
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                Reviews & Ratings
              </h2>
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
        </div>
      </div>
      <Footer />
    </>
  );
}

