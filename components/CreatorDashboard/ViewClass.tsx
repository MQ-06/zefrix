'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
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
}

export default function ViewClass({ classId, onBack, onEdit }: ViewClassProps) {
    const { showError } = useNotification();
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [batches, setBatches] = useState<BatchData[]>([]);
    const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students'>('overview');

    useEffect(() => {
        fetchClassData();
        fetchBatches();
        fetchEnrollments();
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
                {classData.videoLink && (
                    <a
                        href={classData.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionButton}
                    >
                        🎥 View Media
                    </a>
                )}
                <button onClick={onBack} className={styles.secondaryButton}>
                    Close
                </button>
            </div>
        </div>
    );
}
