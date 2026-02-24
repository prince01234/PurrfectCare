"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { cartApi } from "@/lib/api";
import type { Cart, CartItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await cartApi.getCart();
      if (res.data) setCart(res.data);
    } catch {
      // silent — cart may not exist yet
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const items = cart?.items ?? [];
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.priceSnapshot * i.quantity,
    0,
  );

  const addItem = async (
    productId: string,
    quantity: number = 1,
  ): Promise<boolean> => {
    const res = await cartApi.addItem(productId, quantity);
    if (res.data) {
      setCart(res.data.cart);
      return true;
    }
    return false;
  };

  const updateQuantity = async (
    productId: string,
    quantity: number,
  ): Promise<boolean> => {
    const res = await cartApi.updateItemQuantity(productId, quantity);
    if (res.data) {
      setCart(res.data.cart);
      return true;
    }
    return false;
  };

  const removeItem = async (productId: string): Promise<boolean> => {
    const res = await cartApi.removeItem(productId);
    if (res.data) {
      setCart(res.data.cart);
      return true;
    }
    return false;
  };

  const clearCart = async (): Promise<boolean> => {
    const res = await cartApi.clearCart();
    if (res.data) {
      setCart(res.data.cart);
      return true;
    }
    return false;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        totalPrice,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
