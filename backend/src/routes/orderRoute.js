import express from "express";
import orderController from "../controllers/orderController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router();

// URL: /api/orders - Create order from cart
router.post("/", auth, requireVerified, orderController.createOrder);

// URL: /api/orders - Get user's orders
router.get("/", auth, orderController.getOrders);

// URL: /api/orders/:id - Get single order
router.get("/:id", auth, orderController.getOrderById);

// URL: /api/orders/:id/cancel - Cancel order
router.put("/:id/cancel", auth, requireVerified, orderController.cancelOrder);

// URL: /api/orders/:id/payment/khalti - Initiate Khalti payment
router.post(
  "/:id/payment/khalti",
  auth,
  requireVerified,
  orderController.orderPaymentViaKhalti,
);

// URL: /api/orders/:id/confirm-payment - Confirm payment after Khalti callback
router.put(
  "/:id/confirm-payment",
  auth,
  requireVerified,
  orderController.confirmOrderPayment,
);

export default router;
