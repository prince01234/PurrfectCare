import express from "express";
import productController from "../controllers/productController.js";
import { auth, requireVerified, requireRole } from "../middlewares/auth.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";

const router = express.Router();

// ============ PUBLIC ROUTES ============

// URL: /api/products - Get all active products (public)
router.get("/", productController.getProducts);

// URL: /api/products/:id - Get single product (public)
router.get("/:id", productController.getProductById);

// ============ ADMIN ROUTES ============

// URL: /api/admin/products - Get all products for admin (includes inactive)
router.get(
  "/admin/list",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.getAdminProducts,
);

// URL: /api/admin/products - Create new product
router.post(
  "/admin",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.createProduct,
);

// URL: /api/admin/products/:id - Update product
router.put(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.updateProduct,
);

// URL: /api/admin/products/:id - Delete product (soft delete)
router.delete(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.deleteProduct,
);

export default router;
