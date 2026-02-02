import express from "express";
import cartController from "../controllers/cartController.js";
import { auth, requireVerified } from "../middlewares/auth.js";

const router = express.Router();

// All cart routes require authentication

// URL: /api/cart - Get user's cart
router.get("/", auth, cartController.getCart);

// URL: /api/cart/items - Add item to cart
router.post("/items", auth, requireVerified, cartController.addItem);

// URL: /api/cart/items/:productId - Update item quantity
router.put(
  "/items/:productId",
  auth,
  requireVerified,
  cartController.updateItemQuantity,
);

// URL: /api/cart/items/:productId - Remove item from cart
router.delete(
  "/items/:productId",
  auth,
  requireVerified,
  cartController.removeItem,
);

// URL: /api/cart/clear - Clear all items from cart
router.delete("/clear", auth, requireVerified, cartController.clearCart);

export default router;
