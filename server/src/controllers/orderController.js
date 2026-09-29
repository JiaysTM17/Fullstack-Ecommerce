import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Create a new order — with stock deduction + userId linking
// @route   POST /api/orders
// @access  Public (guest checkout) or Private (authenticated)
export const createOrder = async (req, res) => {
  try {
    const { customer, items, subtotal, shippingFee, shippingDiscount, voucherCode, voucherDiscount, coinsUsed, coinDiscount, total, paymentMethod } = req.body;

    // Validate required fields
    if (!customer?.fullName || !customer?.phone || !customer?.address) {
      return sendError(res, "Thông tin khách hàng (họ tên, SĐT, địa chỉ) là bắt buộc", 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, "Đơn hàng phải có ít nhất 1 sản phẩm", 400);
    }
    if (!total || total <= 0) {
      return sendError(res, "Tổng tiền thanh toán không hợp lệ", 400);
    }

    // === STOCK DEDUCTION — Decrease product stock for each item ===
    for (const item of items) {
      if (item.productId) {
        const product = await Product.findOne({ _id: item.productId });
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 1));
          const newSold = (product.sold || 0) + (item.quantity || 1);
          product.stock = newStock;
          product.sold = newSold;
          await product.save();
        }
      }
    }

    // === VOUCHER USAGE — Increment used count ===
    if (voucherCode) {
      const voucher = await memoryStore.vouchers.findOne({ code: voucherCode.toUpperCase() });
      if (voucher) {
        voucher.usedCount = (voucher.usedCount || 0) + 1;
        await voucher.save();
      }
    }

    // === COINS DEDUCTION — Deduct from user balance ===
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (userId && coinsUsed > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.coins = Math.max(0, (user.coins || 0) - coinsUsed);
        await user.save();
      }
    }

    // Enrich items with default shopId
    const enrichedItems = items.map((item) => ({
      ...item,
      shopId: item.shopId || "shop_01",
      shopName: item.shopName || "",
      status: "pending",
    }));

    const order = await Order.create({
      userId: userId || null,
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        email: customer.email?.trim() || "",
        address: customer.address.trim(),
        note: customer.note || "",
      },
      items: enrichedItems,
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
      shippingDiscount: Number(shippingDiscount) || 0,
      voucherCode: voucherCode || "",
      voucherDiscount: Number(voucherDiscount) || 0,
      coinsUsed: Number(coinsUsed) || 0,
      coinDiscount: Number(coinDiscount) || 0,
      total: Number(total),
      paymentMethod: paymentMethod || "COD",
      status: "pending",
      trackingCode: `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timeline: [
        { time: new Date().toISOString(), text: "Đơn hàng đã được đặt thành công" },
      ],
    });

    // === CLEAR CART after successful order ===
    if (userId) {
      memoryStore.carts.clearByUserId(userId);
    }

    // === COINS REWARD — Give back coins for completed purchase ===
    if (userId) {
      const coinsEarned = Math.floor(total / 1000); // 1 coin per 1,000₫ spent
      const user = await User.findById(userId);
      if (user) {
        user.coins = (user.coins || 0) + coinsEarned;
        await user.save();
      }
    }

    sendSuccess(res, {
      order,
      message: "Đặt hàng thành công!",
      coinsEarned: userId ? Math.floor(total / 1000) : 0,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get orders for current user
// @route   GET /api/orders/mine
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const orders = await Order.find(query).sort({ createdAt: -1 });
    const total = await Order.countDocuments(query);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const paged = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    sendSuccess(res, {
      orders: paged,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    // Check ownership (unless admin)
    const userId = req.user._id || req.user.id;
    if (req.user.role !== "admin" && order.userId && order.userId !== userId) {
      return sendError(res, "Bạn không có quyền xem đơn hàng này", 403);
    }

    sendSuccess(res, order);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Cancel an order (customer can cancel pending orders)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    const userId = req.user._id || req.user.id;
    if (order.userId && order.userId !== userId && req.user.role !== "admin") {
      return sendError(res, "Bạn không có quyền hủy đơn hàng này", 403);
    }

    if (order.status !== "pending") {
      return sendError(res, "Chỉ có thể hủy đơn hàng ở trạng thái 'Chờ xác nhận'", 400);
    }

    // Restore stock
    for (const item of order.items || []) {
      if (item.productId) {
        const product = await Product.findOne({ _id: item.productId });
        if (product) {
          product.stock = (product.stock || 0) + (item.quantity || 1);
          product.sold = Math.max(0, (product.sold || 0) - (item.quantity || 1));
          await product.save();
        }
      }
    }

    // Restore coins
    if (order.userId && order.coinsUsed > 0) {
      const user = await User.findById(order.userId);
      if (user) {
        user.coins = (user.coins || 0) + order.coinsUsed;
        await user.save();
      }
    }

    order.status = "cancelled";
    await order.save();

    sendSuccess(res, { order, message: "Đã hủy đơn hàng thành công" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get real-time SPX logistics tracking for an order
// @route   GET /api/orders/:id/tracking
// @access  Public / Authenticated
export const getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ trackingCode: id });
    }

    if (!order) {
      return sendError(res, "Không tìm thấy thông tin đơn hàng hoặc mã vận đơn", 404);
    }

    const trackingCode = order.trackingCode || `SPX-VN-${String(order._id || order.id || "").slice(-8).toUpperCase() || "84729104"}`;
    const orderDate = new Date(order.createdAt || Date.now());
    const estimatedDate = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const stages = [
      {
        stage: "placed",
        title: "Đơn hàng đã đặt",
        desc: "Khách hàng đã hoàn tất thanh toán/đặt hàng thành công",
        timestamp: orderDate.toISOString(),
        completed: true,
      },
      {
        stage: "confirmed",
        title: "Shop đã xác nhận & Đóng gói",
        desc: `Shop ${order.items?.[0]?.shopName || "Thời Trang GenZ"} đã đóng gói kiện hàng`,
        timestamp: new Date(orderDate.getTime() + 2 * 3600 * 1000).toISOString(),
        completed: ["confirmed", "shipping", "completed"].includes(order.status),
      },
      {
        stage: "shipping",
        title: "Đang vận chuyển (SPX Express)",
        desc: "Kiện hàng đã rời kho trung chuyển Tân Bình, đang trên đường giao",
        timestamp: new Date(orderDate.getTime() + 8 * 3600 * 1000).toISOString(),
        completed: ["shipping", "completed"].includes(order.status),
        active: order.status === "shipping",
      },
      {
        stage: "delivered",
        title: "Giao hàng thành công",
        desc: "Người nhận đã kiểm tra và ký nhận hàng nguyên vẹn",
        timestamp: new Date(orderDate.getTime() + 24 * 3600 * 1000).toISOString(),
        completed: order.status === "completed",
      },
    ];

    const trackingData = {
      orderId: order._id || order.id,
      trackingCode,
      carrier: "SPX Express Standard",
      carrierHotline: "1900 1221",
      status: order.status,
      statusText:
        order.status === "completed"
          ? "Đã giao hàng thành công"
          : order.status === "shipping"
          ? "Đang giao hàng"
          : order.status === "confirmed"
          ? "Shop đang đóng gói"
          : order.status === "cancelled"
          ? "Đơn hàng đã hủy"
          : "Chờ người bán xác nhận",
      estimatedDelivery: estimatedDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      courier: {
        name: "Nguyễn Văn Hùng",
        phone: "0908 123 456",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        vehicle: "Xe máy - Biển số 29B1-892.45",
        rating: 4.95,
      },
      currentLocation: {
        lat: 10.7769,
        lng: 106.7009,
        label: "Bưu cục phát SPX Express Tân Bình, TP. Hồ Chí Minh",
        lastUpdated: new Date().toISOString(),
      },
      stages,
      timeline: order.timeline && order.timeline.length > 0 ? order.timeline : stages.filter((s) => s.completed),
    };

    sendSuccess(res, trackingData);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get Electronic VAT Invoice for an order
// @route   GET /api/orders/:id/invoice
// @access  Public / Authenticated
export const getOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ trackingCode: id });
    }
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    const vatRate = 0.08; // 8% VAT
    const netSubtotal = Math.round(order.subtotal / (1 + vatRate));
    const vatAmount = order.subtotal - netSubtotal;

    const invoiceData = {
      invoiceNumber: `HD-${String(order._id || order.id).slice(-8).toUpperCase()}`,
      invoiceSerial: "1C26MMS",
      templateCode: "01GTKT0/001",
      issueDate: order.createdAt || new Date().toISOString(),
      seller: {
        companyName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        taxCode: "0316892345",
        address: "Tầng 18, Tòa nhà Saigon Centre, 65 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        phone: "1900 1221",
        email: "cskh@minishopee.vn",
      },
      buyer: {
        fullName: order.customer?.fullName || "Khách Hàng Mini Shopee",
        phone: order.customer?.phone || "",
        email: order.customer?.email || "",
        address: order.customer?.address || "",
        taxCode: order.customer?.taxCode || "Cá nhân không kinh doanh",
      },
      items: (order.items || []).map((it, idx) => ({
        index: idx + 1,
        name: it.name,
        quantity: it.quantity || 1,
        unitPrice: it.price,
        amount: (it.price || 0) * (it.quantity || 1),
        vatRate: "8%",
      })),
      pricing: {
        subtotal: order.subtotal,
        netSubtotal,
        vatAmount,
        shippingFee: order.shippingFee || 0,
        shippingDiscount: order.shippingDiscount || 0,
        voucherDiscount: order.voucherDiscount || 0,
        coinDiscount: order.coinDiscount || 0,
        total: order.total,
      },
      digitalSignature: {
        signedBy: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE",
        signedDate: order.createdAt || new Date().toISOString(),
        verified: true,
      },
      qrCodeString: `https://minishopee.vn/invoice/verify?id=${order._id || order.id}&serial=1C26MMS`,
    };

    sendSuccess(res, invoiceData);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { createOrder, getMyOrders, getOrderById, cancelOrder, getOrderTracking, getOrderInvoice };
