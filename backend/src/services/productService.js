import Product, { isValidObjectId } from "../models/Product.js";
import User from "../models/User.js";
import { SUPER_ADMIN } from "../constants/roles.js";

// Create a new product (Admin only)
const createProduct = async (adminId, data) => {
  const product = await Product.create({
    ...data,
    createdBy: adminId,
  });

  return product;
};

// Get all products with filters and pagination (Public)
const getProducts = async (queryParams = {}) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    petType,
    minPrice,
    maxPrice,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  // Build filter - only active products for public
  const filter = { isActive: true };

  // Search by name or description
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by category
  if (category) {
    filter.category = category.toLowerCase();
  }

  // Filter by pet type
  if (petType) {
    filter.petType = petType.toLowerCase();
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sortObj = {};
  sortObj[sort] = order === "asc" ? 1 : -1;

  // Query
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .select("-__v");

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Get single product by ID (Public - only if active)
const getProductById = async (productId) => {
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  if (!product.isActive) {
    throw { statusCode: 404, message: "Product is no longer available" };
  }

  return product;
};

// Update product (Admin only - creator or super admin)
const updateProduct = async (productId, adminId, data) => {
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  // Check if admin is the creator or super admin
  const user = await User.findById(adminId);
  const isOwner = product.createdBy.toString() === adminId.toString();
  const isSuperAdmin = user && user.roles === SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    throw {
      statusCode: 403,
      message: "Access denied. You can only edit your own products.",
    };
  }

  // Remove fields that shouldn't be updated
  const { createdBy, _id, ...updateData } = data;

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  return updatedProduct;
};

// Soft delete product (Admin only - creator or super admin)
const deleteProduct = async (productId, adminId) => {
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  // Check if admin is the creator or super admin
  const user = await User.findById(adminId);
  const isOwner = product.createdBy.toString() === adminId.toString();
  const isSuperAdmin = user && user.roles === SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    throw {
      statusCode: 403,
      message: "Access denied. You can only delete your own products.",
    };
  }

  // Soft delete by setting isActive to false
  const deletedProduct = await Product.findByIdAndUpdate(
    productId,
    { isActive: false },
    { new: true },
  );

  return deletedProduct;
};

// Get all products for admin (includes inactive)
const getAdminProducts = async (adminId, queryParams = {}) => {
  const { page = 1, limit = 12, search, category, isActive } = queryParams;

  const filter = {};

  // Filter by active status if specified
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  // Search by name
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Filter by category
  if (category) {
    filter.category = category.toLowerCase();
  }

  // Pagination
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(filter);

  return {
    products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export default {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};
