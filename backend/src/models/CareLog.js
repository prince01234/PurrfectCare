import mongoose from "mongoose";
import { CARE_TYPE_ARRAY } from "../constants/healthAndCare.js";

const careLogSchema = new mongoose.Schema(
  {
    // Reference to the pet
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },

    // Care log details
    careType: {
      type: String,
      required: [true, "Care type is required"],
      enum: {
        values: CARE_TYPE_ARRAY,
        message: "{VALUE} is not a valid care type",
      },
      lowercase: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    time: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // Duration in minutes
      min: [0, "Duration cannot be negative"],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },

    // Additional fields for specific care types
    details: {
      // For feeding
      foodType: {
        type: String,
        trim: true,
        default: null,
      },
      quantity: {
        type: String,
        trim: true,
        default: null,
      },
      // For medication
      medicationName: {
        type: String,
        trim: true,
        default: null,
      },
      dosage: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for efficient querying
careLogSchema.index({ petId: 1 });
careLogSchema.index({ careType: 1 });
careLogSchema.index({ date: -1 });
careLogSchema.index({ isDeleted: 1 });

// Helper function to validate ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to convert string to ObjectId
export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const CareLog = mongoose.model("CareLog", careLogSchema);

export default CareLog;
