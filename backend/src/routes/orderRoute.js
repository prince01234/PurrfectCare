import express from "express";
import orderController from "../controllers/orderController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router();

// All order routes require authentication

// URL: /api/orders - Create order from cart
router.post("/", auth, requireVerified, orderController.createOrder);

// URL: /api/orders - Get user's orders
router.get("/", auth, orderController.getOrders);

// URL: /api/orders/:id - Get single order
router.get("/:id", auth, orderController.getOrderById);

// URL: /api/orders/:id/cancel - Cancel order
router.put("/:id/cancel", auth, requireVerified, orderController.cancelOrder);

export default router;
