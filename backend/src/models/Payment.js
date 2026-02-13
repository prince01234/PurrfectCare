import mongoose from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../constants/marketplace.js";

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required."],
    },
    method: {
      type: String,
      required: [true, "Payment method is required."],
      enum: PAYMENT_METHODS,
    },
    status: {
      type: String,
      default: "pending",
      enum: PAYMENT_STATUSES,
    },
    transactionId: String,
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
