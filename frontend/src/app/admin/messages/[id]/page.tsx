"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  useSocket,
  NewMessageEvent,
  TypingEvent,
} from "@/context/SocketContext";
import { messagingApi, Conversation, Message } from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import MessageBubble from "@/components/chat/MessageBubble";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  ArrowLeft,
  Loader2,
  Heart,
  ShoppingBag,
  Stethoscope,
  Search,
  MessageCircle,
} from "lucide-react";

const contextIcons: Record<string, React.ReactNode> = {
  adoption: <Heart className="w-3.5 h-3.5 text-pink-500" />,
  marketplace: <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />,
  service: <Stethoscope className="w-3.5 h-3.5 text-purple-500" />,
  lost_found: <Search className="w-3.5 h-3.5 text-orange-500" />,
  direct: <MessageCircle className="w-3.5 h-3.5 text-teal-500" />,
};

const contextLabels: Record<string, string> = {
  adoption: "Adoption",
  marketplace: "Marketplace",
  service: "Service",
  lost_found: "Lost & Found",
  direct: "Direct Message",
};

export default function AdminChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const {
    sendMessage: socketSendMessage,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    onConversationRead,
    startTyping,
    stopTyping,
    markAsRead,
    isConnected,
  } = useSocket();
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const otherParticipant = conversation?.participants.find(
    (p) => p._id !== user?._id,
  );

  // Fetch conversation and initial messages
  useEffect(() => {
    if (!user || authLoading) return;

    const load = async () => {
      setIsLoading(true);

      const [convRes, msgRes] = await Promise.all([
        messagingApi.getConversation(conversationId),
        messagingApi.getMessages(conversationId),
      ]);

      if (convRes.data) {
        setConversation(convRes.data);
      }
      if (msgRes.data) {
        setMessages(msgRes.data.messages);
        setHasMore(msgRes.data.hasMore);
      }

      setIsLoading(false);
      isInitialLoad.current = true;
    };

    load();
  }, [conversationId, user, authLoading]);

  // Mark as read on mount
  useEffect(() => {
    if (conversation && user) {
      markAsRead(conversationId);
      messagingApi.markAsRead(conversationId);
    }
  }, [conversation, conversationId, user, markAsRead]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    const unsub = onNewMessage((data: NewMessageEvent) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
        markAsRead(conversationId);
        messagingApi.markAsRead(conversationId);
      }
    });
    return unsub;
  }, [conversationId, onNewMessage, markAsRead]);

  // Typing indicators
  useEffect(() => {
    const unsubStart = onTypingStart((data: TypingEvent) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setIsTyping(true);
      }
    });
    const unsubStop = onTypingStop((data: TypingEvent) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setIsTyping(false);
      }
    });

    return () => {
      unsubStart();
      unsubStop();
    };
  }, [conversationId, user, onTypingStart, onTypingStop]);

  // Read receipts
  useEffect(() => {
    const unsub = onConversationRead((data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            readBy: msg.readBy.includes(data.readBy)
              ? msg.readBy
              : [...msg.readBy, data.readBy],
          })),
        );
      }
    });
    return unsub;
  }, [conversationId, onConversationRead]);

  // Load older messages
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];

    const { data } = await messagingApi.getMessages(conversationId, {
      before: oldestMessage.createdAt,
    });

    if (data) {
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    }
    setIsLoadingMore(false);
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop < 50 && hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  // Send message
  const handleSend = async (text: string) => {
    if (!user) return;

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      text,
      readBy: [user._id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    if (isConnected) {
      const result = await socketSendMessage(conversationId, text);
      if (result.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === optimisticMessage._id ? result.message! : m,
          ),
        );
      }
    } else {
      const { data } = await messagingApi.sendMessage(conversationId, text);
      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMessage._id ? data.message : m)),
        );
      }
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[calc(100vh-180px)]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => router.push("/admin/messages")}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700 overflow-hidden shrink-0">
            {otherParticipant?.profileImage ? (
              <Image
                src={otherParticipant.profileImage}
                alt={otherParticipant.name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              otherParticipant?.name?.charAt(0).toUpperCase() || "?"
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {otherParticipant?.name || "Unknown User"}
            </h2>
            <div className="flex items-center gap-1">
              {conversation && contextIcons[conversation.context]}
              <span className="text-[11px] text-gray-400">
                {conversation && contextLabels[conversation.context]}
              </span>
              {isTyping && (
                <span className="text-[11px] text-teal-500 ml-1">
                  typing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          )}

          {hasMore && !isLoadingMore && (
            <button
              onClick={loadMore}
              className="w-full text-center py-2 text-xs text-teal-600 hover:text-teal-700"
            >
              Load older messages
            </button>
          )}

          {groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {group.label}
                </span>
              </div>
              {group.messages.map((message, idx) => {
                const showAvatar =
                  idx === 0 ||
                  group.messages[idx - 1].sender._id !== message.sender._id;
                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          ))}

          {isTyping && otherParticipant && (
            <TypingIndicator name={otherParticipant.name} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onTypingStart={() =>
            otherParticipant &&
            startTyping(conversationId, otherParticipant._id)
          }
          onTypingStop={() =>
            otherParticipant && stopTyping(conversationId, otherParticipant._id)
          }
        />
      </div>
    </AdminLayout>
  );
}

// Helpers ─────────────────────────────────────────────────────────────────────

interface MessageGroup {
  date: string;
  label: string;
  messages: Message[];
}

function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  for (const message of messages) {
    const date = new Date(message.createdAt);
    const dateKey = date.toDateString();

    if (!currentGroup || currentGroup.date !== dateKey) {
      currentGroup = {
        date: dateKey,
        label: getDateLabel(date),
        messages: [],
      };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(message);
  }

  return groups;
}

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
