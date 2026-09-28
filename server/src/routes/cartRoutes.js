import express from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

router.route("/")
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route("/:productId")
  .put(updateCartItem)
  .delete(removeFromCart);

export default router;
