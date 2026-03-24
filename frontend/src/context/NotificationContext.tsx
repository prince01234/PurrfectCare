"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  CalendarClock,
  Heart,
  MessageCircle,
  Package,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import {
  notificationApi,
  type AppNotification,
  type NotificationListResponse,
} from "@/lib/api/notification";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const getNotificationAccent = (type: string) => {
  if (type.startsWith("message.")) {
    return {
      icon: MessageCircle,
      iconClassName: "text-sky-600",
      chipClassName: "bg-sky-100",
      buttonClassName: "bg-sky-600 text-white",
    };
  }

  if (type.startsWith("booking.")) {
    return {
      icon: CalendarClock,
      iconClassName: "text-emerald-600",
      chipClassName: "bg-emerald-100",
      buttonClassName: "bg-emerald-600 text-white",
    };
  }

  if (type.startsWith("order.")) {
    return {
      icon: Package,
      iconClassName: "text-amber-600",
      chipClassName: "bg-amber-100",
      buttonClassName: "bg-amber-600 text-white",
    };
  }

  if (type.startsWith("adoption.")) {
    return {
      icon: Heart,
      iconClassName: "text-rose-600",
      chipClassName: "bg-rose-100",
      buttonClassName: "bg-rose-600 text-white",
    };
  }

  if (type.startsWith("admin_application.")) {
    return {
      icon: ShieldCheck,
      iconClassName: "text-violet-600",
      chipClassName: "bg-violet-100",
      buttonClassName: "bg-violet-600 text-white",
    };
  }

  return {
    icon: Bell,
    iconClassName: "text-teal-600",
    chipClassName: "bg-teal-100",
    buttonClassName: "bg-teal-600 text-white",
  };
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, "day");
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { onNotification } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!user?._id) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data } = await notificationApi.getNotifications({ limit: 25 });

    if (data) {
      const response = data as NotificationListResponse;
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    }

    setIsLoading(false);
  }, [user?._id]);

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find(
        (notification) => notification._id === id,
      );

      if (!target || target.readAt) {
        return;
      }

      const now = new Date().toISOString();

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, readAt: now }
            : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));

      await notificationApi.markAsRead(id);
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    if (!notifications.some((notification) => !notification.readAt)) {
      return;
    }

    const now = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, readAt: now })),
    );
    setUnreadCount(0);

    await notificationApi.markAllAsRead();
  }, [notifications]);

  const openNotification = useCallback(
    async (notification: AppNotification) => {
      if (!notification.readAt) {
        await markAsRead(notification._id);
      }

      if (notification.link) {
        router.push(notification.link);
      }
    },
    [markAsRead, router],
  );

  const showNotificationToast = useCallback(
    (notification: AppNotification) => {
      const accent = getNotificationAccent(notification.type);
      const Icon = accent.icon;

      toast.custom(
        (toastState) => (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(toastState.id);
              void openNotification(notification);
            }}
            className={`pointer-events-auto w-full max-w-sm rounded-3xl border border-white/70 bg-white/95 p-4 text-left shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur transition ${
              toastState.visible
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent.chipClassName}`}
              >
                <Icon className={`h-5 w-5 ${accent.iconClassName}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {notification.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {notification.body}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    Tap to open
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${accent.buttonClassName}`}
                  >
                    View
                  </span>
                </div>
              </div>
            </div>
          </button>
        ),
        {
          duration: 5000,
        },
      );
    },
    [openNotification],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadNotifications = async () => {
      if (!user?._id) {
        if (!isCancelled) {
          setNotifications([]);
          setUnreadCount(0);
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setIsLoading(true);
      }

      const { data } = await notificationApi.getNotifications({ limit: 25 });

      if (!isCancelled && data) {
        const response = data as NotificationListResponse;
        setNotifications(response.notifications);
        setUnreadCount(response.unreadCount);
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    void loadNotifications();

    return () => {
      isCancelled = true;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) {
      return () => undefined;
    }

    const unsubscribe = onNotification(
      ({ notification: incomingNotification }) => {
        const shouldAutoRead =
          Boolean(incomingNotification.link) &&
          pathname === incomingNotification.link;

        const notification = shouldAutoRead
          ? { ...incomingNotification, readAt: new Date().toISOString() }
          : incomingNotification;

        setNotifications((prev) => {
          const next = [
            notification,
            ...prev.filter((item) => item._id !== incomingNotification._id),
          ];

          return next.slice(0, 40);
        });

        if (shouldAutoRead) {
          void notificationApi.markAsRead(incomingNotification._id);
          return;
        }

        setUnreadCount((prev) => prev + 1);

        if (incomingNotification.actorId !== user._id) {
          showNotificationToast(incomingNotification);
        }
      },
    );

    return unsubscribe;
  }, [onNotification, pathname, showNotificationToast, user?._id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }

  return context;
}
