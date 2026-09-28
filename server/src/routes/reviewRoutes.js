import express from "express";
import { getProductReviews, createReview } from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Public
router.get("/:productId", getProductReviews);

// Private (must be logged in)
router.post("/", authenticate, createReview);

export default router;
