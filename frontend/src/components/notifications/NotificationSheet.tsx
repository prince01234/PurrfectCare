"use client";

import {
  Bell,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  FileCheck2,
  MessageCircle,
  Package,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppNotification } from "@/lib/api";

interface NotificationSheetProps {
  isOpen: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  onClose: () => void;
  onMarkAllAsRead: () => void | Promise<void>;
  onSelectNotification: (notification: AppNotification) => void | Promise<void>;
}

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const isNotificationRead = (notification: AppNotification) =>
  Boolean(notification.isRead || notification.readAt);

const getNotificationAccent = (type: string) => {
  switch (type) {
    case "message":
      return {
        icon: MessageCircle,
        label: "Message",
        chipClass: "bg-sky-100 text-sky-700",
        surfaceClass: "border-sky-200/70 bg-sky-50/70",
        dotClass: "bg-sky-500",
      };
    case "booking":
    case "reminder":
      return {
        icon: CalendarClock,
        label: "Reminder",
        chipClass: "bg-emerald-100 text-emerald-700",
        surfaceClass: "border-emerald-200/70 bg-emerald-50/70",
        dotClass: "bg-emerald-500",
      };
    case "order":
      return {
        icon: Package,
        label: "Order",
        chipClass: "bg-amber-100 text-amber-700",
        surfaceClass: "border-amber-200/70 bg-amber-50/70",
        dotClass: "bg-amber-500",
      };
    case "adoption":
    case "application":
      return {
        icon: FileCheck2,
        label: "Update",
        chipClass: "bg-violet-100 text-violet-700",
        surfaceClass: "border-violet-200/70 bg-violet-50/70",
        dotClass: "bg-violet-500",
      };
    default:
      return {
        icon: Bell,
        label: "Notice",
        chipClass: "bg-slate-100 text-slate-700",
        surfaceClass: "border-slate-200 bg-white",
        dotClass: "bg-slate-500",
      };
  }
};

export default function NotificationSheet({
  isOpen,
  notifications,
  unreadCount,
  isLoading,
  onClose,
  onMarkAllAsRead,
  onSelectNotification,
}: NotificationSheetProps) {
  const hasUnread = unreadCount > 0;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-70 bg-slate-950/32 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-80 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:inset-x-auto sm:right-4 sm:top-[max(0.85rem,calc(env(safe-area-inset-top)+0.4rem))] sm:px-0 sm:pb-0"
          >
            <div className="mx-auto flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_26px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:mx-0 sm:max-h-[74vh] sm:w-102 sm:rounded-[28px]">
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1.5 w-14 rounded-full bg-slate-200/90" />
              </div>

              <div className="border-b border-slate-200/80 bg-[linear-gradient(125deg,rgba(20,184,166,0.14),rgba(255,255,255,0.96)_55%,rgba(59,130,246,0.08))] px-5 pb-4 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm">
                        <Bell className="h-4 w-4" />
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        Notifications
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {hasUnread
                        ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                        : "Everything is caught up"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-white/95 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-slate-600 shadow-sm">
                    {hasUnread ? "Needs attention" : "All read"}
                  </span>

                  <button
                    type="button"
                    onClick={() => void onMarkAllAsRead()}
                    disabled={!hasUnread}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-3 pb-3 pt-3">
                {isLoading ? (
                  <div className="space-y-3 py-1">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-200 bg-white p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                            <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
                            <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="rounded-3xl bg-teal-100 p-4 text-teal-700">
                      <Bell className="h-7 w-7" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-900">
                      No notifications yet
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Messages, booking changes, and account updates will appear
                      here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((notification) => {
                      const accent = getNotificationAccent(notification.type);
                      const Icon = accent.icon;
                      const isRead = isNotificationRead(notification);

                      return (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() =>
                            void onSelectNotification(notification)
                          }
                          className={`group w-full rounded-2xl border px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                            isRead
                              ? "border-slate-200 bg-white"
                              : `${accent.surfaceClass} shadow-[0_10px_26px_rgba(15,23,42,0.08)]`
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 rounded-xl p-2.5 ${isRead ? "bg-slate-100 text-slate-500" : accent.chipClass}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isRead ? "bg-slate-100 text-slate-500" : accent.chipClass}`}
                                    >
                                      {accent.label}
                                    </span>
                                    {!isRead ? (
                                      <span
                                        className={`h-2 w-2 rounded-full ${accent.dotClass}`}
                                      />
                                    ) : null}
                                  </div>
                                  <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {notification.title}
                                  </p>
                                </div>

                                <span className="shrink-0 text-[11px] font-medium text-slate-400">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                                {notification.body}
                              </p>
                            </div>

                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200/80 bg-white px-4 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
