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
    <h3 className="text-md font-semibold mb-2 text-gray-700">Người dùng đang hoạt động</h3>
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-blue-50 transition"
        >
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-blue-300 shadow-sm object-cover"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
              user.status === 'online' ? "bg-green-400" : 
              user.status === 'typing' ? "bg-yellow-400" : "bg-gray-300"
            }`}></span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 truncate">{user.name}</span>
              {user.status === 'online' && (
                <span className="text-xs text-green-500 font-medium">● Online</span>
              )}
              {user.status === 'typing' && (
                <span className="text-xs text-yellow-500 font-medium">● Đang nhập</span>
              )}
            </div>
            {user.lastSeen && user.status === 'offline' && (
              <span className="text-xs text-gray-500">Hoạt động lần cuối: {user.lastSeen}</span>
            )}
          </div>
          {user.status === 'typing' && (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
      ))}
      {users.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          Không có người dùng nào đang hoạt động
        </div>
      )}
    </div>
  </div>
);

const FriendList: React.FC<{ friends: (Friend & { isOnline: boolean })[] }> = ({ friends }) => (
  <div className="w-full mb-6">
    <h3 className="text-md font-semibold mb-2 text-gray-700">Bạn bè</h3>
    <div className="flex space-x-4 overflow-x-auto pb-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex flex-col items-center min-w-[70px] px-2 py-1 bg-gray-50 rounded-lg shadow-sm hover:bg-blue-50 transition"
        >
          <div className="relative">
            <img
              src={friend.avatar}
              alt={friend.name}
              className="w-12 h-12 rounded-full border-2 border-blue-400 shadow"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
              friend.isOnline ? "bg-green-400" : "bg-gray-300"
            }`}></span>
          </div>
          <span className="text-xs mt-1 text-gray-800 font-medium text-center truncate w-14">
            {friend.name}
          </span>
          {friend.isOnline && (
            <span className="text-[10px] text-green-500 font-medium">Online</span>
          )}
        </div>
      ))}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex flex-col items-center py-8">
      {/* Real-time Notifications */}
      <RealTimeNotifications
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        currentUserId={Number(localStorage.getItem("userId"))}
      />
      
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-0 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b bg-blue-50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-blue-700">Đoạn chat</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>{isConnected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
            </div>
          </div>
          <button
            className="text-sm text-red-500 hover:underline"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
        <div className="px-6 pt-4">
          {/* Online Stats */}
          <OnlineStats
            isConnected={isConnected}
            onlineUsersCount={onlineUsers.filter(u => u.status === 'online').length}
            typingUsersCount={typingUsers.length}
            totalFriends={friends.length}
          />
          
          {/* Active Users */}
          {isConnected && activeUsers.length > 0 && (
            <ActiveUsers users={activeUsers} />
          )}
          
          {/* FriendList component here */}
          {friendsLoading ? (
            <div className="text-center text-gray-500 mb-4">Đang tải danh sách bạn bè...</div>
          ) : friendsError ? (
            <div className="text-center text-red-500 mb-4">{friendsError}</div>
          ) : (
            <FriendList friends={friendsWithOnlineStatus} />
          )}
        </div>
        <div className="px-2 pb-2">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Đang tải...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {chatThreadsWithOnlineStatus.length === 0 && (
                <li className="text-gray-500 text-center py-8">Không có đoạn chat nào.</li>
              )}
              {chatThreadsWithOnlineStatus.map((thread) => {
                return (
                  <li
                    key={thread.id}
                    className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-blue-50 transition group"
                    onClick={() => handleSelectChat(thread)}
                  >
                    <div className="relative">
                      <img
                        src={thread.displayUser.avatar}
                        alt={thread.displayUser.name}
                        className="w-12 h-12 rounded-full border-2 border-blue-300 shadow-sm object-cover"
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        thread.displayUser.isOnline ? "bg-green-400" : "bg-gray-300"
                      }`}></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-800 truncate">{thread.displayUser.name}</span>
                        {thread.displayUser.isOnline && (
                          <span className="ml-1 text-xs text-green-500 font-medium">● Online</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate text-start">{thread.lastMessage?.content || ''}</div>
                    </div>
                    <div className="flex flex-col items-end min-w-[80px]">
                      <span className="text-xs text-gray-400">
                        {new Date(thread.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListScreen; 