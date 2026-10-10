import express from "express";
import {
  getProducts,
  getProductById,
  getCategories,
  searchProducts,
  getProductQuestions,
  askProductQuestion,
  voteProductQuestion,
  answerProductQuestion,
  getRelatedProducts,
  getBestSellers,
  getNewArrivals,
  getFlashSale,
  getProductReviewStats,
  getActiveLiveStreamSessions,
  getGroupBuyDeals,
  joinGroupBuyTeam,
} from "../controllers/productController.js";
import { optionalAuthenticate } from "../middlewares/auth.js";

const router = express.Router();

// Collection endpoints (must be before :id to avoid conflicts)
router.get("/search", searchProducts);
router.get("/categories/list", getCategories);
router.get("/best-sellers", getBestSellers);
router.get("/new-arrivals", getNewArrivals);
router.get("/flash-sale", getFlashSale);
router.get("/live-stream/active", getActiveLiveStreamSessions);
router.get("/group-buy/deals", getGroupBuyDeals);
router.post("/group-buy/join", optionalAuthenticate, joinGroupBuyTeam);
router.get("/", getProducts);

// Product Q&A
router.get("/:id/questions", getProductQuestions);
router.post("/:id/questions", optionalAuthenticate, askProductQuestion);
router.post("/:id/questions/:questionId/vote", voteProductQuestion);
router.post("/:id/questions/:questionId/answers", optionalAuthenticate, answerProductQuestion);

// Product details and related
router.get("/:id/related", getRelatedProducts);
router.get("/:id/review-stats", getProductReviewStats);
router.get("/:id", getProductById);

export default router;
