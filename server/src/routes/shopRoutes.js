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
    const shop = await Shop.findOne({
      $or: [{ shopId: identifier }, { slug: identifier }, { _id: identifier }],
      status: "active",
    }).select("-bankAccount");

    if (!shop) {
      return sendError(res, "Không tìm thấy gian hàng hoặc gian hàng đang tạm dừng hoạt động", 404);
    }

    sendSuccess(res, shop);
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
    const products = await Product.find({
      shopId,
      isActive: true,
      approvalStatus: "approved",
    });
    sendSuccess(res, products);
  } catch (error) {
    sendError(res, error.message, 500);
  }
});

export default router;
