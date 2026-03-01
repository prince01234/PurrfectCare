import mongoose from "mongoose";
import {
  LISTING_STATUS,
  LISTING_STATUS_ARRAY,
  ADOPTION_SPECIES,
} from "../constants/adoption.js";

const adoptionListingSchema = new mongoose.Schema(
  {
    // Reference to the user who posted the listing (must have pet_adoption privilege)
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted by user ID is required"],
    },

    // Pet information
    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },
    species: {
      type: String,
      required: [true, "Species is required"],
      enum: {
        values: ADOPTION_SPECIES,
        message: "{VALUE} is not a valid species",
      },
      lowercase: true,
    },
    breed: {
      type: String,
      default: null,
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["male", "female", "unknown"],
        message: "{VALUE} is not a valid gender",
      },
      lowercase: true,
    },
    age: {
      type: Number,
      default: null,
      min: [0, "Age cannot be negative"],
    },

    // Description and details
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    healthInfo: {
      type: String,
      default: null,
      trim: true,
    },
    temperament: {
      type: String,
      default: null,
      trim: true,
    },
    specialNeeds: {
      type: String,
      default: null,
      trim: true,
    },

    // Adoption fee (optional)
    adoptionFee: {
      type: Number,
      default: null,
      min: [0, "Adoption fee cannot be negative"],
    },

    // Photos
    photos: {
      type: [String],
      default: [],
    },

    // Location
    location: {
      type: String,
      default: null,
      trim: true,
    },

    // Listing status
    status: {
      type: String,
      enum: {
        values: LISTING_STATUS_ARRAY,
        message: "{VALUE} is not a valid listing status",
      },
      default: LISTING_STATUS.AVAILABLE,
    },

    // Adoption result tracking
    adoptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adoptedAt: {
      type: Date,
      default: null,
    },

    // Soft delete
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
  },
);

// Indexes
adoptionListingSchema.index({ postedBy: 1 });
adoptionListingSchema.index({ status: 1 });
adoptionListingSchema.index({ species: 1 });
adoptionListingSchema.index({ isDeleted: 1 });
adoptionListingSchema.index({ createdAt: -1 });

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const AdoptionListing = mongoose.model(
  "AdoptionListing",
  adoptionListingSchema,
);

export default AdoptionListing;
