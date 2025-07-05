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
        setChatInfo(data);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Enhanced Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100/50">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate("/chats")}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="ml-3 flex-1 min-w-0">
            <h2 className="text-lg text-center flex justify-start font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {chatInfo?.displayUser?.name}
              
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" : "bg-gradient-to-r from-red-400 to-pink-400"
              }`}></div>
              <span className="truncate font-medium">
                {isConnected ? "Đang hoạt động" : "Mất kết nối"}
              </span>
              {typingUsers.length > 0 && (
                <span className="text-amber-600 animate-pulse font-medium truncate">
                  • {typingUsers.length} đang nhập
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-3 py-2 bg-gradient-to-b from-gray-50/50 to-blue-50/30">
          <div className="space-y-3 pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-end gap-2 animate-fade-in ${
                  msg.type === "sent" ? "justify-end" : "justify-start"
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                
                
                {/* Enhanced Message Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-lg text-sm max-w-[85%] sm:max-w-[75%] transform transition-all duration-200 hover:scale-[1.02] ${
                    msg.type === "sent"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md shadow-blue-200/50"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-gray-100/50 hover:shadow-gray-200/50"
                  }`}
                >
                  {/* Enhanced Sender name for received messages */}
                  {msg.type === "received" && (
                    <div className="text-xs font-semibold text-blue-600 mb-1.5">
                      {msg.sender}
                    </div>
                  )}
                  
                  {/* Enhanced Message content */}
                  <div className="break-words">
                    {!msg.imageUrl ? (
                      <p className="leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-3">
                    
                        <div className="relative group overflow-hidden rounded-xl">
                          <img
                            src={msg.imageUrl}
                            alt="sent image"
                            className="w-[200px] object-cover border border-gray-200 shadow-md transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Message time */}
                  <div className={`text-xs mt-2 font-medium ${
                    msg.type === "sent" ? "text-blue-100 text-right" : "text-gray-400"
                  }`}>
                    {msg.time}
                  </div>
                </div>
                
                
              </div>
            ))}
            
            {/* Enhanced Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Input */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-200/50 px-3 py-3 shadow-lg">
        <div className="flex items-end gap-3">
          {/* Enhanced Image upload button */}
          <button
            onClick={handleImageButtonClick}
            disabled={uploadingImage || !isConnected}
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
            title="Gửi hình ảnh"
          >
            <ImageIcon size="md" />
          </button>
          
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Enhanced Message input */}
          <div className="flex-1 relative">
            <input
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-sm pr-12 transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm"
              placeholder="Nhập tin nhắn..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              disabled={!isConnected}
              maxLength={1000}
            />
            
            {/* Enhanced Character counter */}
            {message.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-400">
                {message.length}/1000
              </div>
            )}
          </div>

          {/* Enhanced Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Enhanced Upload status */}
        {uploadingImage && (
          <div className="mt-3 flex items-center justify-center gap-3 text-sm text-blue-600 font-medium">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải hình ảnh...</span>
          </div>
        )}

        {/* Enhanced Connection status */}
        {!isConnected && (
          <div className="mt-3 text-center text-sm text-red-500 font-medium animate-pulse">
            Đang kết nối lại...
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDetailScreen;
