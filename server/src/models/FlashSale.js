import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const flashSaleItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    flashPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    stockLimit: { type: Number, default: 10 },
    soldCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const flashSaleSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, default: "" },
    slotTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "upcoming", "ended"],
      default: "upcoming",
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    items: [flashSaleItemSchema],
  },
  { timestamps: true }
);

const FlashSaleModel = mongoose.models.FlashSale || mongoose.model("FlashSale", flashSaleSchema);

const FlashSale = new Proxy(FlashSaleModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.flashSales[prop]) {
      return memoryStore.flashSales[prop];
    }
    return target[prop];
  },
});

export default FlashSale;
