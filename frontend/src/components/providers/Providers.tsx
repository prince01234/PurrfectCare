"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationCenterProvider } from "@/context/NotificationCenterContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationCenterProvider>
          <CartProvider>{children}</CartProvider>
        </NotificationCenterProvider>
      </SocketProvider>
    </AuthProvider>
  );
}
