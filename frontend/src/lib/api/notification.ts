import { apiRequest, ApiResponse } from "./client";

export type NotificationType =
  | "message"
  | "booking"
  | "order"
  | "adoption"
  | "reminder"
  | "application"
  | "system";

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string | null;
  entityType?: string | null;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationApi = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }): Promise<ApiResponse<NotificationListResponse>> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly) query.set("unreadOnly", "true");
    if (params?.type) query.set("type", params.type);

    const qs = query.toString();
    return apiRequest<NotificationListResponse>(
      `/api/notifications${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  getUnreadCount: (): Promise<ApiResponse<{ unreadCount: number }>> =>
    apiRequest<{ unreadCount: number }>(
      "/api/notifications/unread-count",
      {},
      true,
    ),

  markAsRead: (id: string): Promise<ApiResponse<AppNotification>> =>
    apiRequest<AppNotification>(
      `/api/notifications/${id}/read`,
      { method: "PUT" },
      true,
    ),

  markAllAsRead: (): Promise<ApiResponse<{ message: string }>> =>
    apiRequest<{ message: string }>(
      "/api/notifications/read-all",
      { method: "PUT" },
      true,
    ),

  registerFCMToken: (token: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest<{ message: string }>(
      "/api/notifications/fcm-token",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      },
      true,
    ),

  removeFCMToken: (token: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest<{ message: string }>(
      "/api/notifications/fcm-token",
      {
        method: "DELETE",
        body: JSON.stringify({ token }),
      },
      true,
    ),
};
