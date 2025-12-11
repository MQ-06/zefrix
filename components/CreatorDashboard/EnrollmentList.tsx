'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './ManageClasses.module.css';

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

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  classPrice: number;
  enrolledAt: any;
  status: string;
  paymentId?: string;
  rating?: number;
  feedback?: string;
}

interface StudentInfo {
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
}

interface EnrollmentListProps {
  classId?: string;
  className?: string;
  onBack?: () => void;
}

export default function EnrollmentList({ classId, className, onBack }: EnrollmentListProps) {
  const { showError } = useNotification();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentsInfo, setStudentsInfo] = useState<Record<string, StudentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb) {
        clearInterval(checkFirebase);
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          if (classId) {
            fetchEnrollments(classId);
          } else {
            fetchAllEnrollments(currentUser.uid);
          }
        } else {
          const unsubscribe = window.firebaseAuth.onAuthStateChanged((user: any) => {
            if (user) {
              setUser(user);
              if (classId) {
                fetchEnrollments(classId);
              } else {
                fetchAllEnrollments(user.uid);
              }
            } else {
              setLoading(false);
            }
          });
          return () => unsubscribe();
        }
      }
    }, 100);

    return () => clearInterval(checkFirebase);
  }, [classId]);

  const fetchEnrollments = async (targetClassId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const q = window.query(enrollmentsRef, window.where('classId', '==', targetClassId));
      const querySnapshot = await window.getDocs(q);

      const enrollmentsList: Enrollment[] = [];
      querySnapshot.forEach((doc: any) => {
        enrollmentsList.push({ id: doc.id, ...doc.data() });
      });

      // Sort by enrollment date (newest first)
      enrollmentsList.sort((a, b) => {
        const aTime = a.enrolledAt?.toMillis?.() || 0;
        const bTime = b.enrolledAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setEnrollments(enrollmentsList);
      
      // Fetch student info for each enrollment
      await fetchStudentsInfo(enrollmentsList);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      showError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEnrollments = async (creatorId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First get all classes by this creator
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const classesQuery = window.query(classesRef, window.where('creatorId', '==', creatorId));
      const classesSnapshot = await window.getDocs(classesQuery);

      const classIds: string[] = [];
      classesSnapshot.forEach((doc: any) => {
        classIds.push(doc.id);
      });

      if (classIds.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      // Then get all enrollments for these classes
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const allEnrollments: Enrollment[] = [];

      // Firestore 'in' query has limit of 10, so we need to batch
      for (let i = 0; i < classIds.length; i += 10) {
        const batch = classIds.slice(i, i + 10);
        const q = window.query(enrollmentsRef, window.where('classId', 'in', batch));
        const querySnapshot = await window.getDocs(q);
        querySnapshot.forEach((doc: any) => {
          allEnrollments.push({ id: doc.id, ...doc.data() });
        });
      }

      // Sort by enrollment date (newest first)
      allEnrollments.sort((a, b) => {
        const aTime = a.enrolledAt?.toMillis?.() || 0;
        const bTime = b.enrolledAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setEnrollments(allEnrollments);
      await fetchStudentsInfo(allEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      showError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsInfo = async (enrollmentsList: Enrollment[]) => {
    if (!window.firebaseDb || !window.doc || !window.getDoc) return;

    const studentsMap: Record<string, StudentInfo> = {};
    const uniqueStudentIds = Array.from(new Set(enrollmentsList.map(e => e.studentId)));

    for (const studentId of uniqueStudentIds) {
      try {
        const userRef = window.doc(window.firebaseDb, 'users', studentId);
        const userSnap = await window.getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          studentsMap[studentId] = {
            name: userData.name || userData.displayName || userData.email?.split('@')[0] || 'Student',
            email: userData.email || enrollmentsList.find(e => e.studentId === studentId)?.studentEmail || '',
            phone: userData.phone || userData.whatsapp || '',
            photoURL: userData.photoURL || userData.profileImage || '',
          };
        } else {
          // Fallback to enrollment data
          const enrollment = enrollmentsList.find(e => e.studentId === studentId);
          if (enrollment) {
            studentsMap[studentId] = {
              name: enrollment.studentName || 'Student',
              email: enrollment.studentEmail || '',
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching student ${studentId}:`, error);
        // Fallback to enrollment data
        const enrollment = enrollmentsList.find(e => e.studentId === studentId);
        if (enrollment) {
          studentsMap[studentId] = {
            name: enrollment.studentName || 'Student',
            email: enrollment.studentEmail || '',
          };
        }
      }
    }

    setStudentsInfo(studentsMap);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
        Loading enrollments...
      </div>
    );
  }

  return (
    <div className="creator-section">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginBottom: '1.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          ← Back
        </button>
      )}

      <h2 className="creator-section-title">
        {className ? `Enrollments: ${className}` : 'All Enrollments'}
      </h2>

      {enrollments.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          {classId ? 'No enrollments for this class yet.' : 'No enrollments found.'}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            Total Enrollments: <strong style={{ color: '#fff' }}>{enrollments.length}</strong>
          </div>

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
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Student</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Class</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Enrolled On</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Payment</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const student = studentsInfo[enrollment.studentId] || {
                    name: enrollment.studentName || 'Student',
                    email: enrollment.studentEmail || '',
                  };

                  return (
                    <tr
                      key={enrollment.id}
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
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {student.photoURL ? (
                            <img
                              src={student.photoURL}
                              alt={student.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #D92A63, #6C63FF)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: '700',
                              fontSize: '0.875rem'
                            }}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ color: '#fff', fontWeight: '600' }}>{student.name}</div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                              {student.email}
                            </div>
                            {student.phone && (
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                        <div style={{ fontWeight: '600' }}>{enrollment.className}</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          ₹{enrollment.classPrice?.toFixed(2) || '0.00'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatDate(enrollment.enrolledAt)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: enrollment.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: enrollment.status === 'active' ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
                          textTransform: 'uppercase'
                        }}>
                          {enrollment.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                        {enrollment.paymentId ? (
                          <span style={{ color: '#4CAF50' }}>✓ Paid</span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {enrollment.rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#FFD700' }}>⭐</span>
                            <span style={{ color: '#fff', fontWeight: '600' }}>{enrollment.rating}/5</span>
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>Not rated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

