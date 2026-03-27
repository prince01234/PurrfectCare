"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationCenterProvider } from "@/context/NotificationCenterContext";
import { useFCM } from "@/lib/hooks/useFCM";

function FCMInitializer({ children }: { children: ReactNode }) {
  useFCM();
  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      <AuthProvider>
        <SocketProvider>
          <NotificationCenterProvider>
            <CartProvider>
              <FCMInitializer>{children}</FCMInitializer>
            </CartProvider>
          </NotificationCenterProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}
