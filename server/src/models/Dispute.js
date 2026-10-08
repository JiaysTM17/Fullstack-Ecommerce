import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const disputeSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    shopId: { type: String, required: true },
    shopName: { type: String, required: true },
    reason: { type: String, required: true },
    claimAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["opened", "under_review", "resolved_refund", "resolved_rejected", "cancelled"],
      default: "opened",
    },
    evidence: { type: [String], default: [] },
    shopResponse: { type: String, default: "" },
    arbitrationNote: { type: String, default: "" },
    resolvedBy: { type: String, default: "" },
    resolvedAt: { type: String, default: null },
  },
  { timestamps: true }
);

const DisputeModel = mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema);

const Dispute = new Proxy(DisputeModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.disputes[prop]) {
      return memoryStore.disputes[prop];
    }
    return target[prop];
  },
});

export default Dispute;
