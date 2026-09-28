import express from "express";
import { getVouchers, applyVoucher, createVoucher, deleteVoucher } from "../controllers/voucherController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Public
router.get("/", getVouchers);
router.post("/apply", applyVoucher);

// Seller/Admin only
router.post("/", authenticate, authorize("seller", "admin"), createVoucher);
router.delete("/:id", authenticate, authorize("seller", "admin"), deleteVoucher);

export default router;
