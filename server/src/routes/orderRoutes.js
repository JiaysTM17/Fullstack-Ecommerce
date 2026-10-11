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
  simulateCarrierWebhook,
  submitOrderCsatFeedback,
  updateOrderGiftWrap,
  updateOrderDoorstepInspection,
  recordDeliveryAttempt,
  getDeliveryAttempts,
  uploadUnboxingVideoProof,
  verifyUnboxingVideoProof,
  executeSmartOneClickReorder,
  calculateMultiWarehouseRouting,
  updateDynamicDeliveryAddress,
  updateEcoPackagingOption,
  assignSmartLockerDelivery,
  issueCarbonOffsetCertificate,
  scheduleDoorstepReturnPickup,
  evaluateOrderFraudRisk,
  reconcileAutomatedCodSettlement,
  claimLateDeliveryCompensation,
  evaluateAiDamageClaim,
  consolidateOrderPackaging,
  updatePriorityColdChainDispatch,
  submitDoorstepApplianceTradeIn,
  reserveStock,
  releaseStock,
} from "../controllers/orderController.js";
import { authenticate, optionalAuthenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Stock reservation endpoints (Cart/Checkout Guard)
router.post("/reserve-stock", optionalAuthenticate, reserveStock);
router.post("/release-stock", optionalAuthenticate, releaseStock);

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

// 3PL Carrier Webhook Simulator & CSAT Delivery Feedback
router.post("/:id/carrier-webhook", simulateCarrierWebhook);
router.post("/:id/csat-feedback", optionalAuthenticate, submitOrderCsatFeedback);
router.patch("/:id/gift-wrap", optionalAuthenticate, updateOrderGiftWrap);
router.post("/:id/reschedule-delivery", optionalAuthenticate, rescheduleOrderDelivery);
router.patch("/:id/doorstep-inspection", optionalAuthenticate, updateOrderDoorstepInspection);
router.post("/:id/delivery-attempts", optionalAuthenticate, recordDeliveryAttempt);
router.get("/:id/delivery-attempts", optionalAuthenticate, getDeliveryAttempts);
router.post("/:id/unboxing-video", optionalAuthenticate, uploadUnboxingVideoProof);
router.patch("/:id/unboxing-video/verify", authenticate, authorize("admin", "seller"), verifyUnboxingVideoProof);
router.post("/:id/smart-reorder", optionalAuthenticate, executeSmartOneClickReorder);
router.post("/:id/warehouse-routing", optionalAuthenticate, calculateMultiWarehouseRouting);
router.patch("/:id/dynamic-address", optionalAuthenticate, updateDynamicDeliveryAddress);
router.patch("/:id/eco-packaging", optionalAuthenticate, updateEcoPackagingOption);
router.post("/:id/smart-locker", optionalAuthenticate, assignSmartLockerDelivery);
router.post("/:id/carbon-certificate", optionalAuthenticate, issueCarbonOffsetCertificate);
router.post("/:id/doorstep-return-pickup", optionalAuthenticate, scheduleDoorstepReturnPickup);
router.post("/:id/fraud-risk-audit", optionalAuthenticate, evaluateOrderFraudRisk);
router.post("/:id/cod-reconcile", optionalAuthenticate, reconcileAutomatedCodSettlement);
router.post("/:id/claim-late-compensation", optionalAuthenticate, claimLateDeliveryCompensation);
router.post("/:id/ai-damage-claim", optionalAuthenticate, evaluateAiDamageClaim);
router.post("/:id/consolidate-packaging", optionalAuthenticate, consolidateOrderPackaging);
router.post("/:id/cold-chain", optionalAuthenticate, updatePriorityColdChainDispatch);
router.post("/:id/doorstep-trade-in", optionalAuthenticate, submitDoorstepApplianceTradeIn);

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


