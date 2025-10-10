// src/hooks/useSocket.js
import { useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';

export default function useSocket() {
  const socketRef = useRef(null);
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    
    // Use API base URL and strip '/api' to get the socket URL
    const url = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    console.log('Connecting to socket at:', url, 'for user:', user.id);
    
    socketRef.current = io(url, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // Authenticate user when connected
    socketRef.current.on('connect', () => {
      const userId = user.id || user._id;
      console.log('Socket connected successfully for user:', userId, 'Full user object:', user);
      socketRef.current.emit('authenticate', { userId });
    });

    // Add error handling
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Handle reconnection
    socketRef.current.on('reconnect', () => {
      const userId = user.id || user._id;
      console.log('Socket reconnected successfully for user:', userId);
      socketRef.current.emit('authenticate', { userId });
    });

    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  return socketRef;
}