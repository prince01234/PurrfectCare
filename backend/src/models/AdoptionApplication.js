import mongoose from "mongoose";
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_ARRAY,
  LIVING_SITUATIONS,
} from "../constants/adoption.js";

const adoptionApplicationSchema = new mongoose.Schema(
  {
    // Reference to the adoption listing
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdoptionListing",
      required: [true, "Listing ID is required"],
    },

    // Reference to the applicant
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant ID is required"],
    },

    // Application message
    message: {
      type: String,
      required: [true, "Application message is required"],
      trim: true,
      minlength: [20, "Message must be at least 20 characters"],
    },

    // Contact information
    contactPhone: {
      type: String,
      required: [true, "Contact phone is required"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
    },

    // Living situation
    livingSituation: {
      type: String,
      required: [true, "Living situation is required"],
      enum: {
        values: LIVING_SITUATIONS,
        message: "{VALUE} is not a valid living situation",
      },
    },
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    otherPetsDetails: {
      type: String,
      default: null,
      trim: true,
    },
    hasChildren: {
      type: Boolean,
      default: false,
    },

    // Application status
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUS_ARRAY,
        message: "{VALUE} is not a valid application status",
      },
      default: APPLICATION_STATUS.PENDING,
    },

    // Review details (set by listing owner)
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
adoptionApplicationSchema.index({ listingId: 1 });
adoptionApplicationSchema.index({ applicantId: 1 });
adoptionApplicationSchema.index({ status: 1 });
adoptionApplicationSchema.index(
  { listingId: 1, applicantId: 1 },
  { unique: true },
);
adoptionApplicationSchema.index({ createdAt: -1 });

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const AdoptionApplication = mongoose.model(
  "AdoptionApplication",
  adoptionApplicationSchema,
);

export default AdoptionApplication;
