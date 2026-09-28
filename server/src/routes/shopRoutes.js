import express from "express";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = express.Router();

// @desc    Lấy danh sách các shop đang hoạt động trên sàn
// @route   GET /api/shops
// @access  Public
router.get("/", async (req, res) => {
  try {
    const shops = await Shop.find({ status: "active" }).select("-bankAccount");
    sendSuccess(res, shops);
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

// @desc    Lấy chi tiết một shop theo shopId hoặc slug
// @route   GET /api/shops/:identifier
// @access  Public
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Find shop by shopId, slug, or _id
    let shop = await Shop.findOne({ shopId: identifier, status: "active" });
    if (!shop) {
      shop = await Shop.findOne({ slug: identifier, status: "active" });
    }
    if (!shop) {
      shop = await Shop.findById(identifier);
    }

    if (!shop || shop.status !== "active") {
      return sendError(res, "Không tìm thấy gian hàng hoặc gian hàng đang tạm dừng hoạt động", 404);
    }

    // Remove bank account info
    const result = shop.toObject ? shop.toObject() : { ...shop };
    delete result.bankAccount;

    // Get product count for this shop
    const productCount = await Product.countDocuments({ shopId: shop.shopId, isActive: true });
    result.productCount = productCount;

    sendSuccess(res, result);
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

// @desc    Lấy danh sách sản phẩm đã duyệt của một shop
// @route   GET /api/shops/:shopId/products
// @access  Public
router.get("/:shopId/products", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { category, page = 1, limit = 50 } = req.query;

    const query = { shopId, isActive: true, approvalStatus: "approved" };
    if (category) query.category = category;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query).sort({ sold: -1 }).skip(skip).limit(limitNum);
    const total = await Product.countDocuments(query);

    sendSuccess(res, {
      products,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

export default router;
