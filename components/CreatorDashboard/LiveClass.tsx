'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    doc: any;
    getDoc: any;
    updateDoc: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    serverTimestamp: any;
    arrayUnion: any;
    Timestamp: any;
  }
}

interface LiveClassProps {
  classId: string;
  sessionId?: string;
  sessionNumber?: number;
  meetingLink: string;
  className: string;
  onEndClass: () => void;
}

interface StudentJoin {
  studentId: string;
  joinedAt: Date;
  isPresent: boolean;
}

export default function LiveClass({ classId, sessionId, sessionNumber, meetingLink, className, onEndClass }: LiveClassProps) {
  const { showSuccess, showError } = useNotification();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [studentJoins, setStudentJoins] = useState<Record<string, StudentJoin>>({});
  const [classStartTime, setClassStartTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchEnrolledStudents();
    // Mark session as live
    markSessionAsLive();
    setClassStartTime(new Date());
  }, [classId]);

  const fetchEnrolledStudents = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      setLoading(false);
      return;
    }

    try {
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', classId));
      const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);
      
      const enrolledStudents: any[] = [];
      enrollmentsSnapshot.forEach((doc: any) => {
        const enrollment = doc.data();
        enrolledStudents.push({
          id: doc.id,
          enrollmentId: doc.id,
          studentId: enrollment.studentId,
          name: enrollment.studentName || 'Student',
          email: enrollment.studentEmail || '',
          attended: enrollment.attended || false
        });
      });

      setStudents(enrolledStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const markSessionAsLive = async () => {
    if (!sessionId || !window.firebaseDb || !window.doc || !window.updateDoc) return;

    try {
      const sessionRef = window.doc(window.firebaseDb, 'sessions', sessionId);
      await window.updateDoc(sessionRef, {
        status: 'live',
        startedAt: window.serverTimestamp ? window.serverTimestamp() : new Date()
      });
    } catch (error) {
      console.error('Error marking session as live:', error);
    }
  };

  const handleToggleAttendance = (studentId: string) => {
    setStudentJoins(prev => {
      const current = prev[studentId];
      if (current) {
        // Toggle existing
        return {
          ...prev,
          [studentId]: {
            ...current,
            isPresent: !current.isPresent
          }
        };
      } else {
        // Mark as present with current time
        return {
          ...prev,
          [studentId]: {
            studentId,
            joinedAt: new Date(),
            isPresent: true
          }
        };
      }
    });
  };

  const handleEndClass = async () => {
    if (!window.firebaseDb || !window.doc || !window.updateDoc || !window.serverTimestamp || !sessionId || !window.firebaseAuth) {
      showError('Firebase not ready or session ID missing');
      return;
    }

    const currentUser = window.firebaseAuth.currentUser;
    if (!currentUser) {
      showError('You must be logged in to end a class');
      return;
    }

    // Verify creator owns this class
    try {
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      const classDoc = await window.getDoc(classRef);
      if (!classDoc.exists()) {
        showError('Class not found');
        return;
      }
      const classData = classDoc.data();
      if (classData.creatorId !== currentUser.uid) {
        showError('You do not have permission to end this class');
        return;
      }
    } catch (error: any) {
      console.error('Error verifying class ownership:', error);
      showError('Failed to verify permissions');
      return;
    }

    try {
      const presentStudentIds: string[] = [];
      const absentStudentIds: string[] = [];
      
      // Determine who attended based on studentJoins
      students.forEach((student) => {
        const joinRecord = studentJoins[student.studentId];
        if (joinRecord && joinRecord.isPresent) {
          presentStudentIds.push(student.studentId);
        } else {
          absentStudentIds.push(student.studentId);
        }
      });

      // Update each enrollment with per-session attendance
      const updatePromises = students.map(async (student) => {
        if (!student.enrollmentId || !window.updateDoc) return;

        const joinRecord = studentJoins[student.studentId];
        const attended = joinRecord?.isPresent || false;
        const joinedAt = joinRecord?.joinedAt || null;

        const enrollmentRef = window.doc(window.firebaseDb, 'enrollments', student.enrollmentId);
        let enrollmentData: any = {};
        if (window.getDoc) {
          const enrollmentDoc = await window.getDoc(enrollmentRef);
          enrollmentData = enrollmentDoc.data() || {};
        }

        // Get current sessionAttendance object
        const sessionAttendance = enrollmentData.sessionAttendance || {};
        
        // Update this session's attendance
        sessionAttendance[sessionId] = {
          attended: attended,
          joinedAt: joinedAt ? (window.serverTimestamp ? window.serverTimestamp() : joinedAt) : null,
          markedAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
          sessionNumber: sessionNumber || 1
        };

        // Calculate overall stats
        const totalSessions = Object.keys(sessionAttendance).length;
        const attendedSessions = Object.values(sessionAttendance).filter((s: any) => s.attended).length;
        const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

        // Update enrollment
        const updateData: any = {
          sessionAttendance: sessionAttendance,
          totalSessions: totalSessions,
          attendedSessions: attendedSessions,
          attendanceRate: attendanceRate
        };

        // Update lastAttendedAt if student attended
        if (attended) {
          updateData.lastAttendedAt = window.serverTimestamp ? window.serverTimestamp() : new Date();
        }

        await window.updateDoc(enrollmentRef, updateData);
        console.log(`✅ Updated enrollment ${student.enrollmentId} with attendance:`, updateData);
      });

      await Promise.all(updatePromises);
      console.log(`✅ Updated ${updatePromises.length} enrollments with attendance data`);

      // Update session document with attendance stats
      const sessionRef = window.doc(window.firebaseDb, 'sessions', sessionId);
      const sessionUpdateData = {
        status: 'completed',
        endedAt: window.serverTimestamp ? window.serverTimestamp() : new Date(),
        attendance: {
          totalEnrolled: students.length,
          present: presentStudentIds.length,
          absent: absentStudentIds.length,
          attendanceRate: students.length > 0 ? (presentStudentIds.length / students.length) * 100 : 0
        },
        attendedStudents: presentStudentIds,
        absentStudents: absentStudentIds,
        attendedCount: presentStudentIds.length
      };
      await window.updateDoc(sessionRef, sessionUpdateData);
      console.log(`✅ Updated session ${sessionId} with attendance:`, sessionUpdateData);

      setIsLive(false);
      showSuccess(`Class ended! ${presentStudentIds.length}/${students.length} students marked as present.`);
      onEndClass();
    } catch (error: any) {
      console.error('Error ending class:', error);
      showError(`Failed to end class: ${error.message}`);
    }
  };

  // Convert Google Meet link to embed format if needed
  const getMeetingEmbedUrl = (link: string) => {
    if (link.includes('meet.google.com')) {
      // Extract meeting code from link
      const match = link.match(/meet\.google\.com\/([a-z-]+)/i);
      if (match) {
        return `https://meet.google.com/${match[1]}`;
      }
    }
    return link;
  };

  return (
    <div className="creator-live-class">
      <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(217, 42, 99, 0.2)', borderRadius: '8px', border: '1px solid #D92A63' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
          {className} - Session {sessionNumber || 1}
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
          {isLive ? '🔴 Live Now' : 'Class Ended'}
        </p>
      </div>

      <div className="creator-live-grid">
        <div className="creator-live-students">
          <div className="creator-students-title">
            Enrolled Students ({students.length})
            <span style={{ marginLeft: '1rem', fontSize: '0.875rem', fontWeight: 'normal', color: 'rgba(255, 255, 255, 0.7)' }}>
              Present: {Object.values(studentJoins).filter(j => j.isPresent).length}/{students.length}
            </span>
          </div>
          <div className="creator-students-list">
            <div className="creator-table-header">
              <div className="creator-table-col" style={{ flex: 1 }}>Name</div>
              <div className="creator-table-col" style={{ width: '140px', textAlign: 'center' }}>Attendance</div>
            </div>
            {loading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                No students enrolled yet
              </div>
            ) : (
              students.map((student) => {
                const joinRecord = studentJoins[student.studentId];
                const isPresent = joinRecord?.isPresent || false;
                return (
                  <div key={student.id} className="creator-student-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                    <span style={{ flex: 1 }}>{student.name}</span>
                    <button
                      onClick={() => handleToggleAttendance(student.studentId)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: isPresent ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                        border: isPresent ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        minWidth: '120px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isPresent) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isPresent) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                    >
                      {isPresent ? '✅ Present' : '⏳ Mark Present'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="creator-live-video">
          <div className="creator-video-wrapper">
            {meetingLink ? (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                padding: '3rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                    Join Google Meet Session
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Click the button below to join the live session in a new tab
                  </p>
                </div>
                <a
                  href={getMeetingEmbedUrl(meetingLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2.5rem',
                    background: 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 15px rgba(217, 42, 99, 0.4)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(217, 42, 99, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(217, 42, 99, 0.4)';
                  }}
                >
                  Join Google Meet →
                </a>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
                <p>No meeting link available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="creator-live-actions" style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        border: '2px solid rgba(217, 42, 99, 0.3)'
      }}>
        {meetingLink && (
          <a
            href={getMeetingEmbedUrl(meetingLink)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'inline-block',
              transition: 'all 0.3s'
            }}
          >
            Open Meet in New Tab
          </a>
        )}
        <button 
          onClick={handleEndClass}
          disabled={!isLive}
          style={{ 
            padding: '1rem 2rem',
            background: isLive ? 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)' : 'rgba(255, 255, 255, 0.1)',
            border: isLive ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: isLive ? 'pointer' : 'not-allowed',
            opacity: isLive ? 1 : 0.5,
            boxShadow: isLive ? '0 4px 15px rgba(244, 67, 54, 0.4)' : 'none',
            transition: 'all 0.3s',
            flex: 1,
            maxWidth: '300px'
          }}
          onMouseEnter={(e) => {
            if (isLive) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🛑 End Class
        </button>
      </div>
    </div>
  );
}
