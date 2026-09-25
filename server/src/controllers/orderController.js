import Order from "../models/Order.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customer, items, subtotal, shippingFee, total, paymentMethod } = req.body;

    // Validation
    if (!customer || !customer.fullName || !customer.phone || !customer.email || !customer.address) {
      return sendError(res, "Customer information is required", 400);
    }

    if (!items || items.length === 0) {
      return sendError(res, "Order items cannot be empty", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return sendError(res, "Invalid email format", 400);
    }

    // Validate phone format (9-11 digits)
    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(customer.phone.replace(/\s/g, ""))) {
      return sendError(res, "Phone number must be 9-11 digits", 400);
    }

    // Create order
    const order = await Order.create({
      customer,
      items,
      subtotal: subtotal || 0,
      shippingFee: shippingFee || 0,
      total: total || 0,
      paymentMethod: paymentMethod || "COD",
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
