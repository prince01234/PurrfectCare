import mongoose from "mongoose";
import { ADMIN, USER, PET_OWNER, SUPER_ADMIN } from "../constants/roles.js";
import { SERVICE_TYPES } from "../constants/serviceTypes.js";

const userSchema = new mongoose.Schema(
  {
    // for authentication
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: (value) => {
          const emailRegex =
            /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;

          return emailRegex.test(value);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    roles: {
      type: String,
      default: USER,
      enum: [ADMIN, USER, PET_OWNER, SUPER_ADMIN],
    },
    // Service type for admins (veterinary, grooming, training, pet_sitting, pet_adoption, marketplace, etc.)
    serviceType: {
      type: String,
      default: null,
      enum: {
        values: SERVICE_TYPES,
        message: "{VALUE} is not a valid service type",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    //for basic profile
    name: {
      type: String,
      required: [true, "Username is required"],
    },
    profileImage: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },

    //for address
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "Nepal" },
    },

    //for system metadata
    lastLogin: Date,

    isActive: {
      type: Boolean,
      default: true,
    },

    //for onboarding
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    userIntent: {
      type: String,
      enum: ["pet_owner", "looking_to_adopt", "exploring", null],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
