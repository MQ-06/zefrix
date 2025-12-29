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

interface ClassInfo {
  id: string;
  title: string;
}

export default function EnrollmentList({ classId, className, onBack }: EnrollmentListProps) {
  const { showError } = useNotification();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [studentsInfo, setStudentsInfo] = useState<Record<string, StudentInfo>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(classId || null);

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

  const fetchClassesAndEnrollments = async (creatorId: string) => {
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

      const classesList: ClassInfo[] = [];
      const classIds: string[] = [];
      classesSnapshot.forEach((doc: any) => {
        const data = doc.data();
        classesList.push({ id: doc.id, title: data.title || 'Untitled Class' });
        classIds.push(doc.id);
      });

      // Sort classes by title
      classesList.sort((a, b) => a.title.localeCompare(b.title));
      setClasses(classesList);

      if (classIds.length === 0) {
        setEnrollments([]);
        setAllEnrollments([]);
        setLoading(false);
        return;
      }

      // Then get all enrollments for these classes
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const fetchedEnrollments: Enrollment[] = [];

      // Firestore 'in' query has limit of 10, so we need to batch
      for (let i = 0; i < classIds.length; i += 10) {
        const batch = classIds.slice(i, i + 10);
        const q = window.query(enrollmentsRef, window.where('classId', 'in', batch));
        const querySnapshot = await window.getDocs(q);
        querySnapshot.forEach((doc: any) => {
          fetchedEnrollments.push({ id: doc.id, ...doc.data() });
        });
      }

      // Sort by enrollment date (newest first)
      fetchedEnrollments.sort((a, b) => {
        const aTime = a.enrolledAt?.toMillis?.() || 0;
        const bTime = b.enrolledAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setAllEnrollments(fetchedEnrollments);
      setEnrollments(fetchedEnrollments);
      await fetchStudentsInfo(fetchedEnrollments);
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
      // Start with enrollment data as fallback
      const enrollment = enrollmentsList.find(e => e.studentId === studentId);
      const fallbackInfo: StudentInfo = {
        name: enrollment?.studentName || 'Student',
        email: enrollment?.studentEmail || '',
      };

      // Try to fetch additional user info, but don't fail if permissions are insufficient
      try {
        const userRef = window.doc(window.firebaseDb, 'users', studentId);
        const userSnap = await window.getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          studentsMap[studentId] = {
            name: userData.name || userData.displayName || fallbackInfo.name,
            email: userData.email || fallbackInfo.email,
            phone: userData.phone || userData.whatsapp || '',
            photoURL: userData.photoURL || userData.profileImage || '',
          };
        } else {
          // Use enrollment data if user document doesn't exist
          studentsMap[studentId] = fallbackInfo;
        }
      } catch (error: any) {
        // If permission denied or any other error, use enrollment data
        // This is expected for creators who cannot read student user documents
        if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
          // Silently use enrollment data - this is expected behavior
          studentsMap[studentId] = fallbackInfo;
        } else {
          console.error(`Error fetching student ${studentId}:`, error);
          studentsMap[studentId] = fallbackInfo;
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

      {/* Class Filter - Only show when viewing all enrollments */}
      {!classId && classes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontWeight: '600',
            fontSize: '0.9375rem'
          }}>
            Filter by Class:
          </label>
          <select
            value={selectedClassId || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedClassId(value === 'all' ? null : value);
            }}
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              minWidth: '300px',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#D92A63';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <option value="all" style={{ background: '#1a1a2e', color: '#fff' }}>
              All Classes
            </option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id} style={{ background: '#1a1a2e', color: '#fff' }}>
                {cls.title}
              </option>
            ))}
          </select>
        </div>
      )}

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
                              src={student.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=D92A63&color=fff&size=128`}
                              alt={student.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('ui-avatars.com')) {
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=D92A63&color=fff&size=128`;
                                }
                              }}
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

