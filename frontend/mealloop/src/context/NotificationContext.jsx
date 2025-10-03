// src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import useSocket from '../hooks/useSocket';
import useNotifications from '../hooks/useNotifications';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

export default function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const socketRef = useSocket();
  const { showChatNotification } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      api.get('/chat/unread-count')
        .then(res => setUnreadCount(res.data.unreadCount))
        .catch(console.error);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  // Socket listeners for global notifications
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const handleNewMessageNotification = (data) => {
      const { donationId, sender, message, timestamp } = data;
      
      // Show browser notification
      const notification = showChatNotification(
        sender.name,
        message,
        () => {
          // You can handle click to open chat here
          window.focus();
        }
      );

      // Add to notifications state
      const newNotification = {
        id: Date.now(),
        type: 'message',
        donationId,
        sender,
        message,
        timestamp,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
      setUnreadCount(prev => prev + 1);

      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    socket.on('new_message_notification', handleNewMessageNotification);

    return () => {
      socket.off('new_message_notification');
    };
  }, [socketRef, user, showChatNotification]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateUnreadCount = (delta) => {
    setUnreadCount(prev => Math.max(0, prev + delta));
  };

  const refreshUnreadCount = async () => {
    if (user) {
      try {
        const res = await api.get('/chat/unread-count');
        setUnreadCount(res.data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  const value = {
    unreadCount,
    notifications,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    updateUnreadCount,
    refreshUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Notification Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.slice(0, 3).map(notification => (
          <div
            key={notification.id}
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ${
              notification.read ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  New message from {notification.sender.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => clearNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}