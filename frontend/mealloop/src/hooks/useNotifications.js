// src/hooks/useNotifications.js
import { useEffect, useState } from 'react';

export default function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, [permission]);

  const showNotification = (title, options = {}) => {
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  };

  const showChatNotification = (senderName, message, onClick) => {
    if (permission === 'granted' && document.hidden) {
      const notification = showNotification(`New message from ${senderName}`, {
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        tag: 'chat-message',
        requireInteraction: true
      });

      if (notification && onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      return notification;
    }
  };

  return { permission, showNotification, showChatNotification };
}