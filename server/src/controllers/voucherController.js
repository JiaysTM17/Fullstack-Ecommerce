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

export default {
  getVouchers,
  applyVoucher,
  applyDualVouchers,
  createVoucher,
  deleteVoucher,
  validateVoucher,
  getMyVouchers,
  getVoucherStats,
};
