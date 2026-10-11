import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// @desc    Get all vouchers (public + shop-specific)
// @route   GET /api/vouchers
// @access  Public
export const getVouchers = catchAsync(async (req, res) => {
  const { shopId, type } = req.query;
  const query = {};
  if (type) query.type = type;

  let vouchers = await memoryStore.vouchers.find(query);

  // Filter: show global vouchers + shop-specific if shopId provided
  if (shopId) {
    vouchers = vouchers.filter((v) => v.isGlobal || v.shopId === shopId);
  } else {
    vouchers = vouchers.filter((v) => v.isGlobal);
  }

  // Check expiry
  const now = new Date();
  vouchers = vouchers.filter((v) => {
    if (!v.expiryDate) return true;
    return new Date(v.expiryDate) >= now;
  });

  sendSuccess(res, vouchers);
});

// @desc    Validate and apply a voucher code
// @route   POST /api/vouchers/apply
// @access  Public
export const applyVoucher = catchAsync(async (req, res) => {
  const { code, orderSubtotal = 0, shopId } = req.body;

  if (!code) return sendError(res, "Vui lòng nhập mã giảm giá", 400);

  const normalized = code.trim().toUpperCase();
  const voucher = await memoryStore.vouchers.findOne({ code: normalized });

  if (!voucher) {
    return sendError(res, "Mã giảm giá không tồn tại hoặc đã hết hạn", 404);
  }

  // Check expiry
  if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
    return sendError(res, "Mã giảm giá đã hết hạn sử dụng", 400);
  }

  // Check usage limit
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    return sendError(res, "Mã giảm giá đã hết lượt sử dụng", 400);
  }

  // Check shop-specific
  if (!voucher.isGlobal && voucher.shopId && shopId && voucher.shopId !== shopId) {
    return sendError(res, "Mã giảm giá không áp dụng cho shop này", 400);
  }

  // Check min order value
  if (voucher.minOrderValue > 0 && orderSubtotal > 0 && orderSubtotal < voucher.minOrderValue) {
    return sendError(res, `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString("vi-VN")}₫`, 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.type === "percent") {
    const base = orderSubtotal > 0 ? orderSubtotal : 100000;
    discountAmount = Math.round((base * Math.min(100, voucher.value)) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else {
    discountAmount = Number(voucher.value) || 0;
  }

  if (orderSubtotal > 0 && discountAmount > orderSubtotal && voucher.type !== "shipping") {
    discountAmount = orderSubtotal;
  }

  logger.info(`Voucher ${voucher.code} applied (discount: ${discountAmount})`, {
    requestId: req.requestId,
    code: voucher.code,
    discountAmount,
  });

  sendSuccess(res, {
    valid: true,
    code: voucher.code,
    name: voucher.name,
    type: voucher.type,
    discountAmount,
    message: `Áp dụng thành công mã ${voucher.code}!`,
  });
});

// @desc    Create a new voucher (seller creates shop voucher)
// @route   POST /api/vouchers
// @access  Private (Seller/Admin)
export const createVoucher = catchAsync(async (req, res) => {
  const { code, name, type, value, maxDiscount, minOrderValue, description, expiryDate, usageLimit, isGlobal, shopId } = req.body;

  if (!code || !name) return sendError(res, "Mã và tên voucher là bắt buộc", 400);

  // Check duplicate
  const existing = await memoryStore.vouchers.findOne({ code: code.toUpperCase().trim() });
  if (existing) return sendError(res, "Mã voucher đã tồn tại", 400);

  const voucher = await memoryStore.vouchers.create({
    code: code.toUpperCase().trim(),
    name: name.trim(),
    type: type || "percent",
    value: Number(value) || 10,
    maxDiscount: Number(maxDiscount) || 100000,
    minOrderValue: Number(minOrderValue) || 0,
    description: description || "",
    expiryDate: expiryDate || "2026-12-31",
    usageLimit: Number(usageLimit) || 100,
    usedCount: 0,
    isGlobal: req.user?.role === "admin" ? (isGlobal !== false) : false,
    shopId: req.user?.role === "admin" ? (shopId || null) : req.user?.shopId,
  });

  logger.info(`Voucher created: ${voucher.code}`, {
    requestId: req.requestId,
    code: voucher.code,
    creatorRole: req.user?.role,
  });

  sendSuccess(res, voucher, 201);
});

// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private (Seller/Admin)
export const deleteVoucher = catchAsync(async (req, res) => {
  const query = { _id: req.params.id };
  // Sellers can only delete their own shop vouchers
  if (req.user?.role === "seller") {
    query.shopId = req.user.shopId;
  }

  const deleted = await memoryStore.vouchers.findOneAndDelete(query);
  if (!deleted) return sendError(res, "Không tìm thấy voucher hoặc bạn không có quyền xóa", 404);

  logger.info(`Voucher deleted: ${deleted.code}`, {
    requestId: req.requestId,
    voucherId: req.params.id,
  });

  sendSuccess(res, { message: `Đã xóa voucher ${deleted.code}` });
});

export const applyDualVouchers = catchAsync(async (req, res) => {
  const { shippingVoucherCode, orderVoucherCode, orderSubtotal = 0, shopId } = req.body;
  
  let totalDiscount = 0;
  const result = {
    shippingVoucher: { valid: false, code: null, discountAmount: 0 },
    orderVoucher: { valid: false, code: null, discountAmount: 0 },
    totalDiscount: 0
  };

  const validateOne = async (code, isShipping) => {
    if (!code) return { valid: false };
    const normalized = code.trim().toUpperCase();
    const voucher = await memoryStore.vouchers.findOne({ code: normalized });
    
    if (!voucher) return { valid: false, error: "Mã giảm giá không tồn tại" };
    if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) return { valid: false, error: "Đã hết hạn" };
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return { valid: false, error: "Đã hết lượt sử dụng" };
    if (!voucher.isGlobal && voucher.shopId && shopId && voucher.shopId !== shopId) return { valid: false, error: "Không áp dụng cho shop này" };
    if (voucher.minOrderValue > 0 && orderSubtotal > 0 && orderSubtotal < voucher.minOrderValue) return { valid: false, error: "Chưa đạt giá trị tối thiểu" };
    
    if (isShipping && voucher.type !== "shipping") return { valid: false, error: "Không phải mã vận chuyển" };
    if (!isShipping && voucher.type === "shipping") return { valid: false, error: "Không phải mã giảm giá đơn hàng" };
    
    let discountAmount = 0;
    if (voucher.type === "percent" || voucher.type === "percentage") {
      const base = orderSubtotal > 0 ? orderSubtotal : 100000;
      discountAmount = Math.round((base * Math.min(100, voucher.value)) / 100);
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = Number(voucher.value) || 0;
    }
    
    if (orderSubtotal > 0 && discountAmount > orderSubtotal && voucher.type !== "shipping") {
      discountAmount = orderSubtotal;
    }
    
    return { valid: true, code: voucher.code, discountAmount };
  };

  if (shippingVoucherCode) {
    const sv = await validateOne(shippingVoucherCode, true);
    if (sv.valid) {
      result.shippingVoucher = { valid: true, code: sv.code, discountAmount: sv.discountAmount };
      totalDiscount += sv.discountAmount;
    } else {
      result.shippingVoucher.error = sv.error;
    }
  }
  
  if (orderVoucherCode) {
    const ov = await validateOne(orderVoucherCode, false);
    if (ov.valid) {
      result.orderVoucher = { valid: true, code: ov.code, discountAmount: ov.discountAmount };
      totalDiscount += ov.discountAmount;
    } else {
      result.orderVoucher.error = ov.error;
    }
  }
  
  result.totalDiscount = totalDiscount;
  
  sendSuccess(res, result);
});

