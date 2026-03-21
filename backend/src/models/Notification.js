import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "message",
  "booking",
  "order",
  "adoption",
  "reminder",
  "application",
  "system",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPES,
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [140, "Notification title cannot exceed 140 characters"],
    },
    body: {
      type: String,
      required: [true, "Notification body is required"],
      trim: true,
      maxlength: [500, "Notification body cannot exceed 500 characters"],
    },
    entityId: {
      type: String,
      default: null,
      trim: true,
    },
    entityType: {
      type: String,
      default: null,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, entityType: 1, entityId: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
