import Order, { isValidObjectId } from "../models/Order.js";
import Product from "../models/Product.js";
import inAppNotificationService from "./inAppNotificationService.js";

const formatOrderStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Updated";

const merchantOrderService = {
  /**
   * Get all orders containing products created by this merchant.
   * Supports pagination and status filtering.
   */
  async getMerchantOrders(adminUserId, queryParams = {}) {
    const { page = 1, limit = 15, status } = queryParams;

    // Find all product IDs owned by this admin
    const products = await Product.find({ createdBy: adminUserId }, { _id: 1 });
    const productIds = products.map((p) => p._id);

    if (productIds.length === 0) {
      return {
        orders: [],
        pagination: { total: 0, page: 1, limit: 15, totalPages: 0 },
      };
    }

    // Build filter: orders containing at least one of this merchant's products
    const filter = { "items.productId": { $in: productIds } };
    if (status) {
      filter.status = status.toLowerCase();
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email profileImage phone")
        .populate("payment")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    // Filter items in each order to only include this merchant's products
    const productIdSet = new Set(productIds.map((id) => id.toString()));

    const enrichedOrders = orders.map((order) => {
      const merchantItems = order.items.filter((item) =>
        productIdSet.has(item.productId.toString()),
      );
      const merchantTotal = merchantItems.reduce(
        (sum, item) => sum + item.priceSnapshot * item.quantity,
        0,
      );

      return {
        _id: order._id,
        customer: {
          _id: order.userId?._id,
          name: order.userId?.name,
          email: order.userId?.email,
          profileImage: order.userId?.profileImage,
          phone: order.userId?.phone,
        },
        items: merchantItems,
        merchantTotal,
        fullTotal: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        payment: order.payment
          ? {
              status: order.payment.status,
              method: order.payment.method,
              amount: order.payment.amount,
            }
          : null,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });

    return {
      orders: enrichedOrders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  },

  /**
   * Update order status (merchant can: confirm, process, deliver, cancel)
   * Flow: pending → confirmed → processing → delivered
   */
  async updateOrderStatus(orderId, newStatus, adminUserId) {
    if (!isValidObjectId(orderId)) {
      throw { statusCode: 400, message: "Invalid order ID" };
    }

    // Validate the merchant owns products in this order
    const products = await Product.find({ createdBy: adminUserId }, { _id: 1 });
    const productIds = products.map((id) => id._id.toString());

    const order = await Order.findById(orderId);
    if (!order) {
      throw { statusCode: 404, message: "Order not found" };
    }

    const hasMerchantItems = order.items.some((item) =>
      productIds.includes(item.productId.toString()),
    );
    if (!hasMerchantItems) {
      throw {
        statusCode: 403,
        message: "You don't have products in this order",
      };
    }

    // Validate status transitions
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["delivered"],
      delivered: [], // terminal
      cancelled: [], // terminal
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw {
        statusCode: 400,
        message: `Cannot change status from "${order.status}" to "${newStatus}"`,
      };
    }

    // If cancelling, restore stock
    if (newStatus === "cancelled") {
      for (const item of order.items) {
        if (productIds.includes(item.productId.toString())) {
          const product = await Product.findById(item.productId);
          if (product && product.stockQty !== null) {
            product.stockQty += item.quantity;
            await product.save();
          }
        }
      }
    }

    order.status = newStatus;
    await order.save();

    // Return enriched order
    const updatedOrder = await Order.findById(orderId)
      .populate("userId", "name email profileImage phone")
      .populate("payment");

    if (updatedOrder?.userId?._id) {
      await inAppNotificationService.createNotification({
        userId: updatedOrder.userId._id.toString(),
        type: "order",
        title: `Order ${formatOrderStatus(newStatus)}`,
        body: `Order #${updatedOrder._id.toString().slice(-6)} is now ${newStatus}.`,
        entityId: updatedOrder._id.toString(),
        entityType: "order",
        data: {
          orderId: updatedOrder._id.toString(),
          status: newStatus,
        },
      });
    }

    return updatedOrder;
  },
};

export default merchantOrderService;
