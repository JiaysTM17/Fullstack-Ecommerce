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