// @desc    Validate a voucher code without applying
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = catchAsync(async (req, res) => {
  const { code, orderTotal = 0 } = req.body;
  if (!code) return sendError(res, "Mã voucher là bắt buộc", 400);

  const voucher = await memoryStore.vouchers.findOne({ code: code.toUpperCase() });
  if (!voucher) return sendError(res, "Mã voucher không tồn tại", 404);

  const issues = [];

  // Check expiry
  if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) {
    issues.push("Voucher đã hết hạn");
  }

  // Check usage limit
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
    issues.push("Voucher đã hết lượt sử dụng");
  }

  // Check minimum order
  if (voucher.minOrderValue && orderTotal < voucher.minOrderValue) {
    issues.push(`Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")}₫`);
  }

  const isValid = issues.length === 0;

  let estimatedDiscount = 0;
  if (isValid && orderTotal > 0) {
    if (voucher.type === "percentage") {
      estimatedDiscount = Math.round(orderTotal * (voucher.value || 0) / 100);
      if (voucher.maxDiscount) estimatedDiscount = Math.min(estimatedDiscount, voucher.maxDiscount);
    } else {
      estimatedDiscount = voucher.value || 0;
    }
    estimatedDiscount = Math.min(estimatedDiscount, orderTotal);
  }

  sendSuccess(res, {
    code: voucher.code,
    name: voucher.name || voucher.code,
    type: voucher.type,
    value: voucher.value,
    isValid,
    issues,
    estimatedDiscount,
    expiryDate: voucher.expiryDate,
    remainingUses: voucher.usageLimit ? Math.max(0, voucher.usageLimit - (voucher.usedCount || 0)) : "Không giới hạn",
  });
});

