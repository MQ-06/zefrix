/**
 * Notification Helper Functions
 * Creates and manages in-app notifications stored in Firestore
 */

export interface NotificationData {
  userId: string;
  userRole: 'student' | 'creator' | 'admin';
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
  readAt?: any; // Firestore Timestamp
  metadata?: {
    className?: string;
    classId?: string;
    amount?: number;
    sessionDate?: any;
    studentName?: string;
    creatorName?: string;
    paymentId?: string;
    orderId?: string;
    [key: string]: any;
  };
}

/**
 * Create a notification in Firestore
 * This should be called server-side (API routes) or client-side with proper auth
 */
export async function createNotification(data: Omit<NotificationData, 'isRead' | 'createdAt'>): Promise<void> {
  if (typeof window === 'undefined') {
    // Server-side: Use Firebase Admin SDK
    console.log('🔔 Creating notification (server-side):', data.title);
    // This will be called from API routes using Admin SDK
    return;
  }

  // Client-side: Use Firebase SDK
  if (!window.firebaseDb || !window.collection || !window.addDoc || !window.serverTimestamp) {
    console.error('Firebase not initialized for notifications');
    return;
  }

  try {
    const notificationsRef = window.collection(window.firebaseDb, 'notifications');
    await window.addDoc(notificationsRef, {
      ...data,
      isRead: false,
      createdAt: window.serverTimestamp(),
    });
    console.log('✅ Notification created:', data.title);
  } catch (error: any) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!window.firebaseDb || !window.doc || !window.updateDoc || !window.serverTimestamp) {
    console.error('Firebase not initialized for marking notification as read');
    return;
  }

  try {
    const notificationRef = window.doc(window.firebaseDb, 'notifications', notificationId);
    await window.updateDoc(notificationRef, {
      isRead: true,
      readAt: window.serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs || !window.updateDoc || !window.doc || !window.serverTimestamp) {
    console.error('Firebase not initialized for marking all notifications as read');
    return;
  }

  try {
    const notificationsRef = window.collection(window.firebaseDb, 'notifications');
    const q = window.query(
      notificationsRef,
      window.where('userId', '==', userId),
      window.where('isRead', '==', false)
    );
    const snapshot = await window.getDocs(q);
    
    // Use batch if available, otherwise update one by one
    const writeBatchFn = (window as any).writeBatch;
    if (writeBatchFn && typeof writeBatchFn === 'function') {
      try {
        const batch = writeBatchFn(window.firebaseDb);
        snapshot.forEach((doc: any) => {
          const notificationRef = window.doc(window.firebaseDb, 'notifications', doc.id);
          batch.update(notificationRef, {
            isRead: true,
            readAt: window.serverTimestamp(),
          });
        });
        await batch.commit();
      } catch (batchError) {
        console.warn('Batch update failed, falling back to individual updates:', batchError);
        // Fallback: update one by one
        const promises = snapshot.docs.map((doc: any) => {
          const notificationRef = window.doc(window.firebaseDb, 'notifications', doc.id);
          return window.updateDoc(notificationRef, {
            isRead: true,
            readAt: window.serverTimestamp(),
          });
        });
        await Promise.all(promises);
      }
    } else {
      // Fallback: update one by one
      const promises = snapshot.docs.map((doc: any) => {
        const notificationRef = window.doc(window.firebaseDb, 'notifications', doc.id);
        return window.updateDoc(notificationRef, {
          isRead: true,
          readAt: window.serverTimestamp(),
        });
      });
      await Promise.all(promises);
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  if (!window.firebaseDb || !window.doc || !window.deleteDoc) {
    console.error('Firebase not initialized for deleting notification');
    return;
  }

  try {
    const notificationRef = window.doc(window.firebaseDb, 'notifications', notificationId);
    await window.deleteDoc(notificationRef);
  } catch (error: any) {
    console.error('Error deleting notification:', error);
  }
}

/**
 * Get notification link based on type
 */
export function getNotificationLink(type: string, relatedId?: string, metadata?: any): string | undefined {
  switch (type) {
    case 'enrollment_confirmed':
      return relatedId ? `/product/${relatedId}` : '/student-dashboard';
    case 'class_approved':
    case 'class_rejected':
      return relatedId ? `/creator-dashboard?classId=${relatedId}` : '/creator-dashboard';
    case 'new_enrollment':
      return relatedId ? `/creator-dashboard?classId=${relatedId}` : '/creator-dashboard';
    case 'session_reminder_24h':
    case 'session_reminder_1h':
    case 'session_starting_soon':
      return '/student-dashboard?view=upcoming-sessions';
    case 'recording_available':
      return relatedId ? `/student-dashboard?view=sessions&classId=${relatedId}` : '/student-dashboard';
    case 'new_class_submitted':
      return relatedId ? `/admin-dashboard?classId=${relatedId}` : '/admin-dashboard';
    case 'payment_received':
      return '/creator-dashboard?view=analytics';
    case 'new_review':
      return relatedId ? `/creator-dashboard?classId=${relatedId}` : '/creator-dashboard';
    default:
      return undefined;
  }
}

/**
 * Format notification message with metadata
 */
export function formatNotificationMessage(type: string, metadata?: any): string {
  switch (type) {
    case 'enrollment_confirmed':
      return `You have successfully enrolled in "${metadata?.className || 'the class'}". Check your dashboard for session details.`;
    case 'class_approved':
      return `Your class "${metadata?.className || 'class'}" has been approved and is now live!`;
    case 'class_rejected':
      return `Your class "${metadata?.className || 'class'}" needs revision. Please check the details.`;
    case 'new_enrollment':
      return `${metadata?.studentName || 'A student'} enrolled in "${metadata?.className || 'your class'}".`;
    case 'session_reminder_24h':
      return `Reminder: Your session for "${metadata?.className || 'the class'}" is tomorrow at ${metadata?.sessionTime || 'the scheduled time'}.`;
    case 'session_reminder_1h':
      return `Reminder: Your session for "${metadata?.className || 'the class'}" starts in 1 hour!`;
    case 'session_starting_soon':
      return `Your session for "${metadata?.className || 'the class'}" is starting soon!`;
    case 'recording_available':
      return `Recording is now available for "${metadata?.className || 'the class'}".`;
    case 'session_cancelled':
      return `Session for "${metadata?.className || 'the class'}" has been cancelled.`;
    case 'new_class_submitted':
      return `New class "${metadata?.className || 'class'}" submitted by ${metadata?.creatorName || 'a creator'} needs review.`;
    case 'payment_received':
      return `Payment of ₹${metadata?.amount?.toFixed(2) || '0'} received for "${metadata?.className || 'your class'}".`;
    case 'new_review':
      return `New review received for "${metadata?.className || 'your class'}".`;
    case 'payment_failed':
      return `Payment failed for enrollment. Please contact support.`;
    case 'enrollment_failed':
      return `Enrollment failed for "${metadata?.className || 'the class'}". Please try again.`;
    default:
      return 'You have a new notification.';
  }
}

