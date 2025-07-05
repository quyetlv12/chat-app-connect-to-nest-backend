import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import RealTimeNotifications from "../components/RealTimeNotifications";
import OnlineStats from "../components/OnlineStats";

interface ChatThread {
  id: number;
  participant1Id: number;
  participant2Id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  participant1: {
    id: number;
    name: string;
    email: string;
    nick_name: string;
    status: string;
  };
  participant2: {
    id: number;
    name: string;
    email: string;
    nick_name: string;
    status: string;
  };
  displayUser: {
    id: number;
    name: string;
    email: string;
    nick_name: string;
    status: string;
    avatar: string;
  };
  lastMessage : {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    senderId: number;
  }
}

interface Friend {
  id: number;
  name: string;
  avatar: string;
}

// ActiveUsers component to show real-time active users
interface ActiveUser {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: string;
}

const ActiveUsers: React.FC<{ users: ActiveUser[] }> = ({ users }) => (
  <div className="w-full mb-6">
    <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
      Người dùng đang hoạt động
    </h3>
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 active:bg-blue-100/50 transition-all duration-200 transform hover:scale-[1.01]"
        >
          <div className="relative flex-shrink-0">
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full border-3 border-white shadow-lg ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-200 object-cover"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </div>
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-3 border-white rounded-full shadow-lg ${
              user.status === 'online' ? "bg-gradient-to-r from-green-400 to-emerald-400" : 
              user.status === 'typing' ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-gray-300 to-gray-400"
            }`}></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-800 truncate">{user.name}</span>
              {user.status === 'online' && (
                <span className="text-xs text-green-500 font-bold">● Online</span>
              )}
              {user.status === 'typing' && (
                <span className="text-xs text-amber-500 font-bold">● Đang nhập</span>
              )}
            </div>
            {user.lastSeen && user.status === 'offline' && (
              <span className="text-xs text-gray-500 font-medium">Hoạt động lần cuối: {user.lastSeen}</span>
            )}
          </div>
          {user.status === 'typing' && (
            <div className="flex gap-1.5 flex-shrink-0">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm"></div>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      ))}
      {users.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="w-16 h-16 mx-auto mb-3 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <p className="font-medium">Không có người dùng nào đang hoạt động</p>
        </div>
      )}
    </div>
  </div>
);

const FriendList: React.FC<{ friends: (Friend & { isOnline: boolean })[] }> = ({ friends }) => (
  <div className="w-full mb-6">
    <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
      Bạn bè
    </h3>
    <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-hide">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex flex-col items-center min-w-[90px] px-4 py-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 active:bg-blue-100/50 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
        >
          <div className="relative mb-3">
            <div className="relative group">
              <img
                src={friend.avatar}
                alt={friend.name}
                className="w-14 h-14 rounded-full border-3 border-white shadow-lg ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-200 object-cover"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </div>
            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-3 border-white rounded-full shadow-lg ${
              friend.isOnline ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-gray-300 to-gray-400"
            }`}></span>
          </div>
          <span className="text-sm text-gray-800 font-bold text-center truncate w-full">
            {friend.name}
          </span>
          {friend.isOnline && (
            <span className="text-xs text-green-500 font-bold mt-1">Online</span>
          )}
        </div>
      ))}
      {friends.length === 0 && (
        <div className="text-center text-gray-500 py-8 w-full">
          <div className="w-16 h-16 mx-auto mb-3 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="font-medium">Không có bạn bè nào</p>
        </div>
      )}
    </div>
  </div>
);

