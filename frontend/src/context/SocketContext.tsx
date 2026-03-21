"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_URL } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  sendMessage: (
    conversationId: string,
    text: string,
  ) => Promise<{ success?: boolean; message?: Message; error?: string }>;
  startTyping: (conversationId: string, recipientId: string) => void;
  stopTyping: (conversationId: string, recipientId: string) => void;
  markAsRead: (conversationId: string) => void;
  onNewMessage: (callback: (data: NewMessageEvent) => void) => () => void;
  onTypingStart: (callback: (data: TypingEvent) => void) => () => void;
  onTypingStop: (callback: (data: TypingEvent) => void) => () => void;
  onConversationRead: (
    callback: (data: ConversationReadEvent) => void,
  ) => () => void;
  onNotification: (callback: (data: NotificationEvent) => void) => () => void;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  text: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewMessageEvent {
  message: Message;
  conversationId: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
}

export interface ConversationReadEvent {
  conversationId: string;
  readBy: string;
}

export interface NotificationEvent {
  notification: AppNotification;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers] = useState<Set<string>>(new Set());

  // Store event listeners
  const newMessageListeners = useRef<Set<(data: NewMessageEvent) => void>>(
    new Set(),
  );
  const typingStartListeners = useRef<Set<(data: TypingEvent) => void>>(
    new Set(),
  );
  const typingStopListeners = useRef<Set<(data: TypingEvent) => void>>(
    new Set(),
  );
  const conversationReadListeners = useRef<
    Set<(data: ConversationReadEvent) => void>
  >(new Set());
  const notificationListeners = useRef<Set<(data: NotificationEvent) => void>>(
    new Set(),
  );

  useEffect(() => {
    if (!token || !user) {
      // Disconnect if user logs out - state will be updated by disconnect event
      if (socketRef.current) {
        const currentSocket = socketRef.current;
        socketRef.current = null;
        currentSocket.disconnect();
      }
      return;
    }

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setSocket(socket);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for incoming messages
    socket.on("message:new", (data: NewMessageEvent) => {
      newMessageListeners.current.forEach((cb) => cb(data));
    });

    // Listen for typing indicators
    socket.on("typing:start", (data: TypingEvent) => {
      typingStartListeners.current.forEach((cb) => cb(data));
    });

    socket.on("typing:stop", (data: TypingEvent) => {
      typingStopListeners.current.forEach((cb) => cb(data));
    });

    // Listen for read receipts
    socket.on("conversation:read", (data: ConversationReadEvent) => {
      conversationReadListeners.current.forEach((cb) => cb(data));
    });

    socket.on(
      "notification:new",
      (data: NotificationEvent | AppNotification) => {
        const normalizedData =
          data && typeof data === "object" && "notification" in data
            ? (data as NotificationEvent)
            : ({ notification: data as AppNotification } as NotificationEvent);

        notificationListeners.current.forEach((cb) => cb(normalizedData));
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, user]);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    return new Promise<{
      success?: boolean;
      message?: Message;
      error?: string;
    }>((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ error: "Not connected to server" });
        return;
      }

      socketRef.current.emit(
        "message:send",
        { conversationId, text },
        (
          response: { success: boolean; message: Message } | { error: string },
        ) => {
          resolve(response);
        },
      );
    });
  }, []);

  const startTyping = useCallback(
    (conversationId: string, recipientId: string) => {
      socketRef.current?.emit("typing:start", { conversationId, recipientId });
    },
    [],
  );

  const stopTyping = useCallback(
    (conversationId: string, recipientId: string) => {
      socketRef.current?.emit("typing:stop", { conversationId, recipientId });
    },
    [],
  );

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:read", { conversationId });
  }, []);

  // Subscribe to new messages
  const onNewMessage = useCallback(
    (callback: (data: NewMessageEvent) => void) => {
      newMessageListeners.current.add(callback);
      return () => {
        newMessageListeners.current.delete(callback);
      };
    },
    [],
  );

  const onTypingStart = useCallback((callback: (data: TypingEvent) => void) => {
    typingStartListeners.current.add(callback);
    return () => {
      typingStartListeners.current.delete(callback);
    };
  }, []);

  const onTypingStop = useCallback((callback: (data: TypingEvent) => void) => {
    typingStopListeners.current.add(callback);
    return () => {
      typingStopListeners.current.delete(callback);
    };
  }, []);

  const onConversationRead = useCallback(
    (callback: (data: ConversationReadEvent) => void) => {
      conversationReadListeners.current.add(callback);
      return () => {
        conversationReadListeners.current.delete(callback);
      };
    },
    [],
  );

  const onNotification = useCallback(
    (callback: (data: NotificationEvent) => void) => {
      notificationListeners.current.add(callback);
      return () => {
        notificationListeners.current.delete(callback);
      };
    },
    [],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onTypingStart,
        onTypingStop,
        onConversationRead,
        onNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
