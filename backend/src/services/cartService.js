import Cart, { isValidObjectId } from "../models/Cart.js";
import Product from "../models/Product.js";

// Get or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

// Get user's cart
const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return cart;
};

// Add item to cart
const addItem = async (userId, productId, quantity = 1) => {
  // Validate productId
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  // Validate quantity
  const qty = parseInt(quantity);
  if (!qty || qty < 1) {
    throw { statusCode: 400, message: "Quantity must be a positive integer" };
  }

  // Check if product exists and is active
  const product = await Product.findById(productId);

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  if (!product.isActive) {
    throw { statusCode: 400, message: "Product is no longer available" };
  }

  // Check stock if stockQty is defined
  if (product.stockQty !== null && qty > product.stockQty) {
    throw {
      statusCode: 400,
      message: `Only ${product.stockQty} items available in stock`,
    };
  }

  // Get or create cart
  const cart = await getOrCreateCart(userId);

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (existingItemIndex > -1) {
    // Update quantity
    const newQty = cart.items[existingItemIndex].quantity + qty;

    // Check stock for total quantity
    if (product.stockQty !== null && newQty > product.stockQty) {
      throw {
        statusCode: 400,
        message: `Cannot add more. Only ${product.stockQty} items available in stock`,
      };
    }

    cart.items[existingItemIndex].quantity = newQty;
    // Update snapshots
    cart.items[existingItemIndex].priceSnapshot = product.price;
    cart.items[existingItemIndex].nameSnapshot = product.name;
    cart.items[existingItemIndex].imageSnapshot = product.images?.[0] || null;
  } else {
    // Add new item with snapshots
    cart.items.push({
      productId: product._id,
      quantity: qty,
      priceSnapshot: product.price,
      nameSnapshot: product.name,
      imageSnapshot: product.images?.[0] || null,
    });
  }

  await cart.save();
  return cart;
};

// Update item quantity in cart
const updateItemQuantity = async (userId, productId, quantity) => {
  // Validate productId
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  // Validate quantity
  const qty = parseInt(quantity);
  if (!qty || qty < 1) {
    throw { statusCode: 400, message: "Quantity must be a positive integer" };
  }

  // Get cart
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw { statusCode: 404, message: "Cart not found" };
  }

  // Find item in cart
  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (itemIndex === -1) {
    throw { statusCode: 404, message: "Item not found in cart" };
  }

  // Check product stock
  const product = await Product.findById(productId);

  if (product && product.stockQty !== null && qty > product.stockQty) {
    throw {
      statusCode: 400,
      message: `Only ${product.stockQty} items available in stock`,
    };
  }

  // Update quantity
  cart.items[itemIndex].quantity = qty;

  // Update price snapshot if product still exists and active
  if (product && product.isActive) {
    cart.items[itemIndex].priceSnapshot = product.price;
    cart.items[itemIndex].nameSnapshot = product.name;
    cart.items[itemIndex].imageSnapshot = product.images?.[0] || null;
  }

  await cart.save();
  return cart;
};

// Remove item from cart
const removeItem = async (userId, productId) => {
  // Validate productId
  if (!isValidObjectId(productId)) {
    throw { statusCode: 400, message: "Invalid product ID" };
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw { statusCode: 404, message: "Cart not found" };
  }

  // Find and remove item
  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId,
  );

  if (itemIndex === -1) {
    throw { statusCode: 404, message: "Item not found in cart" };
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  return cart;
};

// Clear all items from cart
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw { statusCode: 404, message: "Cart not found" };
  }

  cart.items = [];
  await cart.save();

  return cart;
};

export default {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
