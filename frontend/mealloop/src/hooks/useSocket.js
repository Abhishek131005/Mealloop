// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(path = '/', opts = {}) {
  const socketRef = useRef(null);
  useEffect(() => {
    const url = import.meta.env.VITE_API_BASE_URL?.replace('/api',''); // e.g. http://localhost:5000
    socketRef.current = io(url, { path, ...opts }); // if your server uses custom path, e.g. /socket.io
    return () => socketRef.current?.disconnect();
  }, [path]);
  return socketRef;
}