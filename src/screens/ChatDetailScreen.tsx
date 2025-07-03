import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

interface Message {
  content: string;
  type: "sent" | "received" | "system";
  sender: string;
  time: string;
}

const ChatDetailScreen: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không lấy được tin nhắn");
        const data = await res.json();
        console.log("data", data.messages);
        const _messages = data.messages

        if (Array.isArray(_messages)) {
          setMessages(
            _messages.map((msg: any) => ({
              content: msg.content,
              type: msg.senderId == userId ? "sent" : "received",
              sender: msg.senderId == userId ? "You" : `User ${msg.senderId}`,
              time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
            }))
          );
        }
      } catch (err) {
        // Optionally handle error
      }
    };

    fetchMessages();
    // eslint-disable-next-line
  }, [chatId, token, userId, navigate]);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }
    const socket = io("http://localhost:4000", {
      auth: { token, userId },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_chat", { chatId, userId });
      socket.emit("get_chat_history", { chatId });
    });

    socket.on("receive_message", (msg: any) => {
      const content = msg.content;
      const sender = msg.senderId == userId ? "You" : `User ${msg.senderId}`;
      const type = msg.senderId == userId ? "sent" : "received";
      setMessages((prev) => [
        ...prev,
        {
          content,
          type,
          sender,
          time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
        },
      ]);
    });

    socket.on("chat_history", (data: any) => {
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((msg: any) => ({
            content: msg.content,
            type: msg.senderId == userId ? "sent" : "received",
            sender: msg.senderId == userId ? "You" : `User ${msg.senderId}`,
            time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
          }))
        );
      }
    });

    socket.on("user_typing", (data: any) => {
      if (data.userId != userId) setTypingUser(data.userId);
    });
    socket.on("user_stopped_typing", (data: any) => {
      if (data.userId != userId) setTypingUser(null);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [chatId, token, userId]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = () => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit("send_message", {
        chatId: Number(chatId),
        message: { content: message },
      });
      setMessage("");
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    } else {
      if (socketRef.current && chatId && userId) {
        socketRef.current.emit("typing", { chatId, userId });
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.emit("stop_typing", { chatId, userId });
          }
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chat Room {chatId}</h2>
          <button
            onClick={() => navigate("/chats")}
            className="text-sm text-blue-500 hover:underline"
          >
            Quay lại danh sách
          </button>
        </div>
        <div className="border rounded h-64 overflow-y-auto p-3 bg-gray-50 mb-2" style={{ position: "relative" }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 flex flex-col ${msg.type === "sent" ? "items-end" : "items-start"
                }`}
            >
              <div className="font-semibold text-blue-700 mr-2">{msg.sender}:</div>
              <div
                className={`inline-block px-3 py-1 rounded ${msg.type === "sent"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-200 text-gray-900"
                  }`}
              >
                {msg.content}
              </div>
              <div className="text-[10px] text-gray-400">{msg.time}</div>
            </div>
          ))}
          {/* This div is used as a scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
        <div
          style={{ display: typingUser ? "block" : "none" }}
          className="text-xs text-gray-500 mb-2"
        >
          {typingUser && `User ${typingUser} is typing...`}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            className="flex-1 px-3 py-2 border rounded"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={handleInputKeyDown}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailScreen; 