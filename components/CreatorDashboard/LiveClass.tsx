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

export default function LiveClass({ classId, sessionId, sessionNumber, meetingLink, className, onEndClass }: LiveClassProps) {
  const { showSuccess, showError } = useNotification();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    fetchEnrolledStudents();
    // Mark session as live
    markSessionAsLive();
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
        startedAt: window.serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking session as live:', error);
    }
  };

  const handleEndClass = async () => {
    if (!window.firebaseDb || !window.doc || !window.updateDoc || !window.serverTimestamp) {
      showError('Firebase not ready');
      return;
    }

    try {
      // Mark all enrolled students as attended for this session
      const updatePromises = students.map(async (student) => {
        if (student.enrollmentId && window.updateDoc) {
          const enrollmentRef = window.doc(window.firebaseDb, 'enrollments', student.enrollmentId);
          await window.updateDoc(enrollmentRef, {
            attended: true,
            attendedSessions: window.arrayUnion?.(sessionId || ''),
            lastAttendedAt: window.serverTimestamp()
          });
        }
      });

      await Promise.all(updatePromises);

      // Mark session as completed
      if (sessionId) {
        const sessionRef = window.doc(window.firebaseDb, 'sessions', sessionId);
        await window.updateDoc(sessionRef, {
          status: 'completed',
          endedAt: window.serverTimestamp(),
          attendedCount: students.length
        });
      }

      setIsLive(false);
      showSuccess('Class ended successfully! Attendance marked for all enrolled students.');
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
          <div className="creator-students-title">Enrolled Students ({students.length})</div>
          <div className="creator-students-list">
            <div className="creator-table-header">
              <div className="creator-table-col">Name</div>
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
              students.map((student) => (
                <div key={student.id} className="creator-student-item">
                  {student.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="creator-live-video">
          <div className="creator-video-wrapper">
            {meetingLink ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <p style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Join the Google Meet session:
                  </p>
                  <a
                    href={getMeetingEmbedUrl(meetingLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9375rem'
                    }}
                  >
                    Join Google Meet →
                  </a>
                </div>
                <div className="creator-video-container">
                  <iframe
                    className="creator-video-iframe"
                    src={getMeetingEmbedUrl(meetingLink)}
                    title="Live Class Meeting"
                    allow="camera; microphone; fullscreen"
                    allowFullScreen
                  ></iframe>
                </div>
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
