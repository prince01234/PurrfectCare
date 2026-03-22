import { admin } from "../config/firebase.js";
import User from "../models/User.js";

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

    const tokens = user.fcmTokens.map((entry) => entry.token);

    // Stringify all data values (FCM requires string values)
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === "string" ? value : JSON.stringify(value);
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: stringData,
      webpush: {
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

    // Send to each token individually to handle stale tokens
    const results = await Promise.allSettled(
      tokens.map((token) =>
        admin.messaging().send({ ...message, token }),
      ),
    );

    // Collect stale/invalid tokens to remove
    const staleTokens = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const errorCode = result.reason?.code;
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          staleTokens.push(tokens[index]);
        }
      }
    });

    // Remove stale tokens
    if (staleTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token: { $in: staleTokens } } },
      });
      console.log(`Removed ${staleTokens.length} stale FCM token(s) for user ${userId}`);
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
