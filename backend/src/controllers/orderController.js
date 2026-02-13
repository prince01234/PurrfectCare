import orderService from "../services/orderService.js";

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const data = await orderService.createOrder(req.body, req.user._id);

    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating order:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    res.status(error.statusCode || 500).send({ error: error.message });
  }
};

// Initiate Khalti payment for an order
const orderPaymentViaKhalti = async (req, res) => {
  try {
    const data = await orderService.orderPaymentViaKhalti(
      req.params.id,
      req.user,
    );

    res.json(data);
  } catch (error) {
    console.error("Error initiating Khalti payment:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Payment initiation failed" });
  }
};

// Confirm payment after Khalti callback
const confirmOrderPayment = async (req, res) => {
  try {
    const data = await orderService.confirmOrderPayment(
      req.params.id,
      req.body.status,
      req.user,
    );

    res.json(data);
  } catch (error) {
    console.error("Error confirming payment:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Payment confirmation failed" });
  }
};

// Get user's orders
const getOrders = async (req, res) => {
  try {
    const result = await orderService.getOrders(req.user._id, req.query);

    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to fetch orders" });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);

    res.status(200).send(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to fetch order" });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user._id);

    res.status(200).send({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res
      .status(error.statusCode || 500)
      .send({ error: error.message || "Failed to cancel order" });
  }
};

export default {
  createOrder,
  orderPaymentViaKhalti,
  confirmOrderPayment,
  getOrders,
  getOrderById,
  cancelOrder,
};
