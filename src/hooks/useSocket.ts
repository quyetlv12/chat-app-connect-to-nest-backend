import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface OnlineUser {
  userId: number;
  username: string;
  status: 'online' | 'offline' | 'typing';
}

interface TypingUser {
  userId: number;
  username: string;
  chatId: number;
}

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  chatId: number;
  createdAt: string;
  updatedAt: string;
}

export function useSocket(token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const connect = useCallback(() => {
    if (!token) return;
    
    const socket = io("https://vietsocial-be-production.up.railway.app", {
      auth: { token },
      transports: ["websocket"],
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket server");
    });

    // Online/Offline events
    socket.on("user_online", (data: { userId: number }) => {
      setOnlineUsers(prev => {
        const existing = prev.find(user => user.userId === data.userId);
        if (existing) {
          return prev.map(user => 
            user.userId === data.userId 
              ? { ...user, status: 'online' as const }
              : user
          );
        }
        return [...prev, { userId: data.userId, username: `User ${data.userId}`, status: 'online' as const }];
      });
    });

    socket.on("user_offline", (data: { userId: number }) => {
      setOnlineUsers(prev => 
        prev.map(user => 
          user.userId === data.userId 
            ? { ...user, status: 'offline' as const }
            : user
        )
      );
    });

    // Typing events
    socket.on("user_typing", (data: { chatId: number; userId: number; username: string }) => {
      setTypingUsers(prev => {
        const existing = prev.find(typing => 
          typing.userId === data.userId && typing.chatId === data.chatId
        );
        if (existing) return prev;
        return [...prev, { 
          userId: data.userId, 
          username: data.username, 
          chatId: data.chatId 
        }];
      });
    });

    socket.on("user_stop_typing", (data: { chatId: number; userId: number }) => {
      setTypingUsers(prev => 
        prev.filter(typing => 
          !(typing.userId === data.userId && typing.chatId === data.chatId)
        )
      );
    });

    // Message events
    socket.on("receive_message", (message: ChatMessage) => {
      console.log("Received message in hook:", message);
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.find(msg => msg.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socket.on("chat_history", (data: { chatId: number; messages: ChatMessage[] }) => {
      console.log("Received chat history in hook:", data);
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    });

    // Chat online users
    socket.on("chat_online_users", (data: { chatId: number; onlineUsers: number[] }) => {
      console.log(`Online users in chat ${data.chatId}:`, data.onlineUsers);
    });

    socket.on("online_users_response", (data: { chatId: number; onlineUsers: number[] }) => {
      console.log(`Online users response for chat ${data.chatId}:`, data.onlineUsers);
    });

    return socket;
  }, [token]);

  useEffect(() => {
    const socket = connect();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [connect]);

  const joinChat = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("join_chat", { chatId });
    }
  }, [isConnected]);

  const leaveChat = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("leave_chat", { chatId });
    }
  }, [isConnected]);

  const startTyping = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("start_typing", { chatId });
    }
  }, [isConnected]);

  const stopTyping = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("stop_typing", { chatId });
    }
  }, [isConnected]);

  const sendMessage = useCallback((chatId: number, message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("send_message", { chatId, message });
    }
  }, [isConnected]);

  const getOnlineUsers = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("get_online_users", { chatId });
    }
  }, [isConnected]);

  const getChatHistory = useCallback((chatId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("get_chat_history", { chatId });
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    typingUsers,
    messages,
    joinChat,
    leaveChat,
    startTyping,
    stopTyping,
    sendMessage,
    getOnlineUsers,
    getChatHistory,
  };
}
