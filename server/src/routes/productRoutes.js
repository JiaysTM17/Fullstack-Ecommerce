import express from "express";
import {
  getProducts,
  getProductById,
  getCategories,
  searchProducts,
  getProductQuestions,
  askProductQuestion,
  voteProductQuestion,
} from "../controllers/productController.js";
import { optionalAuthenticate } from "../middlewares/auth.js";

const router = express.Router();

// Search must be before :id to avoid conflicts
router.get("/search", searchProducts);
router.get("/categories/list", getCategories);
router.get("/", getProducts);

// Product Q&A
router.get("/:id/questions", getProductQuestions);
router.post("/:id/questions", optionalAuthenticate, askProductQuestion);
router.post("/:id/questions/:questionId/vote", voteProductQuestion);

// Get single product
router.get("/:id", getProductById);

export default router;
