import { apiRequest } from "./client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConversationContext =
  | "adoption"
  | "marketplace"
  | "service"
  | "lost_found"
  | "direct";

export interface ConversationParticipant {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  roles?: string;
  serviceType?: string;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  context: ConversationContext;
  contextRef?: string;
  lastMessage: {
    text: string | null;
    sender: { _id: string; name: string } | string | null;
    timestamp: string | null;
  };
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  text: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface GetOrCreateConversationResponse {
  conversation: Conversation;
  isNew: boolean;
}

export interface SendMessageResponse {
  message: Message;
  conversation: Conversation;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const messagingApi = {
  /** Get or create a conversation */
  getOrCreateConversation: (data: {
    recipientId: string;
    context: ConversationContext;
    contextRef?: string;
  }) =>
    apiRequest<GetOrCreateConversationResponse>(
      "/api/conversations",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),

  /** Get all conversations for the current user */
  getConversations: (params?: {
    context?: ConversationContext;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.context) query.set("context", params.context);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest<ConversationsResponse>(
      `/api/conversations${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  /** Get a single conversation */
  getConversation: (id: string) =>
    apiRequest<Conversation>(`/api/conversations/${id}`, {}, true),

  /** Get messages for a conversation */
  getMessages: (
    conversationId: string,
    params?: { before?: string; limit?: number },
  ) => {
    const query = new URLSearchParams();
    if (params?.before) query.set("before", params.before);
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest<MessagesResponse>(
      `/api/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  /** Send a message (REST fallback) */
  sendMessage: (conversationId: string, text: string) =>
    apiRequest<SendMessageResponse>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
      true,
    ),

  /** Mark conversation as read */
  markAsRead: (conversationId: string) =>
    apiRequest<{ message: string }>(
      `/api/conversations/${conversationId}/read`,
      { method: "PUT" },
      true,
    ),

  /** Get unread conversation count */
  getUnreadCount: () =>
    apiRequest<{ unreadCount: number }>(
      "/api/conversations/unread-count",
      {},
      true,
    ),
};
