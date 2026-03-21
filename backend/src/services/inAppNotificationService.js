import Notification from "../models/Notification.js";
import { getIO } from "../config/realtime.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const emitNotification = (userId, notification, io = null) => {
  const realtime = io || getIO();
  if (!realtime || !userId) return;

  realtime.to(`user:${userId}`).emit("notification:new", { notification });
};

const createNotification = async (payload, io = null) => {
  const {
    userId,
    type,
    title,
    body,
    entityId = null,
    entityType = null,
    data = {},
  } = payload;

  if (!userId || !type || !title || !body) {
    throw new Error("Notification userId, type, title, and body are required");
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    entityId,
    entityType,
    data,
  });

  emitNotification(userId, notification.toObject(), io);
  return notification;
};

const createManyNotifications = async (payloads = [], io = null) => {
  if (!Array.isArray(payloads) || payloads.length === 0) {
    return [];
  }

  const notifications = await Notification.insertMany(payloads);
  notifications.forEach((notification) => {
    emitNotification(notification.userId, notification.toObject(), io);
  });

  return notifications;
};

const getNotifications = async (userId, query = {}) => {
  const { page = 1, limit = DEFAULT_LIMIT, unreadOnly = false, type } = query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  const filter = { userId };
  if (unreadOnly === true || unreadOnly === "true") {
    filter.isRead = false;
  }
  if (type) {
    filter.type = type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  return { unreadCount };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true },
  );

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
  );

  return { message: "Notifications marked as read" };
};

const markEntityNotificationsAsRead = async (userId, entityType, entityId) => {
  if (!userId || !entityType || !entityId) {
    return { message: "Skipped" };
  }

  await Notification.updateMany(
    {
      userId,
      entityType,
      entityId: String(entityId),
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    },
  );

  return { message: "Related notifications marked as read" };
};

export default {
  createNotification,
  createManyNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markEntityNotificationsAsRead,
};
