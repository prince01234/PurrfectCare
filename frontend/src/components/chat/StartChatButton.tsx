"use client";

import { useAuth } from "@/context/AuthContext";
import { ConversationContext } from "@/lib/api/messaging";
import { useRouter } from "next/navigation";
import { messagingApi } from "@/lib/api";
import { MessageCircle, Loader2 } from "lucide-react";
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
    icon: "rounded-xl flex items-center justify-center active:scale-[0.95] transition-all",
  };

  // Icon sizes based on variant
  const iconSize = variant === "icon" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${variants[variant]} disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <MessageCircle className={iconSize} />
      )}
      {variant !== "icon" && <span>{isLoading ? "Opening..." : label}</span>}
    </button>
  );
}
