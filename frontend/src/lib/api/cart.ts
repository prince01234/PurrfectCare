import { apiRequest } from "./client";

// Types
export interface CartItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  nameSnapshot: string;
  imageSnapshot: string | null;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartActionResponse {
  message: string;
  cart: Cart;
}

export const cartApi = {
  getCart: () => apiRequest<Cart>("/api/cart", { method: "GET" }, true),

  addItem: (productId: string, quantity: number = 1) =>
    apiRequest<CartActionResponse>(
      "/api/cart/items",
      {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      },
      true,
    ),

  updateItemQuantity: (productId: string, quantity: number) =>
    apiRequest<CartActionResponse>(
      `/api/cart/items/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      },
      true,
    ),

  removeItem: (productId: string) =>
    apiRequest<CartActionResponse>(
      `/api/cart/items/${productId}`,
      { method: "DELETE" },
      true,
    ),

  clearCart: () =>
    apiRequest<CartActionResponse>(
      "/api/cart/clear",
      { method: "DELETE" },
      true,
    ),
};
