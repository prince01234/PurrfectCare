import { Server } from "socket.io";
import { verifyJWT } from "../utils/jwt.js";
import messagingService from "../services/messagingService.js";


const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const user = await verifyJWT(token);
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id;
    console.log(`User connected: ${userId}`);

    // Join user's private room
    socket.join(`user:${userId}`);

    // Handle sending messages via socket (alternative to REST)
    socket.on("message:send", async (data, callback) => {
      try {
        const { conversationId, text } = data;

        if (!conversationId || !text) {
          return callback?.({ error: "conversationId and text are required" });
        }

        const result = await messagingService.sendMessage(
          conversationId,
          userId,
          text,
        );

        // Find the recipient and emit to their room
        const recipientId = result.conversation.participants.find(
          (p) => p.toString() !== userId,
        );

        if (recipientId) {
          io.to(`user:${recipientId}`).emit("message:new", {
            message: result.message,
            conversationId,
          });
        }

        // Acknowledge to sender
        callback?.({ success: true, message: result.message });
      } catch (error) {
        console.error("Socket message:send error:", error.message);
        callback?.({ error: error.message });
      }
    });

    // Handle typing indicators
    socket.on("typing:start", (data) => {
      const { conversationId, recipientId } = data;
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("typing:start", {
          conversationId,
          userId,
        });
      }
    });

    socket.on("typing:stop", (data) => {
      const { conversationId, recipientId } = data;
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("typing:stop", {
          conversationId,
          userId,
        });
      }
    });

    // Handle marking conversation as read via socket
    socket.on("conversation:read", async (data) => {
      try {
        const { conversationId } = data;
        await messagingService.markConversationAsRead(conversationId, userId);

        // Notify the other participant
        const conversation = await messagingService.getConversationById(
          conversationId,
          userId,
        );
        const recipientId = conversation.participants.find(
          (p) => p._id.toString() !== userId,
        );
        if (recipientId) {
          io.to(`user:${recipientId._id}`).emit("conversation:read", {
            conversationId,
            readBy: userId,
          });
        }
      } catch (error) {
        console.error("Socket conversation:read error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export default initializeSocket;
