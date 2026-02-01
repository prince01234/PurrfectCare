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
    photo: {
      type: String,
      default: null,
    },
    medicalNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying by user
petSchema.index({ userId: 1 });

const Pet = mongoose.model("Pet", petSchema);

export default Pet;