// @desc    Get user's saved/claimed vouchers
// @route   GET /api/vouchers/my
// @access  Private
export const getMyVouchers = catchAsync(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const claimed = memoryStore.userClaimedVouchers?.get?.(userId) || [];

  const enrichedVouchers = [];
  for (const entry of claimed) {
    const voucher = await memoryStore.vouchers.findOne({ code: entry.code || entry });
    if (voucher) {
      const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();
      enrichedVouchers.push({
        code: voucher.code,
        name: voucher.name || voucher.code,
        type: voucher.type,
        value: voucher.value,
        minOrderValue: voucher.minOrderValue,
        expiryDate: voucher.expiryDate,
        isExpired,
        isUsed: entry.isUsed || false,
        claimedAt: entry.claimedAt || null,
      });
    }
  }

  sendSuccess(res, { vouchers: enrichedVouchers, total: enrichedVouchers.length });
});

// @desc    Voucher usage statistics (Admin)
// @route   GET /api/vouchers/stats
// @access  Private (Admin)
export const getVoucherStats = catchAsync(async (req, res) => {
  const allVouchers = await memoryStore.vouchers.find({});

  let totalVouchers = allVouchers.length;
  let activeVouchers = 0;
  let expiredVouchers = 0;
  let totalUsed = 0;
  const now = new Date();

  for (const v of allVouchers) {
    totalUsed += v.usedCount || 0;
    if (v.expiryDate && new Date(v.expiryDate) < now) {
      expiredVouchers++;
    } else {
      activeVouchers++;
    }
  }

  sendSuccess(res, {
    totalVouchers,
    activeVouchers,
    expiredVouchers,
    totalUsed,
    byType: {
      percentage: allVouchers.filter((v) => v.type === "percentage").length,
      fixed: allVouchers.filter((v) => v.type === "fixed").length,
      freeship: allVouchers.filter((v) => v.type === "freeship").length,
    },
  });
});

