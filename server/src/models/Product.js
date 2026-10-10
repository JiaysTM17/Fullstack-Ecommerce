import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: "No brand",
    },
    stock: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    shopId: {
      type: String,
      required: true,
      default: "shop_01",
      index: true,
    },
    shopName: {
      type: String,
      default: "",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    isFastDelivery: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      default: null,
    },
    safetyThreshold: {
      type: Number,
      default: 10,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    clearanceStatus: {
      type: String,
      enum: ["normal", "near_expiry", "clearance"],
      default: "normal",
    },
    clearanceDiscount: {
      type: Number,
      default: 0,
    },
    batchCode: {
      type: String,
      default: "",
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);

const Product = new Proxy(ProductModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.products[prop]) {
      return memoryStore.products[prop];
    }
    return target[prop];
  },
});

export default Product;
