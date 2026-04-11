"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SocketProvider } from "@/context/SocketContext";
import { NotificationCenterProvider } from "@/context/NotificationCenterContext";
import { useFCM } from "@/lib/hooks/useFCM";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";

function FCMInitializer({ children }: { children: ReactNode }) {
  useFCM();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", { scope: "/" })
      .catch((error) => {
        console.warn("[PWA] Service worker registration failed:", error);
      });
  }, []);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      <AuthProvider>
        <SocketProvider>
          <NotificationCenterProvider>
            <CartProvider>
              <PWAInstallPrompt />
              <FCMInitializer>{children}</FCMInitializer>
            </CartProvider>
          </NotificationCenterProvider>
        </SocketProvider>
      </AuthProvider>
    </div>
  );
}
