import express from "express";
import {
  getProductReviews,
  createReview,
  replyToReview,
  reportReview,
  markReviewHelpful,
} from "../controllers/reviewController.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/:productId", getProductReviews);
router.post("/:id/helpful", markReviewHelpful);

// Authenticated routes
router.post("/", authenticate, createReview);
router.post("/:id/reply", authenticate, replyToReview);
router.post("/:id/report", authenticate, reportReview);

export default router;
