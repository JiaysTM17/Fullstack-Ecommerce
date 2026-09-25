import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone:    { type: String, required: true, trim: true },
      email:    { type: String, required: true, trim: true },
      address:  { type: String, required: true },
      note:     { type: String, default: "" },
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name:      { type: String, required: true },
        price:     { type: Number, required: true },
        image:     { type: String, required: true },
        quantity:  { type: Number, required: true, min: 1 },
      },
    ],
    subtotal:       { type: Number, required: true },
    shippingFee:    { type: Number, default: 0 },
    total:          { type: Number, required: true },
    paymentMethod:  { type: String, enum: ["COD", "BANK_TRANSFER", "MOMO", "VNPAY"], default: "COD" },
    status:         { type: String, enum: ["pending", "confirmed", "shipping", "completed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
