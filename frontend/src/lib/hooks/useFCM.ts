"use client";

import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/firebase";
import { notificationApi } from "@/lib/api/notification";
import { useAuth } from "@/context/AuthContext";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Custom hook that initializes Firebase Cloud Messaging:
 * 1. Registers the service worker
 * 2. Requests notification permission
 * 3. Clears stale push subscriptions
 * 4. Gets the FCM token and registers it with the backend
 * 5. Listens for foreground messages
 */
export function useFCM() {
  const { user, token: authToken } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?._id || !authToken) return;

    let cancelled = false;

    const initFCM = async () => {
      try {
        // Check browser support
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
          console.warn("[FCM] Push notifications are not supported in this browser.");
          return;
        }

        // Request permission
        console.log("[FCM] Requesting notification permission...");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[FCM] Notification permission denied.");
          return;
        }
        console.log("[FCM] Permission granted.");

        // Unregister any old firebase service workers to clear stale state
        const existingRegs = await navigator.serviceWorker.getRegistrations();
        for (const reg of existingRegs) {
          if (reg.active?.scriptURL.includes("firebase-messaging-sw")) {
            // Clear any existing push subscription that may be stale
            const existingSub = await reg.pushManager.getSubscription();
            if (existingSub) {
              console.log("[FCM] Unsubscribing stale push subscription...");
              await existingSub.unsubscribe();
            }
            // Unregister this worker so we get a fresh registration
            await reg.unregister();
            console.log("[FCM] Unregistered old service worker.");
          }
        }

        if (cancelled) return;

        // Register a fresh service worker
        console.log("[FCM] Registering service worker...");
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" },
        );
        console.log("[FCM] Service worker registered, waiting for ready...");

        // Wait for service worker to be active
        await navigator.serviceWorker.ready;
        console.log("[FCM] Service worker is ready.");

        if (cancelled) return;

        // Get messaging instance
        const messaging = await getFirebaseMessaging();
        if (!messaging || cancelled) return;

        // Get FCM token
        console.log("[FCM] Getting FCM token with VAPID key...");
        console.log("[FCM] VAPID key present:", !!VAPID_KEY, "length:", VAPID_KEY?.length);

        const fcmToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!fcmToken || cancelled) {
          if (!fcmToken) console.error("[FCM] getToken returned empty.");
          return;
        }

        console.log("[FCM] Got FCM token:", fcmToken.substring(0, 20) + "...");

        // Avoid re-registering the same token
        if (registeredTokenRef.current === fcmToken) {
          console.log("[FCM] Token already registered, skipping.");
          return;
        }

        // Register token with backend
        await notificationApi.registerFCMToken(fcmToken);
        registeredTokenRef.current = fcmToken;
        console.log("[FCM] Token registered with backend successfully.");

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message:", payload);
          // In-app toasts are handled by Socket.IO / NotificationCenterContext,
          // so we don't show a duplicate toast here.
        });
      } catch (error) {
        console.error("[FCM] Error initializing:", error);
      }
    };

    // Delay FCM init to let other providers settle
    const timer = setTimeout(() => {
      initFCM();
    }, 3000);

    // Handle notification clicks from service worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data?.link) {
        window.location.href = event.data.link;
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [user?._id, authToken]);
}