// @desc    Xếp chồng voucher 3 tầng (Freeship + Shop Voucher + Platform Voucher + Xu Shopee)
// @route   POST /api/vouchers/apply-triple
// @access  Public
export const applyTripleVouchers = catchAsync(async (req, res) => {
  const {
    freeshipCode,
    shopCode,
    platformCode,
    subtotal = 0,
    shippingFee = 25000,
    shopId = "shop_01",
    coinsUsed = 0,
  } = req.body;

  const orderSubtotal = Math.max(0, Number(subtotal) || 0);
  let shippingFinalFee = Math.max(0, Number(shippingFee) || 0);
  let shippingDiscount = 0;
  let shopDiscount = 0;
  let platformDiscount = 0;
  let coinDeduction = 0;

  let freeshipApplied = null;
  let shopApplied = null;
  let platformApplied = null;

  // 1. Tầng Freeship
  if (freeshipCode) {
    const v = await memoryStore.vouchers.findOne({ code: freeshipCode.trim().toUpperCase() });
    if (v && (v.type === "shipping" || v.type === "freeship") && orderSubtotal >= (v.minOrderValue || 0)) {
      shippingDiscount = Math.min(shippingFinalFee, v.value || 30000);
      if (v.maxDiscount) shippingDiscount = Math.min(shippingDiscount, v.maxDiscount);
      shippingFinalFee = Math.max(0, shippingFinalFee - shippingDiscount);
      freeshipApplied = { code: v.code, discount: shippingDiscount };
    }
  }

  // 2. Tầng Shop Voucher (Chỉ áp dụng cho đơn vị bán cụ thể)
  if (shopCode) {
    const v = await memoryStore.vouchers.findOne({ code: shopCode.trim().toUpperCase() });
    if (v && (!v.isGlobal || v.shopId === shopId) && orderSubtotal >= (v.minOrderValue || 0)) {
      if (v.type === "percent" || v.type === "percentage") {
        shopDiscount = Math.round((orderSubtotal * (v.value || 0)) / 100);
        if (v.maxDiscount) shopDiscount = Math.min(shopDiscount, v.maxDiscount);
      } else {
        shopDiscount = Math.min(orderSubtotal, v.value || 0);
      }
      shopApplied = { code: v.code, discount: shopDiscount };
    }
  }

  // 3. Tầng Platform Global Voucher
  if (platformCode) {
    const v = await memoryStore.vouchers.findOne({ code: platformCode.trim().toUpperCase() });
    if (v && v.isGlobal && orderSubtotal >= (v.minOrderValue || 0)) {
      const remainingForPlatform = Math.max(0, orderSubtotal - shopDiscount);
      if (v.type === "percent" || v.type === "percentage") {
        platformDiscount = Math.round((remainingForPlatform * (v.value || 0)) / 100);
        if (v.maxDiscount) platformDiscount = Math.min(platformDiscount, v.maxDiscount);
      } else {
        platformDiscount = Math.min(remainingForPlatform, v.value || 0);
      }
      platformApplied = { code: v.code, discount: platformDiscount };
    }
  }

  // 4. Khấu trừ Shopee Xu (Tối đa 50% giá trị còn lại sau voucher)
  const remainingAfterVouchers = Math.max(0, orderSubtotal - shopDiscount - platformDiscount);
  const maxCoinsAllowed = Math.floor(remainingAfterVouchers * 0.5);
  const actualCoins = Math.min(Number(coinsUsed) || 0, maxCoinsAllowed);
  coinDeduction = actualCoins;

  const finalTotal = remainingAfterVouchers - coinDeduction + shippingFinalFee;

  sendSuccess(res, {
    subtotal: orderSubtotal,
    shippingFee: Number(shippingFee) || 0,
    shippingDiscount,
    shopDiscount,
    platformDiscount,
    coinDeduction,
    totalDiscount: shippingDiscount + shopDiscount + platformDiscount + coinDeduction,
    finalTotal: Math.max(0, finalTotal),
    appliedVouchers: {
      freeship: freeshipApplied,
      shop: shopApplied,
      platform: platformApplied,
    },
  });
});

// In-Memory store for active live stream flash vouchers (Feature 98)
let activeLiveFlashVouchers = [
  {
    dropId: "drop_live_init",
    code: "LIVEFLASH88",
    name: "Voucher Chớp Nhoáng Livestream",
    type: "fixed",
    value: 88000,
    minOrderValue: 200000,
    totalSlots: 50,
    claimedCount: 18,
    durationSeconds: 60,
    droppedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    claimedUserIds: ["user_sample_01"],
  },
];

// @desc    Lấy mã flash voucher đang thả trực tiếp trên Livestream (Feature 98)
// @route   GET /api/vouchers/live-stream/active-drop
// @access  Public
export const getActiveLiveFlashDrop = catchAsync(async (req, res) => {
  const now = new Date();
  const valid = activeLiveFlashVouchers.find((d) => new Date(d.expiresAt) > now && d.claimedCount < d.totalSlots);
  return sendSuccess(res, { drop: valid || null }, 200, "Lấy thông tin flash voucher livestream thành công");
});

