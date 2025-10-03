import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ChatList({ user, onSelectChat, refreshTrigger }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchChats = async () => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [chatsRes, unreadRes] = await Promise.all([
        api.get('/chat/active'),
        api.get('/chat/unread-count')
      ]);
      
      setChats(chatsRes.data);
      setTotalUnread(unreadRes.data.unreadCount);
    } catch (err) {
      setChats([]);
      setTotalUnread(0);
      if (err.response) {
        if (err.response.status === 401) {
          console.warn('Not authenticated. Please log in.');
        } else if (err.response.status === 404) {
          console.error('Chat endpoint not found:', err.response.config.url);
        } else {
          console.error('Chat API error:', err.response.status, err.response.data);
        }
      } else {
        console.error('Chat API error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user, refreshTrigger]);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(chats) || chats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Chats</h3>
        <p className="text-gray-500 dark:text-gray-400">Your conversations will appear here once you start chatting with donors or volunteers.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading chats...
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No active chats yet
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.donationId}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              onClick={() => {
                const normalizedPeer = chat.peer ? {
                  id: chat.peer._id,
                  _id: chat.peer._id,
                  name: chat.peer.name,
                  email: chat.peer.email,
                  phone: chat.peer.phone
                } : null;
                onSelectChat(chat.donationId, normalizedPeer);
              }}
            >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {chat.peer?.name ? chat.peer.name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {chat.peer?.name || 'Unknown User'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {chat.foodName || 'Donation'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  chat.status === 'Claimed' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {chat.status}
                </span>
                {chat.lastMessage && (
                  <span className="text-xs text-gray-400">
                    {formatLastMessageTime(chat.lastMessage.timestamp)}
                  </span>
                )}
              </div>
            </div>
            
            {chat.lastMessage && chat.lastMessage.message ? (
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  <span className="font-medium">
                    {chat.lastMessage.sender?._id === user.id ? 'You' : (chat.lastMessage.sender?.name || 'Unknown')}:
                  </span>{' '}
                  {chat.lastMessage.message}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No messages yet
                </p>
              </div>
            )}
          </div>
          ))
        )}
      </div>
    </div>
  );
}
