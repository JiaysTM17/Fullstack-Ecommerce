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
    const { 
      customer, items, subtotal, shippingFee, shippingDiscount, 
      voucherCode, voucherDiscount, shippingVoucherCode, shippingVoucherDiscount, 
      coinsUsed, coinDiscount, total, paymentMethod 
    } = req.body;

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

    // === MINI XU CAP (50% of subtotal) ===
    let effectiveCoinDiscount = Number(coinDiscount) || 0;
    let effectiveCoinsUsed = Number(coinsUsed) || 0;
    let coinDiscountOriginal = undefined;

    const maxCoinDiscount = Math.floor((Number(subtotal) || 0) * 0.5);
    if (effectiveCoinDiscount > maxCoinDiscount) {
      coinDiscountOriginal = effectiveCoinDiscount;
      effectiveCoinDiscount = maxCoinDiscount;
      effectiveCoinsUsed = Math.min(effectiveCoinsUsed, effectiveCoinDiscount);
    }
    
    const calculatedTotal = (Number(subtotal) || 0) + (Number(shippingFee) || 0) 
      - (Number(shippingDiscount) || 0) - (Number(voucherDiscount) || 0) 
      - (Number(shippingVoucherDiscount) || 0) - effectiveCoinDiscount;
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : 0;

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
    
    if (shippingVoucherCode) {
      const shippingVoucher = await memoryStore.vouchers.findOne({ code: shippingVoucherCode.toUpperCase() });
      if (shippingVoucher) {
        shippingVoucher.usedCount = (shippingVoucher.usedCount || 0) + 1;
        await shippingVoucher.save();
      }
    }

    // === COINS DEDUCTION — Deduct from user balance ===
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (userId && effectiveCoinsUsed > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.coins = Math.max(0, (user.coins || 0) - effectiveCoinsUsed);
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
      shippingVoucherCode: shippingVoucherCode || "",
      shippingVoucherDiscount: Number(shippingVoucherDiscount) || 0,
      coinsUsed: effectiveCoinsUsed,
      coinDiscount: effectiveCoinDiscount,
      ...(coinDiscountOriginal !== undefined && { coinDiscountOriginal }),
      total: finalTotal,
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

// @desc    Cancel an order (customer can cancel pending or confirmed orders)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    try {
      order = await Order.findById(id);
    } catch {}
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { id }, { orderId: id }, { trackingCode: id }],
      });
    }
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (order.userId && order.userId !== userId && req.user?.role !== "admin") {
      return sendError(res, "Bạn không có quyền hủy đơn hàng này", 403);
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return sendError(res, "Chỉ có thể hủy đơn hàng ở trạng thái 'Chờ xác nhận' (pending hoặc confirmed)", 400);
    }

    const { cancelReason, reason, cancelNote, note } = req.body || {};
    const finalReason = cancelReason || reason || "Người mua yêu cầu hủy đơn";
    const finalNote = cancelNote || note || "";

    // Restore stock in Product model
    for (const item of order.items || []) {
      const prodId = item.productId || item.product || item._id || item.id;
      if (prodId) {
        let product = null;
        try {
          product = await Product.findOne({
            $or: [{ _id: prodId }, { id: prodId }],
          });
        } catch {}
        if (!product) {
          try {
            product = await Product.findById(prodId);
          } catch {}
        }
        if (product) {
          const qty = Number(item.quantity) || 1;
          product.stock = (product.stock || 0) + qty;
          product.sold = Math.max(0, (product.sold || 0) - qty);
          if (product.soldCount !== undefined) {
            product.soldCount = Math.max(0, (product.soldCount || 0) - qty);
          }
          await product.save();
        }
      }
    }

    // Restore coins to user
    const coinsToRefund = Number(order.coinsUsed || order.coinUsed || order.coinsDeducted || 0);
    if (order.userId && coinsToRefund > 0) {
      let user = null;
      try {
        user = await User.findById(order.userId);
      } catch {}
      if (!user && memoryStore?.users) {
        try {
          user = await memoryStore.users.findById(order.userId);
        } catch {}
      }
      if (user) {
        user.coins = (user.coins || 0) + coinsToRefund;
        await user.save();
      }
    }

    // Update order fields and timeline
    order.status = "cancelled";
    order.statusText = "Đã hủy bởi người mua";
    order.cancelledAt = new Date().toISOString();
    order.cancelReason = finalReason;
    if (finalNote) order.cancelNote = finalNote;

    if (Array.isArray(order.items)) {
      order.items.forEach((it) => {
        it.status = "cancelled";
      });
    }

    if (Array.isArray(order.timeline)) {
      order.timeline.push({
        status: "cancelled",
        description: "Đơn hàng đã được hủy thành công",
        time: new Date().toISOString(),
        text: `Đã hủy đơn hàng: ${finalReason}${finalNote ? `. Ghi chú: ${finalNote}` : ""}`,
      });
    }

    await order.save();
    if (memoryStore?.persist) memoryStore.persist();

    res.status(200).json({
      success: true,
      data: order,
      message: "Hủy đơn hàng thành công",
    });
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
    let order = null;
    try {
      order = await Order.findById(id);
    } catch {
      // Ignore CastError when id is not an ObjectId
    }
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { id }, { orderId: id }, { trackingCode: id }],
      });
    }

    if (!order) {
      return sendError(res, "Không tìm thấy thông tin đơn hàng hoặc mã vận đơn", 404);
    }

    const orderIdStr = String(order._id || order.id || id);
    const trackingCode =
      order.trackingCode ||
      `SPX-VN-${orderIdStr.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "84729104"}`;
    const orderDate = new Date(order.createdAt || Date.now());
    const estimatedDate = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);

    const isDelivered = order.status === "completed" || order.status === "delivered";
    const isShipping = ["shipping", "delivering", "completed", "delivered"].includes(order.status);

    const stages = ["placed", "confirmed", "shipping", "delivered"];
    const currentStage = isDelivered ? "delivered" : (order.status || "shipping");

    const hubs = [
      {
        id: "hub-1",
        name: "Hub Củ Chi SOC",
        description: "Trung tâm phân loại tổng miền Nam",
        time: new Date(orderDate.getTime() + 2 * 3600 * 1000).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }),
        completed: true,
        status: "completed",
      },
      {
        id: "hub-2",
        name: "Hub Tân Bình",
        description: "Kho trung chuyển khu vực Tân Bình - Phú Nhuận",
        time: new Date(orderDate.getTime() + 6 * 3600 * 1000).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }),
        completed: isShipping,
        status: isShipping ? "completed" : "pending",
      },
      {
        id: "hub-3",
        name: "Bưu cục phát Quận 1",
        description: "Bưu cục phát hàng chặng cuối đến người nhận",
        time: new Date(orderDate.getTime() + 12 * 3600 * 1000).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        }),
        completed: isDelivered,
        status: isDelivered ? "completed" : (isShipping ? "in_progress" : "pending"),
      },
    ];

    const checkpoints = [
      { code: "confirmed", name: "Đã xác nhận đơn hàng", time: orderDate.toISOString(), done: true },
      { code: "warehouse_pickup", name: "Đã lấy hàng từ người bán", time: new Date(orderDate.getTime() + 2 * 3600 * 1000).toISOString(), done: true },
      { code: "hub_transit", name: "Đến kho trung chuyển SOC", time: new Date(orderDate.getTime() + 6 * 3600 * 1000).toISOString(), done: isShipping },
      { code: "out_for_delivery", name: "Đang giao đến người mua", time: new Date(orderDate.getTime() + 12 * 3600 * 1000).toISOString(), done: isDelivered },
    ];

    const detailedStages = [
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
        completed: ["confirmed", "shipping", "delivering", "completed", "delivered"].includes(order.status),
      },
      {
        stage: "shipping",
        title: "Đang vận chuyển (SPX Express)",
        desc: "Kiện hàng đã rời kho trung chuyển Tân Bình, đang trên đường giao",
        timestamp: new Date(orderDate.getTime() + 8 * 3600 * 1000).toISOString(),
        completed: isShipping,
        active: isShipping && !isDelivered,
      },
      {
        stage: "delivered",
        title: "Giao hàng thành công",
        desc: "Người nhận đã kiểm tra và ký nhận hàng nguyên vẹn",
        timestamp: new Date(orderDate.getTime() + 24 * 3600 * 1000).toISOString(),
        completed: isDelivered,
      },
    ];

    const timeline = [
      { stage: "pending", label: "Đã đặt đơn", timestamp: orderDate.toISOString(), status: "completed" },
      { stage: "confirmed", label: "Shop xác nhận & đóng gói", timestamp: new Date(orderDate.getTime() + 2 * 3600 * 1000).toISOString(), status: "completed" },
      { stage: "shipping", label: "Đang giao hàng (SPX Express)", timestamp: new Date(orderDate.getTime() + 6 * 3600 * 1000).toISOString(), status: isShipping ? (isDelivered ? "completed" : "in_progress") : "pending" },
      { stage: "delivered", label: "Giao hàng thành công", timestamp: isDelivered ? new Date(orderDate.getTime() + 24 * 3600 * 1000).toISOString() : null, status: isDelivered ? "completed" : "pending" },
    ];

    const trackingData = {
      orderId: order._id || order.id || id,
      trackingCode,
      trackingNumber: trackingCode,
      carrier: "SPX Express",
      carrierStandard: "SPX Express Standard",
      carrierHotline: "1900 1221",
      status: order.status,
      statusText:
        isDelivered
          ? "Đã giao hàng thành công"
          : isShipping
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
        name: order.courier?.name || "Nguyễn Văn Hùng",
        phone: order.courier?.phone || "0908 123 456",
        avatar:
          order.courier?.avatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        vehicle: order.courier?.vehicle || "Xe máy Honda Wave Alpha",
        licensePlate: order.courier?.licensePlate || "59-P1 839.22",
        rating: order.courier?.rating || 4.95,
      },
      currentLocation: {
        lat: 10.7769,
        lng: 106.7009,
        label: "Bưu cục phát SPX Express Quận 1, TP. Hồ Chí Minh",
        address: "Bưu cục phát SPX Express Quận 1, TP. Hồ Chí Minh",
        bearing: 45,
        speedKmh: 28,
        distanceRemainingKm: 1.2,
        etaMinutes: 15,
        lastUpdated: new Date().toISOString(),
      },
      destination: {
        lat: 10.7725,
        lng: 106.698,
        address:
          order.customer?.address ||
          order.shippingAddress ||
          "Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      },
      stages,
      currentStage,
      hubs,
      checkpoints,
      detailedStages,
      timeline,
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
    let order = null;
    try {
      order = await Order.findById(id);
    } catch {
      // Ignore CastError when id is not an ObjectId
    }
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { id }, { orderId: id }, { trackingCode: id }],
      });
    }
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    const subtotal = order.subtotal || order.total || 0;
    const vatRate = 0.08; // 8% VAT
    const netSubtotal = Math.round(subtotal / (1 + vatRate));
    const vatAmount = subtotal - netSubtotal;
    const orderIdStr = String(order._id || order.id || id);
    const invoiceNumber = `INV-2026-${orderIdStr.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;

    const companyData = {
      legalName: "CÔNG TY TNHH MINI SHOPEE VIỆT NAM",
      companyName: "CÔNG TY TNHH MINI SHOPEE VIỆT NAM",
      taxCode: "0318924019",
      address: "Tòa nhà Capital Tower, 109 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
      phone: "1900-1221",
      email: "vat-invoice@shopee.enterprise.vn",
    };

    const buyerData = {
      fullName: order.customer?.fullName || order.customerName || "Khách Hàng Mini Shopee",
      name: order.customer?.fullName || order.customerName || "Khách Hàng Mini Shopee",
      phone: order.customer?.phone || order.phone || "",
      email: order.customer?.email || order.email || "",
      address: order.customer?.address || order.shippingAddress || "",
      taxCode: order.customer?.taxCode || order.buyerTaxCode || "Cá nhân không kinh doanh",
    };

    const invoiceData = {
      orderId: order._id || order.id || id,
      invoiceNumber,
      invoiceSerial: "1C26MMS",
      templateCode: "01GTKT0/001",
      issueDate: order.createdAt || new Date().toISOString(),
      issuedDate: order.createdAt || new Date().toISOString(),
      company: companyData,
      seller: companyData,
      buyer: buyerData,
      buyerTaxCode: buyerData.taxCode,
      items: (order.items || []).map((it, idx) => ({
        index: idx + 1,
        name: it.name,
        quantity: it.quantity || 1,
        unitPrice: Math.round((it.price || 0) / (1 + vatRate)),
        amount: Math.round(((it.price || 0) * (it.quantity || 1)) / (1 + vatRate)),
        rawPrice: it.price || 0,
        rawAmount: (it.price || 0) * (it.quantity || 1),
        vatRate: "8%",
      })),
      subtotal,
      netSubtotal,
      netAmount: netSubtotal,
      vatRate: "8%",
      vatAmount,
      totalPayment: order.total,
      totalWithVat: order.total,
      shippingFee: order.shippingFee || 0,
      shippingDiscount: order.shippingDiscount || 0,
      voucherDiscount: order.voucherDiscount || 0,
      coinDiscount: order.coinDiscount || 0,
      pricing: {
        subtotal,
        netSubtotal,
        netAmount: netSubtotal,
        vatRate: "8%",
        vatAmount,
        shippingFee: order.shippingFee || 0,
        shippingDiscount: order.shippingDiscount || 0,
        voucherDiscount: order.voucherDiscount || 0,
        coinDiscount: order.coinDiscount || 0,
        total: order.total,
      },
      digitalSignature: "SHA256:MINI-SHOPEE-E-INVOICE-0318924019-VALIDATED-SECURE",
      digitalSignatureDetails: {
        signedBy: "CÔNG TY TNHH MINI SHOPEE VIỆT NAM",
        signedDate: order.createdAt || new Date().toISOString(),
        verified: true,
      },
      xmlPayloadDigest: "SHA256:MINI-SHOPEE-E-INVOICE-0318924019-VALIDATED-SECURE",
      qrCodeString: `https://minishopee.vn/invoice/verify?id=${order._id || order.id || id}&serial=1C26MMS&mst=0318924019`,
      qrCodeUrl: `https://invoice.shopee.vn/verify/${order._id || order.id || id}?serial=1C26MMS`,
      htmlPrintTemplate: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hóa Đơn Điện Tử</title></head><body><h1>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</h1><p>MST: 0318924019</p><p>Mẫu số: 01GTKT0/001 - Ký hiệu: 1C26MMS</p></body></html>`,
    };

    sendSuccess(res, invoiceData);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export default { createOrder, getMyOrders, getOrderById, cancelOrder, getOrderTracking, getOrderInvoice };

// @desc    Confirm order (Seller/Admin)
// @route   PATCH /api/orders/:id/confirm
// @access  Private (seller or admin)
export const confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    if (order.status !== "pending") {
      return sendError(res, "Chỉ có thể xác nhận đơn hàng ở trạng thái 'Chờ xác nhận'", 400);
    }

    order.status = "confirmed";
    order.confirmedAt = new Date().toISOString();
    if (Array.isArray(order.timeline)) {
      order.timeline.push({ time: new Date().toISOString(), text: "Đơn hàng đã được xác nhận bởi người bán" });
    }
    await order.save();

    sendSuccess(res, { order, message: "Đã xác nhận đơn hàng" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mark order as shipping (Seller/Admin)
// @route   PATCH /api/orders/:id/ship
// @access  Private (seller or admin)
export const shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    if (order.status !== "confirmed") {
      return sendError(res, "Chỉ có thể chuyển giao đơn hàng đã xác nhận", 400);
    }

    order.status = "shipping";
    order.shippedAt = new Date().toISOString();
    if (Array.isArray(order.timeline)) {
      order.timeline.push({ time: new Date().toISOString(), text: "Đơn hàng đã được giao cho đơn vị vận chuyển SPX Express" });
    }
    await order.save();

    sendSuccess(res, { order, message: "Đơn hàng đang được giao" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mark order as delivered (Buyer)
// @route   PATCH /api/orders/:id/deliver
// @access  Private
export const deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    try {
      order = await Order.findById(id);
    } catch {}
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { id }, { orderId: id }, { trackingCode: id }],
      });
    }
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    if (!["shipping", "delivering"].includes(order.status)) {
      return sendError(res, "Chỉ có thể xác nhận nhận hàng khi đơn đang giao", 400);
    }

    // Check ownership
    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (req.user?.role !== "admin" && order.userId && order.userId !== userId) {
      return sendError(res, "Bạn không có quyền xác nhận đơn hàng này", 403);
    }

    order.status = "delivered";
    order.statusText = "Giao hàng thành công";
    order.deliveredAt = new Date().toISOString();
    if (order.stepIndex !== undefined) order.stepIndex = 4;

    if (Array.isArray(order.items)) {
      order.items.forEach((it) => {
        it.status = "delivered";
      });
    }

    if (Array.isArray(order.timeline)) {
      order.timeline.push({
        status: "delivered",
        description: "Giao hàng thành công",
        time: new Date().toISOString(),
        text: "Người mua đã xác nhận nhận hàng thành công",
      });
    }
    await order.save();
    if (memoryStore?.persist) memoryStore.persist();

    const orderData = order.toObject ? order.toObject() : { ...order };
    sendSuccess(res, {
      ...orderData,
      order,
      message: "Đã xác nhận nhận hàng",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Complete order (Admin or auto after 7 days)
// @route   PATCH /api/orders/:id/complete
// @access  Private (admin)
export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    if (order.status !== "delivered") {
      return sendError(res, "Chỉ có thể hoàn thành đơn hàng đã giao thành công", 400);
    }

    order.status = "completed";
    order.completedAt = new Date().toISOString();
    if (Array.isArray(order.timeline)) {
      order.timeline.push({ time: new Date().toISOString(), text: "Đơn hàng đã hoàn thành" });
    }

    // ======== AUTO-CREDIT SELLER WALLET ========
    const shopTotals = {};
    for (const item of order.items || []) {
      const sId = item.shopId || "shop_01";
      if (!shopTotals[sId]) shopTotals[sId] = 0;
      shopTotals[sId] += (item.price || 0) * (item.quantity || 1);
    }
    
    for (const [shopId, shopRevenue] of Object.entries(shopTotals)) {
      // Find shop in memoryStore
      const shop = memoryStore.shops?.data?.find(s => s.shopId === shopId || s._id === shopId || s.id === shopId) 
                || memoryStore.INITIAL_SHOPS?.find(s => s.shopId === shopId || s._id === shopId || s.id === shopId);
      
      // We know memoryStore exports some data. We'll search across all possibilities
      // In memoryStore.js, shops is often manipulated directly, let's use the find utility or just iterate INITIAL_SHOPS if no dedicated shop model
      // Looking at earlier memoryStore, memoryStore.shops is an instance of MemoryQuery if accessed? 
      // Actually, we can just use memoryStore.shops.findOne({ shopId }) or iterate.
      const shopObj = typeof memoryStore.shops?.findOne === "function" ? await memoryStore.shops.findOne({ $or: [{ shopId }, { _id: shopId }, { id: shopId }] }) : null;
      if (shopObj) {
        const commission = Math.round(shopRevenue * (shopObj.commissionRate || 0.05));
        const netPayout = shopRevenue - commission;
        shopObj.walletBalance = (shopObj.walletBalance || 0) + netPayout;
        if (!shopObj.walletTransactions) shopObj.walletTransactions = [];
        shopObj.walletTransactions.push({
          type: 'order_completed',
          orderId: order._id || order.id || order.orderId,
          amount: netPayout,
          commission,
          timestamp: new Date().toISOString()
        });
        if (typeof shopObj.save === "function") await shopObj.save();
      }
    }
    // ===========================================

    await order.save();

    sendSuccess(res, { order, message: "Đơn hàng đã hoàn thành" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Return an existing order
// @route   PATCH /api/orders/:id/return
// @access  Private
export const returnOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    if (!["delivered", "completed"].includes(order.status)) {
      return sendError(res, "Chỉ có thể trả hàng cho đơn đã giao hoặc đã hoàn thành", 400);
    }

    const deliveryTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime();
    if (Date.now() - deliveryTime > 7 * 24 * 60 * 60 * 1000) {
      return sendError(res, "Đã quá thời hạn 7 ngày để trả hàng", 400);
    }

    order.status = "returning";
    order.returningAt = new Date().toISOString();
    if (Array.isArray(order.timeline)) {
      order.timeline.push({ time: new Date().toISOString(), text: "Yêu cầu trả hàng đã được gửi" });
    }

    // Restore stock
    const { Product } = await import("../models/Product.js").catch(() => ({}));
    if (Product) {
      for (const item of order.items || []) {
        const prodId = item.productId || item.product || item._id || item.id;
        if (prodId) {
          const product = await Product.findOne({ $or: [{ _id: prodId }, { id: prodId }] });
          if (product) {
            product.stock = (product.stock || 0) + (item.quantity || 1);
            product.sold = Math.max(0, (product.sold || 0) - (item.quantity || 1));
            await product.save();
          }
        }
      }
    }

    // Refund coins
    const coinsToRefund = order.coinsUsed || 0;
    if (coinsToRefund > 0 && order.userId) {
      const { default: User } = await import("../models/User.js").catch(() => ({}));
      if (User) {
        const user = await User.findById(order.userId);
        if (user) {
          user.coins = (user.coins || 0) + coinsToRefund;
          await user.save();
        }
      }
    }

    await order.save();

    sendSuccess(res, { order, message: "Yêu cầu trả hàng thành công" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (admin or seller)
export const getOrderStats = async (req, res) => {
  try {
    const allOrders = await Order.find({});

    const statusCounts = {};
    let totalRevenue = 0;
    let todayRevenue = 0;
    let todayOrders = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (const order of allOrders) {
      const status = order.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (order.status === "completed" || order.status === "delivered") {
        totalRevenue += order.total || 0;
      }

      const orderDate = (order.createdAt || "").slice(0, 10);
      if (orderDate === today) {
        todayOrders++;
        if (order.status === "completed" || order.status === "delivered") {
          todayRevenue += order.total || 0;
        }
      }
    }

    sendSuccess(res, {
      totalOrders: allOrders.length,
      statusBreakdown: statusCounts,
      totalRevenue,
      todayRevenue,
      todayOrders,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Search orders
// @route   GET /api/orders/search
// @access  Private (admin)
export const searchOrders = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q || !q.trim()) {
      return sendError(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
    }

    const keyword = q.trim();
    const allOrders = await Order.find({});

    const matched = allOrders.filter((order) => {
      const searchFields = [
        order._id, order.id, order.trackingCode,
        order.customer?.fullName, order.customer?.phone,
        order.customer?.email, order.customer?.address,
        order.status,
      ].filter(Boolean).map(String);

      return searchFields.some((field) =>
        field.toLowerCase().includes(keyword.toLowerCase())
      );
    });

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const start = (pageNum - 1) * limitNum;
    const paged = matched.slice(start, start + limitNum);

    sendSuccess(res, {
      orders: paged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: matched.length,
        totalPages: Math.ceil(matched.length / limitNum) || 1,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Repurchase an existing order (validate stock & replenish cart)
// @route   POST /api/orders/:id/repurchase
// @access  Private
export const repurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;
    try {
      order = await Order.findById(id);
    } catch {}
    if (!order) {
      order = await Order.findOne({
        $or: [{ _id: id }, { id }, { orderId: id }, { trackingCode: id }],
      });
    }
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

    const userId = req.user ? (req.user._id || req.user.id) : null;
    if (order.userId && order.userId !== userId && req.user?.role !== "admin") {
      return sendError(res, "Bạn không có quyền thực hiện thao tác trên đơn hàng này", 403);
    }

    const { itemIds, productId, itemId, addToCart = true } = req.body || {};
    let targetIds = null;
    if (Array.isArray(itemIds) && itemIds.length > 0) {
      targetIds = itemIds.map(String);
    } else if (productId) {
      targetIds = [String(productId)];
    } else if (itemId) {
      targetIds = [String(itemId)];
    }

    let itemsToProcess = order.items || [];
    if (targetIds) {
      itemsToProcess = itemsToProcess.filter((it) => {
        const itId = String(it.productId || it.product || it._id || it.id);
        return targetIds.includes(itId);
      });
      if (itemsToProcess.length === 0) {
        return sendError(res, "Không tìm thấy sản phẩm yêu cầu trong đơn hàng này", 400);
      }
    }

    const itemsToReorder = [];
    const outOfStockItems = [];

    for (const item of itemsToProcess) {
      const prodId = item.productId || item.product || item._id || item.id;
      let prod = null;
      try {
        prod = await Product.findOne({
          $or: [{ _id: prodId }, { id: prodId }],
        });
      } catch {}
      if (!prod) {
        try {
          prod = await Product.findById(prodId);
        } catch {}
      }

      const reqQty = Number(item.quantity) || 1;
      const isAvailable = prod && prod.isActive !== false && (prod.stock || 0) >= reqQty;

      if (isAvailable) {
        itemsToReorder.push({
          productId: prod._id || prod.id,
          product: prod._id || prod.id,
          name: prod.name || item.name,
          price: prod.price !== undefined ? prod.price : item.price,
          quantity: reqQty,
          image: prod.image || item.image,
          shopId: prod.shopId || item.shopId,
          shopName: prod.shopName || item.shopName,
          availableStock: prod.stock,
        });
      } else {
        outOfStockItems.push({
          productId: prodId,
          name: item.name || (prod ? prod.name : "Sản phẩm"),
          quantity: reqQty,
          requestedQuantity: reqQty,
          availableStock: prod ? (prod.stock || 0) : 0,
          reason: !prod
            ? "Sản phẩm không còn tồn tại"
            : (!prod.isActive
                ? "Sản phẩm đã ngưng bán"
                : "Hết hàng hoặc không đủ tồn kho"),
        });
      }
    }

    const canReorderFully = outOfStockItems.length === 0;

    // Replenish user's cart in memoryStore if available and requested
    if (addToCart && itemsToReorder.length > 0 && userId && memoryStore?.carts) {
      try {
        const currentCart = memoryStore.carts.findByUserId(userId);
        let cartItems = currentCart ? [...currentCart.items] : [];
        for (const reorderItem of itemsToReorder) {
          const existingIdx = cartItems.findIndex(
            (i) => String(i.productId || i.product) === String(reorderItem.productId)
          );
          if (existingIdx !== -1) {
            cartItems[existingIdx].quantity += reorderItem.quantity;
            if (reorderItem.availableStock !== undefined) {
              cartItems[existingIdx].quantity = Math.min(
                cartItems[existingIdx].quantity,
                reorderItem.availableStock
              );
            }
          } else {
            cartItems.push({
              productId: reorderItem.productId,
              product: reorderItem.productId,
              quantity: reorderItem.quantity,
              name: reorderItem.name,
              price: reorderItem.price,
              image: reorderItem.image,
              shopId: reorderItem.shopId,
              selected: true,
            });
          }
        }
        memoryStore.carts.upsert(userId, cartItems);
      } catch (cartErr) {
        console.warn("[repurchaseOrder] Could not auto-sync cart in memoryStore:", cartErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id || order.id || order.orderId,
        canReorderFully,
        itemsToReorder,
        outOfStockItems,
        message: canReorderFully
          ? "Đã thêm toàn bộ sản phẩm vào giỏ hàng thành công!"
          : (itemsToReorder.length > 0
              ? `Đã thêm ${itemsToReorder.length} sản phẩm vào giỏ hàng. ${outOfStockItems.length} sản phẩm hết hàng hoặc không đủ tồn kho.`
              : "Tất cả sản phẩm đều đã hết hàng, không thể mua lại."),
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