const ChatListScreen: React.FC = () => {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const { isConnected, onlineUsers, typingUsers } = useSocket(token || "");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchChatThreads();
    fetchFriends();
    // eslint-disable-next-line
  }, [token]);

  const fetchChatThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://vietsocial-be-production.up.railway.app/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không lấy được danh sách đoạn chat");
      const data = await res.json();
      setChatThreads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const res = await fetch("https://vietsocial-be-production.up.railway.app/api/users/all-user-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không lấy được danh sách bạn bè");
      const data = await res.json();
      // Map API user list to Friend[]
      const mappedFriends: Friend[] = Array.isArray(data)
        ? data.map((user: any) => ({
            id: user.id,
            name: user.name || user.nick_name || user.email || "No Name",
            avatar: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
          }))
        : [];
      setFriends(mappedFriends);
    } catch (err: any) {
      setFriendsError(err.message);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleSelectChat = (thread: ChatThread) => {
    navigate(`/chats/${thread.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Helper function to check if a user is online
  const isUserOnline = (userId: number): boolean => {
    return onlineUsers.some(user => user.userId === userId && user.status === 'online');
  };

  // Update friends with online status
  const friendsWithOnlineStatus = friends.map(friend => ({
    ...friend,
    isOnline: isUserOnline(friend.id)
  }));

  // Update chat threads with online status
  const chatThreadsWithOnlineStatus = chatThreads.map(thread => ({
    ...thread,
    displayUser: {
      ...thread.displayUser,
      isOnline: isUserOnline(thread.displayUser.id)
    }
  }));

  // Create active users list from online users and typing users
  useEffect(() => {
    const activeUsersList: ActiveUser[] = [];
    
    // Add online users
    onlineUsers.forEach(onlineUser => {
      if (onlineUser.status === 'online') {
        const friend = friends.find(f => f.id === onlineUser.userId);
        if (friend) {
          activeUsersList.push({
            id: friend.id,
            name: friend.name,
            avatar: friend.avatar,
            status: 'online'
          });
        }
      }
    });

    // Add typing users
    typingUsers.forEach(typingUser => {
      const existingUser = activeUsersList.find(u => u.id === typingUser.userId);
      if (existingUser) {
        existingUser.status = 'typing';
      } else {
        const friend = friends.find(f => f.id === typingUser.userId);
        if (friend) {
          activeUsersList.push({
            id: friend.id,
            name: friend.name,
            avatar: friend.avatar,
            status: 'typing'
          });
        }
      }
    });

    setActiveUsers(activeUsersList);
  }, [onlineUsers, typingUsers, friends]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Enhanced Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Đoạn chat
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" : "bg-gradient-to-r from-red-400 to-pink-400"
              }`}></div>
              <span className="hidden sm:inline font-medium">{isConnected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
              <span className="sm:hidden font-medium">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          <button
            className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium hover:shadow-md"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Real-time Notifications */}
      <RealTimeNotifications
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        currentUserId={Number(localStorage.getItem("userId"))}
      />
      
      {/* Enhanced Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-3 py-4">        
          {/* Enhanced FriendList */}
          <div className="mb-6">
            {friendsLoading ? (
              <div className="text-center text-gray-500 py-6">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Đang tải danh sách bạn bè...
              </div>
            ) : friendsError ? (
              <div className="text-center text-red-500 py-6 font-medium">{friendsError}</div>
            ) : (
              <FriendList friends={friendsWithOnlineStatus} />
            )}
          </div>
          
          {/* Enhanced Chat Threads */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Cuộc trò chuyện
              </h3>
            </div>
            
            {loading ? (
              <div className="text-center text-gray-500 py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <span className="font-medium">Đang tải...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-12 font-medium">{error}</div>
            ) : (
              <div className="divide-y divide-gray-100/50">
                {chatThreadsWithOnlineStatus.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="font-medium">Không có cuộc trò chuyện nào.</p>
                    <p className="text-sm text-gray-400 mt-1">Bắt đầu trò chuyện với bạn bè!</p>
                  </div>
                )}
                {chatThreadsWithOnlineStatus.map((thread, index) => (
                  <div
                    key={thread.id}
                    className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 active:bg-blue-100/50 transition-all duration-200 transform hover:scale-[1.01] animate-fade-in"
                    onClick={() => handleSelectChat(thread)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="relative group">
                        <img
                          src={thread.displayUser.avatar}
                          alt={thread.displayUser.name}
                          className="w-12 h-12 rounded-full border-3 border-white shadow-lg ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all duration-200 object-cover"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-3 border-white shadow-lg ${
                        thread.displayUser.isOnline ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-gray-300 to-gray-400"
                      }`}></span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 truncate">
                          {thread.displayUser.name}
                        </span>
                        {thread.displayUser.isOnline && (
                          <span className="text-xs text-green-500 font-bold">● Online</span>
                        )}
                      </div>
                      
                      <div className="text-sm text-start text-gray-600 truncate font-medium">
                        {thread.lastMessage?.content || 'Chưa có tin nhắn nào'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end min-w-[60px] flex-shrink-0">
                      <span className="text-xs text-gray-400 mb-1 font-medium">
                        {new Date(thread.updatedAt).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                      <span className="text-[10px] text-gray-300 font-medium">
                        {new Date(thread.updatedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatListScreen; 