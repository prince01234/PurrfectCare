import mongoose from "mongoose";
import { ORDER_STATUSES } from "../constants/marketplace.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    // Snapshot fields preserved from cart
    priceSnapshot: {
      type: Number,
      required: [true, "Price snapshot is required"],
    },
    nameSnapshot: {
      type: String,
      required: [true, "Name snapshot is required"],
    },
    imageSnapshot: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    // Reference to the user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Order items (snapshot from cart)
    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: {
        validator: (items) => items.length > 0,
        message: "Order must have at least one item",
      },
    },

    // Order total
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },

    // Order status
    status: {
      type: String,
      default: "pending",
      enum: {
        values: ORDER_STATUSES,
        message: "{VALUE} is not a valid order status",
      },
      lowercase: true,
    },

    // Delivery details (MVP - simple text)
    deliveryAddress: {
      type: String,
      default: null,
      trim: true,
    },

    // Additional notes
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    payment: {
      type: mongoose.Types.ObjectId,
      ref: "Payment",
    },
  },
);

// Indexes for efficient querying
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Helper to check valid ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const Order = mongoose.model("Order", orderSchema);

export default Order;
