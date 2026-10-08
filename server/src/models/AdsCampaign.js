import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const adsCampaignSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, default: "" },
    campaignName: { type: String, required: true },
    type: {
      type: String,
      enum: ["SEARCH_ADS", "DISCOVERY_ADS", "SHOP_ADS"],
      default: "SEARCH_ADS",
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "draft"],
      default: "active",
    },
    budgetDaily: { type: Number, default: 50000 },
    budgetTotal: { type: Number, default: 1000000 },
    spent: { type: Number, default: 0 },
    targetKeywords: [
      {
        keyword: { type: String, required: true },
        bidPrice: { type: Number, default: 1000 },
        matchType: { type: String, enum: ["exact", "broad"], default: "exact" },
      },
    ],
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRevenue: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const AdsCampaignModel = mongoose.models.AdsCampaign || mongoose.model("AdsCampaign", adsCampaignSchema);

const AdsCampaign = new Proxy(AdsCampaignModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.adsCampaigns[prop]) {
      return memoryStore.adsCampaigns[prop];
    }
    return target[prop];
  },
});

export default AdsCampaign;
