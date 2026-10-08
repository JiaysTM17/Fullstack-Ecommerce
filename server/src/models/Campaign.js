import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const campaignSchema = new mongoose.Schema(
  {
    campaignId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    name: { type: String },
    description: { type: String, default: "" },
    banner: { type: String, default: "" },
    type: {
      type: String,
      enum: ["MEGA_SALE", "FLASH_SALE", "BRAND_FEST", "CATEGORY_DAY"],
      default: "MEGA_SALE",
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "paused", "ended"],
      default: "upcoming",
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    discountMinPercent: { type: Number, default: 10 },
    subsidizedByPlatform: { type: Number, default: 5 },
    participatingShops: { type: Array, default: [] },
  },
  { timestamps: true }
);

const CampaignModel = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

const Campaign = new Proxy(CampaignModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.campaigns[prop]) {
      return memoryStore.campaigns[prop];
    }
    return target[prop];
  },
});

export default Campaign;
