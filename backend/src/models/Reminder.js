import mongoose from "mongoose";
import {
  REMINDER_TYPE_ARRAY,
  REMINDER_STATUS_ARRAY,
  REMINDER_FREQUENCY_ARRAY,
  REMINDER_PRIORITY_ARRAY,
  REMINDER_STATUS,
  REMINDER_PRIORITY,
  REMINDER_FREQUENCY,
} from "../constants/reminder.js";

const reminderSchema = new mongoose.Schema(
  {
    // Reference to the user (pet owner)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Reference to the pet
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },

    // Reminder details
    title: {
      type: String,
      required: [true, "Reminder title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    reminderType: {
      type: String,
      required: [true, "Reminder type is required"],
      enum: {
        values: REMINDER_TYPE_ARRAY,
        message: "{VALUE} is not a valid reminder type",
      },
    },

    // Scheduling
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    dueTime: {
      type: String, // Format: "HH:mm"
      default: "09:00",
    },
    frequency: {
      type: String,
      enum: {
        values: REMINDER_FREQUENCY_ARRAY,
        message: "{VALUE} is not a valid frequency",
      },
      default: REMINDER_FREQUENCY.ONCE,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringEndDate: {
      type: Date,
      default: null,
    },

    // Status and priority
    status: {
      type: String,
      enum: {
        values: REMINDER_STATUS_ARRAY,
        message: "{VALUE} is not a valid status",
      },
      default: REMINDER_STATUS.ACTIVE,
    },
    priority: {
      type: String,
      enum: {
        values: REMINDER_PRIORITY_ARRAY,
        message: "{VALUE} is not a valid priority",
      },
      default: REMINDER_PRIORITY.MEDIUM,
    },

    // Email notification settings
    sendEmail: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    lastNotificationSent: {
      type: Date,
      default: null,
    },

    // Related records (optional - links to vaccination, medical record, care log)
    relatedRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedRecordType: {
      type: String,
      enum: ["Vaccination", "MedicalRecord", "CareLog", null],
      default: null,
    },

    // Snooze functionality
    snoozedUntil: {
      type: Date,
      default: null,
    },

    // Completion tracking
    completedAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },

    // Additional details for specific reminder types
    details: {
      // For feeding schedule
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
      // For vet checkup
      vetName: {
        type: String,
        trim: true,
        default: null,
      },
      clinic: {
        type: String,
        trim: true,
        default: null,
      },
      // For vaccination
      vaccineName: {
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

// Virtual: Check if reminder is overdue
reminderSchema.virtual("isOverdue").get(function () {
  if (this.status !== REMINDER_STATUS.ACTIVE) return false;

  const now = new Date();
  const dueDateTime = new Date(this.dueDate);

  if (this.dueTime) {
    const [hours, minutes] = this.dueTime.split(":");
    dueDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }

  return dueDateTime < now;
});

// Virtual: Check if reminder is due today
reminderSchema.virtual("isDueToday").get(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(this.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() === today.getTime();
});

// Virtual: Check if reminder is snoozed
reminderSchema.virtual("isSnoozed").get(function () {
  if (!this.snoozedUntil) return false;
  return new Date() < new Date(this.snoozedUntil);
});

// Indexes for efficient querying
reminderSchema.index({ userId: 1 });
reminderSchema.index({ petId: 1 });
reminderSchema.index({ reminderType: 1 });
reminderSchema.index({ dueDate: 1 });
reminderSchema.index({ status: 1 });
reminderSchema.index({ isDeleted: 1 });
reminderSchema.index({ sendEmail: 1, status: 1, dueDate: 1 }); // For email scheduler

// Helper function to validate ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to convert string to ObjectId
export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
