import mongoose from "mongoose";

const accountVerificationSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Account verification token is required."],
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 3600000, // 1 hour from now
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required."],
  },
});

const model = mongoose.model("AccountVerification", accountVerificationSchema);

export default model;
