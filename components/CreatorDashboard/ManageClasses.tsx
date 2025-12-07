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
  onManageBatches?: (classId: string, className: string) => void;
}

export default function ManageClasses({ onEditClass, onViewClass, onManageBatches }: ManageClassesProps) {
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
        showInfo(`Class Details: Title: ${classItem.title}, Subtitle: ${classItem.subtitle || 'N/A'}, Category: ${classItem.category}, Sub-category: ${classItem.subCategory}, Price: ₹${classItem.price}, Status: ${classItem.status}. Full details view coming soon!`);
      }
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!window.firebaseDb || !window.doc || !window.deleteDoc) {
      showError('Firebase not ready. Please try again.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete "${className}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    setDeletingClassId(classId);
    try {
      const classRef = window.doc(window.firebaseDb, 'classes', classId);
      await window.deleteDoc(classRef);

      // Remove from local state
      setClasses(prev => prev.filter(c => c.classId !== classId));

      showSuccess('Class deleted successfully!');
    } catch (error) {
      console.error('Error deleting class:', error);
      showError('Failed to delete class. Please try again.');
    } finally {
      setDeletingClassId(null);
    }
  };

  const handleManageBatches = (classId: string, className: string) => {
    if (onManageBatches) {
      onManageBatches(classId, className);
    } else {
      showInfo(`Manage Batches for "${className}" - Batch management functionality coming soon! You'll be able to create recurring sessions, schedule multiple dates, and manage batch enrollments.`);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage Classes</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Total Classes: {classes.length} |
          Approved: {classes.filter(c => c.status === 'approved').length} |
          Pending: {classes.filter(c => c.status === 'pending').length} |
          Rejected: {classes.filter(c => c.status === 'rejected').length}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          Loading classes...
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
                  src={classItem.videoLink || "https://cdn.prod.website-files.com/691111a93e1733ebffd9b6b2/691111ab3e1733ebffd9b7c7_avatar-10.jpg"}
                  alt={classItem.title}
                  className={styles.thumbnail}
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
                  Edit Class
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleViewClass(classItem.classId)}
                >
                  View Class
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleManageBatches(classItem.classId, classItem.title)}
                >
                  Manage Batches
                </button>
                <button
                  className={styles.button}
                  onClick={() => handleDeleteClass(classItem.classId, classItem.title)}
                  disabled={deletingClassId === classItem.classId}
                  style={{
                    background: deletingClassId === classItem.classId ? '#666' : 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
                    opacity: deletingClassId === classItem.classId ? 0.6 : 1
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

