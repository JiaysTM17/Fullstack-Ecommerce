import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    banner: { type: String, default: "" },
    type: { type: String, enum: ["MEGA_SALE", "FLASH_SALE", "CATEGORY_DAY", "BRAND_FEST"], default: "MEGA_SALE" },
    status: { type: String, enum: ["upcoming", "active", "ended"], default: "upcoming" },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    discountMinPercent: { type: Number, default: 10 },
    subsidizedByPlatform: { type: Number, default: 5 }, // Platform subsidizes 5% discount
    participatingShops: [
      {
        shopId: { type: String, required: true },
        shopName: { type: String, default: "" },
        registeredAt: { type: String, default: () => new Date().toISOString() },
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
        productIds: [{ type: String }],
      },
    ],
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
