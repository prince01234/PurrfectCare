import mongoose from "mongoose";

const petSchema = new mongoose.Schema(
  {
    // Reference to the owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Basic pet information
    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },
    species: {
      type: String,
      required: [true, "Species is required"],
    },
    breed: {
      type: String,
      default: null,
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "unknown"],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    age: {
      type: Number,
      default: null,
      min: [0, "Age cannot be negative"],
    },

    // Pet media and notes
    photos: {
      type: [String],
      default: [],
    },
    medicalNotes: {
      type: String,
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

// Virtual field: Calculate age from dateOfBirth
petSchema.virtual("calculatedAge").get(function () {
  if (!this.dateOfBirth) return this.age || null;

  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
});

// Index for efficient querying by user
petSchema.index({ userId: 1 });
petSchema.index({ species: 1 });
petSchema.index({ isDeleted: 1 });

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
