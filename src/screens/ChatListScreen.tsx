import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
}

const ChatListScreen: React.FC = () => {
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchChatThreads();
    // eslint-disable-next-line
  }, [token]);

  const fetchChatThreads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/chat", {
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

  const handleSelectChat = (thread: ChatThread) => {
    navigate(`/chats/${thread.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-lg bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Danh sách đoạn chat</h2>
          <button
            className="text-sm text-red-500 hover:underline"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <ul>
            {chatThreads.length === 0 && (
              <li className="text-gray-500">Không có đoạn chat nào.</li>
            )}
            {chatThreads.map((thread) => {
              return (
                <li
                  key={thread.id}
                  className="border-b py-3 flex items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectChat(thread)}
                >
                  <img src={thread.displayUser.avatar} />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-700">
                      {thread.displayUser.name}
                    </div>
                    <div className="font-semibold text-blue-700">
                      {thread.displayUser.email}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(thread.updatedAt).toLocaleString()}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatListScreen; 