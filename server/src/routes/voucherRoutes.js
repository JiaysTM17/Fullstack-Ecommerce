import express from "express";
import {
  getVouchers, applyVoucher, createVoucher, deleteVoucher,
  validateVoucher, getMyVouchers, getVoucherStats,
} from "../controllers/voucherController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public
router.get("/", getVouchers);
router.post("/apply", applyVoucher);

// Authenticated
router.post("/validate", authenticate, validateVoucher);
router.get("/my", authenticate, getMyVouchers);

// Admin only
router.get("/stats", authenticate, authorize("admin"), getVoucherStats);

// Seller/Admin only
router.post("/", authenticate, authorize("seller", "admin"), createVoucher);
router.delete("/:id", authenticate, authorize("seller", "admin"), deleteVoucher);

export default router;
