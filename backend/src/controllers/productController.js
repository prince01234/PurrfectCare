import productService from "../services/productService.js";
import { uploadFile, deleteFile } from "../utils/file.js";

// Get all products (Public)
const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch products";
    res.status(statusCode).send({ error: message });
  }
};

// Get single product by ID (Public)
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).send(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to fetch product";
    res.status(statusCode).send({ error: message });
  }
};

// Create product (Admin only)
const createProduct = async (req, res) => {
  try {
    const adminId = req.user._id;
    const data = { ...req.body };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadFile(req.files);
      data.images = uploadedImages;
    }

    const product = await productService.createProduct(adminId, data);
    res.status(201).send(product);
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to create product";
    res.status(statusCode).send({ error: message });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const adminId = req.user._id;
    const data = { ...req.body };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadFile(req.files);
      data.images = uploadedImages;
    }

    const product = await productService.updateProduct(
      req.params.id,
      adminId,
      data,
    );
    res.status(200).send(product);
  } catch (error) {
    console.error("Error updating product:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).send({ error: messages.join(", ") });
    }

    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update product";
    res.status(statusCode).send({ error: message });
  }
};

// Delete product - soft delete (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const adminId = req.user._id;
    await productService.deleteProduct(req.params.id, adminId);
    res.status(200).send({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to delete product";
    res.status(statusCode).send({ error: message });
  }
};

// Get admin products (includes inactive)
const getAdminProducts = async (req, res) => {
  try {
    const adminId = req.user._id;
    const result = await productService.getAdminProducts(adminId, req.query);
    res.status(200).send(result);
  } catch (error) {
    console.error("Error fetching admin products:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch products";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};
