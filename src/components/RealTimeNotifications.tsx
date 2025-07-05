import React, { useEffect, useState, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'online' | 'offline' | 'typing' | 'message';
  message: string;
  userId: number;
  username: string;
  timestamp: Date;
}

interface RealTimeNotificationsProps {
  onlineUsers: Array<{ userId: number; username: string; status: string }>;
  typingUsers: Array<{ userId: number; username: string; chatId: number }>;
  currentUserId: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  onlineUsers,
  typingUsers,
  currentUserId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const previousOnlineUsersRef = useRef<Set<number>>(new Set());
  const previousTypingUsersRef = useRef<Set<string>>(new Set());

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${notification.userId}-${Date.now()}`,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after 3 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Check for new online users
  useEffect(() => {
    const currentOnlineUserIds = new Set(
      onlineUsers
        .filter(user => user.status === 'online' && user.userId !== currentUserId)
        .map(user => user.userId)
    );

    // Find newly online users
    const newOnlineUsers = Array.from(currentOnlineUserIds).filter(
      userId => !previousOnlineUsersRef.current.has(userId)
    );

    // Add notifications for new online users
    newOnlineUsers.forEach(userId => {
      const user = onlineUsers.find(u => u.userId === userId);
      if (user) {
        addNotification({
          type: 'online',
          message: `${user.username} đã online`,
          userId: user.userId,
          username: user.username,
        });
      }
    });

    // Find users who went offline
    const wentOffline = Array.from(previousOnlineUsersRef.current).filter(
      userId => !currentOnlineUserIds.has(userId)
    );

    // Add notifications for users who went offline
    wentOffline.forEach(userId => {
      const user = onlineUsers.find(u => u.userId === userId);
      if (user) {
        addNotification({
          type: 'offline',
          message: `${user.username} đã offline`,
          userId: user.userId,
          username: user.username,
        });
      }
    });

    previousOnlineUsersRef.current = currentOnlineUserIds;
  }, [onlineUsers, currentUserId, addNotification]);

  // Check for new typing users
  useEffect(() => {
    const currentTypingKeys = new Set(
      typingUsers
        .filter(user => user.userId !== currentUserId)
        .map(user => `${user.userId}-${user.chatId}`)
    );

    // Find newly typing users
    const newTypingUsers = Array.from(currentTypingKeys).filter(
      key => !previousTypingUsersRef.current.has(key)
    );

    // Add notifications for new typing users
    newTypingUsers.forEach(key => {
      const [userId, chatId] = key.split('-').map(Number);
      const user = typingUsers.find(u => u.userId === userId && u.chatId === chatId);
      if (user) {
        addNotification({
          type: 'typing',
          message: `${user.username} đang nhập tin nhắn...`,
          userId: user.userId,
          username: user.username,
        });
      }
    });

    previousTypingUsersRef.current = currentTypingKeys;
  }, [typingUsers, currentUserId, addNotification]);

  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'online':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        );
      case 'offline':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        );
      case 'typing':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        );
    }
  }, []);

  const getNotificationStyle = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'online':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'offline':
        return 'border-l-4 border-gray-500 bg-gray-50';
      case 'typing':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getNotificationStyle(notification.type)} p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in-right`}
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealTimeNotifications;