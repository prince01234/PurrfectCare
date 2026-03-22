import inAppNotificationService from "../services/inAppNotificationService.js";
import pushNotificationService from "../services/pushNotificationService.js";

const getNotifications = async (req, res) => {
  try {
    const data = await inAppNotificationService.getNotifications(
      req.user._id,
      req.query,
    );

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to fetch notifications" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const data = await inAppNotificationService.getUnreadCount(req.user._id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to fetch unread count" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await inAppNotificationService.markAsRead(
      req.params.id,
      req.user._id,
    );
    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to mark notification as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const data = await inAppNotificationService.markAllAsRead(req.user._id);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to mark notifications as read" });
  }
};

const registerFCMToken = async (req, res) => {
  try {
    const data = await pushNotificationService.registerToken(
      req.user._id,
      req.body.token,
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error registering FCM token:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to register FCM token" });
  }
};

const removeFCMToken = async (req, res) => {
  try {
    const data = await pushNotificationService.removeToken(
      req.user._id,
      req.body.token,
    );
    res.status(200).json(data);
  } catch (error) {
    console.error("Error removing FCM token:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to remove FCM token" });
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerFCMToken,
  removeFCMToken,
};
