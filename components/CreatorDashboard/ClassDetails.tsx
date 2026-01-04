'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './ClassDetails.module.css';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    firebaseStorage: any;
    doc: any;
    getDoc: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    updateDoc: any;
    serverTimestamp: any;
    Timestamp: any;
  }
}

interface ClassData {
  classId: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  subCategory: string;
  price: number;
  scheduleType: 'one-time' | 'recurring';
  numberSessions: number;
  sessionDuration?: number;
  maxStudents?: number;
  language?: string;
  level?: string;
  prerequisites?: string;
  learningOutcomes?: string;
  videoLink?: string;
  thumbnailUrl?: string;
  status: string;
  creatorId: string;
  creatorName?: string;
  createdAt: any;
  [key: string]: any;
}

interface BatchData {
  id: string;
  batchDate: any;
  batchTime: string;
  duration: number;
  maxStudents: number;
  enrolledStudents: number;
  attendedStudents?: number;
  status: string;
  meetingLink?: string;
  recordingLink?: string;
}

interface EnrollmentData {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: any;
  attended?: boolean;
  sessionAttendance?: Record<string, any>;
  totalSessions?: number;
  attendedSessions?: number;
  attendanceRate?: number;
  rating?: number;
  feedback?: string;
}

interface ClassDetailsProps {
  classId: string;
  onBack: () => void;
  onStartClass?: (batchId: string) => void;
  onEdit?: () => void;
}

