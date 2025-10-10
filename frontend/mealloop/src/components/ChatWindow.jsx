import { useEffect, useRef, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import useNotifications from '../hooks/useNotifications';
import api from '../services/api';

export default function ChatWindow({ donationId, user, peer, onClose, onMessageReceived }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const typingTimeoutRef = useRef(null);
  const { showChatNotification } = useNotifications();

  // Debug logging for ChatWindow props
  console.log('=== CHATWINDOW DEBUG ===');
  console.log('ChatWindow received - donationId:', donationId);
  console.log('ChatWindow received - user:', user);
  console.log('ChatWindow received - peer:', peer);
  console.log('User name:', user?.name, 'Peer name:', peer?.name);
  console.log('=== END CHATWINDOW DEBUG ===');

  // Monitor socket connection status
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected in ChatWindow');
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected in ChatWindow');
      setSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Check initial connection state
    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socketRef]);

  // Null/undefined peer check
  if (!peer || !(peer.id || peer._id)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Chat Unavailable</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Could not load chat partner information. Please try again or refresh the page.</p>
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Fetch chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      setError(null);
      setLoading(true);
      
      try {
        const res = await api.get(`/chat/${donationId}`);
        if (res.data && Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
        } else if (Array.isArray(res.data)) {
          setMessages(res.data);
        } else {
          setMessages([]);
        }
        
        // Mark messages as read
        await api.put(`/chat/mark-read/${donationId}`);
      } catch (err) {
        setMessages([]);
        if (err.response) {
          if (err.response.status === 401) {
            setError('You are not authorized to view this chat. Please log in.');
          } else if (err.response.status === 404) {
            setError('Chat not found. The donation may not exist or you do not have access.');
          } else {
            setError('Failed to load chat. Please try again.');
          }
        } else {
          setError('Failed to load chat. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatHistory();
  }, [donationId]);

  // Handle incoming messages and notifications
  const handleNewMessage = useCallback((msg) => {
    console.log('Received new message:', msg);
    setMessages(msgs => {
      // Prevent duplicate messages by checking both _id and tempId
      if (msgs.some(m => m._id === msg._id || (m.tempId && m.tempId === msg.tempId))) {
        // If this is updating an optimistic message, replace it
        if (msg.tempId) {
          console.log('Replacing optimistic message with real message');
          return msgs.map(m => m.tempId === msg.tempId ? msg : m);
        }
        console.log('Message already exists, skipping');
        return msgs;
      }
      console.log('Adding new message to list');
      return [...msgs, msg];
    });
    
    // Show notification if message is from peer and window is not focused
    if (msg.sender._id === (peer.id || peer._id) && document.hidden) {
      showChatNotification(
        peer.name || 'User',
        msg.message,
        () => {
          // Focus the chat window
          window.focus();
        }
      );
    }
    
    // Notify parent component about new message
    if (onMessageReceived) {
      onMessageReceived(msg);
    }
  }, [peer.id || peer._id, peer.name, showChatNotification, onMessageReceived]);

  // Join chat room and set up socket listeners
  useEffect(() => {
    if (error || loading || !socketConnected) return;
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      console.error('Socket not connected in ChatWindow');
      return;
    }

    console.log('Setting up chat listeners for donation:', donationId, 'user:', user.id || user._id, 'peer:', peer.id || peer._id);

    // Join room
    socket.emit('join_room', { donationId, userId: user.id || user._id });
    
    // Check peer's initial online status
    socket.emit('check_presence', { userId: peer.id || peer._id, donationId });

    // Set up listeners
    socket.on('chat_message', handleNewMessage);
    socket.on('message_sent', (msg) => {
      console.log('Message sent confirmation received:', msg);
      // Replace optimistic message with confirmed message from server
      setMessages(msgs => msgs.map(m => 
        m.tempId === msg.tempId ? { ...msg, pending: false } : m
      ));
    });

    socket.on('message_delivered', ({ messageId, tempId }) => {
      console.log('Message delivered confirmation received:', { messageId, tempId });
      // Mark message as delivered
      setMessages(msgs => msgs.map(m => 
        (m.tempId === tempId || m._id === messageId) ? { ...m, delivered: true, deliveredAt: new Date() } : m
      ));
    });

    socket.on('message_error', ({ error, tempId }) => {
      console.error('Message error received:', error, tempId);
      // Remove optimistic message on error
      if (tempId) {
        setMessages(msgs => msgs.filter(m => m.tempId !== tempId));
      }
      alert(`Message error: ${error}`);
    });
    
    socket.on('typing', ({ userId, isTyping }) => {
      if (userId === (peer.id || peer._id)) {
        setPeerTyping(isTyping);
      }
    });
    
    socket.on('stop_typing', ({ userId }) => {
      if (userId === (peer.id || peer._id)) {
        setPeerTyping(false);
      }
    });
    
    socket.on('presence', ({ userId, online }) => {
      if (userId === (peer.id || peer._id)) setOnline(online);
    });
    
    socket.on('messages_delivered', ({ userId }) => {
      if (userId === (peer.id || peer._id)) {
        setMessages(msgs => msgs.map(m => 
          m.sender._id === (user.id || user._id) && !m.delivered 
            ? { ...m, delivered: true, deliveredAt: new Date() }
            : m
        ));
      }
    });
    
    socket.on('messages_read', ({ userId }) => {
      if (userId === (peer.id || peer._id)) {
        setMessages(msgs => msgs.map(m => 
          m.sender._id === (user.id || user._id) && !m.read 
            ? { ...m, read: true, readAt: new Date() }
            : m
        ));
      }
    });

    // Mark messages as read when window gains focus
    const handleFocus = () => {
      api.put(`/chat/mark-read/${donationId}`).catch(console.error);
      socket.emit('mark_messages_read', { donationId, userId: user.id || user._id });
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      socket.emit('leave_room', { donationId, userId: user.id || user._id });
      socket.off('chat_message');
      socket.off('message_sent');
      socket.off('message_delivered');
      socket.off('message_error');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('presence');
      socket.off('messages_delivered');
      socket.off('messages_read');
      window.removeEventListener('focus', handleFocus);
    };
  }, [donationId, user.id || user._id, peer.id || peer._id, socketRef, error, loading, socketConnected, handleNewMessage]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!typing) {
      setTyping(true);
      const socket = socketRef.current;
      if (socket) {
        socket.emit('typing', { donationId, userId: user.id || user._id, isTyping: true });
      }
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      const socket = socketRef.current;
      if (socket) {
        socket.emit('stop_typing', { donationId, userId: user.id || user._id });
      }
    }, 2000);
  }, [typing, donationId, user.id || user._id, socketRef]);

  // Auto-scroll to latest only if user is at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  // Track if user is at bottom of messages
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const threshold = 50; // Pixels from bottom to consider "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    setIsAtBottom(atBottom);
  };

  // Message status indicator
  const getMessageStatus = (message) => {
    if (message.sender._id !== (user.id || user._id)) return null;
    
    if (message.pending) {
      return <span className="text-gray-300" title="Sending...">⏳</span>;
    } else if (message.read) {
      return <span className="text-blue-500" title="Read">✓✓</span>;
    } else if (message.delivered) {
      return <span className="text-gray-400" title="Delivered">✓✓</span>;
    } else {
      return <span className="text-gray-300" title="Sent">✓</span>;
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Chat Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sendingMessage) return;
    
    setSendingMessage(true);
    const messageText = input.trim();
    const tempId = Date.now().toString();
    
    // Clear input immediately
    setInput('');
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
    
    // Stop typing indicator
    const socket = socketRef.current;
    if (socket) {
      socket.emit('stop_typing', { donationId, userId: user.id });
    }
    
    // Optimistically add message to UI
    const optimisticMessage = {
      _id: tempId,
      tempId,
      donation: donationId,
      sender: { _id: user.id || user._id, name: user.name, email: user.email },
      receiver: { _id: peer.id || peer._id, name: peer.name, email: peer.email },
      message: messageText,
      timestamp: new Date(),
      delivered: false,
      read: false,
      type: 'text',
      pending: true // Mark as pending
    };
    
    setMessages(msgs => [...msgs, optimisticMessage]);
    setIsAtBottom(true); // Ensure auto-scroll for user's own messages
    
    try {
      if (socket && socket.connected) {
        console.log('Sending message via socket:', {
          donationId,
          sender: user.id || user._id,
          receiver: peer.id || peer._id,
          message: messageText,
          tempId
        });
        socket.emit('chat_message', {
          donationId,
          sender: user.id || user._id,
          receiver: peer.id || peer._id,
          message: messageText,
          tempId
        });
      } else {
        console.warn('Socket not connected, using HTTP fallback');
        // HTTP fallback
        try {
          const response = await api.post('/messages/send', {
            donationId,
            receiver: peer.id || peer._id,
            message: messageText
          });
          
          if (response.data.success) {
            // Replace optimistic message with real one
            setMessages(msgs => msgs.map(m => 
              m.tempId === tempId ? response.data.message : m
            ));
            console.log('Message sent via HTTP fallback');
          }
        } catch (httpError) {
          console.error('HTTP fallback failed:', httpError);
          // Remove optimistic message on error
          setMessages(msgs => msgs.filter(m => m.tempId !== tempId));
          alert('Failed to send message. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(msgs => msgs.filter(m => m.tempId !== tempId));
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col h-[80vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
            <div className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {peer.name ? peer.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                online ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {peer.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-gray-800 space-y-4"
        >
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Start the conversation!
              </h4>
              <p className="text-gray-500 dark:text-gray-500">
                Send a message to {peer.name} about this donation.
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={msg._id || i} className={`flex ${msg.sender._id === (user.id || user._id) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${msg.sender._id === (user.id || user._id) ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  msg.sender._id === (user.id || user._id)
                    ? 'bg-blue-600 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-600'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                </div>
                <div className={`flex items-center mt-1 space-x-2 text-xs text-gray-500 dark:text-gray-400 ${
                  msg.sender._id === (user.id || user._id) ? 'justify-end' : 'justify-start'
                }`}>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {msg.sender._id === (user.id || user._id) && (
                    <span className="flex items-center">
                      {getMessageStatus(msg)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {peerTyping && (
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{peer.name} is typing...</span>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                disabled={sendingMessage}
                className="w-full rounded-full border border-gray-300 dark:border-gray-600 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors disabled:opacity-50"
                maxLength={1000}
              />
            </div>
            <button 
              type="submit" 
              disabled={!input.trim() || sendingMessage}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m6.364.636l-2.828 2.828M20 12h-4m-6.364 6.364l-2.828-2.828M12 20v-4m-6.364-6.364l2.828 2.828M4 12h4m6.364-6.364l2.828 2.828" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}
