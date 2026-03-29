"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  CalendarClock,
  FileCheck2,
  MessageCircle,
  Package,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { AppNotification, notificationApi, NotificationType } from "@/lib/api";
import NotificationSheet from "@/components/notifications/NotificationSheet";

interface NotificationCenterContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationCenterContext = createContext<
  NotificationCenterContextType | undefined
>(undefined);

const getNotificationHref = (
  notification: AppNotification,
  roles?: string,
  serviceType?: string,
) => {
  switch (notification.type) {
    case "message": {
      const conversationId =
        (notification.data?.conversationId as string | undefined) ||
        notification.entityId;
      if (!conversationId) return "/messages";
      return roles === "ADMIN" || roles === "SUPER_ADMIN"
        ? `/admin/messages/${conversationId}`
        : `/messages/${conversationId}`;
    }
    case "booking":
      return roles === "ADMIN" ? "/admin/bookings" : "/bookings";
    case "order":
      if (roles === "ADMIN" && serviceType === "marketplace") {
        return "/admin/orders";
      }
      return "/marketplace/orders";
    case "adoption":
      return roles === "ADMIN"
        ? "/admin/adoption-requests"
        : "/adoption-requests";
    case "application":
      return roles === "SUPER_ADMIN"
        ? "/admin/applications"
        : "/provider/apply";
    case "reminder":
      return "/reminders";
    default:
      return "/dashboard";
  }
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "message":
      return MessageCircle;
    case "booking":
    case "reminder":
      return CalendarClock;
    case "order":
      return Package;
    case "adoption":
    case "application":
      return FileCheck2;
    default:
      return Bell;
  }
};

export function NotificationCenterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const { onNotification } = useSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    const response = await notificationApi.getNotifications({ limit: 25 });
    if (response.data) {
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    }
    setIsLoading(false);
  }, [token, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshNotifications();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!token || !user) {
      return () => undefined;
    }

    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshNotifications, token, user]);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const openSheet = useCallback(() => {
    setIsSheetOpen(true);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const response = await notificationApi.markAsRead(id);
    if (!response.data) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === id
          ? { ...notification, isRead: true, readAt: response.data?.readAt }
          : notification,
      ),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await notificationApi.markAllAsRead();
    if (response.error) return;

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const unsubscribe = onNotification(({ notification }) => {
      setNotifications((prev) => {
        if (prev.some((item) => item._id === notification._id)) {
          return prev;
        }
        return [notification, ...prev].slice(0, 25);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      const conversationId =
        (notification.data?.conversationId as string | undefined) ||
        notification.entityId;
      const isActiveConversation =
        notification.type === "message" &&
        Boolean(conversationId) &&
        pathname?.endsWith(`/${conversationId}`);

      if (isActiveConversation) {
        return;
      }

      const Icon = getNotificationIcon(notification.type);
      toast.custom(
        (t) => (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              setIsSheetOpen(true);
            }}
            className="w-full max-w-sm rounded-2xl border border-white/70 bg-white px-4 py-3 text-left shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-teal-50 p-2 text-teal-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {notification.body}
                </p>
              </div>
            </div>
          </button>
        ),
        {
          id: notification._id,
          duration: 4500,
        },
      );
    });

    return unsubscribe;
  }, [onNotification, pathname]);

  const handleNotificationSelect = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      closeSheet();
      router.push(
        getNotificationHref(notification, user?.roles, user?.serviceType),
      );
    },
    [closeSheet, markAsRead, router, user?.roles, user?.serviceType],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isSheetOpen,
      openSheet,
      closeSheet,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      closeSheet,
      isLoading,
      isSheetOpen,
      markAllAsRead,
      markAsRead,
      notifications,
      openSheet,
      refreshNotifications,
      unreadCount,
    ],
  );

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
      <NotificationSheet
        isOpen={isSheetOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onClose={closeSheet}
        onMarkAllAsRead={markAllAsRead}
        onSelectNotification={handleNotificationSelect}
      />
    </NotificationCenterContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationCenterProvider",
    );
  }

  return context;
}
