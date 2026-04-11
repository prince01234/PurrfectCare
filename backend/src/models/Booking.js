import mongoose from "mongoose";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS,
  BOOKING_TYPES,
  BOOKING_TYPE,
} from "../constants/booking.js";

const bookingSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: [true, "Provider ID is required"],
    },
    petIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Pet",
      default: [],
    },

    // Booking type
    bookingType: {
      type: String,
      required: [true, "Booking type is required"],
      enum: {
        values: BOOKING_TYPES,
        message: "{VALUE} is not a valid booking type",
      },
    },

    // For time-slot bookings
    date: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String, // "09:00" format
      default: null,
    },
    endTime: {
      type: String, // "09:30" format
      default: null,
    },

    // For date-range bookings (pet_sitting)
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },

    // Selected service option (if any)
    serviceOption: {
      name: { type: String, default: null },
      price: { type: Number, default: null },
      duration: { type: Number, default: null },
      serviceCategory: { type: String, default: null },
      vaccineType: { type: String, default: null },
      veterinarian: { type: String, default: null },
    },

    // Booking details
    notes: {
      type: String,
      default: null,
      trim: true,
      maxLength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["khalti", "cod"],
      default: "cod",
    },

    // Payment reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    // Status
    status: {
      type: String,
      default: BOOKING_STATUS.PENDING,
      enum: {
        values: BOOKING_STATUSES,
        message: "{VALUE} is not a valid booking status",
      },
    },

    // Provider response
    providerNotes: {
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
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ date: 1, providerId: 1 });
bookingSchema.index({ startDate: 1, endDate: 1, providerId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
