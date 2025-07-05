import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import TypingIndicator from "../components/TypingIndicator";
import ImageIcon from "../icons/image";

interface Message {
  content: string;
  type: "sent" | "received" | "text";
  sender: string;
  avatar?: string;
  time: string;
  imageUrl?: string;
}

interface TypingUser {
  userId: number;
  username: string;
  avatar?: string;
}

const ChatDetailScreen: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const userAvatar = localStorage.getItem("avatar") || "/default-avatar.png";
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const {
    isConnected,
    typingUsers: socketTypingUsers,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    sendMessage,
    getOnlineUsers,
    socket,
  } = useSocket(token || "");

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }

    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `https://vietsocial-be-production.up.railway.app/api/chat/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();

        setMessages(
          data.messages.map((msg: any) => ({
            content: msg.content,
            type: msg.senderId == userId ? "sent" : "received",
            sender:
              msg.senderId == userId
                ? "Bạn"
                : msg.sender.name || `User ${msg.senderId}`,
            avatar:
              msg.senderId == userId
                ? userAvatar
                : msg.sender?.avatar || "/default-avatar.png",
            time: new Date(msg.createdAt).toLocaleTimeString(),
            imageUrl: msg.imageUrl,
          }))
        );
        setChatInfo(data.chat);
      } catch (err) {
        console.error("Fetch message error:", err);
      }
    };

    fetchMessages();
  }, [chatId, token, userId, userAvatar, navigate]);

  useEffect(() => {
    if (isConnected && chatId) {
      joinChat(Number(chatId));
      getOnlineUsers(Number(chatId));
    }

    return () => {
      if (chatId) leaveChat(Number(chatId));
    };
  }, [isConnected, chatId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleReceiveMessage = (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          content: msg.content,
          type: msg.senderId == userId ? "sent" : "received",
          sender:
            msg.senderId == userId
              ? "Bạn"
              : msg.sender.name || `User ${msg.senderId}`,
          avatar:
            msg.senderId == userId
              ? userAvatar
              : msg.sender?.avatar || "/default-avatar.png",
          time: new Date(msg.createdAt).toLocaleTimeString(),
          imageUrl: msg.imageUrl,
        },
      ]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, userId, userAvatar]);

  useEffect(() => {
    const currentTyping = socketTypingUsers
      .filter((t) => t.chatId === Number(chatId))
      .map((t) => ({
        ...t,
        avatar:
          t.userId == Number(userId)
            ? userAvatar
            : chatInfo?.participants?.find((p: any) => p.id === t.userId)
                ?.avatar,
      }));
    setTypingUsers(currentTyping);
  }, [socketTypingUsers, chatId, chatInfo, userAvatar, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 500) {
      if (!isTyping && chatId) {
        setIsTyping(true);
        startTyping(Number(chatId));
        lastTypingTimeRef.current = now;
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (chatId) {
        setIsTyping(false);
        stopTyping(Number(chatId));
      }
    }, 2000);

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (message.trim() && chatId) {
      sendMessage(Number(chatId), { content: message });
      setMessage("");
      setIsTyping(false);
      stopTyping(Number(chatId));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !token) return;

    if (!file.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file hình ảnh");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File quá lớn. Tối đa 10MB");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `https://vietsocial-be-production.up.railway.app/api/chat/${chatId}/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      console.log("Image uploaded:", result);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Không thể upload ảnh");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex justify-center items-center px-4 py-6">
      <div className="w-full max-w-md h-full flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden border border-blue-100">
        {/* Header */}
        <div className="flex items-center px-5 py-4 bg-blue-50 border-b border-blue-100">
          <button
            onClick={() => navigate("/chats")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Trở về
          </button>
          <div className="ml-4 flex-1">
            <h2 className="text-lg font-semibold text-blue-800 truncate">
              {chatInfo?.displayUser?.name || `Chat Room ${chatId}`}
            </h2>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                }`}
              ></span>
              <span>{isConnected ? "Đã kết nối" : "Mất kết nối"}</span>
              {typingUsers.length > 0 && (
                <span className="text-yellow-600 animate-pulse">
                  • {typingUsers.length} đang nhập
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 bg-gray-50 max-h-[500px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-2 ${
                msg.type === "sent" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl shadow text-sm max-w-[75%] ${
                  msg.type === "sent"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                <div>
                  {!msg.imageUrl ? <p>{msg.content}</p> : ""}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="sent image"
                      className="mt-2 rounded-md max-h-60 object-cover max-w-full border"
                    />
                  )}
                </div>
                <div className="text-xs text-right opacity-60 mt-1">
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          <TypingIndicator typingUsers={typingUsers} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleImageButtonClick}
              disabled={uploadingImage || !isConnected}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 disabled:opacity-50"
              title="Gửi hình ảnh"
            >
              <ImageIcon />
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageUpload}
            />

            <input
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              disabled={!isConnected}
            />

            <button
              onClick={handleSendMessage}
              className="px-5 py-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300"
              disabled={!message.trim() || !isConnected}
            >
              Gửi
            </button>
          </div>

          {uploadingImage && (
            <div className="mt-2 text-sm text-blue-500 text-center animate-pulse">
              Đang tải hình ảnh...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDetailScreen;
