"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { messagingApi, Conversation, ConversationContext } from "@/lib/api";
import MobileLayout from "@/components/layout/MobileLayout";
import ConversationItem from "@/components/chat/ConversationItem";
import { MessageCircle, ArrowLeft, Search, Loader2 } from "lucide-react";

const contextFilters: { label: string; value: ConversationContext | "all" }[] =
  [
    { label: "All", value: "all" },
    { label: "Adoption", value: "adoption" },
    { label: "Marketplace", value: "marketplace" },
    { label: "Services", value: "service" },
    { label: "Lost & Found", value: "lost_found" },
    { label: "Direct", value: "direct" },
  ];

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { onNewMessage } = useSocket();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ConversationContext | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    const params: { context?: ConversationContext } = {};
    if (activeFilter !== "all") {
      params.context = activeFilter;
    }

    const { data } = await messagingApi.getConversations(params);
    if (data) {
      setConversations(data.conversations);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (user) {
      (async () => {
        setIsLoading(true);
        await fetchConversations();
        setIsLoading(false);
      })();
    } else if (!authLoading) {
      setConversations([]);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchConversations, router]);

  // Listen for new messages to refresh conversation list
  useEffect(() => {
    const unsub = onNewMessage(() => {
      fetchConversations();
    });
    return unsub;
  }, [onNewMessage, fetchConversations]);

  useEffect(() => {
    if (!user) {
      return () => undefined;
    }

    const interval = window.setInterval(() => {
      void fetchConversations();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchConversations, user]);

  // Filter by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const otherParticipant = conv.participants.find((p) => p._id !== user?._id);
    return otherParticipant?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex items-center justify-between px-4 pt-12 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white border border-transparent focus:border-teal-300 transition-all"
              />
            </div>
          </div>

          {/* Context Filters */}
          <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {contextFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.value
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Sign in to view messages
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mb-5">
                Browse the app as guest, then sign in when you are ready to chat
                with providers and sellers.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-2.5 rounded-full bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                No conversations yet
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Start a conversation by messaging a seller, adoption provider,
                or service provider.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  onClick={() => router.push(`/messages/${conversation._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
