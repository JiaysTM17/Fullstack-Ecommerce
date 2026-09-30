import express from "express";
import {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart,
  applyVoucherPreview, getCartSummary,
} from "../controllers/cartController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Cart summary and voucher preview (before generic routes)
router.get("/summary", getCartSummary);
router.post("/apply-voucher", applyVoucherPreview);

router.route("/")
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route("/:productId")
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;
