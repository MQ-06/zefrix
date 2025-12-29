'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    doc: any;
    getDoc: any;
  }
}

interface AnalyticsData {
  totalClasses: number;
  approvedClasses: number;
  pendingClasses: number;
  totalEnrollments: number;
  totalAttended: number;
  totalRevenue: number;
  averageRating: number;
  totalRatings: number;
  enrollmentsByClass: Array<{
    classId: string;
    className: string;
    enrollmentCount: number;
    attendedCount: number;
    revenue: number;
    averageRating: number;
    ratingCount: number;
  }>;
}

export default function Analytics() {
  const { showError } = useNotification();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClasses: 0,
    approvedClasses: 0,
    pendingClasses: 0,
    totalEnrollments: 0,
    totalAttended: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalRatings: 0,
    enrollmentsByClass: [],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb) {
        clearInterval(checkFirebase);
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          fetchAnalytics(currentUser.uid);
        } else {
          const unsubscribe = window.firebaseAuth.onAuthStateChanged((user: any) => {
            if (user) {
              setUser(user);
              fetchAnalytics(user.uid);
            } else {
              setLoading(false);
            }
          });
          return () => unsubscribe();
        }
      }
    }, 100);

    return () => clearInterval(checkFirebase);
  }, []);

  const fetchAnalytics = async (creatorId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch all classes by creator
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const classesQuery = window.query(classesRef, window.where('creatorId', '==', creatorId));
      const classesSnapshot = await window.getDocs(classesQuery);

      const classes: any[] = [];
      classesSnapshot.forEach((doc: any) => {
        classes.push({ classId: doc.id, ...doc.data() });
      });

      // Fetch all enrollments for these classes
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const allEnrollments: any[] = [];

      // Firestore 'in' query has limit of 10, so we need to batch
      const classIds = classes.map(c => c.classId);
      for (let i = 0; i < classIds.length; i += 10) {
        const batch = classIds.slice(i, i + 10);
        if (batch.length > 0) {
          const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', 'in', batch));
          const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
          enrollmentsSnapshot.forEach((doc: any) => {
            allEnrollments.push({ id: doc.id, ...doc.data() });
          });
        }
      }

      // Calculate analytics
      const approvedClasses = classes.filter(c => c.status === 'approved');
      const pendingClasses = classes.filter(c => c.status === 'pending');
      
      // Fetch ratings for all classes
      const ratingsRef = window.collection(window.firebaseDb, 'ratings');
      const allRatings: any[] = [];
      const ratingsSnapshot = await window.getDocs(ratingsRef);
      ratingsSnapshot.forEach((doc: any) => {
        allRatings.push({ id: doc.id, ...doc.data() });
      });

      // Calculate enrollments, attendance, revenue, and ratings by class
      const enrollmentsByClassMap: Record<string, { 
        className: string; 
        count: number; 
        attended: number;
        revenue: number;
        ratings: number[];
      }> = {};
      
      allEnrollments.forEach((enrollment) => {
        const classId = enrollment.classId;
        if (!enrollmentsByClassMap[classId]) {
          const classData = classes.find(c => c.classId === classId);
          enrollmentsByClassMap[classId] = {
            className: enrollment.className || classData?.title || 'Unknown Class',
            count: 0,
            attended: 0,
            revenue: 0,
            ratings: [],
          };
        }
        enrollmentsByClassMap[classId].count++;
        if (enrollment.attended) {
          enrollmentsByClassMap[classId].attended++;
        }
        const classData = classes.find(c => c.classId === classId);
        enrollmentsByClassMap[classId].revenue += enrollment.classPrice || classData?.price || 0;
        
        // Add rating if exists
        if (enrollment.rating) {
          enrollmentsByClassMap[classId].ratings.push(enrollment.rating);
        }
      });

      // Add ratings from ratings collection
      allRatings.forEach((rating) => {
        const classId = rating.classId;
        if (enrollmentsByClassMap[classId]) {
          enrollmentsByClassMap[classId].ratings.push(rating.rating);
        }
      });

      const enrollmentsByClass = Object.entries(enrollmentsByClassMap).map(([classId, data]) => {
        const avgRating = data.ratings.length > 0
          ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
          : 0;
        return {
          classId,
          className: data.className,
          enrollmentCount: data.count,
          attendedCount: data.attended,
          revenue: data.revenue,
          averageRating: avgRating,
          ratingCount: data.ratings.length,
        };
      });

      // Sort by enrollment count (descending)
      enrollmentsByClass.sort((a, b) => b.enrollmentCount - a.enrollmentCount);

      const totalRevenue = enrollmentsByClass.reduce((sum, item) => sum + item.revenue, 0);
      const totalAttended = allEnrollments.filter(e => e.attended).length;
      const allRatingsList = allRatings.map(r => r.rating).concat(
        allEnrollments.filter(e => e.rating).map(e => e.rating)
      );
      const averageRating = allRatingsList.length > 0
        ? allRatingsList.reduce((sum, r) => sum + r, 0) / allRatingsList.length
        : 0;

      setAnalytics({
        totalClasses: classes.length,
        approvedClasses: approvedClasses.length,
        pendingClasses: pendingClasses.length,
        totalEnrollments: allEnrollments.length,
        totalAttended,
        totalRevenue,
        averageRating,
        totalRatings: allRatingsList.length,
        enrollmentsByClass,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="creator-section">
      <h2 className="creator-section-title">Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Classes
          </div>
          <div style={{ color: '#fff', fontSize: '2rem', fontWeight: '700' }}>
            {analytics.totalClasses}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Approved Classes
          </div>
          <div style={{ color: '#4CAF50', fontSize: '2rem', fontWeight: '700' }}>
            {analytics.approvedClasses}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Enrollments
          </div>
          <div style={{ color: '#fff', fontSize: '2rem', fontWeight: '700' }}>
            {analytics.totalEnrollments}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Total Revenue
          </div>
          <div style={{ color: '#FFD700', fontSize: '2rem', fontWeight: '700' }}>
            ₹{analytics.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Attendance Rate
          </div>
          <div style={{ color: '#4CAF50', fontSize: '2rem', fontWeight: '700' }}>
            {analytics.totalEnrollments > 0 
              ? `${((analytics.totalAttended / analytics.totalEnrollments) * 100).toFixed(1)}%`
              : '0%'}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {analytics.totalAttended} / {analytics.totalEnrollments} attended
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Average Rating
          </div>
          <div style={{ color: '#FFD700', fontSize: '2rem', fontWeight: '700' }}>
            {analytics.averageRating > 0 ? `⭐ ${analytics.averageRating.toFixed(1)}` : 'N/A'}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {analytics.totalRatings} ratings
          </div>
        </div>
      </div>

      {/* Enrollments by Class */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Enrollments by Class
        </h3>

        {analytics.enrollmentsByClass.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            No enrollments yet. Once students enroll in your classes, you'll see the data here.
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Class Name</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#fff', fontWeight: '600' }}>Enrollments</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#fff', fontWeight: '600' }}>Attended</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#fff', fontWeight: '600' }}>Rating</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#fff', fontWeight: '600' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.enrollmentsByClass.map((item, index) => (
                  <tr
                    key={item.classId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: '600' }}>
                      {item.className}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'rgba(255, 255, 255, 0.9)' }}>
                      {item.enrollmentCount}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {item.attendedCount} ({item.enrollmentCount > 0 ? ((item.attendedCount / item.enrollmentCount) * 100).toFixed(0) : 0}%)
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#FFD700', fontWeight: '600' }}>
                      {item.averageRating > 0 ? `⭐ ${item.averageRating.toFixed(1)} (${item.ratingCount})` : 'No ratings'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#FFD700', fontWeight: '600' }}>
                      ₹{item.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

