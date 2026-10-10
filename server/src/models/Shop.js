import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const shopSchema = new mongoose.Schema(
  {
    shopId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.Mixed, // Supports ObjectId or String in fallback
      required: true,
      index: true,
    },
    logo: {
      type: String,
      default: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    bankAccount: {
      bankName: {
        type: String,
        required: true,
        trim: true,
      },
      accountNumber: {
        type: String,
        required: true,
        trim: true,
      },
      accountName: {
        type: String,
        required: true,
        trim: true,
      },
    },
    commissionRate: {
      type: Number,
      default: 0.05,
      min: 0,
      max: 0.5,
    },
    status: {
      type: String,
      enum: ["pending", "active", "locked"],
      default: "active",
      index: true,
    },
    lockReason: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    followers: {
      type: Number,
      default: 0,
    },
    responseRate: {
      type: Number,
      default: 98,
      min: 0,
      max: 100,
    },
    responseTime: {
      type: String,
      default: "Trong 10 phút",
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    badges: {
      type: [String],
      default: ["Chính Hãng 100%"],
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    walletTransactions: {
      type: Array,
      default: [],
    },
    settlementStatus: {
      type: String,
      enum: ["pending", "processing", "settled"],
      default: "pending",
    },
    settledAt: {
      type: String,
      default: null,
    },
    shippingPolicy: {
      baseFee: { type: Number, default: 22000 },
      freeShipThreshold: { type: Number, default: 300000 },
      spxSubsidized: { type: Boolean, default: true },
      expressAvailable: { type: Boolean, default: true },
      expressSurcharge: { type: Number, default: 15000 },
    },
    operationalMetrics: {
      onTimeShipmentRate: { type: Number, default: 98.5 }, // % đơn giao SPX đúng hạn SLA
      lateShipmentRate: { type: Number, default: 1.5 },     // % giao trễ
      cancellationRate: { type: Number, default: 0.8 },     // % đơn shop hủy
      returnRate: { type: Number, default: 1.2 },           // % hàng trả lại
      sellerPenaltyPoints: { type: Number, default: 0 },    // Điểm phạt Sao Quả Tạ
      penaltyTier: { type: String, enum: ["TIER_0", "TIER_1", "TIER_2", "TIER_3"], default: "TIER_0" },
    },
    autoReply: {
      enabled: { type: Boolean, default: true },
      welcomeMessage: {
        type: String,
        default: "Cảm ơn bạn đã ghé thăm gian hàng! Shop đang chuẩn bị đơn và sẽ phản hồi tin nhắn trong ít phút ạ.",
      },
      offlineMessage: {
        type: String,
        default: "Hiện tại shop đang ngoài giờ làm việc (sau 22:00). Bạn vui lòng để lại lời nhắn, shop sẽ trả lời ngay khi mở cửa vào 8:00 sáng mai nhé!",
      },
      quickTemplates: {
        type: [
          {
            id: String,
            triggerKeyword: String,
            responseMessage: String,
          },
        ],
        default: [
          {
            id: "tpl_shipping",
            triggerKeyword: "khi nào giao",
            responseMessage: "Đơn hàng của bạn sẽ được bàn giao cho đơn vị vận chuyển SPX trong vòng 24 giờ kể từ khi xác nhận ạ!",
          },
          {
            id: "tpl_size",
            triggerKeyword: "tư vấn size",
            responseMessage: "Dạ bạn cho shop xin thông tin chiều cao và cân nặng để shop tư vấn size chuẩn form nhất cho bạn nhé!",
          },
        ],
      },
    },
    kycVerification: {
      status: {
        type: String,
        enum: ["UNVERIFIED", "PENDING_REVIEW", "VERIFIED", "REJECTED"],
        default: "VERIFIED",
      },
      businessType: {
        type: String,
        enum: ["INDIVIDUAL", "HOUSEHOLD", "ENTERPRISE"],
        default: "ENTERPRISE",
      },
      taxId: { type: String, default: "0318928172" },
      citizenId: { type: String, default: "079094001234" },
      businessLicenseNumber: { type: String, default: "GPKD-HCM-2024-889" },
      legalRepresentative: { type: String, default: "Nguyễn Văn Đại Diện" },
      verifiedAt: { type: String, default: "2026-01-15T08:00:00.000Z" },
      rejectedReason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

shopSchema.index({ name: "text", description: "text" });

const ShopModel = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

const Shop = new Proxy(ShopModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.shops[prop]) {
      return memoryStore.shops[prop];
    }
    return target[prop];
  },
});

export default Shop;
