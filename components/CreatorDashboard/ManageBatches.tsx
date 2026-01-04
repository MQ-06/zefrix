'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import styles from './ManageBatches.module.css';

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
    addDoc: any;
    updateDoc: any;
    serverTimestamp: any;
    Timestamp: any;
  }
}

interface BatchItem {
  id: string;
  classId: string;
  className: string;
  batchDate: any; // Firestore Timestamp
  batchTime: string;
  duration: number; // in minutes
  maxStudents: number;
  enrolledStudents: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt: any;
  [key: string]: any;
}

interface ManageBatchesProps {
  classId?: string;
  className?: string;
  onBack?: () => void;
}

export default function ManageBatches({ classId, className, onBack }: ManageBatchesProps) {
  const { showSuccess, showError, showInfo } = useNotification();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    batchDate: '',
    batchTime: '',
    duration: 60,
    maxStudents: 30,
    meetingLink: '',
  });

  useEffect(() => {
    // Wait for Firebase to initialize
    const checkFirebase = setInterval(() => {
      if (window.firebaseAuth && window.firebaseDb) {
        clearInterval(checkFirebase);
        const currentUser = window.firebaseAuth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          if (classId) {
            fetchBatches(classId);
          } else {
            fetchAllBatches(currentUser.uid);
          }
        } else {
          // Listen for auth state change
          const unsubscribe = window.firebaseAuth.onAuthStateChanged((user: any) => {
            if (user) {
              setUser(user);
              if (classId) {
                fetchBatches(classId);
              } else {
                fetchAllBatches(user.uid);
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

  const fetchBatches = async (targetClassId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      console.log('Firebase not ready yet');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const batchesRef = window.collection(window.firebaseDb, 'batches');
      const q = window.query(batchesRef, window.where('classId', '==', targetClassId));
      const querySnapshot = await window.getDocs(q);

      const batchesList: BatchItem[] = [];
      querySnapshot.forEach((doc: any) => {
        batchesList.push({ id: doc.id, ...doc.data() });
      });

      // Sort by batch date (newest first)
      batchesList.sort((a, b) => {
        const aTime = a.batchDate?.toMillis?.() || 0;
        const bTime = b.batchDate?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setBatches(batchesList);
    } catch (error) {
      console.error('Error fetching batches:', error);
      showError('Failed to load batches. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBatches = async (creatorId: string) => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      console.log('Firebase not ready yet');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const batchesRef = window.collection(window.firebaseDb, 'batches');
      const q = window.query(batchesRef, window.where('creatorId', '==', creatorId));
      const querySnapshot = await window.getDocs(q);

      const batchesList: BatchItem[] = [];
      querySnapshot.forEach((doc: any) => {
        batchesList.push({ id: doc.id, ...doc.data() });
      });

      // Sort by batch date (newest first)
      batchesList.sort((a, b) => {
        const aTime = a.batchDate?.toMillis?.() || 0;
        const bTime = b.batchDate?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setBatches(batchesList);
    } catch (error) {
      console.error('Error fetching batches:', error);
      showError('Failed to load batches. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.firebaseDb || !window.collection || !window.addDoc || !window.serverTimestamp) {
      showError('Firebase not ready. Please try again.');
      return;
    }

    if (!classId) {
      showError('No class selected. Please select a class first.');
      return;
    }

    if (!formData.batchDate || !formData.batchTime) {
      showError('Please fill in all required fields.');
      return;
    }

    try {
      // Convert date and time to Firestore Timestamp
      const dateTimeString = `${formData.batchDate}T${formData.batchTime}`;
      const batchDateTime = new Date(dateTimeString);

      const batchesRef = window.collection(window.firebaseDb, 'batches');
      await window.addDoc(batchesRef, {
        classId,
        className: className || 'Unknown Class',
        creatorId: user.uid,
        batchDate: window.Timestamp?.fromDate?.(batchDateTime) || batchDateTime,
        batchTime: formData.batchTime,
        duration: formData.duration,
        maxStudents: formData.maxStudents,
        enrolledStudents: 0,
        status: 'scheduled',
        meetingLink: formData.meetingLink,
        createdAt: window.serverTimestamp(),
      });

      showSuccess('Batch created successfully!');

      // Reset form and refresh batches
      setFormData({
        batchDate: '',
        batchTime: '',
        duration: 60,
        maxStudents: 30,
        meetingLink: '',
      });
      setShowCreateForm(false);
      fetchBatches(classId);
    } catch (error) {
      console.error('Error creating batch:', error);
      showError('Failed to create batch. Please try again.');
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!window.firebaseDb || !window.doc || !window.updateDoc) {
      showError('Firebase not ready. Please try again.');
      return;
    }

    if (!editingBatch) return;

    if (!formData.batchDate || !formData.batchTime) {
      showError('Please fill in all required fields.');
      return;
    }

    try {
      // Convert date and time to Firestore Timestamp
      const dateTimeString = `${formData.batchDate}T${formData.batchTime}`;
      const batchDateTime = new Date(dateTimeString);

      const batchRef = window.doc(window.firebaseDb, 'batches', editingBatch.id);
      await window.updateDoc(batchRef, {
        batchDate: window.Timestamp?.fromDate?.(batchDateTime) || batchDateTime,
        batchTime: formData.batchTime,
        duration: formData.duration,
        maxStudents: formData.maxStudents,
        meetingLink: formData.meetingLink,
      });

      showSuccess('Batch updated successfully!');

      // Reset form and refresh batches
      setFormData({
        batchDate: '',
        batchTime: '',
        duration: 60,
        maxStudents: 30,
        meetingLink: '',
      });
      setEditingBatch(null);
      if (classId) {
        fetchBatches(classId);
      } else if (user) {
        fetchAllBatches(user.uid);
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      showError('Failed to update batch. Please try again.');
    }
  };

  const handleDeleteBatch = async (batchId: string, batchInfo: string) => {
    if (!window.firebaseDb || !window.doc || !window.deleteDoc) {
      showError('Firebase not ready. Please try again.');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete this batch?\n\n${batchInfo}\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    setDeletingBatchId(batchId);
    try {
      const batchRef = window.doc(window.firebaseDb, 'batches', batchId);
      await window.deleteDoc(batchRef);

      // Remove from local state
      setBatches(prev => prev.filter(b => b.id !== batchId));

      showSuccess('Batch deleted successfully!');
    } catch (error) {
      console.error('Error deleting batch:', error);
      showError('Failed to delete batch. Please try again.');
    } finally {
      setDeletingBatchId(null);
    }
  };

  const handleEditBatch = (batch: BatchItem) => {
    // Convert Firestore Timestamp to date string
    let dateStr = '';
    if (batch.batchDate?.toDate) {
      const date = batch.batchDate.toDate();
      dateStr = date.toISOString().split('T')[0];
    }

    setFormData({
      batchDate: dateStr,
      batchTime: batch.batchTime || '',
      duration: batch.duration || 60,
      maxStudents: batch.maxStudents || 30,
      meetingLink: batch.meetingLink || '',
    });
    setEditingBatch(batch);
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      batchDate: '',
      batchTime: '',
      duration: 60,
      maxStudents: 30,
      meetingLink: '',
    });
    setEditingBatch(null);
    setShowCreateForm(false);
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

  const formatDateTime = (timestamp: any, time: string) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const dateStr = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return `${dateStr} at ${time}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {onBack && (
          <button onClick={onBack} className={styles.backButton}>
            ← Back to Batches
          </button>
        )}
        <h2 className={styles.title}>
          {className ? `Manage Batches - ${className}` : 'Manage All Batches'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Total Batches: {batches.length} |
          Scheduled: {batches.filter(b => b.status === 'scheduled').length} |
          Completed: {batches.filter(b => b.status === 'completed').length} |
          Cancelled: {batches.filter(b => b.status === 'cancelled').length}
        </p>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className={styles.formContainer}>
          <h3 className={styles.formTitle}>
            {editingBatch ? 'Edit Batch' : 'Create New Batch'}
          </h3>
          <form onSubmit={editingBatch ? handleUpdateBatch : handleCreateBatch} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Batch Date *</label>
                <input
                  type="date"
                  value={formData.batchDate}
                  onChange={(e) => setFormData({ ...formData, batchDate: e.target.value })}
                  className={styles.input}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Batch Time *</label>
                <input
                  type="time"
                  value={formData.batchTime}
                  onChange={(e) => setFormData({ ...formData, batchTime: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Duration (minutes) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  className={styles.input}
                  required
                  min="15"
                  step="15"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Max Students *</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 30 })}
                  className={styles.input}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Meeting Link (Optional)</label>
              <input
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className={styles.input}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton}>
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </button>
              <button type="button" onClick={handleCancelEdit} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Batch Button */}
      {!showCreateForm && classId && (
        <div className={styles.createSection}>
          <button
            onClick={() => setShowCreateForm(true)}
            className={styles.createButton}
          >
            + Create New Batch
          </button>
        </div>
      )}

      {/* Batches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#fff' }}>
          {classId
            ? 'No batches found for this class. Create your first batch to get started!'
            : 'No batches found. Select a class to manage batches.'}
        </div>
      ) : (
        <div className={styles.batchList}>
          {batches.map((batch) => (
            <div key={batch.id} className={styles.batchItem}>
              <div className={styles.batchGrid}>
                <div className={styles.batchInfo}>
                  <div className={styles.batchDateTime}>
                    📅 {formatDateTime(batch.batchDate, batch.batchTime)}
                  </div>
                  <div className={styles.batchMeta}>
                    ⏱️ {batch.duration} min | 👥 {batch.enrolledStudents}/{batch.maxStudents} students
                  </div>
                  {batch.meetingLink && (
                    <div className={styles.batchLink}>
                      🔗 <a href={batch.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
                <div
                  className={styles.batchStatus}
                  style={{ color: getStatusColor(batch.status) }}
                >
                  {getStatusLabel(batch.status)}
                </div>
                <div className={styles.batchActions}>
                  <button
                    className={styles.button}
                    onClick={() => handleEditBatch(batch)}
                    disabled={batch.status === 'completed'}
                    title={batch.status === 'completed' ? 'Cannot edit completed batches' : 'Edit this batch'}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteBatch(
                      batch.id,
                      `${formatDateTime(batch.batchDate, batch.batchTime)}`
                    )}
                    disabled={deletingBatchId === batch.id}
                  >
                    {deletingBatchId === batch.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
