import express from "express";
import messagingController from "../controllers/messagingController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// URL: /api/conversations - Get all conversations for authenticated user
router.get("/", auth, messagingController.getConversations);

// URL: /api/conversations/unread-count - Get unread conversation count
router.get("/unread-count", auth, messagingController.getUnreadCount);

// URL: /api/conversations - Create or get existing conversation
router.post("/", auth, messagingController.getOrCreateConversation);

// URL: /api/conversations/:id - Get a single conversation
router.get("/:id", auth, messagingController.getConversationById);

// URL: /api/conversations/:id/messages - Get messages for a conversation
router.get("/:id/messages", auth, messagingController.getMessages);

// URL: /api/conversations/:id/messages - Send a message
router.post("/:id/messages", auth, messagingController.sendMessage);

// URL: /api/conversations/:id/read - Mark conversation as read
router.put("/:id/read", auth, messagingController.markAsRead);

export default router;
