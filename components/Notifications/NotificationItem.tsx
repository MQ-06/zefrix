'use client';

import { useState } from 'react';
import Link from 'next/link';
import { markNotificationAsRead } from '@/lib/notifications';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: any;
    metadata?: any;
  };
  onUpdate: () => void;
}

export default function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.isRead || isMarkingRead) return;
    
    setIsMarkingRead(true);
    try {
      await markNotificationAsRead(notification.id);
      onUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('approved') || type.includes('confirmed') || type.includes('success')) {
      return '✅';
    }
    if (type.includes('rejected') || type.includes('failed') || type.includes('cancelled')) {
      return '❌';
    }
    if (type.includes('payment') || type.includes('received')) {
      return '💰';
    }
    if (type.includes('enrollment') || type.includes('new')) {
      return '👥';
    }
    if (type.includes('reminder') || type.includes('session')) {
      return '📅';
    }
    if (type.includes('review') || type.includes('rating')) {
      return '⭐';
    }
    return '🔔';
  };

  const content = (
    <div
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
      onClick={!notification.isRead ? handleMarkAsRead : undefined}
      style={{
        background: notification.isRead ? 'rgba(255, 255, 255, 0.03)' : 'rgba(217, 42, 99, 0.1)',
        borderLeft: notification.isRead ? '3px solid transparent' : '3px solid #D92A63',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.75rem',
        cursor: !notification.isRead ? 'pointer' : 'default',
        transition: 'all 0.2s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!notification.isRead) {
          e.currentTarget.style.background = 'rgba(217, 42, 99, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.isRead ? 'rgba(255, 255, 255, 0.03)' : 'rgba(217, 42, 99, 0.1)';
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
          {getNotificationIcon(notification.type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: notification.isRead ? '500' : '600',
            color: '#fff',
            margin: '0 0 0.5rem 0',
          }}>
            {notification.title}
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0 0 0.5rem 0',
            lineHeight: '1.5',
          }}>
            {notification.message}
          </p>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
          }}>
            {formatDate(notification.createdAt)}
          </div>
        </div>
      </div>
      {!notification.isRead && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#D92A63',
        }} />
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link 
        href={notification.link} 
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

