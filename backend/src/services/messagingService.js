import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { CONTEXT_TYPES } from "../models/Conversation.js";

const getParticipantMeta = (userId, recipientId) => {
  const normalizedParticipantIds = [userId, recipientId]
    .map((id) => id.toString())
    .sort();

  return {
    participants: normalizedParticipantIds,
    participantKey: normalizedParticipantIds.join(":"),
  };
};

const getOrCreateConversation = async (
  userId,
  recipientId,
  context,
  contextRef = null,
) => {
  if (!recipientId) {
    const error = new Error("Recipient ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (userId === recipientId) {
    const error = new Error("Cannot start a conversation with yourself");
    error.statusCode = 400;
    throw error;
  }

  if (!CONTEXT_TYPES.includes(context)) {
    const error = new Error(
      `Invalid context. Must be one of: ${CONTEXT_TYPES.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Verify recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    const error = new Error("Recipient user not found");
    error.statusCode = 404;
    throw error;
  }

  const { participants, participantKey } = getParticipantMeta(
    userId,
    recipientId,
  );

  // Try to find existing conversation (new + legacy shape)
  let conversation = await Conversation.findOne({
    $or: [
      {
        participantKey,
        context,
        contextRef: contextRef || null,
      },
      {
        participants: { $all: participants, $size: 2 },
        context,
        contextRef: contextRef || null,
      },
    ],
  }).populate("participants", "name email profileImage roles serviceType");

  if (conversation) {
    if (!conversation.participantKey) {
      conversation.participantKey = participantKey;
      await conversation.save();
    }
    return { conversation, isNew: false };
  }

  // Create new conversation (race-safe)
  try {
    conversation = await Conversation.findOneAndUpdate(
      {
        participantKey,
        context,
        contextRef: contextRef || null,
      },
      {
        $setOnInsert: {
          participants,
          participantKey,
          context,
          contextRef: contextRef || null,
          readBy: [userId],
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  } catch (error) {
    if (error?.code === 11000) {
      conversation = await Conversation.findOne({
        participantKey,
        context,
        contextRef: contextRef || null,
      });
    } else {
      throw error;
    }
  }

  conversation = await Conversation.findById(conversation._id).populate(
    "participants",
    "name email profileImage roles serviceType",
  );

  return { conversation, isNew: true };
};

const getConversations = async (userId, query = {}) => {
  const { context, page = 1, limit = 20 } = query;

  const filter = { participants: userId };
  if (context) {
    filter.context = context;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [conversations, total] = await Promise.all([
    Conversation.find(filter)
      .populate("participants", "name email profileImage roles serviceType")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Conversation.countDocuments(filter),
  ]);

  return {
    conversations,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(
    "participants",
    "name email profileImage roles serviceType",
  );

  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === userId,
  );
  if (!isParticipant) {
    const error = new Error("You are not a participant in this conversation");
    error.statusCode = 403;
    throw error;
  }

  return conversation;
};

const sendMessage = async (conversationId, userId, text) => {
  if (!text || !text.trim()) {
    const error = new Error("Message text is required");
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  // Verify user is a participant
  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId,
  );
  if (!isParticipant) {
    const error = new Error("You are not a participant in this conversation");
    error.statusCode = 403;
    throw error;
  }

  // Create the message
  const message = await Message.create({
    conversationId,
    sender: userId,
    text: text.trim(),
    readBy: [userId],
  });

  // Update conversation's last message and timestamp
  conversation.lastMessage = {
    text: text.trim(),
    sender: userId,
    timestamp: message.createdAt,
  };
  // Mark as read only by sender; recipient hasn't seen it yet
  conversation.readBy = [userId];
  await conversation.save();

  // Populate sender info before returning
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "name email profileImage",
  );

  return {
    message: populatedMessage,
    conversation,
  };
};

const getMessages = async (conversationId, userId, query = {}) => {
  const { before, limit = 50 } = query;

  // Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId,
  );
  if (!isParticipant) {
    const error = new Error("You are not a participant in this conversation");
    error.statusCode = 403;
    throw error;
  }

  const filter = { conversationId };
  if (before) {
    filter.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(filter)
    .populate("sender", "name email profileImage")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) + 1); // fetch one extra to check if more exist

  const hasMore = messages.length > parseInt(limit);
  if (hasMore) messages.pop();

  // Return in chronological order
  messages.reverse();

  return {
    messages,
    hasMore,
  };
};

const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId,
  );
  if (!isParticipant) {
    const error = new Error("You are not a participant in this conversation");
    error.statusCode = 403;
    throw error;
  }

  // Add user to readBy if not already present
  if (!conversation.readBy.some((id) => id.toString() === userId)) {
    conversation.readBy.push(userId);
    await conversation.save();
  }

  // Mark all unread messages in this conversation as read by this user
  await Message.updateMany(
    {
      conversationId,
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } },
  );

  return { message: "Conversation marked as read" };
};

const getUnreadCount = async (userId) => {
  const count = await Conversation.countDocuments({
    participants: userId,
    readBy: { $ne: userId },
    "lastMessage.timestamp": { $ne: null },
  });

  return { unreadCount: count };
};

export default {
  getOrCreateConversation,
  getConversations,
  getConversationById,
  sendMessage,
  getMessages,
  markConversationAsRead,
  getUnreadCount,
};
