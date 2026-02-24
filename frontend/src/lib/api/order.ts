import { apiRequest } from "./client";

// Types
export interface OrderItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  nameSnapshot: string;
  imageSnapshot: string | null;
}

export interface PaymentRecord {
  _id: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed";
  transactionId?: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  deliveryAddress: string | null;
  notes: string | null;
  paymentMethod: "khalti" | "cod";
  payment: PaymentRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KhaltiPaymentResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
}

export interface CreateOrderData {
  paymentMethod: "khalti" | "cod";
  deliveryAddress?: string;
  notes?: string;
}

export const orderApi = {
  createOrder: (data: CreateOrderData) =>
    apiRequest<Order>(
      "/api/orders",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    ),

  getOrders: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    const qs = query.toString();
    return apiRequest<OrdersResponse>(
      `/api/orders${qs ? `?${qs}` : ""}`,
      { method: "GET" },
      true,
    );
  },

  getOrderById: (id: string) =>
    apiRequest<Order>(`/api/orders/${id}`, { method: "GET" }, true),

  cancelOrder: (id: string) =>
    apiRequest<{ message: string; order: Order }>(
      `/api/orders/${id}/cancel`,
      { method: "PUT" },
      true,
    ),

  initiateKhaltiPayment: (orderId: string) =>
    apiRequest<KhaltiPaymentResponse>(
      `/api/orders/${orderId}/payment/khalti`,
      { method: "POST" },
      true,
    ),

  confirmPayment: (orderId: string, status: string) =>
    apiRequest<Order>(
      `/api/orders/${orderId}/confirm-payment`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
      true,
    ),
};
