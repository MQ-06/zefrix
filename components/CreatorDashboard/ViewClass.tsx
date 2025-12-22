'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import SessionForm from './SessionForm';
import styles from './ViewClass.module.css';

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
    status: string;
    creatorId: string;
    creatorName?: string;
    createdAt: any;
    updatedAt?: any;
    [key: string]: any;
}

interface BatchData {
    id: string;
    batchDate: any;
    batchTime: string;
    duration: number;
    maxStudents: number;
    enrolledStudents: number;
    status: string;
    meetingLink?: string;
}

interface EnrollmentData {
    id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    enrolledAt: any;
    batchId?: string;
}

interface ViewClassProps {
    classId: string;
    onBack: () => void;
    onEdit?: () => void;
    onStartLiveClass?: (classId: string, sessionId: string, sessionData: any) => void;
}

export default function ViewClass({ classId, onBack, onEdit, onStartLiveClass }: ViewClassProps) {
    const { showError, showSuccess } = useNotification();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [batches, setBatches] = useState<BatchData[]>([]);
    const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'batches' | 'students'>('overview');

    useEffect(() => {
        fetchClassData();
        fetchBatches();
        fetchEnrollments();
        fetchSessions();
    }, [classId]);

    const fetchClassData = async () => {
        if (!window.firebaseDb || !window.doc || !window.getDoc) {
            console.log('Firebase not ready yet');
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
                showError('Class not found!');
                onBack();
            }
        } catch (error) {
            console.error('Error fetching class data:', error);
            showError('Failed to load class data. Please try again.');
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

            // Sort by batch date
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
                enrollmentsList.push({ id: doc.id, ...doc.data() });
            });

            // Sort by enrollment date (newest first)
            enrollmentsList.sort((a, b) => {
                const aTime = a.enrolledAt?.toMillis?.() || 0;
                const bTime = b.enrolledAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            setEnrollments(enrollmentsList);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
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
                sessionsList.push({ id: doc.id, ...doc.data() });
            });

            // Sort by session number
            sessionsList.sort((a, b) => {
                return (a.sessionNumber || 0) - (b.sessionNumber || 0);
            });

            setSessions(sessionsList);
        } catch (error) {
            console.error('Error fetching sessions:', error);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#4CAF50';
            case 'pending':
                return '#FF9800';
            case 'rejected':
                return '#F44336';
            case 'scheduled':
                return '#4CAF50';
            case 'completed':
                return '#2196F3';
            case 'cancelled':
                return '#F44336';
            default:
                return '#9E9E9E';
        }
    };

    const getStatusLabel = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const handleUploadRecording = async (sessionId: string, file: File) => {
        if (!window.firebaseDb || !window.doc || !window.updateDoc) {
            showError('Firebase not ready');
            return;
        }

        try {
            const { uploadVideo, getClassRecordingPath, validateFile } = await import('@/lib/utils/serverStorage');
            const validation = validateFile(file, 'video');
            if (!validation.valid) {
                showError(validation.error || 'Invalid file');
                return;
            }
            const path = getClassRecordingPath(classId, sessionId, file.name);
            const downloadURL = await uploadVideo(file, path);
            const sessionRef = window.doc(window.firebaseDb, 'sessions', sessionId);
            await window.updateDoc(sessionRef, {
                recordingLink: downloadURL,
                recordingUploadedAt: new Date()
            });
            fetchSessions();
            showSuccess('Recording uploaded successfully!');
        } catch (error: any) {
            console.error('Recording upload error:', error);
            showError(error.message || 'Failed to upload recording');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
                    Loading class details...
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#fff' }}>
                    Class not found.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    ← Back to Classes
                </button>
                <div className={styles.headerContent}>
                    <div className={styles.titleSection}>
                        <h2 className={styles.title}>{classData.title}</h2>
                        {classData.subtitle && (
                            <p className={styles.subtitle}>{classData.subtitle}</p>
                        )}
                    </div>
                    <div
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(classData.status) }}
                    >
                        {getStatusLabel(classData.status)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                {classData.status === 'approved' && (
                    <button
                        className={`${styles.tab} ${activeTab === 'sessions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('sessions')}
                    >
                        Session Details
                    </button>
                )}
                <button
                    className={`${styles.tab} ${activeTab === 'batches' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('batches')}
                >
                    Batches ({batches.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'students' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Students ({enrollments.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className={styles.overviewGrid}>
                        {/* Basic Information Card */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Basic Information</h3>
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
                                    <span className={styles.infoLabel}>Schedule Type:</span>
                                    <span className={styles.infoValue}>
                                        {classData.scheduleType === 'one-time' ? 'One-Time' : 'Recurring'}
                                    </span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Number of Sessions:</span>
                                    <span className={styles.infoValue}>{classData.numberSessions}</span>
                                </div>
                                {classData.sessionDuration && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Session Duration:</span>
                                            <span className={styles.infoValue}>{classData.sessionDuration} minutes</span>
                                        </div>
                                    </>
                                )}
                                {classData.maxStudents && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Max Students:</span>
                                            <span className={styles.infoValue}>{classData.maxStudents}</span>
                                        </div>
                                    </>
                                )}
                                {classData.language && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Language:</span>
                                            <span className={styles.infoValue}>{classData.language}</span>
                                        </div>
                                    </>
                                )}
                                {classData.level && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Level:</span>
                                            <span className={styles.infoValue}>{classData.level}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description Card */}
                        {classData.description && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Description</h3>
                                <p className={styles.description}>{classData.description}</p>
                            </div>
                        )}

                        {/* Prerequisites Card */}
                        {classData.prerequisites && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Prerequisites</h3>
                                <p className={styles.description}>{classData.prerequisites}</p>
                            </div>
                        )}

                        {/* Learning Outcomes Card */}
                        {classData.learningOutcomes && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Learning Outcomes</h3>
                                <p className={styles.description}>{classData.learningOutcomes}</p>
                            </div>
                        )}

                        {/* Video Link Card */}
                        {classData.videoLink && (
                            <div className={styles.card}>
                                <h3 className={styles.cardTitle}>Class Video/Image</h3>
                                <div className={styles.videoPreview}>
                                    <img
                                        src={classData.videoLink}
                                        alt={classData.title}
                                        className={styles.videoImage}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://cdn.prod.website-files.com/691111ab3e1733ebffd9b739/691111ab3e1733ebffd9b861_course-12.jpg';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Metadata Card */}
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Metadata</h3>
                            <div className={styles.infoList}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Created:</span>
                                    <span className={styles.infoValue}>{formatDateTime(classData.createdAt)}</span>
                                </div>
                                {classData.updatedAt && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Last Updated:</span>
                                            <span className={styles.infoValue}>{formatDateTime(classData.updatedAt)}</span>
                                        </div>
                                    </>
                                )}
                                <div className={styles.divider}></div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Creator:</span>
                                    <span className={styles.infoValue}>{classData.creatorName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && classData.status === 'approved' && (
                    <div className={styles.tabContent}>
                        {sessions.length === 0 ? (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                                    Fill Session Details First
                                </h3>
                                <SessionForm
                                    classId={classId}
                                    className={classData.title}
                                    numberOfSessions={classData.numberSessions}
                                    scheduleType={classData.scheduleType}
                                    startDate={classData.startDate}
                                    endDate={classData.endDate}
                                    recurringStartTime={classData.recurringStartTime}
                                    recurringEndTime={classData.recurringEndTime}
                                    days={classData.days}
                                    onSuccess={() => {
                                        fetchClassData();
                                        fetchSessions();
                                    }}
                                />
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                                    Scheduled Sessions ({sessions.length})
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    {sessions.map((session) => {
                                        const sessionDate = session.sessionDate?.toDate ? session.sessionDate.toDate() : new Date(session.sessionDate);
                                        const isLive = session.status === 'live';
                                        const isCompleted = session.status === 'completed';
                                        const isUpcoming = session.status !== 'completed' && session.status !== 'live' && sessionDate > new Date();
                                        
                                        return (
                                            <div 
                                                key={session.id} 
                                                style={{
                                                    background: isLive ? 'rgba(217, 42, 99, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                    borderRadius: '12px',
                                                    padding: '1.5rem',
                                                    border: isLive ? '2px solid #D92A63' : '1px solid rgba(255, 255, 255, 0.1)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                                            Session {session.sessionNumber}
                                                        </h4>
                                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                                                            <span>📅 {formatDate(sessionDate)}</span>
                                                            <span>🕐 {session.sessionTime}</span>
                                                            {session.meetingLink && (
                                                                <span>🔗 <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#D92A63' }}>Meeting Link</a></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {isLive && (
                                                            <span style={{
                                                                background: '#D92A63',
                                                                color: '#fff',
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '20px',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '600',
                                                                display: 'inline-block',
                                                                marginBottom: '0.5rem'
                                                            }}>
                                                                🔴 LIVE
                                                            </span>
                                                        )}
                                                        {isCompleted && (
                                                            <span style={{
                                                                background: '#4CAF50',
                                                                color: '#fff',
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '20px',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '600',
                                                                display: 'inline-block',
                                                                marginBottom: '0.5rem'
                                                            }}>
                                                                ✓ Completed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {session.meetingLink && (isUpcoming || isLive) && onStartLiveClass && (
                                                    <button
                                                        onClick={() => onStartLiveClass(classId, session.id, session)}
                                                        style={{
                                                            background: isLive ? '#4CAF50' : 'linear-gradient(135deg, #D92A63 0%, #FF654B 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.75rem 1.5rem',
                                                            borderRadius: '8px',
                                                            fontSize: '0.9375rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        {isLive ? 'Continue Live Class' : 'Start Class'}
                                                    </button>
                                                )}
                                                {isCompleted && (
                                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                                            Upload Recording:
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    handleUploadRecording(session.id, file);
                                                                }
                                                            }}
                                                            style={{ 
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                background: 'rgba(255, 255, 255, 0.1)',
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                borderRadius: '6px',
                                                                color: '#fff',
                                                                fontSize: '0.875rem'
                                                            }}
                                                        />
                                                        {session.recordingLink && (
                                                            <div style={{ marginTop: '0.5rem' }}>
                                                                <a 
                                                                    href={session.recordingLink} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    style={{ 
                                                                        color: '#2196F3',
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.875rem'
                                                                    }}
                                                                >
                                                                    📹 View Recording
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {!session.meetingLink && !isCompleted && (
                                                    <div style={{ 
                                                        padding: '1rem', 
                                                        background: 'rgba(255, 152, 0, 0.1)', 
                                                        borderRadius: '8px',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        Please update session details form below to add meeting link.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                                        Update Session Details
                                    </h3>
                                    <SessionForm
                                        classId={classId}
                                        className={classData.title}
                                        numberOfSessions={classData.numberSessions}
                                        scheduleType={classData.scheduleType}
                                        startDate={classData.startDate}
                                        endDate={classData.endDate}
                                        recurringStartTime={classData.recurringStartTime}
                                        recurringEndTime={classData.recurringEndTime}
                                        days={classData.days}
                                        onSuccess={() => {
                                            fetchClassData();
                                            fetchSessions();
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Batches Tab */}
                {activeTab === 'batches' && (
                    <div className={styles.batchesContent}>
                        {batches.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No batches scheduled for this class yet.</p>
                                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                                    Go to Manage Classes → Manage Batches to create batches.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.batchList}>
                                {batches.map((batch) => (
                                    <div key={batch.id} className={styles.batchCard}>
                                        <div className={styles.batchHeader}>
                                            <div className={styles.batchInfo}>
                                                <div className={styles.batchDate}>
                                                    📅 {formatDate(batch.batchDate)} at {batch.batchTime}
                                                </div>
                                                <div className={styles.batchMeta}>
                                                    ⏱️ {batch.duration} min | 👥 {batch.enrolledStudents}/{batch.maxStudents} students
                                                </div>
                                            </div>
                                            <div
                                                className={styles.batchStatus}
                                                style={{ color: getStatusColor(batch.status) }}
                                            >
                                                {getStatusLabel(batch.status)}
                                            </div>
                                        </div>
                                        {batch.meetingLink && (
                                            <div className={styles.batchLink}>
                                                🔗 <a href={batch.meetingLink} target="_blank" rel="noopener noreferrer">
                                                    Join Meeting
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className={styles.studentsContent}>
                        {enrollments.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No students enrolled in this class yet.</p>
                            </div>
                        ) : (
                            <div className={styles.studentList}>
                                <div className={styles.tableHeader}>
                                    <div className={styles.tableCol}>Student Name</div>
                                    <div className={styles.tableCol}>Email</div>
                                    <div className={styles.tableCol}>Enrolled On</div>
                                </div>
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className={styles.tableRow}>
                                        <div className={styles.tableCol}>{enrollment.studentName}</div>
                                        <div className={styles.tableCol}>{enrollment.studentEmail}</div>
                                        <div className={styles.tableCol}>{formatDateTime(enrollment.enrolledAt)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
                {onEdit && classData.status !== 'approved' && (
                    <button onClick={onEdit} className={styles.actionButton}>
                        ✏️ Edit Class
                    </button>
                )}
                <button onClick={onBack} className={styles.secondaryButton}>
                    Close
                </button>
            </div>
        </div>
    );
}
