import express from "express";
import { getProducts, getProductById, getCategories, searchProducts } from "../controllers/productController.js";

const router = express.Router();

// Search must be before :id to avoid conflicts
router.get("/search", searchProducts);
router.get("/categories/list", getCategories);
router.get("/", getProducts);
router.get("/:id", getProductById);

export default router;
