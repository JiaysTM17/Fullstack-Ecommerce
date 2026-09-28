import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cart = memoryStore.carts.findByUserId(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      return sendSuccess(res, { items: [], total: 0, itemCount: 0 });
    }

    // Enrich items with latest product data
    const enrichedItems = [];
    let total = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const product = await memoryStore.products.findOne({ _id: item.productId });
      if (product && product.isActive) {
        const enriched = {
          productId: item.productId,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          quantity: Math.min(item.quantity, product.stock || 999),
          shopId: product.shopId,
          shopName: product.shopName,
          stock: product.stock,
          selected: item.selected !== false,
        };
        enrichedItems.push(enriched);
        if (enriched.selected) {
          total += enriched.price * enriched.quantity;
          itemCount += enriched.quantity;
        }
      }
    }

    sendSuccess(res, { items: enrichedItems, total, itemCount });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) return sendError(res, "productId là bắt buộc", 400);

    // Verify product exists and is active
    const product = await memoryStore.products.findOne({ _id: productId });
    if (!product) return sendError(res, "Sản phẩm không tồn tại", 404);
    if (!product.isActive) return sendError(res, "Sản phẩm hiện không còn bán", 400);

    // Check stock
    if (product.stock !== undefined && product.stock < quantity) {
      return sendError(res, `Chỉ còn ${product.stock} sản phẩm trong kho`, 400);
    }

    const cart = memoryStore.carts.findByUserId(userId);
    let items = cart ? [...cart.items] : [];

    const existingIdx = items.findIndex((i) => i.productId === productId);
    if (existingIdx !== -1) {
      items[existingIdx].quantity += quantity;
      // Cap at stock
      if (product.stock !== undefined) {
        items[existingIdx].quantity = Math.min(items[existingIdx].quantity, product.stock);
      }
    } else {
      items.push({ productId, quantity: Math.min(quantity, product.stock || 999), selected: true });
    }

    memoryStore.carts.upsert(userId, items);

    sendSuccess(res, {
      message: `Đã thêm "${product.name}" vào giỏ hàng`,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;
    const { quantity, selected } = req.body;

    const cart = memoryStore.carts.findByUserId(userId);
    if (!cart) return sendError(res, "Giỏ hàng trống", 404);

    let items = [...cart.items];
    const idx = items.findIndex((i) => i.productId === productId);
    if (idx === -1) return sendError(res, "Sản phẩm không có trong giỏ hàng", 404);

    if (quantity !== undefined) {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].quantity = quantity;
      }
    }

    if (selected !== undefined && idx < items.length) {
      items[idx].selected = selected;
    }

    memoryStore.carts.upsert(userId, items);
    sendSuccess(res, { message: "Đã cập nhật giỏ hàng" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { productId } = req.params;

    const cart = memoryStore.carts.findByUserId(userId);
    if (!cart) return sendError(res, "Giỏ hàng trống", 404);

    const items = cart.items.filter((i) => i.productId !== productId);
    memoryStore.carts.upsert(userId, items);

    sendSuccess(res, { message: "Đã xóa sản phẩm khỏi giỏ hàng" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    memoryStore.carts.clearByUserId(userId);
    sendSuccess(res, { message: "Đã xóa toàn bộ giỏ hàng" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
