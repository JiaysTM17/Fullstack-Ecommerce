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
