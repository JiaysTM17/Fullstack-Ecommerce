import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  repurchaseOrder,
  getOrderTracking,
  getOrderInvoice,
  confirmOrder,
  shipOrder,
  deliverOrder,
  completeOrder,
  returnOrder,
  getOrderStats,
  searchOrders,
  requestOrderReturn,
} from "../controllers/orderController.js";
import { authenticate, optionalAuthenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Order creation supports both guest and authenticated checkout
router.post("/", optionalAuthenticate, createOrder);

// Order statistics and search (must be before /:id routes)
router.get("/stats", authenticate, getOrderStats);
router.get("/search", authenticate, searchOrders);

// Tracking and invoice endpoints
router.get("/:id/tracking", optionalAuthenticate, getOrderTracking);
router.get("/:id/invoice", optionalAuthenticate, getOrderInvoice);

// Customer return request
router.post("/:id/return-request", optionalAuthenticate, requestOrderReturn);

// Order workflow transitions
router.patch("/:id/confirm", authenticate, confirmOrder);
router.patch("/:id/ship", authenticate, shipOrder);
router.patch("/:id/deliver", authenticate, deliverOrder);
router.patch("/:id/complete", authenticate, completeOrder);

// Authenticated routes
router.get("/mine", authenticate, getMyOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/cancel", authenticate, cancelOrder);
router.patch("/:id/return", authenticate, returnOrder);
router.post("/:id/repurchase", authenticate, repurchaseOrder);

export default router;