// @desc    Seller / Host thả mã giảm giá chớp nhoáng trên Livestream (Feature 98)
// @route   POST /api/vouchers/live-stream/drop
// @access  Public / Authenticate
export const dropLiveFlashVoucher = catchAsync(async (req, res) => {
  const {
    code = "LIVEFLASH99",
    name = "Flash Voucher Livestream 30s",
    value = 50000,
    minOrderValue = 150000,
    totalSlots = 30,
    durationSeconds = 45,
  } = req.body;

  const now = new Date();
  const dropId = `drop_${Date.now()}`;
  const normalizedCode = code.trim().toUpperCase();

  const newDrop = {
    dropId,
    code: normalizedCode,
    name,
    type: "fixed",
    value: Number(value) || 50000,
    minOrderValue: Number(minOrderValue) || 150000,
    totalSlots: Number(totalSlots) || 30,
    claimedCount: 0,
    durationSeconds: Number(durationSeconds) || 45,
    droppedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + (Number(durationSeconds) || 45) * 1000).toISOString(),
    claimedUserIds: [],
  };

  // Đồng thời lưu hoặc kích hoạt trong memoryStore.vouchers để người dùng áp dụng được khi thanh toán
  const existingVoucher = await memoryStore.vouchers.findOne({ code: normalizedCode });
  if (!existingVoucher) {
    await memoryStore.vouchers.create({
      code: normalizedCode,
      name,
      type: "fixed",
      value: newDrop.value,
      maxDiscount: newDrop.value,
      minOrderValue: newDrop.minOrderValue,
      description: `Mã chớp nhoáng Livestream giảm ${newDrop.value.toLocaleString('vi-VN')}₫`,
      expiryDate: new Date(now.getTime() + 86400000).toISOString(), // Áp dụng trong 24h sau khi giật được
      usageLimit: newDrop.totalSlots,
      usedCount: 0,
      isGlobal: true,
    });
  }

  activeLiveFlashVouchers.unshift(newDrop);

  return sendSuccess(res, { drop: newDrop }, 201, "Đã thả Flash Voucher trên Livestream thành công!");
});

// @desc    Người xem giật mã flash voucher trong stream (Feature 98)
// @route   POST /api/vouchers/live-stream/claim
// @access  Public / Authenticate
export const claimLiveFlashVoucher = catchAsync(async (req, res) => {
  const { dropId, userId = "guest_viewer" } = req.body;
  const now = new Date();

  const drop = activeLiveFlashVouchers.find((d) => d.dropId === dropId);
  if (!drop) {
    return sendError(res, "Phiên thả mã không tồn tại hoặc đã kết thúc", 404);
  }

  if (new Date(drop.expiresAt) <= now) {
    return sendError(res, "Mã chớp nhoáng đã hết thời gian giật!", 400);
  }

  if (drop.claimedCount >= drop.totalSlots) {
    return sendError(res, "Rất tiếc! Toàn bộ số lượng mã đã được giật hết trong nháy mắt", 400);
  }

  if (drop.claimedUserIds.includes(userId)) {
    return sendError(res, "Bạn đã giật mã này rồi! Hãy dùng khi thanh toán nhé", 400);
  }

  drop.claimedCount += 1;
  drop.claimedUserIds.push(userId);

  return sendSuccess(res, {
    dropId: drop.dropId,
    code: drop.code,
    name: drop.name,
    value: drop.value,
    minOrderValue: drop.minOrderValue,
    remainingSlots: drop.totalSlots - drop.claimedCount,
  }, 200, `Chúc mừng bạn đã giật thành công Voucher ${drop.code}!`);
});

export default {
  getVouchers,
  applyVoucher,
  applyDualVouchers,
  createVoucher,
  deleteVoucher,
  validateVoucher,
  getMyVouchers,
  getVoucherStats,
  applyTripleVouchers,
  getActiveLiveFlashDrop,
  dropLiveFlashVoucher,
  claimLiveFlashVoucher,
};
