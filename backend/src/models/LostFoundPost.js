import mongoose from "mongoose";
import {
  POST_TYPE_ARRAY,
  POST_STATUS,
  POST_STATUS_ARRAY,
  LOST_FOUND_SPECIES,
} from "../constants/lostFound.js";

const lostFoundPostSchema = new mongoose.Schema(
  {
    // Type of post: lost or found
    postType: {
      type: String,
      required: [true, "Post type is required"],
      enum: {
        values: POST_TYPE_ARRAY,
        message: "{VALUE} is not a valid post type",
      },
      lowercase: true,
    },

    // Reference to the user who created the post
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user ID is required"],
    },

    // Pet information
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    species: {
      type: String,
      required: [true, "Species is required"],
      enum: {
        values: LOST_FOUND_SPECIES,
        message: "{VALUE} is not a valid species",
      },
      lowercase: true,
    },
    breed: {
      type: String,
      default: null,
      trim: true,
    },
    color: {
      type: String,
      default: null,
      trim: true,
    },
    petName: {
      type: String,
      default: null,
      trim: true,
    },

    // Photos
    photos: {
      type: [String],
      default: [],
    },

    // Location
    locationAddress: {
      type: String,
      required: [true, "Location address is required"],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },

    // Date when pet was lost or found
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },

    // Reward (only applicable for lost posts)
    reward: {
      type: Number,
      default: null,
      min: [0, "Reward cannot be negative"],
    },

    // Post status
    status: {
      type: String,
      default: POST_STATUS.ACTIVE,
      enum: {
        values: POST_STATUS_ARRAY,
        message: "{VALUE} is not a valid status",
      },
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
lostFoundPostSchema.index({ postType: 1, status: 1 });
lostFoundPostSchema.index({ createdBy: 1 });
lostFoundPostSchema.index({ species: 1 });
lostFoundPostSchema.index({ status: 1, createdAt: -1 });
lostFoundPostSchema.index({ latitude: 1, longitude: 1 });

const LostFoundPost = mongoose.model("LostFoundPost", lostFoundPostSchema);

// Helper function to validate ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export default LostFoundPost;
