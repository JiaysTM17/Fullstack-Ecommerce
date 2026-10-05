/**
 * Wishlist Controller — Quản lý danh sách sản phẩm yêu thích
 * Upgraded: Refactored with catchAsync and structured logging
 */
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// In-memory wishlist store
const wishlists = new Map();

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const wishlist = wishlists.get(userId) || [];

  // Enrich with product data
  const enrichedItems = [];
  for (const item of wishlist) {
    const product = await memoryStore.products.findOne({ _id: item.productId });
    if (product && product.isActive) {
      enrichedItems.push({
        productId: item.productId,
        addedAt: item.addedAt,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        rating: product.rating,
        sold: product.sold,
        stock: product.stock,
        shopName: product.shopName,
        inStock: (product.stock || 0) > 0,
      });
    }
  }

  sendSuccess(res, {
    items: enrichedItems,
    total: enrichedItems.length,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  if (!productId) return sendError(res, "productId là bắt buộc", 400);

  // Verify product exists
  const product = await memoryStore.products.findOne({ _id: productId });
  if (!product) return sendError(res, "Sản phẩm không tồn tại", 404);

  let wishlist = wishlists.get(userId) || [];

  // Check if already in wishlist
  if (wishlist.some((item) => item.productId === productId)) {
    return sendError(res, "Sản phẩm đã có trong danh sách yêu thích", 400);
  }

  // Limit to 100 items
  if (wishlist.length >= 100) {
    return sendError(res, "Danh sách yêu thích đã đạt giới hạn tối đa (100 sản phẩm)", 400);
  }

  wishlist.unshift({ productId, addedAt: new Date().toISOString() });
  wishlists.set(userId, wishlist);

  logger.info(`Product ${productId} added to wishlist for user ${userId}`, {
    requestId: req.requestId,
    userId,
    productId,
  });

  sendSuccess(res, {
    message: `Đã thêm "${product.name}" vào danh sách yêu thích`,
    total: wishlist.length,
  }, 201);
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  let wishlist = wishlists.get(userId) || [];
  const initialLength = wishlist.length;
  wishlist = wishlist.filter((item) => item.productId !== productId);
  wishlists.set(userId, wishlist);

  if (wishlist.length === initialLength) {
    return sendError(res, "Sản phẩm không có trong danh sách yêu thích", 404);
  }

  logger.info(`Product ${productId} removed from wishlist for user ${userId}`, {
    requestId: req.requestId,
    userId,
    productId,
  });

  sendSuccess(res, {
    message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
    total: wishlist.length,
  });
});

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  const wishlist = wishlists.get(userId) || [];
  const isInWishlist = wishlist.some((item) => item.productId === productId);

  sendSuccess(res, { productId, isInWishlist });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  wishlists.set(userId, []);

  logger.info(`Cleared wishlist for user ${userId}`, {
    requestId: req.requestId,
    userId,
  });

  sendSuccess(res, { message: "Đã xóa toàn bộ danh sách yêu thích" });
});

// @desc    Move all wishlist items to cart
// @route   POST /api/wishlist/move-to-cart
// @access  Private
export const moveAllToCart = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const wishlist = wishlists.get(userId) || [];

  if (wishlist.length === 0) {
    return sendError(res, "Danh sách yêu thích đang trống", 400);
  }

  let addedCount = 0;
  let outOfStockCount = 0;
  const cart = memoryStore.carts.findByUserId(userId);
  let cartItems = cart ? [...cart.items] : [];

  for (const item of wishlist) {
    const product = await memoryStore.products.findOne({ _id: item.productId });
    if (!product || !product.isActive || (product.stock !== undefined && product.stock <= 0)) {
      outOfStockCount++;
      continue;
    }

    const existingIdx = cartItems.findIndex((ci) => ci.productId === item.productId);
    if (existingIdx === -1) {
      cartItems.push({ productId: item.productId, quantity: 1, selected: true });
      addedCount++;
    }
  }

  memoryStore.carts.upsert(userId, cartItems);
  wishlists.set(userId, []);

  logger.info(`Moved ${addedCount} items from wishlist to cart for user ${userId}`, {
    requestId: req.requestId,
    userId,
    addedCount,
    outOfStockCount,
  });

  sendSuccess(res, {
    message: `Đã chuyển ${addedCount} sản phẩm vào giỏ hàng`,
    addedCount,
    outOfStockCount,
  });
});

export default { getWishlist, addToWishlist, removeFromWishlist, checkWishlist, clearWishlist, moveAllToCart };
