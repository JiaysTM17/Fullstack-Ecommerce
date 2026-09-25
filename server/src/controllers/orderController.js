import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customer, items, shippingFee = 0, paymentMethod } = req.body;

    // Validate customer
    if (!customer) {
      return sendError(res, "Customer information is required", 400);
    }

    const { fullName, phone, email, address } = customer;
    if (!fullName || !phone || !email || !address) {
      return sendError(res, "fullName, phone, email, address are required", 400);
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, "Invalid email format", 400);
    }

    // Validate phone (9-11 digits, strip spaces)
    const cleanPhone = phone.replace(/\s/g, "");
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return sendError(res, "Phone number must be 9-11 digits", 400);
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, "Order must contain at least one item", 400);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.name || item.price == null || !item.image || !item.quantity) {
        return sendError(res, `Item ${i + 1} is missing required fields (productId, name, price, image, quantity)`, 400);
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return sendError(res, `Item ${i + 1} quantity must be a positive integer`, 400);
      }
      if (typeof item.price !== "number" || item.price < 0) {
        return sendError(res, `Item ${i + 1} price must be a non-negative number`, 400);
      }
    }

    // Recompute totals server-side (don't trust client)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + (Number(shippingFee) || 0);

    // Validate paymentMethod
    const allowedMethods = ["COD", "BANK_TRANSFER", "MOMO", "VNPAY"];
    const method = allowedMethods.includes(paymentMethod) ? paymentMethod : "COD";

    const order = await Order.create({
      customer: {
        fullName,
        phone: cleanPhone,
        email,
        address,
        note: customer.note || "",
      },
      items,
      subtotal,
      shippingFee: Number(shippingFee) || 0,
      total,
      paymentMethod: method,
      status: "pending",
    });

    sendSuccess(
      res,
      {
        orderId: order._id,
        total: order.total,
        status: order.status,
        message: "Order created successfully",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export { createOrder };
