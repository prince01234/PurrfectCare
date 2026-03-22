import express from "express";
import notificationController from "../controllers/notificationController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", auth, notificationController.getNotifications);
router.get("/unread-count", auth, notificationController.getUnreadCount);
router.put("/read-all", auth, notificationController.markAllAsRead);
router.put("/:id/read", auth, notificationController.markAsRead);

// FCM token management
router.post("/fcm-token", auth, notificationController.registerFCMToken);
router.delete("/fcm-token", auth, notificationController.removeFCMToken);

export default router;
