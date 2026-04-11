/* eslint-disable no-restricted-globals */

/**
 * Firebase Messaging Service Worker
 *
 * This is a lightweight service worker that handles push notifications
 * WITHOUT importing the Firebase SDK (avoids CDN version issues).
 *
 * Firebase's getToken() in the main app still works — it only needs a
 * registered service worker, not one with Firebase messaging initialised.
 */

const STATIC_CACHE = "purrfectcare-static-v1";

const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icons\//,
  /^\/(favicon\.png|manifest\.webmanifest)$/,
  /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i,
];

const isCacheableStaticAsset = (url, request) => {
  if (request.method !== "GET") return false;
  if (request.mode === "navigate") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/data/")) return false;

  return STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("purrfectcare-static-") && key !== STATIC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isCacheableStaticAsset(url, request)) {
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      const networkPromise = fetch(request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type !== "opaque"
          ) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      if (cachedResponse) {
        event.waitUntil(networkPromise);
        return cachedResponse;
      }

      const networkResponse = await networkPromise;
      return networkResponse || Response.error();
    }),
  );
});

// Handle incoming push messages (works for both foreground and background)
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data?.json() || {};
  } catch {
    // If the payload isn't JSON, use it as the notification body
    data = {
      notification: { title: "PurrfectCare", body: event.data?.text() || "" },
    };
  }

  // Firebase sends the payload in either notification or data fields
  const notification = data.notification || {};
  const fcmData = data.data || {};

  const title = notification.title || fcmData.title || "PurrfectCare";
  const options = {
    body: notification.body || fcmData.body || "",
    icon: notification.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: fcmData.type || "purrfectcare-notification",
    data: {
      link: fcmData.link || notification.click_action || "/dashboard",
      ...fcmData,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open or focus the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link = event.notification.data?.link || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              link,
            });
            return;
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
      }),
  );
});
