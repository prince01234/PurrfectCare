import express from "express";
import productController from "../controllers/productController.js";
import { auth, requireVerified, requireRole } from "../middlewares/auth.js";
import { ADMIN, SUPER_ADMIN } from "../constants/roles.js";
import { uploadProductImages } from "../utils/file.js";

const router = express.Router();

// URL: /api/products - Get all active products (public)
router.get("/", productController.getProducts);

// URL: /api/products/:id - Get single product (public)
router.get("/:id", productController.getProductById);

// URL: /api/products/admin/list - Get all products for admin (includes inactive)
router.get(
  "/admin/list",
  auth,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.getAdminProducts,
);

// URL: /api/products/admin - Create new product with images
router.post(
  "/admin",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  uploadProductImages.array("images", 5),
  productController.createProduct,
);

// URL: /api/products/admin/:id - Update product with images
router.put(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  uploadProductImages.array("images", 5),
  productController.updateProduct,
);

// URL: /api/products/admin/:id - Delete product (soft delete)
router.delete(
  "/admin/:id",
  auth,
  requireVerified,
  requireRole(ADMIN, SUPER_ADMIN),
  productController.deleteProduct,
);

export default router;
