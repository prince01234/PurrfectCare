import Order, { isValidObjectId } from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Create order from cart
const createOrder = async (userId, deliveryAddress = null, notes = null) => {
  // Get user's cart
  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw { statusCode: 400, message: "Cart is empty" };
  }

  // Validate all items are still available and update snapshots
  const validatedItems = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const product = await Product.findById(item.productId);

    // Skip if product no longer exists or is inactive
    if (!product || !product.isActive) {
      throw {
        statusCode: 400,
        message: `Product "${item.nameSnapshot}" is no longer available. Please remove it from your cart.`,
      };
    }

    // Check stock
    if (product.stockQty !== null && item.quantity > product.stockQty) {
      throw {
        statusCode: 400,
        message: `Insufficient stock for "${product.name}". Only ${product.stockQty} available.`,
      };
    }

    // Add to validated items with current snapshots
    validatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      priceSnapshot: product.price,
      nameSnapshot: product.name,
      imageSnapshot: product.images?.[0] || null,
    });

    totalAmount += product.price * item.quantity;

    // Reduce stock if stockQty is tracked
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
    status: "pending",
  });

  // Clear cart after successful order creation
  cart.items = [];
  await cart.save();

  return order;
};

// Get user's orders with pagination
const getOrders = async (userId, queryParams = {}) => {
  const { page = 1, limit = 10, status } = queryParams;

  const filter = { userId };

  if (status) {
    filter.status = status.toLowerCase();
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const orders = await Order.find(filter)
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

// Get single order by ID (only owner can view)
const getOrderById = async (orderId, userId) => {
  if (!isValidObjectId(orderId)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  // Only owner can view their order
  if (order.userId.toString() !== userId.toString()) {
    throw { statusCode: 403, message: "Access denied" };
  }

  return order;
};

// Cancel order (only if status is pending)
const cancelOrder = async (orderId, userId) => {
  if (!isValidObjectId(orderId)) {
    throw { statusCode: 400, message: "Invalid order ID" };
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw { statusCode: 404, message: "Order not found" };
  }

  // Only owner can cancel their order
  if (order.userId.toString() !== userId.toString()) {
    throw { statusCode: 403, message: "Access denied" };
  }

  // Can only cancel pending orders
  if (order.status !== "pending") {
    throw {
      statusCode: 400,
      message: `Cannot cancel order with status "${order.status}"`,
    };
  }

  // Restore stock for cancelled order
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product && product.stockQty !== null) {
      product.stockQty += item.quantity;
      await product.save();
    }
  }

  order.status = "cancelled";
  await order.save();

  return order;
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};
