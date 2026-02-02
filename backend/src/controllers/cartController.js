import cartService from "../services/cartService.js";

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartService.getCart(userId);
    res.status(200).send(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Failed to fetch cart";
    res.status(statusCode).send({ error: message });
  }
};

// Add item to cart
const addItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).send({ error: "Product ID is required" });
    }

    const cart = await cartService.addItem(userId, productId, quantity);
    res.status(200).send({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to add item to cart";
    res.status(statusCode).send({ error: message });
  }
};

// Update item quantity
const updateItemQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).send({ error: "Quantity is required" });
    }

    const cart = await cartService.updateItemQuantity(
      userId,
      productId,
      quantity,
    );
    res.status(200).send({ message: "Cart updated", cart });
  } catch (error) {
    console.error("Error updating cart item:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to update cart item";
    res.status(statusCode).send({ error: message });
  }
};

// Remove item from cart
const removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await cartService.removeItem(userId, productId);
    res.status(200).send({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to remove item from cart";
    res.status(statusCode).send({ error: message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartService.clearCart(userId);
    res.status(200).send({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error clearing cart:", error);
    const statusCode = error.statusCode || 400;
    const message = error.message || "Failed to clear cart";
    res.status(statusCode).send({ error: message });
  }
};

export default {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
