'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: NotificationType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: Notification = { id, message, type, duration };

    console.log('🔔 Showing notification:', { type, message, duration });
    setNotifications((prev) => {
      const updated = [...prev, notification];
      console.log('📋 Notifications array:', updated.length, 'notifications');
      return updated;
    });

    // Auto remove after duration
    setTimeout(() => {
      console.log('⏰ Removing notification:', id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  const showSuccess = (message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showNotification(message, 'error', duration || 5000);
  };

  const showInfo = (message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  };

  const showWarning = (message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

function NotificationContainer({
  notifications,
  onRemove,
}: {
  notifications: Notification[];
  onRemove: (id: string) => void;
}) {
  if (notifications.length === 0) return null;
  
  return (
    <div 
      className="fixed top-20 right-4 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none"
      style={{ 
        position: 'fixed',
        top: '80px',
        right: '16px',
        zIndex: 99999,
        maxWidth: '420px'
      }}
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function NotificationToast({
  notification,
  onRemove,
}: {
  notification: Notification;
  onRemove: (id: string) => void;
}) {
  const { message, type, id } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-600 border-red-400';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 border-yellow-400';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400';
    }
  };

  return (
    <div
      className={`
        ${getStyles()}
        pointer-events-auto
        rounded-lg
        shadow-2xl
        border-2
        backdrop-blur-sm
        p-4
        flex
        items-start
        gap-3
        min-w-[300px]
        max-w-md
      `}
      style={{
        animation: 'slideInRight 0.3s ease-out',
        position: 'relative',
        zIndex: 99999,
        transform: 'translateX(0)',
        opacity: 1,
      }}
    >
      <div className="flex-shrink-0 text-white mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm leading-relaxed break-words" style={{ color: 'white' }}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors ml-2"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

