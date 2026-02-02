import mongoose from "mongoose";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_PET_TYPES,
} from "../constants/marketplace.js";

const productSchema = new mongoose.Schema(
  {
    // Basic product information
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      lowercase: true,
    },
    petType: {
      type: String,
      default: "all",
      enum: {
        values: PRODUCT_PET_TYPES,
        message: "{VALUE} is not a valid pet type",
      },
      lowercase: true,
    },
    brand: {
      type: String,
      default: null,
      trim: true,
    },

    // Product media
    images: {
      type: [String],
      default: [],
    },

    // Inventory
    stockQty: {
      type: Number,
      default: null,
      min: [0, "Stock quantity cannot be negative"],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Reference to admin who created the product
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
productSchema.index({ category: 1 });
productSchema.index({ petType: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", description: "text" });

// Helper to check valid ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const Product = mongoose.model("Product", productSchema);

export default Product;
