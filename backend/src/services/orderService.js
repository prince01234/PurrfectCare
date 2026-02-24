import crypto from "crypto";
import Order, { isValidObjectId } from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import payment from "../utils/payment.js";

// Create order from cart (no payment processing here)
const createOrder = async (data, userId) => {
  const { paymentMethod, deliveryAddress, notes } = data;

  // Get user's cart
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw { statusCode: 400, message: "Cart is empty" };
  }

  // Validate all items are still available
  const validatedItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      throw {
        statusCode: 400,
        message: `Product "${item.nameSnapshot}" is no longer available. Please remove it from your cart.`,
      };
    }

    if (product.stockQty !== null && item.quantity > product.stockQty) {
      throw {
        statusCode: 400,
        message: `Insufficient stock for "${product.name}". Only ${product.stockQty} available.`,
      };
    }

    validatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      priceSnapshot: product.price,
      nameSnapshot: product.name,
      imageSnapshot: product.images?.[0] || null,
    });

    totalAmount += product.price * item.quantity;

    // Reduce stock
    if (product.stockQty !== null) {
      product.stockQty -= item.quantity;
      await product.save();
    }
  }

  // Create order
  const order = await Order.create({
    userId,
    items: validatedItems,
    totalAmount,
    deliveryAddress,
    notes,
    paymentMethod,
    status: "pending",
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  return order;
};

// Initiate Khalti payment for an existing order
const orderPaymentViaKhalti = async (id, user) => {
  if (!isValidObjectId(id)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(id).populate("payment");

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  if (order.userId.toString() !== user._id.toString()) {
    throw { statusCode: 403, message: "Access denied." };
  }

  if (order.status !== "pending") {
    throw {
      statusCode: 400,
      message: `Cannot pay for order with status "${order.status}"`,
    };
  }

  // Reuse existing payment if one already exists, otherwise create new
  let orderPayment = order.payment;
  if (!orderPayment || orderPayment.status === "failed") {
    const transactionId = crypto.randomUUID();
    orderPayment = await Payment.create({
      amount: order.totalAmount,
      method: "khalti",
      transactionId,
    });
    await Order.findByIdAndUpdate(id, {
      payment: orderPayment._id,
    });
  }

  // Fetch full user for customer info
  const fullUser = await User.findById(user._id);

  return await payment.payViaKhalti({
    amount: Math.round(order.totalAmount * 100), // Khalti expects paisa
    purchaseOrderId: id,
    purchaseOrderName: `PurrfectCare Order #${order._id}`,
    customer: fullUser,
  });
};

// Confirm payment after Khalti callback
const confirmOrderPayment = async (id, status, user) => {
  if (!isValidObjectId(id)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(id).populate("payment");

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  if (order.userId.toString() !== user._id.toString()) {
    throw { statusCode: 403, message: "Access denied." };
  }

  if (!order.payment) {
    throw {
      statusCode: 400,
      message: "No payment record found for this order",
    };
  }

  if (status !== "Completed") {
    await Payment.findByIdAndUpdate(order.payment._id, {
      status: "failed",
    });

    throw { statusCode: 400, message: "Payment failed." };
  }

  await Payment.findByIdAndUpdate(order.payment._id, {
    status: "completed",
  });

  return await Order.findByIdAndUpdate(
    id,
    { status: "confirmed" },
    { new: true },
  );
};

// Get user's orders with pagination
const getOrders = async (userId, queryParams = {}) => {
  const { page = 1, limit = 10, status } = queryParams;

  const filter = { userId };

  if (status) {
    filter.status = status.toLowerCase();
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const orders = await Order.find(filter)
    .populate("payment")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments(filter);

  return {
    orders,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get single order by ID
const getOrderById = async (orderId, userId) => {
  if (!isValidObjectId(orderId)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(orderId).populate("payment");

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  if (order.userId.toString() !== userId.toString()) {
    throw { statusCode: 403, message: "Access denied" };
  }

  return order;
};

// Cancel order (only if pending)
const cancelOrder = async (orderId, userId) => {
  if (!isValidObjectId(orderId)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  if (order.userId.toString() !== userId.toString()) {
    throw { statusCode: 403, message: "Access denied" };
  }

  if (order.status !== "pending") {
    throw {
      statusCode: 400,
      message: `Cannot cancel order with status "${order.status}"`,
    };
  }

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product && product.stockQty !== null) {
      product.stockQty += item.quantity;
      await product.save();
    }
  }

  // Mark payment as failed if exists
  if (order.payment) {
    const paymentRecord = await Payment.findById(order.payment);
    if (paymentRecord && paymentRecord.status !== "completed") {
      paymentRecord.status = "failed";
      await paymentRecord.save();
    }
  }

  order.status = "cancelled";
  await order.save();

  return order;
};

export default {
  createOrder,
  orderPaymentViaKhalti,
  confirmOrderPayment,
  getOrders,
  getOrderById,
  cancelOrder,
};
