"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { messagingApi, Conversation, ConversationContext } from "@/lib/api";
import AdminLayout from "@/components/layout/AdminLayout";
import ConversationItem from "@/components/chat/ConversationItem";
import { MessageCircle, Search, Loader2 } from "lucide-react";

const contextFilters: { label: string; value: ConversationContext | "all" }[] =
  [
    { label: "All", value: "all" },
    { label: "Adoption", value: "adoption" },
    { label: "Marketplace", value: "marketplace" },
    { label: "Services", value: "service" },
    { label: "Lost & Found", value: "lost_found" },
    { label: "Direct", value: "direct" },
  ];

export default function AdminMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { onNewMessage } = useSocket();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ConversationContext | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { context?: ConversationContext } = {};
      if (activeFilter !== "all") {
        params.context = activeFilter;
      }

      const { data } = await messagingApi.getConversations(params);
      if (data) {
        setConversations(data.conversations);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Refresh on new messages
  useEffect(() => {
    const unsub = onNewMessage(() => {
      fetchConversations();
    });
    return unsub;
  }, [onNewMessage, fetchConversations]);

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
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 border border-gray-200 focus:border-teal-300 transition-all"
          />
        </div>

        {/* Context Filters */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {contextFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.value
                  ? "bg-teal-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        {isLoading ? (
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
              Conversations with users will appear here when they reach out
              about your listings, products, or services.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                onClick={() =>
                  router.push(`/admin/messages/${conversation._id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
