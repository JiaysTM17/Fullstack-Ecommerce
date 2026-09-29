import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrderTracking,
  getOrderInvoice,
} from "../controllers/orderController.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.js";

const router = express.Router();

// Order creation supports both guest and authenticated checkout
router.post("/", optionalAuthenticate, createOrder);

// Tracking and invoice endpoints
router.get("/:id/tracking", optionalAuthenticate, getOrderTracking);
router.get("/:id/invoice", optionalAuthenticate, getOrderInvoice);

// Authenticated routes
router.get("/mine", authenticate, getMyOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/cancel", authenticate, cancelOrder);

export default router;
