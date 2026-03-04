import mongoose from "mongoose";
import { BOOKABLE_SERVICE_TYPES } from "../constants/booking.js";

const serviceOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Option name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    price: {
      type: Number,
      default: null,
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: Number, // Duration in minutes
      default: null,
      min: [0, "Duration cannot be negative"],
    },
    image: {
      type: String,
      default: null,
    },
  },
  { _id: true },
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      lowercase: true,
    },
    startTime: {
      type: String, // "09:00" format
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // "17:00" format
      required: [true, "End time is required"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const serviceProviderSchema = new mongoose.Schema(
  {
    // Reference to the user (must be an ADMIN with matching serviceType)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },

    // Service details
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: {
        values: BOOKABLE_SERVICE_TYPES,
        message: "{VALUE} is not a valid bookable service type",
      },
    },
    name: {
      type: String,
      required: [true, "Provider name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },

    // Location
    address: {
      type: String,
      default: null,
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },

    // Contact
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },

    // Provider photo/logo
    image: {
      type: String,
      default: null,
    },

    // Cover / banner image
    coverImage: {
      type: String,
      default: null,
    },

    // Facility amenities (e.g. Free Parking, Waiting Lounge)
    amenities: {
      type: [String],
      default: [],
    },

    // Average rating
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },

    // Availability schedule (weekly)
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },

    // Service options / packages
    serviceOptions: {
      type: [serviceOptionSchema],
      default: [],
    },

    // Slot duration in minutes (for time-slot services)
    slotDuration: {
      type: Number,
      default: 30,
      min: [15, "Slot duration must be at least 15 minutes"],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
serviceProviderSchema.index({ serviceType: 1, isActive: 1 });
serviceProviderSchema.index({ userId: 1 });
serviceProviderSchema.index({ name: "text", description: "text" });

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  serviceProviderSchema,
);

export default ServiceProvider;
