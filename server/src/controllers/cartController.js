import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = catchAsync(async (req, res) => {
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
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = catchAsync(async (req, res) => {
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

  logger.info(`User ${userId} added product ${productId} (qty: ${quantity}) to cart`, {
    requestId: req.requestId,
    userId,
    productId,
    quantity,
  });

  sendSuccess(res, {
    message: `Đã thêm "${product.name}" vào giỏ hàng`,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  }, 201);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = catchAsync(async (req, res) => {
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
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { productId } = req.params;

  const cart = memoryStore.carts.findByUserId(userId);
  if (!cart) return sendError(res, "Giỏ hàng trống", 404);

  const items = cart.items.filter((i) => i.productId !== productId);
  memoryStore.carts.upsert(userId, items);

  sendSuccess(res, { message: "Đã xóa sản phẩm khỏi giỏ hàng" });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  memoryStore.carts.clearByUserId(userId);
  sendSuccess(res, { message: "Đã xóa toàn bộ giỏ hàng" });
});

// @desc    Preview voucher application on cart
// @route   POST /api/cart/apply-voucher
// @access  Private
export const applyVoucherPreview = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { voucherCode } = req.body;

  if (!voucherCode) return sendError(res, "Vui lòng nhập mã voucher", 400);

  const cart = memoryStore.carts.findByUserId(userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    return sendError(res, "Giỏ hàng trống", 400);
  }

  // Calculate cart total
  let cartTotal = 0;
  for (const item of cart.items) {
    if (item.selected !== false) {
      const product = await memoryStore.products.findOne({ _id: item.productId });
      if (product) cartTotal += product.price * item.quantity;
    }
  }

  // Look up voucher
  const voucher = await memoryStore.vouchers.findOne({ code: voucherCode.toUpperCase() });
  if (!voucher) {
    return sendError(res, "Mã voucher không hợp lệ hoặc không tồn tại", 404);
  }

  // Validate voucher
  if (voucher.minOrderValue && cartTotal < voucher.minOrderValue) {
    return sendError(res, `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}₫ để áp dụng voucher này`, 400);
  }

  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return sendError(res, "Voucher đã hết lượt sử dụng", 400);
  }

  let discountAmount = 0;
  if (voucher.type === "percentage") {
    discountAmount = Math.round(cartTotal * (voucher.value || 0) / 100);
    if (voucher.maxDiscount) discountAmount = Math.min(discountAmount, voucher.maxDiscount);
  } else {
    discountAmount = voucher.value || 0;
  }

  discountAmount = Math.min(discountAmount, cartTotal);

  sendSuccess(res, {
    voucherCode: voucher.code,
    voucherName: voucher.name || voucher.code,
    type: voucher.type,
    value: voucher.value,
    cartTotal,
    discountAmount,
    finalTotal: cartTotal - discountAmount,
    message: `Áp dụng voucher thành công! Giảm ${discountAmount.toLocaleString("vi-VN")}₫`,
  });
});

// @desc    Get cart summary with estimated totals
// @route   GET /api/cart/summary
// @access  Private
export const getCartSummary = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const cart = memoryStore.carts.findByUserId(userId);

  if (!cart || !cart.items || cart.items.length === 0) {
    return sendSuccess(res, {
      itemCount: 0,
      selectedCount: 0,
      subtotal: 0,
      estimatedShipping: 0,
      estimatedTotal: 0,
      shops: [],
    });
  }

  let subtotal = 0;
  let selectedCount = 0;
  let itemCount = cart.items.length;
  const shopMap = new Map();

  for (const item of cart.items) {
    const product = await memoryStore.products.findOne({ _id: item.productId });
    if (!product || !product.isActive) continue;

    const lineTotal = product.price * item.quantity;

    if (item.selected !== false) {
      subtotal += lineTotal;
      selectedCount += item.quantity;
    }

    const shopId = product.shopId || "default";
    if (!shopMap.has(shopId)) {
      shopMap.set(shopId, { shopId, shopName: product.shopName || shopId, itemCount: 0, subtotal: 0 });
    }
    const shopEntry = shopMap.get(shopId);
    shopEntry.itemCount += item.quantity;
    shopEntry.subtotal += lineTotal;
  }

  const estimatedShipping = subtotal > 300000 ? 0 : 30000;

  sendSuccess(res, {
    itemCount,
    selectedCount,
    subtotal,
    estimatedShipping,
    estimatedTotal: subtotal + estimatedShipping,
    shops: Array.from(shopMap.values()),
    freeShippingThreshold: 300000,
    amountToFreeShipping: subtotal >= 300000 ? 0 : 300000 - subtotal,
  });
});

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyVoucherPreview,
  getCartSummary,
};
