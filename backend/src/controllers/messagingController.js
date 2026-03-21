import messagingService from "../services/messagingService.js";
import inAppNotificationService from "../services/inAppNotificationService.js";

const getMessagePreview = (text) => {
  if (!text) return "You have a new message";
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
};

// Get or create a conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId, context, contextRef } = req.body;
    const data = await messagingService.getOrCreateConversation(
      req.user._id,
      recipientId,
      context,
      contextRef,
    );

    res.status(data.isNew ? 201 : 200).json(data);
  } catch (error) {
    console.error("Error getting/creating conversation:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Get all conversations for the authenticated user
const getConversations = async (req, res) => {
  try {
    const data = await messagingService.getConversations(
      req.user._id,
      req.query,
    );

    res.json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Get a single conversation by ID
const getConversationById = async (req, res) => {
  try {
    const conversation = await messagingService.getConversationById(
      req.params.id,
      req.user._id,
    );

    res.json(conversation);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Send a message in a conversation
const sendMessage = async (req, res) => {
  try {
    const data = await messagingService.sendMessage(
      req.params.id,
      req.user._id,
      req.body.text,
    );

    // Emit real-time event via Socket.IO (if available on req.app)
    const io = req.app.get("io");
    if (io) {
      const conversation = data.conversation;
      const recipientId = conversation.participants.find(
        (p) => p.toString() !== req.user._id,
      );
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("message:new", {
          message: data.message,
          conversationId: req.params.id,
        });

        await inAppNotificationService.createNotification(
          {
            userId: recipientId,
            type: "message",
            title: `New message from ${data.message.sender?.name || "someone"}`,
            body: getMessagePreview(data.message.text),
            entityId: req.params.id,
            entityType: "conversation",
            data: {
              conversationId: req.params.id,
              senderId: data.message.sender?._id || req.user._id,
              senderName: data.message.sender?.name || "Unknown user",
            },
          },
          io,
        );
      }
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const data = await messagingService.getMessages(
      req.params.id,
      req.user._id,
      req.query,
    );

    res.json(data);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Mark a conversation as read
const markAsRead = async (req, res) => {
  try {
    const data = await messagingService.markConversationAsRead(
      req.params.id,
      req.user._id,
    );
    await inAppNotificationService.markEntityNotificationsAsRead(
      req.user._id,
      "conversation",
      req.params.id,
    );

    // Notify the other participant that messages were read
    const io = req.app.get("io");
    if (io) {
      const conversation = await messagingService.getConversationById(
        req.params.id,
        req.user._id,
      );
      const recipientId = conversation.participants.find(
        (p) => p._id.toString() !== req.user._id,
      );
      if (recipientId) {
        io.to(`user:${recipientId._id}`).emit("conversation:read", {
          conversationId: req.params.id,
          readBy: req.user._id,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Get unread conversation count
const getUnreadCount = async (req, res) => {
  try {
    const data = await messagingService.getUnreadCount(req.user._id);

    res.json(data);
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

export default {
  getOrCreateConversation,
  getConversations,
  getConversationById,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
};
