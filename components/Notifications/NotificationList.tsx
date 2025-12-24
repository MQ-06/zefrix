'use client';

import { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import { markAllNotificationsAsRead } from '@/lib/notifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: any;
  metadata?: any;
}

interface NotificationListProps {
  userId: string;
  userRole: 'student' | 'creator' | 'admin';
}

declare global {
  interface Window {
    firebaseDb: any;
    collection: any;
    query: any;
    where: any;
    getDocs: any;
    onSnapshot: any;
    orderBy: any;
    limit: any;
  }
}

export default function NotificationList({ userId, userRole }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!window.firebaseDb || !window.collection || !window.query || !window.where || !window.getDocs || !window.orderBy || !window.limit) {
      setLoading(false);
      return;
    }

    try {
      const notificationsRef = window.collection(window.firebaseDb, 'notifications');
      let q = window.query(
        notificationsRef,
        window.where('userId', '==', userId),
        window.orderBy('createdAt', 'desc'),
        window.limit(50)
      );

      const snapshot = await window.getDocs(q);
      const fetchedNotifications: Notification[] = [];
      snapshot.forEach((doc: any) => {
        fetchedNotifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time listener
    if (window.firebaseDb && window.collection && window.query && window.where && window.onSnapshot && window.orderBy && window.limit) {
      const notificationsRef = window.collection(window.firebaseDb, 'notifications');
      const q = window.query(
        notificationsRef,
        window.where('userId', '==', userId),
        window.orderBy('createdAt', 'desc'),
        window.limit(50)
      );

      const unsubscribe = window.onSnapshot(q, (snapshot: any) => {
        const fetchedNotifications: Notification[] = [];
        snapshot.forEach((doc: any) => {
          fetchedNotifications.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
        setLoading(false);
      }, (error: any) => {
        console.error('Error listening to notifications:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [userId]);

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      await markAllNotificationsAsRead(userId);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#fff',
          margin: 0,
        }}>
          Notifications
          {unreadCount > 0 && (
            <span style={{
              marginLeft: '0.5rem',
              fontSize: '1rem',
              color: '#D92A63',
              fontWeight: '600',
            }}>
              ({unreadCount} unread)
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '0.25rem' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                background: filter === 'all' ? '#D92A63' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: filter === 'all' ? '600' : '400',
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '0.5rem 1rem',
                background: filter === 'unread' ? '#D92A63' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: filter === 'unread' ? '600' : '400',
              }}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(217, 42, 99, 0.2)',
                border: '1px solid #D92A63',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#fff',
          }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {filter === 'unread' 
              ? 'You\'re all caught up!'
              : 'You\'ll see notifications about enrollments, class updates, and more here.'}
          </p>
        </div>
      ) : (
        <div>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onUpdate={fetchNotifications}
            />
          ))}
        </div>
      )}
    </div>
  );
}

