"use client";

import { useAuth } from "@/context/AuthContext";
import { ConversationContext } from "@/lib/api/messaging";
import { useRouter } from "next/navigation";
import { messagingApi } from "@/lib/api";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

interface StartChatButtonProps {
  recipientId: string;
  context: ConversationContext;
  contextRef?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "icon";
}

export default function StartChatButton({
  recipientId,
  context,
  contextRef,
  label = "Message",
  className = "",
  variant = "primary",
}: StartChatButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || user._id === recipientId) return null;

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await messagingApi.getOrCreateConversation({
        recipientId,
        context,
        contextRef,
      });

      if (error) {
        toast.error(error);
        return;
      }

      if (data?.conversation) {
        router.push(`/messages/${data.conversation._id}`);
      }
    } catch {
      toast.error("Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    primary:
      "bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center gap-2",
    secondary:
      "bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center gap-2",
    icon: "p-2 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-[0.95] transition-all",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${variants[variant]} disabled:opacity-50 ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      {variant !== "icon" && <span>{isLoading ? "Opening..." : label}</span>}
    </button>
  );
}
