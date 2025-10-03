// hooks/useMessageNotifications.js
import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import useSocket from './useSocket';
import api from '../services/api';

export default function useMessageNotifications() {
  const { user } = useContext(AuthContext);
  const socketRef = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({}); // donationId -> count

  // Fetch initial unread counts for all donations
  const refreshUnreadCounts = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/chat/active');
      const counts = {};
      response.data.forEach(chat => {
        if (chat.unreadCount > 0) {
          counts[chat.donationId] = chat.unreadCount;
        }
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [user]);

  // Listen for new messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const handleNewMessage = (message) => {
      // Only count messages from others
      if (message.sender._id !== user.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.donation]: (prev[message.donation] || 0) + 1
        }));
      }
    };

    const handleMessageRead = ({ donationId }) => {
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[donationId];
        return newCounts;
      });
    };

    socket.on('chat_message', handleNewMessage);
    socket.on('messages_read', handleMessageRead);

    return () => {
      socket.off('chat_message', handleNewMessage);
      socket.off('messages_read', handleMessageRead);
    };
  }, [socketRef, user]);

  // Initial load
  useEffect(() => {
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  const markAsRead = useCallback((donationId) => {
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[donationId];
      return newCounts;
    });
  }, []);

  return {
    unreadCounts,
    refreshUnreadCounts,
    markAsRead
  };
}