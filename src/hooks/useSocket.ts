import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return socketRef;
}
