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
