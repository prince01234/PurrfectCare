import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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
    // Snapshot fields to preserve data at time of adding
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

const cartSchema = new mongoose.Schema(
  {
    // Reference to the user (one cart per user)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },

    // Cart items
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Helper to check valid ObjectId
export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
