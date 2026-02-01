import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    // Reference to the pet
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: [true, "Pet ID is required"],
    },

    // Medical visit details
    visitDate: {
      type: Date,
      required: [true, "Visit date is required"],
    },
    reasonForVisit: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
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
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
      default: null,
    },
    temperature: {
      type: Number,
      default: null,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    treatment: {
      type: String,
      trim: true,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
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

// Virtual: Check if follow-up is due
medicalRecordSchema.virtual("isFollowUpDue").get(function () {
  if (!this.followUpDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUp = new Date(this.followUpDate);
  followUp.setHours(0, 0, 0, 0);

  return followUp <= today;
});

// Indexes for efficient querying
medicalRecordSchema.index({ petId: 1 });
medicalRecordSchema.index({ visitDate: -1 });
medicalRecordSchema.index({ followUpDate: 1 });
medicalRecordSchema.index({ isDeleted: 1 });

// Helper function to validate ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to convert string to ObjectId
export const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
