import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
  moveAllToCart,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

router.get("/", getWishlist);
router.post("/move-to-cart", moveAllToCart);
router.get("/check/:productId", checkWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.delete("/", clearWishlist);

export default router;
