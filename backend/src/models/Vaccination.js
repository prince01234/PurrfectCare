import mongoose from "mongoose";
import { VACCINATION_STATUS_ARRAY } from "../constants/healthAndCare.js";

const vaccinationSchema = new mongoose.Schema(
  {
    // Reference to the pet
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },

    // Vaccination details
    vaccineName: {
      type: String,
      required: [true, "Vaccine name is required"],
      trim: true,
    },
    dateGiven: {
      type: Date,
      required: [true, "Date given is required"],
    },
    nextDueDate: {
      type: Date,
      default: null,
    },
    veterinarian: {
      type: String,
      trim: true,
      default: null,
    },
    clinic: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: VACCINATION_STATUS_ARRAY,
        message: "{VALUE} is not a valid status",
      },
      default: "completed",
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

// Virtual: Automatically calculate status based on dates
vaccinationSchema.virtual("calculatedStatus").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateGiven = new Date(this.dateGiven);
  dateGiven.setHours(0, 0, 0, 0);

  // If dateGiven is in the future, it's upcoming
  if (dateGiven > today) {
    return "upcoming";
  }

  // If there's a nextDueDate
  if (this.nextDueDate) {
    const nextDue = new Date(this.nextDueDate);
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue < today) {
      return "overdue";
    }
  }

  return "completed";
});

// Pre-save middleware to auto-set status based on dates
vaccinationSchema.pre("save", function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateGiven = new Date(this.dateGiven);
  dateGiven.setHours(0, 0, 0, 0);

  // If dateGiven is in the future, it's upcoming
  if (dateGiven > today) {
    this.status = "upcoming";
  } else if (this.nextDueDate) {
    const nextDue = new Date(this.nextDueDate);
    nextDue.setHours(0, 0, 0, 0);

    if (nextDue < today) {
      this.status = "overdue";
    } else {
      this.status = "completed";
    }
  } else {
    this.status = "completed";
  }
});

// Indexes for efficient querying
vaccinationSchema.index({ petId: 1 });
vaccinationSchema.index({ status: 1 });
vaccinationSchema.index({ dateGiven: -1 });
vaccinationSchema.index({ nextDueDate: 1 });
vaccinationSchema.index({ isDeleted: 1 });

// Helper function to validate ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to convert string to ObjectId
export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const Vaccination = mongoose.model("Vaccination", vaccinationSchema);

export default Vaccination;
