'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './ManageClasses.module.css';
import { DEFAULT_COURSE_IMAGE } from '@/lib/constants';

declare global {
  interface Window {
    firebaseAuth: any;
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    getDoc: any;
    doc: any;
    deleteDoc: any;
    updateDoc: any;
  }
}

interface ClassItem {
  classId: string;
  title: string;
  subtitle?: string;
  status: string;
  category: string;
  subCategory: string;
  price: number;
  videoLink?: string;
  createdAt: any;
  [key: string]: any;
}

interface ManageClassesProps {
  onEditClass?: (classId: string) => void;
  onViewClass?: (classId: string) => void;
  onViewEnrollments?: (classId: string, className: string) => void;
}

export default function ManageClasses({ onEditClass, onViewClass, onViewEnrollments }: ManageClassesProps) {
  const { showSuccess, showError, showInfo } = useNotification();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for Firebase to initialize
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb) {
        clearInterval(checkFirebase);
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          fetchClasses(currentUser.uid);
        } else {
          // Listen for auth state change
          const unsubscribe = window.firebaseAuth.onAuthStateChanged((user: any) => {
            if (user) {
              setUser(user);
              fetchClasses(user.uid);
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

  const fetchClasses = async (creatorId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      console.log('Firebase not ready yet');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const classesRef = window.collection(window.firebaseDb, 'classes');
      const q = window.query(classesRef, window.where('creatorId', '==', creatorId));
      const querySnapshot = await window.getDocs(q);

      const classesList: ClassItem[] = [];
      querySnapshot.forEach((doc: any) => {
        classesList.push({ classId: doc.id, ...doc.data() });
      });

      // Sort by creation date (newest first)
      classesList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setClasses(classesList);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showError('Failed to load classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = (classId: string) => {
    if (onEditClass) {
      onEditClass(classId);
    } else {
      showInfo(`Edit functionality for class ${classId} - Coming soon!`);
    }
  };

  const handleViewClass = (classId: string) => {
    if (onViewClass) {
      onViewClass(classId);
    } else {
      const classItem = classes.find(c => c.classId === classId);
      if (classItem) {
        showInfo(`Batch Details: Title: ${classItem.title}, Subtitle: ${classItem.subtitle || 'N/A'}, Category: ${classItem.category}, Sub-category: ${classItem.subCategory}, Price: ₹${classItem.price}, Status: ${classItem.status}. Full details view coming soon!`);
      }
    }
  };

  const canDeleteClass = (classItem: ClassItem): { canDelete: boolean; reason: string } => {
    // Approved classes cannot be deleted - they are live and visible to students
    if (classItem.status === 'approved') {
      return {
        canDelete: false,
        reason: 'Approved classes cannot be deleted. They are live on the platform and students may have enrolled or made purchases. Please contact admin if you need to remove an approved class.'
      };
    }

    // Only pending and rejected classes can potentially be deleted
    if (classItem.status !== 'pending' && classItem.status !== 'rejected') {
      return {
        canDelete: false,
        reason: `Classes with status "${classItem.status}" cannot be deleted.`
      };
    }

    return { canDelete: true, reason: '' };
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!window.firebaseDb || !window.doc || !window.deleteDoc || !window.getDoc || !window.collection || !window.query || !window.where || !window.getDocs) {
      showError('Firebase not ready. Please try again.');
      return;
    }

    // Find the class item
    const classItem = classes.find(c => c.classId === classId);
    if (!classItem) {
      showError('Batch not found.');
      return;
    }

    // Check if class can be deleted based on status
    const deletionCheck = canDeleteClass(classItem);
    if (!deletionCheck.canDelete) {
      showError(deletionCheck.reason);
      return;
    }

    setDeletingClassId(classId);
    try {
      // Check for enrollments
      const enrollmentsRef = window.collection(window.firebaseDb, 'enrollments');
      const enrollmentsQuery = window.query(enrollmentsRef, window.where('classId', '==', classId));
      const enrollmentsSnapshot = await window.getDocs(enrollmentsQuery);

      if (!enrollmentsSnapshot.empty) {
        setDeletingClassId(null);
        showError(`Cannot delete "${className}". This class has ${enrollmentsSnapshot.size} student enrollment(s). Students have paid and enrolled in this class, so deletion would affect their access and purchases.`);
        return;
      }

      // Check for sessions
      const sessionsRef = window.collection(window.firebaseDb, 'sessions');
      const sessionsQuery = window.query(sessionsRef, window.where('classId', '==', classId));
      const sessionsSnapshot = await window.getDocs(sessionsQuery);

      if (!sessionsSnapshot.empty) {
        setDeletingClassId(null);
        showError(`Cannot delete "${className}". This class has ${sessionsSnapshot.size} session(s) scheduled or completed. Sessions have been created for this class, so deletion is not allowed to preserve data integrity.`);
        return;
      }

      // Confirm deletion
      const confirmed = confirm(
        `Are you sure you want to delete "${className}"?\n\n` +
        `Status: ${classItem.status}\n` +
        `This action cannot be undone.`
      );
      if (!confirmed) {
        setDeletingClassId(null);
        return;
      }

      // Delete the class
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      await window.deleteDoc(classRef);

      // Remove from local state
      setClasses(prev => prev.filter(c => c.classId !== classId));

      showSuccess('Class deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting class:', error);
      
      // Handle specific Firebase permission errors
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        const deletionCheck = canDeleteClass(classItem);
        if (!deletionCheck.canDelete) {
          showError(deletionCheck.reason);
        } else {
          showError(`Permission denied. You cannot delete this class. ${deletionCheck.reason || 'Please ensure you have the necessary permissions.'}`);
        }
      } else {
        showError('Failed to delete class. Please try again.');
      }
    } finally {
      setDeletingClassId(null);
    }
  };


  const handleViewEnrollments = (classId: string, className: string) => {
    if (onViewEnrollments) {
      onViewEnrollments(classId, className);
    } else {
      showInfo(`View Enrollments for "${className}" - Enrollment view coming soon!`);
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
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getDeleteButtonInfo = (classItem: ClassItem) => {
    const deletionCheck = canDeleteClass(classItem);
    return {
      disabled: !deletionCheck.canDelete || deletingClassId === classItem.classId,
      title: deletionCheck.canDelete 
        ? 'Delete this class (only if no enrollments or sessions exist)'
        : deletionCheck.reason
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Batches</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Total Classes: {classes.length} |
          Approved: {classes.filter(c => c.status === 'approved').length} |
          Pending: {classes.filter(c => c.status === 'pending').length} |
          Rejected: {classes.filter(c => c.status === 'rejected').length}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          Loading batches...
        </div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          No classes found. Create your first class to get started!
        </div>
      ) : (
        <div className={styles.classList}>
          {classes.map((classItem) => (
            <div key={classItem.classId} className={styles.classItem}>
              <div className={styles.classGrid}>
                <img
                  src={(classItem.videoLink && classItem.videoLink.trim() !== '') ? classItem.videoLink : DEFAULT_COURSE_IMAGE}
                  alt={classItem.title}
                  className={styles.thumbnail}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
                  }}
                />
                <h3 className={styles.classTitle}>{classItem.title}</h3>
                <h3
                  className={styles.classStatus}
                  style={{ color: getStatusColor(classItem.status) }}
                >
                  {getStatusLabel(classItem.status)}
                </h3>
                <div className={styles.classCount}>₹{classItem.price || 0}</div>
                <button
                  className={styles.button}
                  onClick={() => handleEditClass(classItem.classId)}
                  disabled={classItem.status === 'approved'}
                  title={classItem.status === 'approved' ? 'Cannot edit approved classes' : 'Edit this class'}
                >
                  Edit Batch
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleViewClass(classItem.classId)}
                >
                  View Batch
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleViewEnrollments(classItem.classId, classItem.title)}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                  }}
                >
                  View Enrollments
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleDeleteClass(classItem.classId, classItem.title)}
                  disabled={getDeleteButtonInfo(classItem).disabled}
                  title={getDeleteButtonInfo(classItem).title}
                  style={{
                    background: getDeleteButtonInfo(classItem).disabled 
                      ? '#666' 
                      : deletingClassId === classItem.classId 
                        ? '#666' 
                        : 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
                    opacity: getDeleteButtonInfo(classItem).disabled || deletingClassId === classItem.classId ? 0.6 : 1,
                    cursor: getDeleteButtonInfo(classItem).disabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deletingClassId === classItem.classId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

