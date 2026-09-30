import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Get all vouchers (public + shop-specific)
// @route   GET /api/vouchers
// @access  Public
export const getVouchers = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Validate and apply a voucher code
// @route   POST /api/vouchers/apply
// @access  Public
export const applyVoucher = async (req, res) => {
  try {
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

    sendSuccess(res, {
      valid: true,
      code: voucher.code,
      name: voucher.name,
      type: voucher.type,
      discountAmount,
      message: `Áp dụng thành công mã ${voucher.code}!`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Create a new voucher (seller creates shop voucher)
// @route   POST /api/vouchers
// @access  Private (Seller/Admin)
export const createVoucher = async (req, res) => {
  try {
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

    sendSuccess(res, voucher, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private (Seller/Admin)
export const deleteVoucher = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    // Sellers can only delete their own shop vouchers
    if (req.user?.role === "seller") {
      query.shopId = req.user.shopId;
    }

    const deleted = await memoryStore.vouchers.findOneAndDelete(query);
    if (!deleted) return sendError(res, "Không tìm thấy voucher hoặc bạn không có quyền xóa", 404);

    sendSuccess(res, { message: `Đã xóa voucher ${deleted.code}` });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { getVouchers, applyVoucher, createVoucher, deleteVoucher };

// @desc    Validate a voucher code without applying
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get user's saved/claimed vouchers
// @route   GET /api/vouchers/my
// @access  Private
export const getMyVouchers = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Voucher usage statistics (Admin)
// @route   GET /api/vouchers/stats
// @access  Private (Admin)
export const getVoucherStats = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
