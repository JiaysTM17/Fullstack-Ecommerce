import mongoose from "mongoose";
import memoryStore from "./memoryStore.js";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    currentStock: { type: Number, default: 0 },
    safetyThreshold: { type: Number, default: 10 },
    reorderQuantity: { type: Number, required: true, min: 1 },
    estimatedUnitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true },
    shopId: { type: String, required: true, index: true },
    shopName: { type: String, default: "" },
    supplier: {
      name: { type: String, required: true },
      contact: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    items: [purchaseOrderItemSchema],
    totalEstimatedCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "DISPATCHED", "RECEIVED", "CANCELLED"],
      default: "DRAFT",
    },
    notes: { type: String, default: "" },
    expectedDeliveryDate: { type: String, default: "" },
  },
  { timestamps: true }
);

const PurchaseOrderModel =
  mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", purchaseOrderSchema);

const PurchaseOrder = new Proxy(PurchaseOrderModel, {
  get(target, prop) {
    if (mongoose.connection.readyState === 1) {
      return target[prop];
    }
    if (memoryStore.purchaseOrders && memoryStore.purchaseOrders[prop]) {
      return memoryStore.purchaseOrders[prop];
    }
    return target[prop];
  },
});

export default PurchaseOrder;
