import mongoose from "mongoose";
import { SERVICE_TYPES } from "../constants/serviceTypes.js";

const adminApplicationSchema = new mongoose.Schema(
  {
    // User applying
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Service info
    organizationName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: {
        values: SERVICE_TYPES,
        message: "{VALUE} is not a valid service type",
      },
    },
    serviceDescription: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
    },
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    contactAddress: {
      type: String,
      required: [true, "Contact address is required"],
      trim: true,
    },

    // Status
    status: {
      type: String,
      default: "pending",
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not a valid status",
      },
    },

    // Admin review details
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes
adminApplicationSchema.index({ userId: 1 });
adminApplicationSchema.index({ status: 1 });
adminApplicationSchema.index({ serviceType: 1 });
adminApplicationSchema.index({ createdAt: -1 });

const AdminApplication =
  mongoose.models.AdminApplication ||
  mongoose.model("AdminApplication", adminApplicationSchema);

export { AdminApplication as default };
export const isValidObjectId = mongoose.Types.ObjectId.isValid;
