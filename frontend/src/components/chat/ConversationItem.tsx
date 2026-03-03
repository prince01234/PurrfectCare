"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Conversation, ConversationContext } from "@/lib/api/messaging";
import {
  Heart,
  ShoppingBag,
  Stethoscope,
  Search,
  MessageCircle,
} from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

const contextIcons: Record<ConversationContext, React.ReactNode> = {
  adoption: <Heart className="w-4 h-4 text-pink-500" />,
  marketplace: <ShoppingBag className="w-4 h-4 text-blue-500" />,
  service: <Stethoscope className="w-4 h-4 text-purple-500" />,
  lost_found: <Search className="w-4 h-4 text-orange-500" />,
  direct: <MessageCircle className="w-4 h-4 text-teal-500" />,
};

const contextLabels: Record<ConversationContext, string> = {
  adoption: "Adoption",
  marketplace: "Marketplace",
  service: "Service",
  lost_found: "Lost & Found",
  direct: "Direct",
};

export default function ConversationItem({
  conversation,
  onClick,
}: ConversationItemProps) {
  const { user } = useAuth();

  // Get the other participant
  const otherParticipant = conversation.participants.find(
    (p) => p._id !== user?._id,
  );

  const isUnread =
    conversation.lastMessage?.timestamp &&
    !conversation.readBy.includes(user?._id || "");

  const lastMessageText = conversation.lastMessage?.text;
  const lastMessageTime = conversation.lastMessage?.timestamp
    ? formatRelativeTime(conversation.lastMessage.timestamp)
    : "";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-base font-semibold text-teal-700 overflow-hidden">
          {otherParticipant?.profileImage ? (
            <Image
              src={otherParticipant.profileImage}
              alt={otherParticipant.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            otherParticipant?.name?.charAt(0).toUpperCase() || "?"
          )}
        </div>
        {/* Context badge */}
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
          {contextIcons[conversation.context]}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-medium text-gray-800"}`}
          >
            {otherParticipant?.name || "Unknown User"}
          </h3>
          <span
            className={`text-xs shrink-0 ${isUnread ? "text-teal-600 font-semibold" : "text-gray-400"}`}
          >
            {lastMessageTime}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-xs truncate ${isUnread ? "text-gray-700 font-medium" : "text-gray-500"}`}
          >
            {lastMessageText || "No messages yet"}
          </p>
          {isUnread && (
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
          )}
        </div>
        <span className="text-[10px] text-gray-400">
          {contextLabels[conversation.context]}
        </span>
      </div>
    </button>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
