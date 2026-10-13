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
  rescheduleOrderDelivery,
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
  dispatchAutonomousDroneFlight,
  settleColdChainInsuranceClaim,
  optimizeSolarFleetGreenRouting,
  updateRealTimeParcelRerouting,
  updateFragileShockSensorTelemetry,
  recordMultiCarrierCarbonLedger,
  evaluateVideoReturnResaleGrading,
  updateAcousticAntiTamperTelemetry,
  updateMicroHubPouchLockBoxHandoff,
  verifyNfcGeofenceProofOfDelivery,
  scanHazardousMaterialSafety,
  updateDroneAirCorridorLandingBeacon,
  authorizeSmartLockInHomeDelivery,
  updateParcelMoistureTelemetry,
  updateFiberOpticMeshSeal,
  updateMobileVanRobotSwarmDispatch,
  auditThermoChromicColorShiftBarcode,
  launchUndergroundPneumaticCapsuleDispatch,
  monitorCryogenicFreezerDryIceTelemetry,
  monitorHyperbaricPressureAntiExplosionVault,
  updateSatelliteLoRaMeshDeadZoneTelemetry,
  verifyQuantumKeyDistributionEncryptionSeal,
  verifySyntheticDnaNanotechTaggingSeal,
  triggerInteractiveDoorbellGateRelease,
  triggerSmartLockerPinlessNfcTapAndGo,
  auditAcousticParcelDropTamper,
  updatePredictiveDeliveryWindowReroute,
  updateDoorstepUnattendedSafeDrop,
  reserveStock,
  releaseStock,
} from "../controllers/orderController.js";
import { authenticate, optionalAuthenticate, authorize } from "../middlewares/auth.js";
import { idempotencyGuard } from "../middlewares/idempotency.js";

const router = express.Router();

// Stock reservation endpoints (Cart/Checkout Guard)
router.post("/reserve-stock", optionalAuthenticate, reserveStock);
router.post("/release-stock", optionalAuthenticate, releaseStock);

// Order creation supports both guest and authenticated checkout with Enterprise Idempotency Guard
router.post("/", optionalAuthenticate, idempotencyGuard(), createOrder);

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
router.post("/:id/drone-dispatch", optionalAuthenticate, dispatchAutonomousDroneFlight);
router.post("/:id/cold-chain-insurance-claim", optionalAuthenticate, settleColdChainInsuranceClaim);
router.post("/:id/solar-green-fleet", optionalAuthenticate, optimizeSolarFleetGreenRouting);
router.post("/:id/realtime-reroute", optionalAuthenticate, updateRealTimeParcelRerouting);
router.post("/:id/fragile-shock-telemetry", optionalAuthenticate, updateFragileShockSensorTelemetry);
router.post("/:id/carrier-carbon-ledger", optionalAuthenticate, recordMultiCarrierCarbonLedger);
router.post("/:id/ai-return-resale-grading", optionalAuthenticate, evaluateVideoReturnResaleGrading);
router.post("/:id/acoustic-anti-tamper", optionalAuthenticate, updateAcousticAntiTamperTelemetry);
router.post("/:id/micro-hub-pouch-handoff", optionalAuthenticate, updateMicroHubPouchLockBoxHandoff);
router.post("/:id/nfc-geofence-pod", optionalAuthenticate, verifyNfcGeofenceProofOfDelivery);
router.post("/:id/hazmat-safety-scan", optionalAuthenticate, scanHazardousMaterialSafety);
router.post("/:id/drone-air-corridor-beacon", optionalAuthenticate, updateDroneAirCorridorLandingBeacon);
router.post("/:id/smart-lock-in-home-delivery", optionalAuthenticate, authorizeSmartLockInHomeDelivery);
router.post("/:id/moisture-telemetry", optionalAuthenticate, updateParcelMoistureTelemetry);
router.post("/:id/fiber-optic-mesh-seal", optionalAuthenticate, updateFiberOpticMeshSeal);
router.post("/:id/mobile-van-robot-swarm", optionalAuthenticate, updateMobileVanRobotSwarmDispatch);
router.post("/:id/thermochromic-barcode", optionalAuthenticate, auditThermoChromicColorShiftBarcode);
router.post("/:id/pneumatic-capsule", optionalAuthenticate, launchUndergroundPneumaticCapsuleDispatch);
router.post("/:id/cryogenic-dry-ice", optionalAuthenticate, monitorCryogenicFreezerDryIceTelemetry);
router.post("/:id/hyperbaric-explosion-vault", optionalAuthenticate, monitorHyperbaricPressureAntiExplosionVault);
router.post("/:id/satellite-lora-mesh", optionalAuthenticate, updateSatelliteLoRaMeshDeadZoneTelemetry);
router.post("/:id/qkd-encryption-seal", optionalAuthenticate, verifyQuantumKeyDistributionEncryptionSeal);
router.post("/:id/dna-nanotech-seal", optionalAuthenticate, verifySyntheticDnaNanotechTaggingSeal);
router.post("/:id/doorbell-gate-release", optionalAuthenticate, triggerInteractiveDoorbellGateRelease);
router.post("/:id/smart-locker-pinless-nfc", optionalAuthenticate, triggerSmartLockerPinlessNfcTapAndGo);
router.post("/:id/acoustic-drop-tamper", optionalAuthenticate, auditAcousticParcelDropTamper);
router.post("/:id/predictive-delivery-window", optionalAuthenticate, updatePredictiveDeliveryWindowReroute);
router.post("/:id/unattended-safe-drop", optionalAuthenticate, updateDoorstepUnattendedSafeDrop);

// Order workflow transitions
router.patch("/:id/confirm", authenticate, confirmOrder);
router.patch("/:id/ship", authenticate, shipOrder);
router.patch("/:id/deliver", authenticate, deliverOrder);
router.patch("/:id/complete", authenticate, completeOrder);

// Authenticated routes
router.get("/mine", authenticate, getMyOrders);
router.get("/my-orders", authenticate, getMyOrders); // Alias for flexible client compatibility
router.get("/:id/vat-invoice", optionalAuthenticate, getOrderInvoice); // Alias for /:id/invoice
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/cancel", authenticate, cancelOrder);
router.patch("/:id/return", authenticate, returnOrder);
router.post("/:id/repurchase", authenticate, repurchaseOrder);

export default router;


