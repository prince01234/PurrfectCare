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
      minLength: [6, "Password must be at least 6 characters long"],
      select: false,
      default: null,
    },
    // OAuth provider IDs
    googleId: {
      type: String,
      default: undefined,
    },
    facebookId: {
      type: String,
      default: undefined,
    },
    githubId: {
      type: String,
      default: undefined,
    },
    // Tracks which authentication providers are linked to this account
    authProviders: {
      type: [String],
      enum: ["email", "google", "facebook", "github"],
      default: ["email"],
    },
    // Stores social profile data (name, email, profile picture)
    socialProfile: {
      displayName: String,
      profilePicture: String,
      provider: String,
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

    // Location coordinates for map (set when provider application is approved)
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },

    // Organization name for service providers
    organizationName: {
      type: String,
      default: null,
      trim: true,
    },
    contactPhone: {
      type: String,
      default: null,
    },
    contactAddress: {
      type: String,
      default: null,
      trim: true,
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

    // FCM push notification tokens
    fcmTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Enforce uniqueness only when OAuth provider IDs are actually present as strings.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } },
);
userSchema.index(
  { facebookId: 1 },
  {
    unique: true,
    partialFilterExpression: { facebookId: { $type: "string" } },
  },
);
userSchema.index(
  { githubId: 1 },
  { unique: true, partialFilterExpression: { githubId: { $type: "string" } } },
);

const User = mongoose.model("User", userSchema);

export default User;
