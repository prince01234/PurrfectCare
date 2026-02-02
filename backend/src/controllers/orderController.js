import orderService from "../services/orderService.js";

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deliveryAddress, notes } = req.body;

    const order = await orderService.createOrder(
      userId,
      deliveryAddress,
      notes,
    );
    res.status(201).send({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Error creating order:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create order";
    res.status(statusCode).send({ error: message });
  }
};

// Get user's orders
const getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await orderService.getOrders(userId, req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch orders";
    res.status(statusCode).send({ error: message });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const order = await orderService.getOrderById(req.params.id, userId);
    res.status(200).send(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch order";
    res.status(statusCode).send({ error: message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const order = await orderService.cancelOrder(req.params.id, userId);
    res.status(200).send({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to cancel order";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};
