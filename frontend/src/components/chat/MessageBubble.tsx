"use client";

import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/lib/api/messaging";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
}

export default function MessageBubble({
  message,
  showAvatar = true,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isMine = user?._id === message.sender._id;

  const time = formatMessageTime(message.createdAt);

  return (
    <div
      className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} mb-1`}
    >
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <div className="relative w-7 h-7 rounded-full bg-teal-100 shrink-0 flex items-center justify-center text-xs font-semibold text-teal-700 mt-auto">
          {message.sender.profileImage ? (
            <Image
              src={message.sender.profileImage}
              alt={message.sender.name}
              fill
              className="rounded-full object-cover"
              sizes="28px"
            />
          ) : (
            message.sender.name?.charAt(0).toUpperCase()
          )}
        </div>
      ) : !isMine ? (
        <div className="w-7 shrink-0" />
      ) : null}

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
          isMine
            ? "bg-teal-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap wrap-break-word">
          {message.text}
        </p>
        <p
          className={`text-[10px] mt-0.5 ${
            isMine ? "text-teal-100" : "text-gray-400"
          } text-right`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${period}`;
}
