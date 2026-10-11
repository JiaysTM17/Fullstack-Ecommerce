import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      address: { type: String, required: true },
      note: { type: String, default: "" },
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.Mixed, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        shopId: { type: String, required: true, default: "shop_01", index: true },
        shopName: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
          default: "pending",
        },
      },
    ],
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    shippingDiscount: { type: Number, default: 0 },
    shippingVoucherCode: { type: String, default: "" },
    shippingVoucherDiscount: { type: Number, default: 0 },
    voucherCode: { type: String, default: "" },
    voucherDiscount: { type: Number, default: 0 },
    coinsUsed: { type: Number, default: 0 },
    coinDiscount: { type: Number, default: 0 },
    tripleVouchers: {
      freeship: {
        code: { type: String, default: "" },
        discount: { type: Number, default: 0 },
      },
      shopVoucher: {
        code: { type: String, default: "" },
        discount: { type: Number, default: 0 },
      },
      platformVoucher: {
        code: { type: String, default: "" },
        discount: { type: Number, default: 0 },
      },
      coinDiscount: { type: Number, default: 0 },
      coinsRedeemed: { type: Number, default: 0 },
    },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "BANK_TRANSFER", "MOMO", "VNPAY"], default: "COD" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled", "returning"],
      default: "pending",
    },
    idempotencyKey: { type: String, default: null, index: true },
    reservationId: { type: String, default: null },
    trackingCode: { type: String, default: "" },
    carrierPartner: {
      type: String,
      enum: ["SPX_EXPRESS", "VIETTEL_POST", "GHN_EXPRESS"],
      default: "SPX_EXPRESS",
    },
    shippingHub: { type: String, default: "Kho Phân Loại Trung Tâm Sài Gòn SOC" },
    csatFeedback: {
      rating: { type: Number, min: 1, max: 5, default: null }, // 1 to 5 stars
      deliverySpeedRating: { type: Number, min: 1, max: 5, default: null },
      courierAttitudeRating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: "" },
      submittedAt: { type: String, default: null },
    },
    giftWrap: {
      enabled: { type: Boolean, default: false },
      fee: { type: Number, default: 0 },
      theme: { type: String, enum: ["STANDARD", "LUXURY_RED", "PASTEL_PINK", "BIRTHDAY_CELEBRATION"], default: "STANDARD" },
      greetingMessage: { type: String, default: "" },
      recipientName: { type: String, default: "" },
      senderName: { type: String, default: "" },
    },
    deliveryReschedule: {
      status: {
        type: String,
        enum: ["none", "requested", "confirmed", "rejected"],
        default: "none",
      },
      requestedDate: { type: String, default: null }, // e.g. "2026-10-15"
      timeSlot: {
        type: String,
        enum: ["ANYTIME", "MORNING_8_12", "AFTERNOON_13_17", "EVENING_18_21"],
        default: "ANYTIME",
      },
      note: { type: String, default: "" },
      rescheduledAt: { type: String, default: null },
      courierConfirmedAt: { type: String, default: null },
    },
    doorstepInspection: {
      enabled: { type: Boolean, default: false },
      fee: { type: Number, default: 0 }, // Miễn phí dịch vụ bảo chứng Shopee Đồng Kiểm
      status: {
        type: String,
        enum: ["none", "requested", "inspected_passed", "inspected_rejected"],
        default: "none",
      },
      inspectorCourierName: { type: String, default: "" },
      inspectionNote: { type: String, default: "" },
      inspectedAt: { type: String, default: null },
      photoProof: { type: [String], default: [] },
    },
    warrantyProtection: {
      enabled: { type: Boolean, default: false },
      planId: { type: String, default: null },
      planName: { type: String, default: "" },
      durationMonths: { type: Number, default: 0 },
      fee: { type: Number, default: 0 },
      certificateCode: { type: String, default: null },
      activatedAt: { type: String, default: null },
    },
    deliveryAttempts: {
      totalAttempts: { type: Number, default: 0 },
      maxAttempts: { type: Number, default: 3 },
      currentStatus: {
        type: String,
        enum: ["scheduled", "in_transit", "failed_attempt", "delivered", "returned_to_hub"],
        default: "scheduled",
      },
      history: [
        {
          attemptNumber: { type: Number, required: true },
          attemptedAt: { type: String, required: true },
          courierName: { type: String, default: "Bưu tá SPX Express" },
          reason: {
            type: String,
            enum: [
              "CUSTOMER_UNREACHABLE",
              "CUSTOMER_RESCHEDULED",
              "INCORRECT_ADDRESS",
              "SECURITY_GATE_DENIED",
              "FORCE_MAJEURE_WEATHER",
            ],
            default: "CUSTOMER_UNREACHABLE",
          },
          reasonNote: { type: String, default: "" },
          proofPhoto: { type: String, default: "" },
          nextScheduledSlot: { type: String, default: null },
        },
      ],
      escalatedToCustomerCare: { type: Boolean, default: false },
    },
    unboxingVideoProof: {
      hasVideo: { type: Boolean, default: false },
      videoUrl: { type: String, default: "" },
      uploadedAt: { type: String, default: null },
      sha256Hash: { type: String, default: "" },
      durationSeconds: { type: Number, default: 0 },
      verificationStatus: {
        type: String,
        enum: ["none", "uploaded", "verified", "rejected"],
        default: "none",
      },
      verifiedBy: { type: String, default: null },
      verifiedAt: { type: String, default: null },
      verificationNote: { type: String, default: "" },
    },
    oneClickReorderSuite: {
      isReordered: { type: Boolean, default: false },
      reorderCount: { type: Number, default: 0 },
      lastReorderedAt: { type: String, default: null },
      reorderVoucherApplied: { type: String, default: "" },
      reorderSavings: { type: Number, default: 0 },
    },
    multiWarehouseRouting: {
      isSplitOrder: { type: Boolean, default: false },
      fulfillmentHubs: [
        {
          hubId: { type: String, default: "" },
          hubName: { type: String, default: "" },
          region: { type: String, default: "HANOI" },
          itemsCount: { type: Number, default: 0 },
          estimatedDistanceKm: { type: Number, default: 0 },
          dispatchedStatus: { type: String, default: "pending" },
        },
      ],
      primaryOriginHub: { type: String, default: "" },
      carbonSavedKg: { type: Number, default: 0 },
    },
    dynamicAddressCorrection: {
      isModified: { type: Boolean, default: false },
      originalAddress: { type: String, default: "" },
      correctedAddress: { type: String, default: "" },
      correctionReason: { type: String, default: "" },
      modifiedAt: { type: String, default: null },
      lockStatus: {
        type: String,
        enum: ["open", "locked_in_transit"],
        default: "open",
      },
    },
    ecoPackagingContribution: {
      isOptedIn: { type: Boolean, default: false },
      boxType: {
        type: String,
        enum: ["standard", "biodegradable_honeycomb", "reusable_shoebox"],
        default: "standard",
      },
      treePlantContribution: { type: Number, default: 0 },
      plasticFreeGuaranteed: { type: Boolean, default: false },
      rewardCoinsIssued: { type: Number, default: 0 },
    },
    contactlessLockerDelivery: {
      isRequested: { type: Boolean, default: false },
      lockerStationId: { type: String, default: "" },
      lockerStationName: { type: String, default: "" },
      lockerStationAddress: { type: String, default: "" },
      compartmentPinCode: { type: String, default: "" },
      compartmentId: { type: String, default: "" },
      pinExpiresAt: { type: String, default: null },
      pickupStatus: {
        type: String,
        enum: ["none", "allocated", "delivered_in_locker", "picked_up", "expired_returned"],
        default: "none",
      },
      pickedUpAt: { type: String, default: null },
    },
    carbonOffsetCert: {
      isIssued: { type: Boolean, default: false },
      certificateId: { type: String, default: "" },
      carbonOffsetKg: { type: Number, default: 0 },
      issuedAt: { type: String, default: null },
      treeUnitsPlanted: { type: Number, default: 0 },
      certPdfUrl: { type: String, default: "" },
      nftBadgeCode: { type: String, default: "" },
    },
    doorstepReturnPickup: {
      isBooked: { type: Boolean, default: false },
      appointmentDate: { type: String, default: null },
      timeWindow: {
        type: String,
        enum: ["anytime", "morning_8_12", "afternoon_13_17", "evening_18_20"],
        default: "anytime",
      },
      courierName: { type: String, default: "" },
      courierPhone: { type: String, default: "" },
      pickupStatus: {
        type: String,
        enum: ["none", "scheduled", "courier_assigned", "picked_up", "returned_to_hub"],
        default: "none",
      },
      pickupAddress: { type: String, default: "" },
      pickupNote: { type: String, default: "" },
    },
    fraudRiskScore: {
      riskScore: { type: Number, default: 0 },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
      },
      flags: { type: [String], default: [] },
      scannedAt: { type: String, default: null },
      actionTaken: {
        type: String,
        enum: ["none", "allowed", "flagged_for_manual_review", "cod_disabled", "account_frozen"],
        default: "allowed",
      },
    },
    automatedCodSettlement: {
      settlementId: { type: String, default: "" },
      amountCollected: { type: Number, default: 0 },
      courierHandoverStatus: {
        type: String,
        enum: ["pending_collection", "courier_cash_held", "hub_verified", "platform_cleared", "seller_remitted"],
        default: "pending_collection",
      },
      verifiedAt: { type: String, default: null },
      remittedAt: { type: String, default: null },
      reconciliationRef: { type: String, default: "" },
    },
    lateDeliveryCompensation: {
      isEligible: { type: Boolean, default: false },
      promiseDeliveryDate: { type: String, default: null },
      actualDeliveredDate: { type: String, default: null },
      delayHours: { type: Number, default: 0 },
      compensationVoucherCode: { type: String, default: "" },
      compensationAmount: { type: Number, default: 0 },
      claimStatus: {
        type: String,
        enum: ["none", "eligible_unclaimed", "auto_credited", "expired"],
        default: "none",
      },
      claimedAt: { type: String, default: null },
    },
    aiDamageClaimEvaluation: {
      hasClaim: { type: Boolean, default: false },
      claimId: { type: String, default: "" },
      damageSeverityPercent: { type: Number, default: 0 },
      detectedFlaws: { type: [String], default: [] },
      instantPartialRefundOffered: { type: Number, default: 0 },
      acceptedByBuyer: { type: Boolean, default: false },
      evaluationVerdict: {
        type: String,
        enum: ["none", "minor_scratch", "cracked_screen_or_shell", "severe_unusable", "fraud_suspected"],
        default: "none",
      },
      evaluatedAt: { type: String, default: null },
      refundStatus: {
        type: String,
        enum: ["none", "partial_refund_credited", "full_return_requested", "rejected"],
        default: "none",
      },
    },
    consolidatedPackagingSuite: {
      isConsolidated: { type: Boolean, default: false },
      consolidationHub: { type: String, default: "SPX Logistics Sorting Center Tân Bình" },
      consolidatedBoxesCount: { type: Number, default: 1 },
      participatingShops: { type: [String], default: [] },
      packagingMaterialsSavedKg: { type: Number, default: 0 },
      shippingFeeSaved: { type: Number, default: 0 },
      consolidationStatus: {
        type: String,
        enum: ["none", "awaiting_items", "bundled_in_hub", "dispatched_single_box"],
        default: "none",
      },
      consolidatedAt: { type: String, default: null },
    },
    priorityColdChainDispatch: {
      isColdChain: { type: Boolean, default: false },
      sensorSerial: { type: String, default: "" },
      minTempCelsius: { type: Number, default: 0 },
      maxTempCelsius: { type: Number, default: 4 },
      currentTempCelsius: { type: Number, default: 2.5 },
      thermalInsulationBox: {
        type: String,
        enum: ["none", "dry_ice_pack", "gel_ice_sealed", "smart_refrigerated_container"],
        default: "none",
      },
      tempBreachAlert: { type: Boolean, default: false },
      lastSensorSyncAt: { type: String, default: null },
    },
    doorstepOldApplianceTradeIn: {
      isTradeInRequested: { type: Boolean, default: false },
      applianceType: {
        type: String,
        enum: ["none", "smartphone", "laptop", "tablet", "refrigerator", "washing_machine", "television"],
        default: "none",
      },
      deviceBrandModel: { type: String, default: "" },
      cosmeticCondition: {
        type: String,
        enum: ["like_new", "minor_wear", "cracked_or_faulty"],
        default: "like_new",
      },
      subsidyCreditAmount: { type: Number, default: 0 },
      recycleCertificateCode: { type: String, default: "" },
      pickupCourierName: { type: String, default: "" },
      tradeInStatus: {
        type: String,
        enum: ["none", "scheduled_pickup", "inspected_at_doorstep", "subsidy_credited", "e_waste_recycled"],
        default: "none",
      },
      creditedAt: { type: String, default: null },
    },
    autonomousDroneDelivery: {
      isDroneEligible: { type: Boolean, default: false },
      droneCallsign: { type: String, default: "" },
      flightAltitudeMeters: { type: Number, default: 120 },
      flightSpeedKmh: { type: Number, default: 65 },
      batteryLevelPercent: { type: Number, default: 92 },
      helipadCoordinates: {
        lat: { type: Number, default: 10.7769 },
        lng: { type: Number, default: 106.7009 },
      },
      tetherDropStatus: {
        type: String,
        enum: ["none", "takeoff_clearance", "airborne_cruise", "hovering_above_pad", "winch_cable_lowered", "landed_safely"],
        default: "none",
      },
      windSpeedKnots: { type: Number, default: 8.5 },
      flightLogId: { type: String, default: "" },
    },
    coldChainInsuranceCompensation: {
      hasInsurance: { type: Boolean, default: false },
      policyId: { type: String, default: "" },
      coverageAmount: { type: Number, default: 0 },
      breachDetected: { type: Boolean, default: false },
      autoClaimStatus: {
        type: String,
        enum: ["none", "monitoring", "breach_verified", "payout_settled", "claim_rejected"],
        default: "none",
      },
      payoutAmount: { type: Number, default: 0 },
      settledAt: { type: String, default: null },
      insuranceProvider: { type: String, default: "Shopee Bảo Hiểm Hàng Lạnh Toàn Diện" },
    },
    solarFleetGreenRouting: {
      isGreenFleet: { type: Boolean, default: false },
      vehicleType: {
        type: String,
        enum: ["none", "electric_van", "solar_cargo_bike", "ev_scooter"],
        default: "none",
      },
      fleetId: { type: String, default: "" },
      routeOptimizationEfficiencyPercent: { type: Number, default: 0 },
      co2AvoidedGrams: { type: Number, default: 0 },
      solarEnergyHarvestedWh: { type: Number, default: 0 },
      ecoDriverRating: { type: Number, default: 5.0 },
    },
    realTimeParcelRerouting: {
      isRerouted: { type: Boolean, default: false },
      originalCoordinates: {
        lat: { type: Number, default: 10.7769 },
        lng: { type: Number, default: 106.7009 },
      },
      newCoordinates: {
        lat: { type: Number, default: 10.7801 },
        lng: { type: Number, default: 106.6992 },
      },
      reroutedAddress: { type: String, default: "" },
      deliveryTimeWindow: {
        type: String,
        enum: ["morning_08_12", "afternoon_13_17", "evening_18_21", "weekend_priority"],
        default: "afternoon_13_17",
      },
      additionalDistanceKm: { type: Number, default: 0 },
      rerouteFeeCharged: { type: Number, default: 0 },
      courierAckStatus: {
        type: String,
        enum: ["none", "pending_courier_ack", "reroute_accepted", "route_recalculated"],
        default: "none",
      },
      reroutedAt: { type: String, default: null },
    },
    fragileShockSensorTelemetry: {
      isFragileMonitored: { type: Boolean, default: false },
      shockSensorId: { type: String, default: "" },
      maxGForceLimit: { type: Number, default: 2.5 },
      recordedGForce: { type: Number, default: 1.1 },
      impactExceeded: { type: Boolean, default: false },
      dropEventCount: { type: Number, default: 0 },
      autoClaimInsuranceStatus: {
        type: String,
        enum: ["none", "safe_transit", "impact_breached", "compensation_disbursed"],
        default: "none",
      },
      insuranceCompensationAmount: { type: Number, default: 0 },
      lastTelemetrySyncAt: { type: String, default: null },
    },
    multiCarrierCarbonLedger: {
      isLedgerRecorded: { type: Boolean, default: false },
      carrierCode: {
        type: String,
        enum: ["SPX_EXPRESS", "GHN_EXPRESS", "VIETTEL_POST", "JNT_EXPRESS"],
        default: "SPX_EXPRESS",
      },
      carrierConsortiumBatchId: { type: String, default: "" },
      carbonCreditsOffset: { type: Number, default: 0 },
      blockchainVerificationHash: { type: String, default: "" },
      greenAuditStatus: {
        type: String,
        enum: ["none", "pending_batch", "hash_verified", "gold_standard_certified"],
        default: "none",
      },
      verifiedAt: { type: String, default: null },
    },
    aiVideoReturnResaleGrading: {
      hasEvaluated: { type: Boolean, default: false },
      videoAnalysisId: { type: String, default: "" },
      resaleGrade: {
        type: String,
        enum: ["grade_a_pristine", "grade_b_open_box", "grade_c_refurbished", "grade_d_salvage_parts"],
        default: "grade_a_pristine",
      },
      restockingFeeDeductionPercent: { type: Number, default: 0 },
      estimatedResaleValueVnd: { type: Number, default: 0 },
      secondaryMarketChannel: {
        type: String,
        enum: ["shopee_outlet", "refurbished_mall", "b2b_liquidation_auction"],
        default: "shopee_outlet",
      },
      gradedAt: { type: String, default: null },
    },
    acousticAntiTamperTelemetry: {
      isAcousticMonitored: { type: Boolean, default: false },
      sensorId: { type: String, default: null },
      decibelSpikePeak: { type: Number, default: 0 },
      frequencySignature: { type: String, default: "ambient_transit" },
      tamperEventDetected: { type: Boolean, default: false },
      tapeCutPatternMatch: { type: Boolean, default: false },
      sealIntegrityStatus: {
        type: String,
        enum: ["pristine", "suspicious_vibration", "tampered_tape_cut", "critical_seal_breach"],
        default: "pristine",
      },
      alertTriggeredAt: { type: String, default: null },
      courierInterceptFlag: { type: Boolean, default: false },
      investigationRef: { type: String, default: null },
    },
    invoiceIssued: { type: Boolean, default: false },
    timeline: { type: Array, default: [] },
    returnRequest: {
      reason: { type: String, default: "" },
      evidence: { type: [String], default: [] },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      refundAmount: { type: Number, default: 0 },
      requestedAt: { type: String, default: null },
      respondedAt: { type: String, default: null },
      responseNote: { type: String, default: "" },
    },
    codFee: { type: Number, default: 0 },
    codSettlementStatus: {
      type: String,
      enum: ["uncollected", "collected_by_courier", "reconciled_with_platform", "remitted_to_seller"],
      default: "uncollected",
    },
    codReconciledAt: { type: String, default: null },
  },
  { timestamps: true }
);

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

const Order = new Proxy(OrderModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.orders[prop]) {
      return memoryStore.orders[prop];
    }
    return target[prop];
  },
});

export default Order;
