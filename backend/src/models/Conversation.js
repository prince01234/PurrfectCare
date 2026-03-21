import mongoose from "mongoose";

const CONTEXT_TYPES = [
  "adoption",
  "marketplace",
  "service",
  "lost_found",
  "direct",
];

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantKey: {
      type: String,
      default: null,
    },
    context: {
      type: String,
      required: [true, "Conversation context is required"],
      enum: {
        values: CONTEXT_TYPES,
        message: "{VALUE} is not a valid conversation context",
      },
    },
    // Optional reference to the related entity (listing, product, service, etc.)
    contextRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    lastMessage: {
      text: { type: String, default: null },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: null },
    },
    // Track read status per participant
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

conversationSchema.pre("validate", function () {
  if (Array.isArray(this.participants) && this.participants.length > 0) {
    const normalizedParticipants = this.participants
      .map((id) => id?.toString?.())
      .filter(Boolean)
      .sort();

    this.participantKey = normalizedParticipants.join(":");
  }
});

// Compound unique index using deterministic participantKey + context + contextRef
conversationSchema.index(
  { participantKey: 1, context: 1, contextRef: 1 },
  {
    unique: true,
    partialFilterExpression: {
      participantKey: { $type: "string" },
    },
  },
);

// Index for fast lookup of user's conversations
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
export { CONTEXT_TYPES };
