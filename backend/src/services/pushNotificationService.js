import { admin } from "../config/firebase.js";
import User from "../models/User.js";

const TRANSIENT_ERROR_CODES = new Set([
  "messaging/internal-error",
  "messaging/server-unavailable",
  "messaging/unknown-error",
]);

const toFCMStringData = (data = {}) => {
  const stringData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    if (value === null) {
      stringData[key] = "";
      continue;
    }

    if (typeof value === "string") {
      stringData[key] = value;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      stringData[key] = String(value);
      continue;
    }

    try {
      const json = JSON.stringify(value);
      if (typeof json === "string") {
        stringData[key] = json;
      }
    } catch {
      // Skip values that cannot be serialized.
    }
  }

  return stringData;
};

const sendToTokenWithRetry = async (token, message) => {
  try {
    await admin.messaging().send({ ...message, token });
    return { ok: true };
  } catch (error) {
    const code = error?.code;
    if (!TRANSIENT_ERROR_CODES.has(code)) {
      return { ok: false, error };
    }

    try {
      await admin.messaging().send({ ...message, token });
      return { ok: true, retried: true };
    } catch (retryError) {
      return { ok: false, error: retryError };
    }
  }
};

/**
 * Register an FCM token for a user (add to their token list).
 * Prevents duplicate tokens.
 */
const registerToken = async (userId, token) => {
  if (!token) {
    throw new Error("FCM token is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if token already exists
  const exists = user.fcmTokens?.some((entry) => entry.token === token);
  if (exists) {
    return { message: "Token already registered" };
  }

  await User.findByIdAndUpdate(userId, {
    $push: {
      fcmTokens: { token, createdAt: new Date() },
    },
  });

  return { message: "FCM token registered" };
};

/**
 * Remove an FCM token for a user.
 */
const removeToken = async (userId, token) => {
  if (!token) {
    throw new Error("FCM token is required");
  }

  await User.findByIdAndUpdate(userId, {
    $pull: { fcmTokens: { token } },
  });

  return { message: "FCM token removed" };
};

/**
 * Send a push notification to all devices of a user.
 * Automatically removes invalid/expired tokens.
 */
const sendPushNotification = async (userId, { title, body, data = {} }) => {
  try {
    // Check if firebase admin is initialized
    if (!admin.apps?.length) {
      return;
    }

    const user = await User.findById(userId).select("fcmTokens");
    if (!user?.fcmTokens?.length) {
      return;
    }

    const tokens = [...new Set(user.fcmTokens.map((entry) => entry.token))];

    // Stringify all data values (FCM requires string values)
    const stringData = toFCMStringData(data);

    const safeTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : "PurrfectCare";
    const safeBody =
      typeof body === "string" && body.trim().length > 0
        ? body.trim()
        : "You have a new notification";

    const message = {
      notification: {
        title: safeTitle,
        body: safeBody,
      },
      data: stringData,
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "3600",
        },
        notification: {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: stringData.type || "default",
          requireInteraction: false,
        },
        fcmOptions: {
          link: stringData.link || "/dashboard",
        },
      },
    };

    // Send to each token individually to handle stale/transient errors token-by-token.
    const results = await Promise.all(
      tokens.map(async (token) => ({
        token,
        ...(await sendToTokenWithRetry(token, message)),
      })),
    );

    // Collect stale/invalid tokens to remove
    const staleTokens = [];
    let successCount = 0;
    let retrySuccessCount = 0;
    const hardFailures = [];

    results.forEach((result) => {
      if (result.ok) {
        successCount += 1;
        if (result.retried) {
          retrySuccessCount += 1;
        }
        return;
      }

      const errorCode = result.error?.code;
      if (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered"
      ) {
        staleTokens.push(result.token);
        return;
      }

      hardFailures.push(errorCode || "unknown");
    });

    // Remove stale tokens
    if (staleTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: { $in: staleTokens } } },
      });
      console.log(
        `Removed ${staleTokens.length} stale FCM token(s) for user ${userId}`,
      );
    }

    if (hardFailures.length > 0 || retrySuccessCount > 0) {
      console.warn(
        `[Push] user=${userId} sent=${successCount}/${tokens.length} retried=${retrySuccessCount} failures=${hardFailures.join(",")}`,
      );
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

export default {
  registerToken,
  removeToken,
  sendPushNotification,
};
