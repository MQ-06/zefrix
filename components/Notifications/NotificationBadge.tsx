'use client';

import { useState, useEffect } from 'react';

interface NotificationBadgeProps {
  userId: string;
}

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    onSnapshot: any;
  }
}

export default function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs) {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const notificationsRef = window.collection(window.firebaseDb, 'notifications');
        const q = window.query(
          notificationsRef,
          window.where('userId', '==', userId),
          window.where('isRead', '==', false)
        );
        const snapshot = await window.getDocs(q);
        setUnreadCount(snapshot.size);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time listener
    if (window.onSnapshot) {
      const notificationsRef = window.collection(window.firebaseDb, 'notifications');
      const q = window.query(
        notificationsRef,
        window.where('userId', '==', userId),
        window.where('isRead', '==', false)
      );

      const unsubscribe = window.onSnapshot(q, (snapshot: any) => {
        setUnreadCount(snapshot.size);
      }, (error: any) => {
        console.error('Error listening to unread count:', error);
      });

      return () => unsubscribe();
    }
  }, [userId]);

  if (unreadCount === 0) return null;

  return (
    <span
      style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        background: '#D92A63',
        color: '#fff',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: '700',
        minWidth: '20px',
      }}
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

