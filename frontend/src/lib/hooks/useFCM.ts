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
    let unsubscribeOnMessage: (() => void) | null = null;

    const initFCM = async () => {
      try {
        // Check browser support
        if (
          !("Notification" in window) ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window)
        ) {
          console.warn(
            "[FCM] Push notifications are not supported in this browser.",
          );
          return;
        }

        if (!window.isSecureContext) {
          console.warn(
            "[FCM] Push notifications require a secure context (HTTPS). ",
          );
          return;
        }

        if (!VAPID_KEY) {
          console.warn("[FCM] Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
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

        if (cancelled) return;

        // Reuse existing service worker when possible to avoid token churn.
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (
          !registration ||
          !registration.active?.scriptURL.includes("firebase-messaging-sw.js")
        ) {
          console.log("[FCM] Registering service worker...");
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" },
          );
        } else {
          console.log("[FCM] Reusing existing service worker registration.");
          void registration.update();
        }
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
        console.log(
          "[FCM] VAPID key present:",
          !!VAPID_KEY,
          "length:",
          VAPID_KEY?.length,
        );

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
        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          console.log("[FCM] Foreground message:", payload);

          // Use a browser-agnostic foreground fallback so notifications are
          // surfaced consistently across Chrome/Edge/other Chromium browsers.
          const shouldShowSystemNotification =
            Notification.permission === "granted";
          if (!shouldShowSystemNotification) {
            return;
          }

          const title =
            payload.notification?.title ||
            payload.data?.title ||
            "PurrfectCare";
          const body = payload.notification?.body || payload.data?.body || "";

          if (!body) {
            return;
          }

          void registration
            .showNotification(title, {
              body,
              icon: payload.notification?.icon || "/icons/icon-192x192.png",
              badge: "/icons/icon-72x72.png",
              tag:
                payload.data?.entityId ||
                payload.data?.notificationId ||
                payload.messageId ||
                payload.data?.type ||
                "purrfectcare-notification",
              data: {
                link: payload.data?.link || "/dashboard",
              },
            })
            .catch((error) => {
              console.warn(
                "[FCM] Failed to show foreground notification:",
                error,
              );
            });
        });
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") {
          console.warn(
            "[FCM] Push registration aborted by browser/network. Will retry on next session.",
          );
          return;
        }

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
      if (unsubscribeOnMessage) {
        unsubscribeOnMessage();
      }
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [user?._id, authToken]);
}