export default function ClassDetails({ classId, onBack, onStartClass, onEdit }: ClassDetailsProps) {
  const { showError, showInfo, showSuccess } = useNotification();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'students' | 'sessions'>('overview');

  useEffect(() => {
    fetchClassData();
    fetchBatches();
    fetchSessions();
    fetchEnrollments();
  }, [classId]);

  const fetchClassData = async () => {
    if (!window.firebaseDb || !window.doc || !window.getDoc) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const classSnap = await window.getDoc(classRef);

      if (classSnap.exists()) {
        setClassData({ classId: classSnap.id, ...classSnap.data() } as ClassData);
      } else {
        showError('Batch not found!');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching class data:', error);
      showError('Failed to load class data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    try {
      const batchesRef = window.collection(window.firebaseDb, 'batches');
      const q = window.query(batchesRef, window.where('classId', '==', classId));
      const querySnapshot = await window.getDocs(q);

      const batchesList: BatchData[] = [];
      querySnapshot.forEach((doc: any) => {
        batchesList.push({ id: doc.id, ...doc.data() });
      });

      batchesList.sort((a, b) => {
        const aTime = a.batchDate?.toMillis?.() || 0;
        const bTime = b.batchDate?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setBatches(batchesList);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchSessions = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    try {
      const sessionsRef = window.collection(window.firebaseDb, 'sessions');
      const q = window.query(sessionsRef, window.where('classId', '==', classId));
      const querySnapshot = await window.getDocs(q);

      const sessionsList: any[] = [];
      querySnapshot.forEach((doc: any) => {
        const sessionData = { id: doc.id, ...doc.data() };
        sessionsList.push(sessionData);
        // Debug: Log session data
        console.log(`📅 Session ${doc.id} - status: ${sessionData.status}, attendance:`, sessionData.attendance);
      });

      // Sort by session number or date
      sessionsList.sort((a, b) => {
        const aNum = a.sessionNumber || 0;
        const bNum = b.sessionNumber || 0;
        if (aNum !== bNum) return aNum - bNum;
        const aDate = a.sessionDate?.toMillis?.() || 0;
        const bDate = b.sessionDate?.toMillis?.() || 0;
        return aDate - bDate;
      });

      console.log(`✅ Fetched ${sessionsList.length} sessions for class ${classId}`);
      setSessions(sessionsList);
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
    }
  };

  const fetchEnrollments = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const q = window.query(enrollmentsRef, window.where('classId', '==', classId));
      const querySnapshot = await window.getDocs(q);

      const enrollmentsList: EnrollmentData[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data();
        enrollmentsList.push({ id: doc.id, ...data });
        // Debug: Log attendance data
        if (data.sessionAttendance) {
          const sessionKeys = Object.keys(data.sessionAttendance);
          console.log(`👤 Enrollment ${doc.id} (${data.studentName}) - sessionAttendance keys:`, sessionKeys);
          sessionKeys.forEach(sessionId => {
            const att = data.sessionAttendance[sessionId];
            console.log(`  └─ Session ${sessionId}: attended=${att.attended}, sessionNumber=${att.sessionNumber}`);
          });
        } else {
          console.log(`👤 Enrollment ${doc.id} (${data.studentName}) - NO sessionAttendance data`);
        }
      });

      console.log(`✅ Fetched ${enrollmentsList.length} enrollments for class ${classId}`);
      setEnrollments(enrollmentsList);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Calculate analytics with per-session attendance
  const totalEnrollments = enrollments.length;
  
  // Calculate attendance from sessionAttendance data
  let totalAttended = 0;
  let totalAttendanceRate = 0;
  let studentsWithSessions = 0;
  
  console.log(`📊 Calculating analytics for ${enrollments.length} enrollments...`);
  enrollments.forEach(e => {
    const sessionAttendance = e.sessionAttendance || {};
    const sessions = Object.keys(sessionAttendance).length;
    if (sessions > 0) {
      studentsWithSessions++;
      const attended = Object.values(sessionAttendance).filter((s: any) => s.attended).length;
      if (attended > 0) {
        totalAttended++;
      }
      const rate = (attended / sessions) * 100;
      totalAttendanceRate += rate;
      console.log(`  └─ Student ${e.studentName}: ${attended}/${sessions} sessions attended (${rate.toFixed(1)}%)`);
    }
  });
  
  // Calculate average attendance rate only for students who have session data
  const averageAttendanceRate = studentsWithSessions > 0 ? totalAttendanceRate / studentsWithSessions : 0;
  console.log(`📊 Analytics Result: totalAttended=${totalAttended}, studentsWithSessions=${studentsWithSessions}, averageRate=${averageAttendanceRate.toFixed(1)}%`);
  
  const averageRating = enrollments.filter(e => e.rating).length > 0
    ? (enrollments.reduce((sum, e) => sum + (e.rating || 0), 0) / enrollments.filter(e => e.rating).length).toFixed(1)
    : 'N/A';
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  const upcomingBatches = batches.filter(b => b.status === 'scheduled').length;
  const totalRevenue = totalEnrollments * (classData?.price || 0);

  const handleStartClass = (batchId: string) => {
    if (onStartClass) {
      onStartClass(batchId);
    } else {
      showInfo('Start class functionality - Opens live room for this batch');
    }
  };

  const [uploadingRecording, setUploadingRecording] = useState<string | null>(null);
  const [recordingFile, setRecordingFile] = useState<{ [key: string]: File }>({});

  const handleRecordingFileChange = (batchId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecordingFile(prev => ({ ...prev, [batchId]: file }));
  };

  const handleUploadRecording = async (batchId: string) => {
    const file = recordingFile[batchId];
    if (!file) {
      showError('Please select a recording file first');
      return;
    }

    if (!classId) {
      showError('Class ID not found. Please try again.');
      return;
    }

    setUploadingRecording(batchId);
    try {
      const { uploadVideo, getClassRecordingPath, validateFile } = await import('@/lib/utils/serverStorage');
      
      // Validate file
      const validation = validateFile(file, 'video');
      if (!validation.valid) {
        showError(validation.error || 'Invalid file');
        return;
      }

      // Upload video
      const path = getClassRecordingPath(classId, batchId, file.name);
      const downloadURL = await uploadVideo(file, path);

      // Update batch with recording link
      if (window.firebaseDb && window.doc && window.updateDoc) {
        const batchRef = window.doc(window.firebaseDb, 'batches', batchId);
        await window.updateDoc(batchRef, {
          recordingLink: downloadURL,
          updatedAt: window.serverTimestamp(),
        });
      }

      // Refresh batches
      await fetchBatches();

      showSuccess('Recording uploaded successfully!');
      setRecordingFile(prev => {
        const newState = { ...prev };
        delete newState[batchId];
        return newState;
      });
    } catch (error: any) {
      console.error('Recording upload error:', error);
      showError(error.message || 'Failed to upload recording');
    } finally {
      setUploadingRecording(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
          Loading batch details...
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
          Batch not found.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <h2 className={styles.title}>{classData.title}</h2>
        {classData.subtitle && (
          <p className={styles.subtitle}>{classData.subtitle}</p>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'students' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Members ({totalEnrollments})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({sessions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            {/* Class Info Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Class Information</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Category:</span>
                  <span className={styles.infoValue}>{classData.category}</span>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Sub-Category:</span>
                  <span className={styles.infoValue}>{classData.subCategory}</span>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Price:</span>
                  <span className={styles.infoValue}>₹{classData.price}</span>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Type:</span>
                  <span className={styles.infoValue}>
                    {classData.scheduleType === 'one-time' ? 'One-Time Class' : 'Batch (Recurring)'}
                  </span>
                </div>
                <div className={styles.divider}></div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Number of Sessions:</span>
                  <span className={styles.infoValue}>{classData.numberSessions || 1}</span>
                </div>
                {classData.scheduleType === 'recurring' && classData.startDate && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Batch Start Date:</span>
                      <span className={styles.infoValue}>
                        {(() => {
                          try {
                            const date = new Date(classData.startDate);
                            return date.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            });
                          } catch {
                            return classData.startDate;
                          }
                        })()}
                        {classData.recurringStartTime && ` at ${classData.recurringStartTime}`}
                      </span>
                    </div>
                    {classData.endDate && (
                      <>
                        <div className={styles.divider}></div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Batch End Date:</span>
                          <span className={styles.infoValue}>
                            {(() => {
                              try {
                                const date = new Date(classData.endDate);
                                return date.toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                });
                              } catch {
                                return classData.endDate;
                              }
                            })()}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
                {classData.scheduleType === 'one-time' && classData.date && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Batch Date:</span>
                      <span className={styles.infoValue}>
                        {(() => {
                          try {
                            const date = new Date(classData.date);
                            return date.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            });
                          } catch {
                            return classData.date;
                          }
                        })()}
                        {classData.startTime && ` at ${classData.startTime}`}
                      </span>
                    </div>
                  </>
                )}
                {classData.maxStudents && (
                  <>
                    <div className={styles.divider}></div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Max Capacity:</span>
                      <span className={styles.infoValue}>{classData.maxStudents} Members</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Quick Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{totalEnrollments}</div>
                  <div className={styles.statLabel}>Total Enrollments</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{upcomingBatches}</div>
                  <div className={styles.statLabel}>Upcoming Batches</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{completedBatches}</div>
                  <div className={styles.statLabel}>Completed</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>₹{totalRevenue}</div>
                  <div className={styles.statLabel}>Total Revenue</div>
                </div>
              </div>
            </div>

            {/* Upcoming Batches Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Upcoming Batches</h3>
              {batches.filter(b => b.status === 'scheduled').length === 0 ? (
                <p className={styles.emptyText}>No upcoming batches scheduled.</p>
              ) : (
                <div className={styles.batchList}>
                  {batches.filter(b => b.status === 'scheduled').map((batch) => (
                    <div key={batch.id} className={styles.batchItem}>
                      <div className={styles.batchInfo}>
                        <div className={styles.batchDate}>
                          📅 {formatDate(batch.batchDate)} at {batch.batchTime}
                        </div>
                        <div className={styles.batchMeta}>
                          👥 {batch.enrolledStudents}/{batch.maxStudents} enrolled
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartClass(batch.id)}
                        className={styles.startButton}
                      >
                        Start Batch
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description Card */}
            {classData.description && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Description</h3>
                <p className={styles.description}>{classData.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className={styles.analyticsGrid}>
            {/* Enrollment Analytics */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Enrollment Analytics</h3>
              <div className={styles.analyticsStats}>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Total Enrollments</div>
                  <div className={styles.analyticValue}>{totalEnrollments}</div>
                </div>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Students Attended</div>
                  <div className={styles.analyticValue}>{totalAttended}</div>
                </div>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Average Attendance Rate</div>
                  <div className={styles.analyticValue}>
                    {averageAttendanceRate > 0 ? `${averageAttendanceRate.toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Average Rating</div>
                  <div className={styles.analyticValue}>
                    {averageRating !== 'N/A' ? `⭐ ${averageRating}` : 'No ratings yet'}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Analytics */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Revenue Analytics</h3>
              <div className={styles.analyticsStats}>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Price per Student</div>
                  <div className={styles.analyticValue}>₹{classData.price}</div>
                </div>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Total Revenue</div>
                  <div className={styles.analyticValue}>₹{totalRevenue}</div>
                </div>
                <div className={styles.analyticItem}>
                  <div className={styles.analyticLabel}>Avg. per Batch</div>
                  <div className={styles.analyticValue}>
                    ₹{batches.length > 0 ? (totalRevenue / batches.length).toFixed(0) : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Performance */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Batch Performance</h3>
              {batches.length === 0 ? (
                <p className={styles.emptyText}>No batches created yet.</p>
              ) : (
                <div className={styles.batchPerformanceList}>
                  {batches.map((batch) => (
                    <div key={batch.id} className={styles.performanceItem}>
                      <div className={styles.performanceInfo}>
                        <div className={styles.performanceDate}>
                          {formatDate(batch.batchDate)} at {batch.batchTime}
                        </div>
                        <div className={styles.performanceMeta}>
                          {batch.enrolledStudents}/{batch.maxStudents} enrolled
                          {batch.attendedStudents !== undefined && ` • ${batch.attendedStudents} attended`}
                        </div>
                      </div>
                      <div className={styles.performanceStatus} style={{
                        color: batch.status === 'completed' ? '#4CAF50' : batch.status === 'scheduled' ? '#FF9800' : '#F44336'
                      }}>
                        {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className={styles.studentsContent}>
            {enrollments.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No students enrolled yet.</p>
              </div>
            ) : (
              <div className={styles.studentList}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCol}>Student Name</div>
                  <div className={styles.tableCol}>Email</div>
                  <div className={styles.tableCol}>Enrolled On</div>
                  <div className={styles.tableCol}>Status</div>
                </div>
                {enrollments.map((enrollment) => {
                  const sessionAttendance = enrollment.sessionAttendance || {};
                  const totalSessions = Object.keys(sessionAttendance).length;
                  const attendedSessions = Object.values(sessionAttendance).filter((s: any) => s.attended).length;
                  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
                  
                  return (
                    <div key={enrollment.id} className={styles.tableRow}>
                      <div className={styles.tableCol}>{enrollment.studentName}</div>
                      <div className={styles.tableCol}>{enrollment.studentEmail}</div>
                      <div className={styles.tableCol}>{formatDateTime(enrollment.enrolledAt)}</div>
                      <div className={styles.tableCol}>
                        {totalSessions > 0 ? (
                          <span>
                            {attendedSessions}/{totalSessions} sessions ({attendanceRate.toFixed(0)}%)
                          </span>
                        ) : (
                          <span>⏳ No sessions yet</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab - Per-Session Attendance */}
        {activeTab === 'sessions' && (
          <div className={styles.studentsContent}>
            {sessions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No sessions created yet.</p>
              </div>
            ) : (
              <div className={styles.studentList}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCol}>Session</div>
                  <div className={styles.tableCol}>Date & Time</div>
                  <div className={styles.tableCol}>Status</div>
                  <div className={styles.tableCol}>Attendance</div>
                </div>
                {sessions.map((session) => {
                  const attendance = session.attendance || {};
                  const presentCount = attendance.present || 0;
                  const totalEnrolled = attendance.totalEnrolled || enrollments.length;
                  const attendanceRate = totalEnrolled > 0 ? ((presentCount / totalEnrolled) * 100).toFixed(0) : '0';
                  
                  return (
                    <div key={session.id} className={styles.tableRow}>
                      <div className={styles.tableCol}>
                        Session {session.sessionNumber || 'N/A'}
                      </div>
                      <div className={styles.tableCol}>
                        {session.sessionDate ? formatDate(session.sessionDate) : 'N/A'} 
                        {session.sessionTime && ` at ${session.sessionTime}`}
                      </div>
                      <div className={styles.tableCol}>
                        <span style={{
                          color: session.status === 'completed' ? '#4CAF50' : 
                                 session.status === 'live' ? '#D92A63' : 
                                 session.status === 'scheduled' ? '#FF9800' : '#F44336',
                          fontWeight: '600'
                        }}>
                          {session.status?.charAt(0).toUpperCase() + session.status?.slice(1) || 'N/A'}
                        </span>
                      </div>
                      <div className={styles.tableCol}>
                        {session.status === 'completed' ? (
                          <span>
                            {(() => {
                              // Calculate actual attendance from enrollments
                              let actualPresent = 0;
                              let actualTotal = 0;
                              enrollments.forEach(e => {
                                const sessionAttendance = e.sessionAttendance || {};
                                if (sessionAttendance[session.id]) {
                                  actualTotal++;
                                  if (sessionAttendance[session.id].attended) {
                                    actualPresent++;
                                  }
                                }
                              });
                              // Use actual data if available, otherwise fallback to session.attendance
                              const displayPresent = actualTotal > 0 ? actualPresent : presentCount;
                              const displayTotal = actualTotal > 0 ? actualTotal : (totalEnrolled || enrollments.length);
                              const displayRate = displayTotal > 0 ? ((displayPresent / displayTotal) * 100).toFixed(0) : '0';
                              return `${displayPresent}/${displayTotal} (${displayRate}%)`;
                            })()}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        {onEdit && classData.status !== 'approved' && (
          <button onClick={onEdit} className={styles.actionButton}>
            ✏️ Edit Batch
          </button>
        )}
        <button onClick={onBack} className={styles.secondaryButton}>
          Close
        </button>
      </div>
    </div>
  );
}
