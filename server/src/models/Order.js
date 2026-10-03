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
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "BANK_TRANSFER", "MOMO", "VNPAY"], default: "COD" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled", "returning"],
      default: "pending",
    },
    trackingCode: { type: String, default: "" },
    invoiceIssued: { type: Boolean, default: false },
    timeline: { type: Array, default: [] },
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
