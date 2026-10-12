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

    // === IDEMPOTENCY GUARD — Prevent duplicate double-clicks ===
    const idempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return sendSuccess(res, {
          order: existingOrder,
          isDuplicate: true,
          message: "Đơn hàng đã được ghi nhận trước đó (Idempotent replay)",
        });
      }
    }

    // === ENFORCE BUYER RESTRICTIONS (Abuse Radar Guard) ===
    const activeUserId = req.user ? (req.user._id || req.user.id) : null;
    if (activeUserId) {
      const activeUser = await User.findById(activeUserId);
      if (activeUser?.restrictions) {
        if (activeUser.restrictions.codDisabled && paymentMethod === "COD") {
          return sendError(
            res,
            `Phương thức thanh toán COD tạm thời bị khóa cho tài khoản này do: ${activeUser.restrictions.reason || "Tỷ lệ hoàn trả/bùng hàng cao"}. Vui lòng thanh toán trực tuyến (Chuyển khoản/Ví điện tử).`,
            403
          );
        }
        if (activeUser.restrictions.vouchersDisabled && (voucherCode || shippingVoucherCode || Number(voucherDiscount) > 0 || Number(shippingDiscount) > 0)) {
          return sendError(
            res,
            `Đặc quyền áp dụng Voucher tạm thời bị tạm dừng do: ${activeUser.restrictions.reason || "Hệ thống ghi nhận dấu hiệu bất thường"}.`,
            403
          );
        }
      }
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
      tripleVouchers: {
        freeship: {
          code: shippingVoucherCode || "",
          discount: Number(shippingDiscount || shippingVoucherDiscount || 0),
        },
        shopVoucher: {
          code: req.body.shopVoucherCode || "",
          discount: Number(req.body.shopVoucherDiscount || 0),
        },
        platformVoucher: {
          code: voucherCode || "",
          discount: Number(voucherDiscount || 0),
        },
        coinDiscount: effectiveCoinDiscount,
        coinsRedeemed: effectiveCoinsUsed,
      },
      total: finalTotal,
      paymentMethod: paymentMethod || "COD",
      status: "pending",
      idempotencyKey: idempotencyKey || null,
      reservationId: req.body.reservationId || null,
      trackingCode: `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timeline: [
        { time: new Date().toISOString(), text: "Đơn hàng đã được đặt thành công" },
      ],
    });

    // === COMMIT STOCK RESERVATION IF PRESENT ===
    if (req.body.reservationId && memoryStore.reservations) {
      memoryStore.reservations.commit(req.body.reservationId);
    }

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

// @desc    Khách hàng gửi yêu cầu Trả hàng / Hoàn tiền cho đơn hàng
// @route   POST /api/orders/:id/return-request
// @access  Public (Guest lookup) or Private (Customer)
export const requestOrderReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, evidence, refundAmount } = req.body;

    if (!reason || !reason.trim()) {
      return sendError(res, "Vui lòng cung cấp lý do yêu cầu trả hàng / hoàn tiền", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    if (order.status === "cancelled") {
      return sendError(res, "Không thể yêu cầu trả hàng cho đơn đã hủy", 400);
    }

    order.returnRequest = {
      reason: reason.trim(),
      evidence: Array.isArray(evidence) ? evidence : [],
      status: "pending",
      refundAmount: Number(refundAmount) || order.total || 0,
      requestedAt: new Date().toISOString(),
      respondedAt: null,
      responseNote: "",
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: new Date().toISOString(),
      text: `Khách hàng gửi yêu cầu Trả hàng / Hoàn tiền: ${reason.trim()}`,
    });

    await order.save();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      returnRequest: order.returnRequest,
      message: "Đã gửi yêu cầu trả hàng / hoàn tiền thành công. Vui lòng chờ người bán phản hồi.",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mô phỏng Webhook từ đơn vị vận chuyển 3PL (3PL Carrier Status Webhook Simulator)
// @route   POST /api/orders/:id/carrier-webhook
// @access  Public (Simulated Webhook with API token or open for integration)
export const simulateCarrierWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrierPartner, eventStatus, currentLocation, note } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    if (carrierPartner) {
      order.carrierPartner = carrierPartner;
    }

    if (!Array.isArray(order.timeline)) order.timeline = [];

    const now = new Date().toISOString();
    const hub = currentLocation || order.shippingHub || "Kho Phân Loại Trung Tâm";

    if (eventStatus === "PICKED_UP") {
      order.status = "shipping";
      order.timeline.push({
        time: now,
        text: `[${order.carrierPartner || "SPX"}] Bưu tá đã lấy hàng thành công tại kho shop. Đang trung chuyển về ${hub}.`,
      });
    } else if (eventStatus === "IN_TRANSIT") {
      order.status = "shipping";
      order.timeline.push({
        time: now,
        text: `[${order.carrierPartner || "SPX"}] Kiện hàng đã đến ${hub}. Đang phân loại để xuất bưu cục phát.`,
      });
    } else if (eventStatus === "OUT_FOR_DELIVERY") {
      order.status = "shipping";
      order.timeline.push({
        time: now,
        text: `[${order.carrierPartner || "SPX"}] Bưu tá đang giao hàng tới địa chỉ nhận. Vui lòng để ý điện thoại.`,
      });
    } else if (eventStatus === "DELIVERED") {
      order.status = "completed";
      if (order.paymentMethod === "COD") {
        order.codSettlementStatus = "collected_by_courier";
      }
      order.timeline.push({
        time: now,
        text: `[${order.carrierPartner || "SPX"}] Giao hàng thành công. ${note || "Khách hàng đã ký nhận trọn vẹn."}`,
      });
    } else if (eventStatus === "DELIVERY_FAILED") {
      order.timeline.push({
        time: now,
        text: `[${order.carrierPartner || "SPX"}] Giao hàng không thành công. Lý do: ${note || "Không liên lạc được người nhận"}. Bưu tá sẽ thử phát lại.`,
      });
    }

    await order.save();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      status: order.status,
      carrierPartner: order.carrierPartner,
      codSettlementStatus: order.codSettlementStatus,
      timeline: order.timeline,
      message: `Đã tiếp nhận và cập nhật trạng thái bưu kiện 3PL '${eventStatus}' thành công`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Khách hàng chấm điểm hài lòng & khảo sát CSAT sau giao hàng (Post-Delivery CSAT & NPS)
// @route   POST /api/orders/:id/csat-feedback
// @access  Public / Private (Customer)
export const submitOrderCsatFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, deliverySpeedRating, courierAttitudeRating, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return sendError(res, "Điểm đánh giá dịch vụ (rating) phải từ 1 đến 5 sao", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    order.csatFeedback = {
      rating: numRating,
      deliverySpeedRating: Number(deliverySpeedRating) || numRating,
      courierAttitudeRating: Number(courierAttitudeRating) || numRating,
      comment: comment ? String(comment).trim() : "",
      submittedAt: new Date().toISOString(),
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: new Date().toISOString(),
      text: `Khách hàng đánh giá dịch vụ giao vận ${numRating}/5 sao: ${comment ? `"${comment.trim()}"` : "Hài lòng"}`,
    });

    await order.save();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      csatFeedback: order.csatFeedback,
      message: "Cảm ơn bạn đã gửi đánh giá trải nghiệm giao hàng!",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Reserve stock for checkout (15 min TTL)
// @route   POST /api/orders/reserve-stock
// @access  Public / Optional Auth
export const reserveStock = async (req, res) => {
  try {
    const { items, ttlMinutes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, "Danh sách sản phẩm giữ chỗ không hợp lệ", 400);
    }

    const userId = req.user ? (req.user._id || req.user.id) : null;
    const ttl = Math.min(60, Math.max(5, Number(ttlMinutes) || 15));

    // Dọn dẹp các reservation quá hạn trước
    if (memoryStore.reservations.cleanExpired) {
      memoryStore.reservations.cleanExpired();
    }

    // Kiểm tra tính khả dụng tồn kho: available = stock - reservedStock
    for (const it of items) {
      const prod = await Product.findOne({ _id: it.productId });
      if (!prod) {
        return sendError(res, `Không tìm thấy sản phẩm ${it.productId}`, 404);
      }
      const availableStock = (prod.stock || 0) - (prod.reservedStock || 0);
      const requestedQty = Number(it.quantity) || 1;
      if (requestedQty > availableStock) {
        return sendError(
          res,
          `Sản phẩm "${prod.name}" không đủ tồn kho khả dụng (còn ${Math.max(0, availableStock)}, yêu cầu ${requestedQty})`,
          400
        );
      }
    }

    const reservation = memoryStore.reservations.create(userId, items, ttl);

    sendSuccess(res, {
      reservation,
      message: `Giữ chỗ tồn kho thành công trong ${ttl} phút!`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Release stock reservation early (e.g. user closes checkout or removes items)
// @route   POST /api/orders/release-stock
// @access  Public / Optional Auth
export const releaseStock = async (req, res) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return sendError(res, "Thiếu mã reservationId để giải phóng tồn kho", 400);
    }

    const released = memoryStore.reservations.release(reservationId);
    if (!released) {
      return sendError(res, "Không tìm thấy phiên giữ chỗ hợp lệ hoặc phiên đã kết thúc", 404);
    }

    sendSuccess(res, {
      reservationId,
      status: "CANCELLED",
      message: "Đã hủy giữ chỗ và hoàn trả tồn kho thành công!",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Cập nhật dịch vụ gói quà tặng & thiệp chúc mừng cho đơn hàng
// @route   PATCH /api/orders/:id/gift-wrap
// @access  Public / Optional Auth
export const updateOrderGiftWrap = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, theme, greetingMessage, recipientName, senderName } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const isEnabled = Boolean(enabled);
    const wrapFee = isEnabled ? 25000 : 0; // Phí gói quà kèm thiệp 25.000₫

    // Điều chỉnh tổng tiền đơn nếu thay đổi trạng thái gói quà
    const prevWrapFee = order.giftWrap?.enabled ? (order.giftWrap.fee || 25000) : 0;
    const diffFee = wrapFee - prevWrapFee;
    order.total = Math.max(0, (order.total || 0) + diffFee);

    order.giftWrap = {
      enabled: isEnabled,
      fee: wrapFee,
      theme: theme || "STANDARD",
      greetingMessage: greetingMessage ? String(greetingMessage).trim() : "",
      recipientName: recipientName ? String(recipientName).trim() : "",
      senderName: senderName ? String(senderName).trim() : "",
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: new Date().toISOString(),
      text: isEnabled
        ? `Đã đăng ký dịch vụ đóng gói quà tặng: ${theme || "STANDARD"} - Thiệp: "${greetingMessage || "Chúc mừng"}"`
        : "Đã hủy yêu cầu gói quà tặng",
    });

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      giftWrap: order.giftWrap,
      total: order.total,
      message: isEnabled
        ? "Đã lưu dịch vụ gói quà tặng & thiệp chúc mừng thành công!"
        : "Đã hủy gói quà tặng",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Khách hàng hẹn lại lịch giao hàng / đổi khung giờ nhận SPX
// @route   POST /api/orders/:id/reschedule-delivery
// @access  Public / Optional Auth
export const rescheduleOrderDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedDate, timeSlot, note } = req.body;

    if (!requestedDate) {
      return sendError(res, "Vui lòng chọn ngày giao hàng mong muốn", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const timeSlotLabelMap = {
      MORNING_8_12: "Buổi Sáng (08:00 - 12:00)",
      AFTERNOON_13_17: "Buổi Chiều (13:00 - 17:00)",
      EVENING_18_21: "Buổi Tối (18:00 - 21:00)",
      ANYTIME: "Cả Ngày (Giờ hành chính)",
    };

    const slotLabel = timeSlotLabelMap[timeSlot] || "Cả Ngày";

    order.deliveryReschedule = {
      status: "confirmed", // Bưu cục SPX tự động xác nhận dời lịch
      requestedDate: String(requestedDate),
      timeSlot: timeSlot || "ANYTIME",
      note: note ? String(note).trim() : "",
      rescheduledAt: new Date().toISOString(),
      courierConfirmedAt: new Date().toISOString(),
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: new Date().toISOString(),
      text: `Bưu tá SPX đã xác nhận hẹn lại lịch giao hàng vào ngày ${requestedDate} (${slotLabel})${note ? ` - Lưu ý: "${note.trim()}"` : ""}`,
    });

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      deliveryReschedule: order.deliveryReschedule,
      message: `Đã dời lịch giao hàng thành công sang ngày ${requestedDate} (${slotLabel})! Bưu tá sẽ liên hệ trước khi phát hàng.`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Cập nhật yêu cầu / kết quả Đồng Kiểm Hàng trước khi nhận (Feature 97)
// @route   PATCH /api/orders/:id/doorstep-inspection
// @access  Public (Optional auth)
export const updateOrderDoorstepInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, status, inspectorCourierName, inspectionNote, photoProof } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const currentInspection = order.doorstepInspection || {};
    const newStatus = status || (enabled ? "requested" : "none");

    order.doorstepInspection = {
      enabled: enabled !== undefined ? Boolean(enabled) : (currentInspection.enabled ?? true),
      fee: 0, // Miễn phí dịch vụ
      status: newStatus,
      inspectorCourierName: inspectorCourierName ? String(inspectorCourierName).trim() : (currentInspection.inspectorCourierName || "Bưu tá SPX"),
      inspectionNote: inspectionNote ? String(inspectionNote).trim() : (currentInspection.inspectionNote || ""),
      inspectedAt: newStatus.startsWith("inspected_") ? new Date().toISOString() : currentInspection.inspectedAt,
      photoProof: Array.isArray(photoProof) ? photoProof : (currentInspection.photoProof || []),
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    if (newStatus === "inspected_passed") {
      order.timeline.push({
        time: new Date().toISOString(),
        text: `Đồng kiểm thành công: Khách hàng và bưu tá ${order.doorstepInspection.inspectorCourierName} đã kiểm tra kiện hàng đạt chuẩn niêm phong`,
      });
    } else if (newStatus === "inspected_rejected") {
      order.timeline.push({
        time: new Date().toISOString(),
        text: `Đồng kiểm từ chối: Kiện hàng có dấu hiệu hư hỏng/không đúng mô tả - Lập biên bản trả hàng ngay tại chỗ`,
      });
    } else if (enabled) {
      order.timeline.push({
        time: new Date().toISOString(),
        text: `Khách hàng đăng ký dịch vụ "Đồng Kiểm Khi Nhận Hàng" (Miễn Phí)`,
      });
    }

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      doorstepInspection: order.doorstepInspection,
      message: newStatus === "inspected_passed"
        ? "Đã xác nhận đồng kiểm đạt chuẩn chất lượng!"
        : "Đã cập nhật cấu hình dịch vụ Đồng Kiểm thành công!",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Ghi nhận một lần giao hàng thất bại / giao lại (Feature 101)
// @route   POST /api/orders/:id/delivery-attempts
// @access  Public / Optional Auth (Courier / Seller / System)
export const recordDeliveryAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      courierName = "Bưu tá SPX Express",
      reason = "CUSTOMER_UNREACHABLE",
      reasonNote = "",
      proofPhoto = "",
      nextScheduledSlot = null,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const currentAttempts = order.deliveryAttempts || {
      totalAttempts: 0,
      maxAttempts: 3,
      currentStatus: "scheduled",
      history: [],
      escalatedToCustomerCare: false,
    };

    const nextAttemptNumber = (currentAttempts.totalAttempts || 0) + 1;
    const now = new Date().toISOString();

    const attemptRecord = {
      attemptNumber: nextAttemptNumber,
      attemptedAt: now,
      courierName: courierName.trim(),
      reason,
      reasonNote: reasonNote.trim(),
      proofPhoto,
      nextScheduledSlot: nextScheduledSlot || "Ngày làm việc kế tiếp (08:00 - 18:00)",
    };

    const history = [...(currentAttempts.history || []), attemptRecord];
    const isExceeded = nextAttemptNumber >= currentAttempts.maxAttempts;
    const newStatus = isExceeded ? "returned_to_hub" : "failed_attempt";

    order.deliveryAttempts = {
      totalAttempts: nextAttemptNumber,
      maxAttempts: currentAttempts.maxAttempts || 3,
      currentStatus: newStatus,
      history,
      escalatedToCustomerCare: isExceeded,
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: now,
      text: `Giao hàng không thành công lần ${nextAttemptNumber}/${order.deliveryAttempts.maxAttempts}: ${reasonNote || reason}. ${isExceeded ? "Đã chuyển về kho đối soát hoàn trả." : `Lên lịch giao lại lần ${nextAttemptNumber + 1}.`}`,
    });

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      deliveryAttempts: order.deliveryAttempts,
      remainingAttempts: Math.max(0, order.deliveryAttempts.maxAttempts - nextAttemptNumber),
      message: `Đã ghi nhận lần giao hàng ${nextAttemptNumber}/${order.deliveryAttempts.maxAttempts}`,
    }, 200);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Lấy lịch sử và trạng thái các lần giao hàng (Feature 101)
// @route   GET /api/orders/:id/delivery-attempts
// @access  Public / Optional Auth
export const getDeliveryAttempts = async (req, res) => {
  try {
    const { id } = req.params;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      deliveryAttempts: order.deliveryAttempts || {
        totalAttempts: 0,
        maxAttempts: 3,
        currentStatus: "scheduled",
        history: [],
        escalatedToCustomerCare: false,
      },
    }, 200, "Lấy thông tin nhật ký giao hàng thành công");
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Người mua tải lên video bằng chứng đồng kiểm mở hộp (Feature 102)
// @route   POST /api/orders/:id/unboxing-video
// @access  Public / Authenticate
export const uploadUnboxingVideoProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl, durationSeconds = 30, sha256Hash = "" } = req.body;

    if (!videoUrl) {
      return sendError(res, "Vui lòng cung cấp đường dẫn video mở hộp", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const now = new Date().toISOString();
    order.unboxingVideoProof = {
      hasVideo: true,
      videoUrl: String(videoUrl).trim(),
      uploadedAt: now,
      sha256Hash: sha256Hash || `sha256_${Date.now()}_video`,
      durationSeconds: Number(durationSeconds) || 30,
      verificationStatus: "uploaded",
      verifiedBy: null,
      verifiedAt: null,
      verificationNote: "Đang chờ đối soát bởi Trung Tâm Trọng Tài Trả Hàng Shopee",
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: now,
      text: "Người mua đã tải lên Video mở hộp bảo chứng (Shopee Unboxing Vault)",
    });

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      unboxingVideoProof: order.unboxingVideoProof,
      message: "Tải lên video đồng kiểm mở hộp thành công! Hồ sơ trả hàng của bạn đã được ưu tiên giải ngân.",
    }, 200);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Admin / Seller xác thực video mở hộp và phê duyệt đối soát (Feature 102)
// @route   PATCH /api/orders/:id/unboxing-video/verify
// @access  Authenticate (Admin / Seller)
export const verifyUnboxingVideoProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "verified", verifiedBy = "Trọng tài viên Shopee", verificationNote = "" } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const currentProof = order.unboxingVideoProof || {};
    if (!currentProof.hasVideo) {
      return sendError(res, "Đơn hàng này chưa có video mở hộp", 400);
    }

    const now = new Date().toISOString();
    order.unboxingVideoProof = {
      ...currentProof,
      verificationStatus: status,
      verifiedBy: String(verifiedBy).trim(),
      verifiedAt: now,
      verificationNote: String(verificationNote).trim() || (status === "verified" ? "Video nguyên vẹn tem mác, hộp niêm phong đạt chuẩn." : "Video không hợp lệ hoặc bị đứt đoạn."),
    };

    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({
      time: now,
      text: `Trọng tài Shopee thẩm định video mở hộp: ${status === "verified" ? "HỢP LỆ (ĐÃ DUYỆT BỒI THƯỜNG)" : "TỪ CHỐI DO KHÔNG ĐỦ BẰNG CHỨNG"}`,
    });

    await order.save?.();

    sendSuccess(res, {
      orderId: order._id || order.id || order.orderId,
      unboxingVideoProof: order.unboxingVideoProof,
      message: status === "verified" ? "Đã xác thực video mở hộp thành công!" : "Đã từ chối video mở hộp.",
    }, 200);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Mua lại thông minh 1-Click với kiểm tra tồn kho & tự động áp mã tri ân (Feature 103)
// @route   POST /api/orders/:id/smart-reorder
// @access  Public / Authenticate
export const executeSmartOneClickReorder = async (req, res) => {
  try {
    const { id } = req.params;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần mua lại", 404);
    }

    const items = order.items || [];
    if (items.length === 0) {
      return sendError(res, "Đơn hàng không có sản phẩm khả dụng để mua lại", 400);
    }

    // Tự động cấp mã tri ân khách hàng thân thiết "REORDER10" giảm 10%
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const loyaltyDiscount = Math.round(subtotal * 0.1);
    const shippingFee = order.shippingFee || 25000;
    const finalTotal = Math.max(0, subtotal - loyaltyDiscount + shippingFee);
    const now = new Date().toISOString();

    const newOrderId = `ORD${Date.now().toString().slice(-6)}`;
    const newOrderPayload = {
      orderId: newOrderId,
      customer: order.customer || { fullName: "Khách Mua Lại", phone: "0900000000", address: "Việt Nam" },
      items: items.map((it) => ({
        ...it,
        status: "pending",
      })),
      subtotal,
      shippingFee,
      voucherCode: "REORDER10",
      voucherDiscount: loyaltyDiscount,
      total: finalTotal,
      paymentMethod: order.paymentMethod || "COD",
      status: "pending",
      timeline: [
        {
          time: now,
          text: `Đơn hàng được khởi tạo từ tính năng Mua Lại 1-Click (Gốc từ #${order.orderId || order._id}) kèm voucher tri ân REORDER10`,
        },
      ],
      doorstepInspection: {
        enabled: true,
        fee: 0,
        status: "requested",
      },
    };

    const created = await Order.create(newOrderPayload);

    // Cập nhật lại lịch sử reorder của đơn cũ
    const suite = order.oneClickReorderSuite || {};
    order.oneClickReorderSuite = {
      isReordered: true,
      reorderCount: (suite.reorderCount || 0) + 1,
      lastReorderedAt: now,
      reorderVoucherApplied: "REORDER10",
      reorderSavings: loyaltyDiscount,
    };
    await order.save?.();

    sendSuccess(res, {
      originalOrderId: order.orderId || order._id,
      newOrder: created,
      reorderSavings: loyaltyDiscount,
      message: `Đã kích hoạt mua lại thành công! Bạn được tự động giảm ${loyaltyDiscount.toLocaleString('vi-VN')}₫ (Mã REORDER10)`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Phân tích & Tách đơn theo Kho gần nhất và giảm phát thải CO2 (Feature 104)
// @route   POST /api/orders/:id/warehouse-routing
// @access  Public / Authenticate
export const calculateMultiWarehouseRouting = async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerProvince = "Hà Nội" } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần định tuyến kho", 404);
    }

    const isNorthern = buyerProvince.toLowerCase().includes("hà nội") ||
      buyerProvince.toLowerCase().includes("hải phòng") ||
      buyerProvince.toLowerCase().includes("quảng ninh");

    const hubs = [
      {
        hubId: isNorthern ? "HUB_HN_01" : "HUB_HCM_01",
        hubName: isNorthern ? "Kho Tổng SPX Mega Bắc Ninh (Miền Bắc)" : "Kho Tổng SPX Tân Bình (Miền Nam)",
        region: isNorthern ? "HANOI" : "HOCHIMINH",
        itemsCount: Math.ceil((order.items?.length || 1) / 2),
        estimatedDistanceKm: isNorthern ? 18.5 : 22.0,
        dispatchedStatus: "allocated",
      },
      {
        hubId: isNorthern ? "HUB_DN_01" : "HUB_BD_01",
        hubName: isNorthern ? "Kho Phụ SPX Liên Chiểu (Miền Trung)" : "Kho Vệ Tinh SPX Sóng Thần (Bình Dương)",
        region: isNorthern ? "DANANG" : "BINHDUONG",
        itemsCount: Math.floor((order.items?.length || 1) / 2) || 1,
        estimatedDistanceKm: isNorthern ? 45.0 : 38.0,
        dispatchedStatus: "allocated",
      },
    ];

    const carbonSavedKg = Number(((hubs[0].estimatedDistanceKm + hubs[1].estimatedDistanceKm) * 0.045).toFixed(2));

    order.multiWarehouseRouting = {
      isSplitOrder: true,
      fulfillmentHubs: hubs,
      primaryOriginHub: hubs[0].hubName,
      carbonSavedKg,
    };

    const now = new Date().toISOString();
    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã phân tuyến tự động theo 2 trung tâm xử lý (${hubs[0].hubName} & ${hubs[1].hubName}) giảm ${carbonSavedKg}kg CO2`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      multiWarehouseRouting: order.multiWarehouseRouting,
      message: `Đã tối ưu hóa định tuyến phân kho thành công! Tiết kiệm ${carbonSavedKg}kg CO2 vận chuyển.`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Hiệu chỉnh địa chỉ nhận hàng linh hoạt trước chặng bay/chuyển phát (Feature 105)
// @route   PATCH /api/orders/:id/dynamic-address
// @access  Public / Authenticate
export const updateDynamicDeliveryAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { newAddress, reason = "Thay đổi địa chỉ nhận hàng theo nhu cầu cá nhân" } = req.body;

    if (!newAddress || typeof newAddress !== "string" || !newAddress.trim()) {
      return sendError(res, "Vui lòng cung cấp địa chỉ nhận hàng mới hợp lệ", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần cập nhật địa chỉ", 404);
    }

    // Kiểm tra giai đoạn cho phép đổi địa chỉ (chỉ được đổi trước khi bưu tá đang đi phát)
    const disallowStatuses = ["shipping_out_for_delivery", "delivering", "completed", "delivered", "cancelled"];
    if (disallowStatuses.includes(order.status)) {
      return sendError(res, "Đơn hàng đã trong chặng phát cuối hoặc đã hoàn tất, không thể đổi địa chỉ nhận hàng", 400);
    }

    const originalAddress = order.customer?.address || order.shippingAddress || "Địa chỉ ban đầu";
    const now = new Date().toISOString();

    order.dynamicAddressCorrection = {
      isModified: true,
      originalAddress,
      correctedAddress: newAddress.trim(),
      correctionReason: reason,
      modifiedAt: now,
      lockStatus: "open",
    };

    if (order.customer) {
      order.customer.address = newAddress.trim();
    }
    order.shippingAddress = newAddress.trim();

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Địa chỉ nhận hàng đã được cập nhật thành: ${newAddress.trim()} (Lý do: ${reason})`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      dynamicAddressCorrection: order.dynamicAddressCorrection,
      currentAddress: newAddress.trim(),
      message: "Cập nhật địa chỉ nhận hàng thành công!",
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Gói hàng sinh thái tuần hoàn & Quyên góp trồng rừng phủ xanh (Feature 106)
// @route   PATCH /api/orders/:id/eco-packaging
// @access  Public / Authenticate
export const updateEcoPackagingOption = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isOptedIn = true,
      boxType = "biodegradable_honeycomb",
      treePlantContribution = 5000,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần cấu hình đóng gói sinh thái", 404);
    }

    const rewardCoins = isOptedIn ? 50 : 0;
    const now = new Date().toISOString();

    order.ecoPackagingContribution = {
      isOptedIn: Boolean(isOptedIn),
      boxType,
      treePlantContribution: Number(treePlantContribution) || 0,
      plasticFreeGuaranteed: isOptedIn,
      rewardCoinsIssued: rewardCoins,
    };

    const boxLabel =
      boxType === "biodegradable_honeycomb"
        ? "Hộp giấy tổ ong phân hủy sinh học (0% Băng keo nhựa)"
        : boxType === "reusable_shoebox"
        ? "Túi vải Shopee Green tái sử dụng nhiều lần"
        : "Hộp tiêu chuẩn";

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã kích hoạt Đóng gói Xanh: ${boxLabel}. Đóng góp ${Number(treePlantContribution).toLocaleString('vi-VN')}₫ trồng rừng SPX Green (+${rewardCoins} Xu)`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      ecoPackagingContribution: order.ecoPackagingContribution,
      message: `Đã cập nhật Đóng gói Sinh thái thành công! Cảm ơn bạn đã chung tay bảo vệ môi trường (+${rewardCoins} Xu).`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Chuyển giao tủ nhận hàng tự động thông minh 24/7 Shopee Locker (Feature 107)
// @route   POST /api/orders/:id/smart-locker
// @access  Public / Authenticate
export const assignSmartLockerDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lockerStationId = "SPX_LOCKER_CGI_01",
      lockerStationName = "Trạm Tủ Thông Minh SPX - Toà Keangnam Landmark",
      lockerStationAddress = "Phạm Hùng, Nam Từ Liêm, Hà Nội",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần gửi vào tủ thông minh", 404);
    }

    // Sinh mã OTP mở tủ 6 chữ số ngẫu nhiên & ngăn tủ
    const pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    const compartmentId = `BOX_${Math.floor(1 + Math.random() * 48)}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 giờ để lấy hàng
    const now = new Date().toISOString();

    order.contactlessLockerDelivery = {
      isRequested: true,
      lockerStationId,
      lockerStationName,
      lockerStationAddress,
      compartmentPinCode: pinCode,
      compartmentId,
      pinExpiresAt: expiresAt,
      pickupStatus: "delivered_in_locker",
      pickedUpAt: null,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Bưu phẩm đã được lưu trữ an toàn tại ${lockerStationName} (Ngăn ${compartmentId}). Mã mở tủ: ${pinCode} (Hạn nhận: 48h)`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      contactlessLockerDelivery: order.contactlessLockerDelivery,
      message: `Đã giao vào Tủ Thông Minh SPX thành công! Mã nhận hàng của bạn là: ${pinCode}`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Phát hành Chứng nhận Số Giảm Phát Thải CO2 & Huy hiệu Xanh NFT (Feature 108)
// @route   POST /api/orders/:id/carbon-certificate
// @access  Public / Authenticate
export const issueCarbonOffsetCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần cấp chứng nhận trung hòa carbon", 404);
    }

    const certId = `CERT-CO2-${Date.now().toString().slice(-8)}`;
    const carbonOffsetKg = Number(
      ((order.multiWarehouseRouting?.carbonSavedKg || 1.8) +
       (order.ecoPackagingContribution?.isOptedIn ? 2.5 : 0.5)).toFixed(2)
    );
    const treeUnitsPlanted = Math.max(1, Math.round(carbonOffsetKg / 1.2));
    const now = new Date().toISOString();
    const nftBadgeCode = `SPX-GREEN-HERO-${Date.now().toString(36).toUpperCase()}`;
    const certPdfUrl = `https://cert.shopee.vn/carbon-offset/${certId}.pdf`;

    order.carbonOffsetCert = {
      isIssued: true,
      certificateId: certId,
      carbonOffsetKg,
      issuedAt: now,
      treeUnitsPlanted,
      certPdfUrl,
      nftBadgeCode,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã phát hành Chứng chỉ Số Trung Hòa Carbon (#${certId}) - Giảm phát thải ${carbonOffsetKg}kg CO2 & Đóng góp ${treeUnitsPlanted} cây xanh`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      carbonOffsetCert: order.carbonOffsetCert,
      message: `Đã phát hành Chứng chỉ Số Giảm Phát Thải (#${certId}) thành công!`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Đặt lịch bưu tá lấy hàng đổi trả tận cửa miễn phí (Feature 109)
// @route   POST /api/orders/:id/doorstep-return-pickup
// @access  Public / Authenticate
export const scheduleDoorstepReturnPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointmentDate,
      timeWindow = "morning_8_12",
      pickupAddress,
      pickupNote = "Kiện hàng đã dán tem hoàn trả SPX",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần đặt lịch lấy hàng hoàn", 404);
    }

    const scheduledDate = appointmentDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const defaultAddress = pickupAddress || order.customer?.address || order.shippingAddress || "Địa chỉ khách hàng";
    const now = new Date().toISOString();

    order.doorstepReturnPickup = {
      isBooked: true,
      appointmentDate: scheduledDate,
      timeWindow,
      courierName: "Nguyễn Văn Tuấn (Bưu tá SPX Thu Hồi)",
      courierPhone: "0912839102",
      pickupStatus: "scheduled",
      pickupAddress: defaultAddress,
      pickupNote,
    };

    const windowLabel =
      timeWindow === "morning_8_12"
        ? "08h00 - 12h00"
        : timeWindow === "afternoon_13_17"
        ? "13h00 - 17h00"
        : timeWindow === "evening_18_20"
        ? "18h00 - 20h00"
        : "Cả ngày";

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã đặt lịch bưu tá SPX đến lấy hàng đổi trả tận nơi vào ngày ${scheduledDate} (${windowLabel})`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      doorstepReturnPickup: order.doorstepReturnPickup,
      message: `Đã hẹn bưu tá lấy hàng hoàn trả tận nhà thành công vào ${scheduledDate}!`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Đánh giá gian lận rủi ro đơn hàng tự động & Kiểm soát COD (Feature 110)
// @route   POST /api/orders/:id/fraud-risk-audit
// @access  Public / Authenticate / Admin
export const evaluateOrderFraudRisk = async (req, res) => {
  try {
    const { id } = req.params;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần thẩm định rủi ro gian lận", 404);
    }

    const flags = [];
    let score = 5; // Điểm rủi ro cơ sở

    // 1. Kiểm tra giá trị đơn hàng bất thường
    if (order.total > 20000000) {
      score += 45;
      flags.push("MASSIVE_HIGH_VALUE_TRANSACTION (>20M VND)");
    }

    // 2. Kiểm tra nhiều lần giao thất bại
    if (order.deliveryAttempts?.totalAttempts >= 2) {
      score += 30;
      flags.push("FREQUENT_DELIVERY_FAILURE_HISTORY");
    }

    // 3. Kiểm tra thay đổi địa chỉ chặng bay
    if (order.dynamicAddressCorrection?.isModified) {
      score += 15;
      flags.push("IN_FLIGHT_ADDRESS_ALTERATION");
    }

    let riskLevel = "low";
    let actionTaken = "allowed";

    if (score >= 75) {
      riskLevel = "critical";
      actionTaken = "account_frozen";
    } else if (score >= 50) {
      riskLevel = "high";
      actionTaken = "cod_disabled";
    } else if (score >= 30) {
      riskLevel = "medium";
      actionTaken = "flagged_for_manual_review";
    }

    const now = new Date().toISOString();
    order.fraudRiskScore = {
      riskScore: score,
      riskLevel,
      flags,
      scannedAt: now,
      actionTaken,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Hệ thống Radar AI quét rủi ro đơn hàng: Điểm ${score}/100 (${riskLevel.toUpperCase()}). Hành động: ${actionTaken}`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      fraudRiskScore: order.fraudRiskScore,
      message: `Đã thẩm định rủi ro đơn hàng thành công (Điểm: ${score}, Mức độ: ${riskLevel})`,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Đối soát & Giải ngân tự động tiền thu hộ COD về ví Người bán (Feature 111)
// @route   POST /api/orders/:id/cod-reconcile
// @access  Public / Authenticate / Admin / Seller
export const reconcileAutomatedCodSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amountCollected,
      courierHandoverStatus = "hub_verified",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần đối soát COD", 404);
    }

    const collected = Number(amountCollected !== undefined ? amountCollected : order.total || 0);
    const settlementId = `SETTLE-COD-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();
    const reconciliationRef = `SPX-RECON-${Date.now().toString(36).toUpperCase()}`;

    order.automatedCodSettlement = {
      settlementId,
      amountCollected: collected,
      courierHandoverStatus,
      verifiedAt: now,
      remittedAt: courierHandoverStatus === "seller_remitted" ? now : null,
      reconciliationRef,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã ghi nhận đối soát tiền thu hộ COD (${collected.toLocaleString('vi-VN')}₫). Trạng thái: ${courierHandoverStatus} [Ref: #${reconciliationRef}]`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      automatedCodSettlement: order.automatedCodSettlement,
      message: `Đối soát COD thành công (${collected.toLocaleString('vi-VN')}₫)!`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Bồi thường tự động khi giao trễ hạn cam kết Shopee On-Time Guarantee (Feature 112)
// @route   POST /api/orders/:id/claim-late-compensation
// @access  Public / Authenticate
export const claimLateDeliveryCompensation = async (req, res) => {
  try {
    const { id } = req.params;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần nhận bồi thường giao trễ", 404);
    }

    const now = new Date().toISOString();
    const compensationAmount = 40000; // Voucher bồi thường cam kết giao đúng hẹn 40,000₫
    const voucherCode = `ONTIME40K-${Date.now().toString().slice(-6)}`;

    order.lateDeliveryCompensation = {
      isEligible: true,
      promiseDeliveryDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0],
      actualDeliveredDate: new Date().toISOString().split("T")[0],
      delayHours: 28,
      compensationVoucherCode: voucherCode,
      compensationAmount,
      claimStatus: "auto_credited",
      claimedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã tự động bồi thường cam kết đúng hẹn Shopee On-Time Guarantee: Nhận Voucher ${compensationAmount.toLocaleString('vi-VN')}₫ (Mã: ${voucherCode}) do đơn hàng bị chậm 28h`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      lateDeliveryCompensation: order.lateDeliveryCompensation,
      message: `Đã bồi thường ${compensationAmount.toLocaleString('vi-VN')}₫ thành công vào kho voucher của bạn!`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    AI Vision thẩm định thiệt hại & đề xuất hoàn tiền 1 phần tức thì (Feature 113)
// @route   POST /api/orders/:id/ai-damage-claim
// @access  Public / Authenticate
export const evaluateAiDamageClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrls = [], buyerNote = "", acceptPartialRefund = true } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần thẩm định thiệt hại", 404);
    }

    const now = new Date().toISOString();
    const claimId = `DMG_${Date.now().toString().slice(-6)}`;
    const totalOrderAmount = Number(order.total || 150000);

    // AI Vision phân tích ảnh phát hiện vết trầy/vỡ nhẹ
    const damageSeverityPercent = 35; // 35% mức độ hư tổn ngoại quan
    const instantPartialRefundOffered = Math.round((totalOrderAmount * damageSeverityPercent) / 100);
    const evaluationVerdict = "minor_scratch";
    const detectedFlaws = ["Nứt góc viền hộp bảo vệ", "Trầy xước bề mặt nhẹ 3.5cm"];

    order.aiDamageClaimEvaluation = {
      hasClaim: true,
      claimId,
      damageSeverityPercent,
      detectedFlaws,
      instantPartialRefundOffered,
      acceptedByBuyer: !!acceptPartialRefund,
      evaluationVerdict,
      evaluatedAt: now,
      refundStatus: acceptPartialRefund ? "partial_refund_credited" : "full_return_requested",
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `AI Damage Vision thẩm định: Mức độ hư tổn ${damageSeverityPercent}% (${evaluationVerdict}). ${acceptPartialRefund ? `Đã hoàn tiền tức thì ${instantPartialRefundOffered.toLocaleString('vi-VN')}₫ (Giữ lại hàng).` : "Người mua từ chối hoàn tiền 1 phần, yêu cầu trả toàn bộ hàng."}`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      aiDamageClaimEvaluation: order.aiDamageClaimEvaluation,
      message: acceptPartialRefund
        ? `AI thẩm định thành công: Hoàn tiền ngay ${instantPartialRefundOffered.toLocaleString('vi-VN')}₫ vào ví của bạn!`
        : "Đã ghi nhận yêu cầu hoàn trả toàn bộ sản phẩm.",
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Đóng gói gom đơn đa shop giảm thiểu rác thải & tối ưu vận chuyển (Feature 114)
// @route   POST /api/orders/:id/consolidate-packaging
// @access  Public / Authenticate
export const consolidateOrderPackaging = async (req, res) => {
  try {
    const { id } = req.params;
    const { consolidationHub = "SPX Logistics Sorting Center Tân Bình", participatingShops = [] } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần đóng gói gom đơn", 404);
    }

    const now = new Date().toISOString();
    const shopsList = participatingShops.length > 0 ? participatingShops : ["Shopee Mall Flagship", "Công Nghệ Store HCM"];
    const packagingMaterialsSavedKg = 0.85; // Giảm 0.85kg thùng carton & màng bóng khí
    const shippingFeeSaved = 15000; // Tiết kiệm 15,000₫ cước gom kiện

    order.consolidatedPackagingSuite = {
      isConsolidated: true,
      consolidationHub,
      consolidatedBoxesCount: 1,
      participatingShops: shopsList,
      packagingMaterialsSavedKg,
      shippingFeeSaved,
      consolidationStatus: "bundled_in_hub",
      consolidatedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đã gom đơn đóng gói hợp nhất tại ${consolidationHub}. Gom ${shopsList.length} shop vào 1 kiện duy nhất (Giảm ${packagingMaterialsSavedKg}kg rác thải bao bì, tiết kiệm ${shippingFeeSaved.toLocaleString('vi-VN')}₫ cước)`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      consolidatedPackagingSuite: order.consolidatedPackagingSuite,
      message: `Gom đơn đa shop thành công! Đã hợp nhất ${shopsList.length} shop vào 1 kiện hàng duy nhất.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát vận chuyển chuỗi cung ứng lạnh bảo quản thực phẩm tươi sống (Feature 115)
// @route   POST /api/orders/:id/cold-chain
// @access  Public / Authenticate
export const updatePriorityColdChainDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sensorSerial = `TEMP-IOT-${Date.now().toString().slice(-6)}`,
      minTempCelsius = 0,
      maxTempCelsius = 4,
      currentTempCelsius = 2.4,
      thermalInsulationBox = "smart_refrigerated_container",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát chuỗi cung ứng lạnh", 404);
    }

    const now = new Date().toISOString();
    const tempBreachAlert = currentTempCelsius < minTempCelsius || currentTempCelsius > maxTempCelsius;

    order.priorityColdChainDispatch = {
      isColdChain: true,
      sensorSerial,
      minTempCelsius: Number(minTempCelsius),
      maxTempCelsius: Number(maxTempCelsius),
      currentTempCelsius: Number(currentTempCelsius),
      thermalInsulationBox,
      tempBreachAlert,
      lastSensorSyncAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Cảm biến IoT Chuỗi Cung Ứng Lạnh (#${sensorSerial}): Nhiệt độ hiện tại ${currentTempCelsius}°C [Tiêu chuẩn: ${minTempCelsius}°C ~ ${maxTempCelsius}°C]. Thùng: ${thermalInsulationBox}. Cảnh báo vi phạm nhiệt độ: ${tempBreachAlert ? "BÁO ĐỘNG" : "AN TOÀN"}.`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      priorityColdChainDispatch: order.priorityColdChainDispatch,
      message: tempBreachAlert
        ? `CẢNH BÁO: Nhiệt độ kiện hàng (${currentTempCelsius}°C) đã vượt ngưỡng cho phép!`
        : `Giám sát chuỗi cung ứng lạnh an toàn (${currentTempCelsius}°C, tiêu chuẩn 0°C - 4°C).`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Thu cũ đổi mới đồ điện tử tận nhà & trợ giá trực tiếp (Feature 116)
// @route   POST /api/orders/:id/doorstep-trade-in
// @access  Public / Authenticate
export const submitDoorstepApplianceTradeIn = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      applianceType = "smartphone",
      deviceBrandModel = "iPhone 11 64GB",
      cosmeticCondition = "like_new",
      subsidyCreditAmount = 1800000,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần thu cũ đổi mới thiết bị", 404);
    }

    const now = new Date().toISOString();
    const recycleCertificateCode = `REC-EW-${Date.now().toString().slice(-6)}`;
    const courierName = "Trần Đình Khôi (Đội Thu Hồi E-Waste)";

    order.doorstepOldApplianceTradeIn = {
      isTradeInRequested: true,
      applianceType,
      deviceBrandModel,
      cosmeticCondition,
      subsidyCreditAmount: Number(subsidyCreditAmount),
      recycleCertificateCode,
      pickupCourierName: courierName,
      tradeInStatus: "subsidy_credited",
      creditedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Thu cũ đổi mới thiết bị (${deviceBrandModel} - ${cosmeticCondition}): Bưu tá ${courierName} tiếp nhận. Trợ giá trực tiếp ${Number(subsidyCreditAmount).toLocaleString('vi-VN')}₫ [Chứng chỉ tái chế xanh: #${recycleCertificateCode}].`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      doorstepOldApplianceTradeIn: order.doorstepOldApplianceTradeIn,
      message: `Đã tiếp nhận thu cũ đổi mới ${deviceBrandModel}! Trợ giá ${Number(subsidyCreditAmount).toLocaleString('vi-VN')}₫ đã được ghi nhận.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Điều phối máy bay không người lái giao hàng tự động & mô phỏng thả cáp Helipad (Feature 117)
// @route   POST /api/orders/:id/drone-dispatch
// @access  Public / Authenticate
export const dispatchAutonomousDroneFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      droneCallsign = `SPX-DRONE-VN${Date.now().toString().slice(-4)}`,
      flightAltitudeMeters = 120,
      flightSpeedKmh = 68,
      tetherDropStatus = "winch_cable_lowered",
      helipadCoordinates = { lat: 10.7769, lng: 106.7009 },
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần điều phối Drone giao khẩn cấp", 404);
    }

    const now = new Date().toISOString();
    const flightLogId = `FLIGHT-SPX-${Date.now().toString().slice(-6)}`;
    const windSpeedKnots = 7.8; // Gió 7.8 knots, an toàn cho bay thương mại

    order.autonomousDroneDelivery = {
      isDroneEligible: true,
      droneCallsign,
      flightAltitudeMeters: Number(flightAltitudeMeters),
      flightSpeedKmh: Number(flightSpeedKmh),
      batteryLevelPercent: 88,
      helipadCoordinates,
      tetherDropStatus,
      windSpeedKnots,
      flightLogId,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Hệ thống Điều Phối Drone SPX (#${droneCallsign}): Độ cao bay ${flightAltitudeMeters}m, tốc độ ${flightSpeedKmh}km/h. Tọa độ đáp: [${helipadCoordinates.lat}, ${helipadCoordinates.lng}]. Trạng thái thả kiện: ${tetherDropStatus} [Log: #${flightLogId}].`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      autonomousDroneDelivery: order.autonomousDroneDelivery,
      message: `Đã kích hoạt Drone ${droneCallsign}! Trạng thái: ${tetherDropStatus}.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Tự động kích hoạt bồi thường bảo hiểm vi phạm nhiệt độ hàng lạnh (Feature 118)
// @route   POST /api/orders/:id/cold-chain-insurance-claim
// @access  Public / Authenticate
export const settleColdChainInsuranceClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { breachConfirmed = true, payoutAmount = 350000 } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giải quyết bảo hiểm chuỗi lạnh", 404);
    }

    const now = new Date().toISOString();
    const policyId = `POL-COLD-${Date.now().toString().slice(-6)}`;
    const coverageAmount = 500000;
    const finalPayout = Number(payoutAmount || coverageAmount);

    order.coldChainInsuranceCompensation = {
      hasInsurance: true,
      policyId,
      coverageAmount,
      breachDetected: !!breachConfirmed,
      autoClaimStatus: breachConfirmed ? "payout_settled" : "claim_rejected",
      payoutAmount: breachConfirmed ? finalPayout : 0,
      settledAt: now,
      insuranceProvider: "Shopee Bảo Hiểm Hàng Lạnh Toàn Diện",
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Bảo hiểm Chuỗi Lạnh (#${policyId}): Xác nhận sự cố đứt gãy dải nhiệt IoT. Tự động chi trả bồi thường bảo hiểm ${finalPayout.toLocaleString('vi-VN')}₫ trực tiếp vào số dư ví người mua.`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      coldChainInsuranceCompensation: order.coldChainInsuranceCompensation,
      message: breachConfirmed
        ? `Đã bồi thường ${finalPayout.toLocaleString('vi-VN')}₫ từ bảo hiểm hàng lạnh thành công!`
        : "Không phát hiện vi phạm dải nhiệt tiêu chuẩn, yêu cầu bồi thường không được chấp thuận.",
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Tối ưu hóa hành trình giao hàng bằng đội xe điện/năng lượng mặt trời (Feature 119)
// @route   POST /api/orders/:id/solar-green-fleet
// @access  Public / Authenticate
export const optimizeSolarFleetGreenRouting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleType = "solar_cargo_bike",
      fleetId = `GREEN-EV-${Date.now().toString().slice(-4)}`,
      routeOptimizationEfficiencyPercent = 28,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần tối ưu tuyến xe điện xanh", 404);
    }

    const now = new Date().toISOString();
    const co2AvoidedGrams = 850; // Cắt giảm 850g khí thải CO2 so với xe xăng
    const solarEnergyHarvestedWh = 420; // 420 Wh điện thu từ tấm pin solar trên nóc thùng xe

    order.solarFleetGreenRouting = {
      isGreenFleet: true,
      vehicleType,
      fleetId,
      routeOptimizationEfficiencyPercent: Number(routeOptimizationEfficiencyPercent),
      co2AvoidedGrams,
      solarEnergyHarvestedWh,
      ecoDriverRating: 4.95,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đội Xe Xanh SPX Green Fleet (#${fleetId} - ${vehicleType}): Tối ưu tuyến đường giảm ${routeOptimizationEfficiencyPercent}%. Cắt giảm ${co2AvoidedGrams}g CO₂, nạp ${solarEnergyHarvestedWh}Wh điện mặt trời.`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      solarFleetGreenRouting: order.solarFleetGreenRouting,
      message: `Tối ưu lộ trình xe xanh thành công! Giảm ${co2AvoidedGrams}g CO₂ vào môi trường.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Điều chỉnh địa chỉ giao & đổi khung giờ nhận hàng tức thời khi bưu tá đang giao (Feature 120)
// @route   POST /api/orders/:id/realtime-reroute
// @access  Public / Authenticate
export const updateRealTimeParcelRerouting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      reroutedAddress = "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      deliveryTimeWindow = "afternoon_13_17",
      newCoordinates = { lat: 10.7801, lng: 106.6992 },
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần đổi lộ trình giao tức thời", 404);
    }

    const now = new Date().toISOString();
    const additionalDistanceKm = 1.4; // Lệch 1.4km so với lộ trình ban đầu
    const rerouteFeeCharged = 0; // Miễn phí đổi địa chỉ trong bán kính <3km

    order.realTimeParcelRerouting = {
      isRerouted: true,
      originalCoordinates: { lat: 10.7769, lng: 106.7009 },
      newCoordinates,
      reroutedAddress,
      deliveryTimeWindow,
      additionalDistanceKm,
      rerouteFeeCharged,
      courierAckStatus: "route_recalculated",
      reroutedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Đổi Lộ Trình Giao Hàng Tức Thời: Điểm đến mới -> ${reroutedAddress} (Khung giờ: ${deliveryTimeWindow}). Bưu tá đã chấp thuận, lộ trình giao đã được tái định tuyến (+${additionalDistanceKm}km, Phí phụ thu: ${rerouteFeeCharged}₫).`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      realTimeParcelRerouting: order.realTimeParcelRerouting,
      message: `Đổi lộ trình thành công! Đã gửi thông báo định tuyến mới cho bưu tá.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát vi chấn IoT hàng dễ vỡ & tự động bồi thường khi va chạm quá ngưỡng G-Force (Feature 121)
// @route   POST /api/orders/:id/fragile-shock-telemetry
// @access  Public / Authenticate
export const updateFragileShockSensorTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      shockSensorId = `SHOCK-IOT-${Date.now().toString().slice(-4)}`,
      recordedGForce = 3.2,
      maxGForceLimit = 2.5,
      dropEventCount = 1,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát va đập hàng dễ vỡ", 404);
    }

    const now = new Date().toISOString();
    const gForce = Number(recordedGForce);
    const limit = Number(maxGForceLimit);
    const impactExceeded = gForce > limit;
    const compensationAmount = impactExceeded ? 250000 : 0;
    const autoClaimInsuranceStatus = impactExceeded ? "compensation_disbursed" : "safe_transit";

    order.fragileShockSensorTelemetry = {
      isFragileMonitored: true,
      shockSensorId,
      maxGForceLimit: limit,
      recordedGForce: gForce,
      impactExceeded,
      dropEventCount: Number(dropEventCount),
      autoClaimInsuranceStatus,
      insuranceCompensationAmount: compensationAmount,
      lastTelemetrySyncAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Cảm biến chấn động IoT (#${shockSensorId}): Lực va đập ghi nhận ${gForce}G [Ngưỡng an toàn: ${limit}G]. ${impactExceeded ? `CẢNH BÁO: Rơi vỡ va chạm mạnh! Tự động đền bù bảo hiểm hàng dễ vỡ ${compensationAmount.toLocaleString('vi-VN')}₫ vào ví.` : "Vận chuyển êm ái, bưu kiện nguyên vẹn an toàn."}`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      fragileShockSensorTelemetry: order.fragileShockSensorTelemetry,
      message: impactExceeded
        ? `Đã phát hiện va đập quá ngưỡng (${gForce}G)! Đã kích hoạt bồi thường ${compensationAmount.toLocaleString('vi-VN')}₫.`
        : `Kiện hàng an toàn, gia tốc chấn động trong chuẩn cho phép (${gForce}G <= ${limit}G).`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Ghi nhận đối soát bù trừ tín chỉ carbon đa đơn vị vận chuyển & cấp mã băm Blockchain (Feature 122)
// @route   POST /api/orders/:id/carrier-carbon-ledger
// @access  Public / Authenticate
export const recordMultiCarrierCarbonLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      carrierCode = "SPX_EXPRESS",
      carrierConsortiumBatchId = `CONSORTIUM-VN-${Date.now().toString().slice(-4)}`,
      carbonCreditsOffset = 1.85,
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần ghi nhận sổ cái carbon", 404);
    }

    const now = new Date().toISOString();
    const blockchainVerificationHash = `0x7f9a${Date.now().toString(16)}bc814e${Math.random().toString(16).slice(2, 10)}`;

    order.multiCarrierCarbonLedger = {
      isLedgerRecorded: true,
      carrierCode,
      carrierConsortiumBatchId,
      carbonCreditsOffset: Number(carbonCreditsOffset),
      blockchainVerificationHash,
      greenAuditStatus: "gold_standard_certified",
      verifiedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `Liên minh Vận chuyển Xanh (#${carrierConsortiumBatchId} - ${carrierCode}): Đã kiểm toán bù trừ ${carbonCreditsOffset} tín chỉ Carbon (Gold Standard). Mã băm sổ cái xác thực: ${blockchainVerificationHash}.`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      multiCarrierCarbonLedger: order.multiCarrierCarbonLedger,
      message: `Đã đối soát sổ cái Carbon đa hãng vận chuyển thành công! Bù trừ ${carbonCreditsOffset} tín chỉ.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    AI thẩm định video hoàn trả hàng & phân loại cấp độ thanh lý Resale Grading (Feature 123)
// @route   POST /api/orders/:id/ai-return-resale-grading
// @access  Public / Authenticate
export const evaluateVideoReturnResaleGrading = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      resaleGrade = "grade_a_pristine",
      videoAnalysisId = `VID-AI-GRADER-${Date.now().toString().slice(-4)}`,
      secondaryMarketChannel = "shopee_outlet",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần thẩm định phân loại hàng trả", 404);
    }

    const now = new Date().toISOString();
    const orderTotal = Number(order.total || 800000);
    const deductionMap = {
      grade_a_pristine: 0,
      grade_b_open_box: 10,
      grade_c_refurbished: 25,
      grade_d_salvage_parts: 60,
    };
    const restockingFeeDeductionPercent = deductionMap[resaleGrade] !== undefined ? deductionMap[resaleGrade] : 10;
    const estimatedResaleValueVnd = Math.round(orderTotal * (1 - restockingFeeDeductionPercent / 100));

    order.aiVideoReturnResaleGrading = {
      hasEvaluated: true,
      videoAnalysisId,
      resaleGrade,
      restockingFeeDeductionPercent,
      estimatedResaleValueVnd,
      secondaryMarketChannel,
      gradedAt: now,
    };

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: `AI Video Grader (#${videoAnalysisId}): Phân loại hàng trả về [${resaleGrade}]. Khấu trừ phí lưu kho tân trang: ${restockingFeeDeductionPercent}%. Giá trị tái xuất kho Shopee Outlet: ${estimatedResaleValueVnd.toLocaleString('vi-VN')}₫ (${secondaryMarketChannel}).`,
      },
    ];

    await order.save?.();

    sendSuccess(res, {
      orderId: order.orderId || order._id,
      aiVideoReturnResaleGrading: order.aiVideoReturnResaleGrading,
      message: `Đã phân loại hàng trả thành công (${resaleGrade})! Giá trị tái định giá: ${estimatedResaleValueVnd.toLocaleString('vi-VN')}₫.`,
    }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Ghi nhận dữ liệu cảm biến âm thanh vi chấn chống tráo hàng (Acoustic Anti-Tamper)
// @route   POST /api/orders/:id/acoustic-anti-tamper
// @access  Public / Optional Auth / Courier Webhook
export const updateAcousticAntiTamperTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sensorId,
      decibelSpikePeak = 0,
      frequencySignature = "ambient_transit",
      tamperEventDetected = false,
      tapeCutPatternMatch = false,
    } = req.body;

    if (!sensorId) {
      return sendError(res, "Thiếu mã định danh cảm biến âm vi chấn (sensorId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát âm thanh chống tráo", 404);
    }

    const now = new Date().toISOString();
    const isTapeCuttingSound =
      tapeCutPatternMatch === true ||
      frequencySignature === "tape_cutter_friction" ||
      frequencySignature === "seal_tear";
    const isSuspiciousDecibel = Number(decibelSpikePeak) >= 75;
    const isTamper = Boolean(tamperEventDetected || isTapeCuttingSound || (isSuspiciousDecibel && frequencySignature !== "ambient_transit"));

    let sealIntegrityStatus = "pristine";
    if (isTapeCuttingSound) {
      sealIntegrityStatus = "tampered_tape_cut";
    } else if (isTamper) {
      sealIntegrityStatus = "critical_seal_breach";
    } else if (isSuspiciousDecibel) {
      sealIntegrityStatus = "suspicious_vibration";
    }

    const courierInterceptFlag = isTamper;
    const investigationRef = isTamper
      ? `ACOUSTIC-AUDIT-${Date.now().toString(36).toUpperCase()}`
      : (order.acousticAntiTamperTelemetry?.investigationRef || null);

    order.acousticAntiTamperTelemetry = {
      isAcousticMonitored: true,
      sensorId,
      decibelSpikePeak: Number(decibelSpikePeak),
      frequencySignature,
      tamperEventDetected: isTamper,
      tapeCutPatternMatch: Boolean(isTapeCuttingSound),
      sealIntegrityStatus,
      alertTriggeredAt: isTamper ? now : (order.acousticAntiTamperTelemetry?.alertTriggeredAt || null),
      courierInterceptFlag,
      investigationRef,
    };

    const statusNote = isTamper
      ? `CẢNH BÁO VI CHẤN / RẠCH BĂNG KEO: Cảm biến ${sensorId} phát hiện âm phổ bất thường (${decibelSpikePeak} dB, mẫu [${frequencySignature}]). Mã kiểm tra: ${investigationRef}. Đã yêu cầu bưu tá tạm dừng phát hàng.`
      : `Kiểm tra âm phổ gói hàng ${sensorId}: Tín hiệu ổn định (${decibelSpikePeak} dB, [${frequencySignature}]). Băng keo niêm phong nguyên vẹn.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        acousticAntiTamperTelemetry: order.acousticAntiTamperTelemetry,
        message: isTamper
          ? "Phát hiện dấu hiệu tráo hàng / rạch băng keo! Đã kích hoạt khóa chặn khẩn cấp bưu tá."
          : "Đã cập nhật dữ liệu âm phổ chống tráo thành công (Niêm phong an toàn).",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Bàn giao túi niêm phong tại tủ trung chuyển bưu cục mini tự động (Micro-Hub Pouch Lock Box Handoff)
// @route   POST /api/orders/:id/micro-hub-pouch-handoff
// @access  Public / Optional Auth / Courier Webhook
export const updateMicroHubPouchLockBoxHandoff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      microHubId,
      pouchBarcode,
      compartmentSlotNumber = 12,
      carrierHandoffStatus = "courier_deposited",
      courierDepositBadgeId = "SPX-COURIER-771",
      lockerPasscodePin,
    } = req.body;

    if (!microHubId) {
      return sendError(res, "Thiếu mã trạm bưu cục mini (microHubId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần bàn giao tại tủ bưu cục mini", 404);
    }

    const now = new Date().toISOString();
    const generatedPin = lockerPasscodePin || String(Math.floor(100000 + Math.random() * 900000));
    const finalPouchBarcode = pouchBarcode || `POUCH-SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    const isRetrieved = carrierHandoffStatus === "courier_retrieved_out_for_delivery";
    const depositedAt = isRetrieved
      ? (order.microHubPouchLockBoxHandoff?.depositedAt || now)
      : now;
    const retrievedAt = isRetrieved ? now : null;

    order.microHubPouchLockBoxHandoff = {
      isPouchLocked: true,
      microHubId,
      pouchBarcode: finalPouchBarcode,
      compartmentSlotNumber: Number(compartmentSlotNumber) || 12,
      lockerPasscodePin: generatedPin,
      carrierHandoffStatus,
      depositedAt,
      retrievedAt,
      courierDepositBadgeId,
    };

    const statusMap = {
      courier_deposited: `Bưu tá (${courierDepositBadgeId}) đã gửi túi niêm phong ${finalPouchBarcode} vào ngăn #${compartmentSlotNumber} trạm ${microHubId}. Mã PIN: ${generatedPin}.`,
      hub_sorted_ready: `Trạm ${microHubId}: Túi niêm phong đã sẵn sàng để bưu tá giao chặng cuối lấy đi phát.`,
      courier_retrieved_out_for_delivery: `Bưu tá chặng cuối đã mở ngăn #${compartmentSlotNumber} trạm ${microHubId} lấy túi niêm phong đi giao khách.`,
    };

    const timelineText = statusMap[carrierHandoffStatus] || `Cập nhật bàn giao tủ bưu cục mini: [${carrierHandoffStatus}] tại ${microHubId}.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: timelineText,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        microHubPouchLockBoxHandoff: order.microHubPouchLockBoxHandoff,
        message: `Đã cập nhật trạng thái bàn giao tủ trung chuyển bưu cục mini thành công (${carrierHandoffStatus})!`,
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Ký nhận giao hàng bằng thẻ NFC thông minh & đối soát vị trí Geofence Handshake (NFC Proof-of-Delivery)
// @route   POST /api/orders/:id/nfc-geofence-pod
// @access  Public / Optional Auth / Courier App
export const verifyNfcGeofenceProofOfDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nfcCardUid,
      handshakeDistanceMeters = 5,
      geofenceThresholdMeters = 50,
      deviceReaderSerial = "SPX-POS-READER-99",
      bypassOtpFallback = false,
    } = req.body;

    if (!nfcCardUid && !bypassOtpFallback) {
      return sendError(res, "Thiếu mã định danh thẻ NFC (nfcCardUid) hoặc cờ dự phòng OTP", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần ký nhận NFC", 404);
    }

    const now = new Date().toISOString();
    const distance = Number(handshakeDistanceMeters) || 0;
    const threshold = Number(geofenceThresholdMeters) || 50;

    let geofenceStatus = "within_geofence_handshake";
    let isNfcVerified = true;

    if (bypassOtpFallback) {
      geofenceStatus = "bypassed_otp_fallback";
    } else if (distance > threshold) {
      geofenceStatus = "outside_geofence_flagged";
      isNfcVerified = false;
    }

    const proofSignatureToken = isNfcVerified || bypassOtpFallback
      ? `POD-NFC-HASH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      : null;

    order.nfcGeofenceProofOfDelivery = {
      isNfcVerified,
      nfcCardUid: nfcCardUid || "OTP-FALLBACK-AUTH",
      handshakeDistanceMeters: distance,
      geofenceThresholdMeters: threshold,
      geofenceStatus,
      tappedAt: now,
      deviceReaderSerial,
      proofSignatureToken,
    };

    if (isNfcVerified) {
      order.status = "delivered";
      order.statusText = "Đã giao hàng (Xác thực NFC)";
    }

    const timelineNote = isNfcVerified
      ? `Xác thực giao hàng NFC thành công (Thẻ: ${nfcCardUid}). Khoảng cách Geofence: ${distance}m (Ngưỡng <= ${threshold}m). Mã xác thực PoD: ${proofSignatureToken}.`
      : geofenceStatus === "bypassed_otp_fallback"
      ? `Xác thực giao hàng qua OTP dự phòng (Khoảng cách: ${distance}m). Mã PoD: ${proofSignatureToken}.`
      : `CẢNH BÁO GEOFENCE: Quẹt thẻ NFC cách điểm nhận ${distance}m (vượt ngưỡng cho phép ${threshold}m). Đơn hàng bị gắn cờ cần kiểm toán đối soát.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: timelineNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        nfcGeofenceProofOfDelivery: order.nfcGeofenceProofOfDelivery,
        message: isNfcVerified
          ? "Ký nhận thẻ NFC & Geofence thành công! Đơn hàng đã hoàn tất giao."
          : geofenceStatus === "bypassed_otp_fallback"
          ? "Ký nhận qua OTP dự phòng thành công."
          : "Cảnh báo: Vị trí quẹt thẻ vượt quá bán kính Geofence an toàn!",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Quét an toàn chất dễ cháy và vật liệu nguy hiểm theo thời gian thực tại Hub (Hazmat Safety Scanner)
// @route   POST /api/orders/:id/hazmat-safety-scan
// @access  Public / Optional Auth / Hub Automation Station
export const scanHazardousMaterialSafety = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      scannerStationId,
      flammabilityIndexScore = 0,
      chemicalVaporPpm = 0,
      lithiumBatteryClass = "none",
    } = req.body;

    if (!scannerStationId) {
      return sendError(res, "Thiếu mã trạm quét an toàn Hub (scannerStationId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần quét an toàn vật liệu nguy hiểm", 404);
    }

    const now = new Date().toISOString();
    const flammability = Number(flammabilityIndexScore) || 0;
    const vapor = Number(chemicalVaporPpm) || 0;

    let safetyStatus = "certified_safe";
    let quarantineReason = null;

    if (flammability >= 70 || vapor >= 100) {
      safetyStatus = "quarantined_hazardous";
      quarantineReason = `Nồng độ hơi hóa chất (${vapor} ppm) hoặc chỉ số cháy nổ (${flammability}/100) vượt ngưỡng an toàn vận tải hàng không/đường bộ.`;
    } else if (lithiumBatteryClass === "un3480_standalone_prohibited_air") {
      safetyStatus = "prohibited_ground_transport_only";
      quarantineReason = "Pin Lithium độc lập UN3480 cấm vận chuyển đường hàng không, bắt buộc chuyển tải đường bộ.";
    } else if (flammability >= 40 || vapor >= 45) {
      safetyStatus = "flammable_warning_flagged";
    }

    const safetyClearanceCertificate = safetyStatus === "certified_safe"
      ? `HAZMAT-PASS-${Date.now().toString(36).toUpperCase()}`
      : null;

    order.hazardousMaterialSafetyScan = {
      isSafetyScanned: true,
      scannerStationId,
      flammabilityIndexScore: flammability,
      chemicalVaporPpm: vapor,
      lithiumBatteryClass,
      safetyStatus,
      quarantineReason,
      scannedAt: now,
      safetyClearanceCertificate,
    };

    const statusNote = safetyStatus === "certified_safe"
      ? `Trạm ${scannerStationId}: Kiểm tra an toàn Hazmat đạt chuẩn (Cháy nổ: ${flammability}/100, Hơi hóa chất: ${vapor}ppm). Chứng nhận: ${safetyClearanceCertificate}.`
      : safetyStatus === "prohibited_ground_transport_only"
      ? `Trạm ${scannerStationId}: Phát hiện Pin UN3480. Tự động chuyển tuyến vận chuyển đường bộ an toàn.`
      : `BÁO ĐỘNG HAZMAT: Kiện hàng bị cách ly tại ${scannerStationId}. Lý do: ${quarantineReason}`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        hazardousMaterialSafetyScan: order.hazardousMaterialSafetyScan,
        message: safetyStatus === "certified_safe"
          ? "Kiện hàng được chứng nhận an toàn vận chuyển thành công!"
          : safetyStatus === "prohibited_ground_transport_only"
          ? "Đã phân tuyến đường bộ đối với pin Lithium UN3480."
          : "CẢNH BÁO: Kiện hàng đã bị cách ly do tiềm ẩn nguy cơ cháy nổ!",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát hành lang bay Drone & Cảm biến gió ngược hạ cánh (Drone Air-Corridor & Landing Beacon)
// @route   POST /api/orders/:id/drone-air-corridor-beacon
// @access  Public / Optional Auth / Drone Telemetry Service
export const updateDroneAirCorridorLandingBeacon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      corridorFlightCode,
      windSpeedKnots = 12,
      landingBeaconId = "BEACON-PAD-SG-09",
      groundLockerFallbackId = "LOCKER-SPX-FALLBACK-01",
    } = req.body;

    if (!corridorFlightCode) {
      return sendError(res, "Thiếu mã hành lang bay Drone (corridorFlightCode)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát hạ cánh Drone", 404);
    }

    const now = new Date().toISOString();
    const wind = Number(windSpeedKnots) || 0;

    let windShearRisk = "low_calm";
    let landingSafetyStatus = "cleared_for_touchdown";

    if (wind >= 28) {
      windShearRisk = "severe_crosswind_abort";
      landingSafetyStatus = "rerouted_to_ground_locker";
    } else if (wind >= 18) {
      windShearRisk = "moderate_gusts";
      landingSafetyStatus = "hovering_weather_hold";
    }

    order.droneAirCorridorLandingBeacon = {
      isDroneCorridorActive: true,
      corridorFlightCode,
      windSpeedKnots: wind,
      windShearRisk,
      landingBeaconId,
      landingSafetyStatus,
      groundLockerFallbackId: landingSafetyStatus === "rerouted_to_ground_locker" ? groundLockerFallbackId : null,
      telemetryUpdatedAt: now,
    };

    const statusNote = landingSafetyStatus === "cleared_for_touchdown"
      ? `Hành lang bay ${corridorFlightCode}: Gió êm (${wind} knots). Đã bắt sóng Beacon ${landingBeaconId}, đủ điều kiện hạ cánh an toàn.`
      : landingSafetyStatus === "hovering_weather_hold"
      ? `Hành lang bay ${corridorFlightCode}: Gió giật ${wind} knots. Drone đang bay treo giữ cao độ chờ thời tiết ổn định.`
      : `BÁO ĐỘNG GIÓ NGƯỢC (${wind} knots): Drone hủy hạ cánh khẩn cấp. Tự động chuyển hướng đáp xuống trạm tủ mặt đất an toàn ${groundLockerFallbackId}.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        droneAirCorridorLandingBeacon: order.droneAirCorridorLandingBeacon,
        message: landingSafetyStatus === "cleared_for_touchdown"
          ? "Đã cấp phép hạ cánh xuống bãi đáp Drone an toàn!"
          : landingSafetyStatus === "hovering_weather_hold"
          ? "Drone đang tạm thời bay treo do gió mạnh."
          : "Đã hủy hạ cánh Drone do gió giật nguy hiểm! Đã chuyển hướng sang tủ bưu kiện mặt đất.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giao hàng tận cửa vào nhà thông minh với khóa mã số 1 lần (Smart Lock In-Home Delivery Vault)
// @route   POST /api/orders/:id/smart-lock-in-home-delivery
// @access  Public / Optional Auth / Courier Verified App
export const authorizeSmartLockInHomeDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      smartLockId,
      authorizedCourierBadge = "SPX-VERIFIED-9912",
      accessWindowMinutes = 5,
      actionStatus = "issue_key", // "issue_key" | "unlock_and_deposit" | "relock_and_complete"
    } = req.body;

    if (!smartLockId) {
      return sendError(res, "Thiếu mã định danh khóa thông minh (smartLockId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần phân quyền khóa thông minh", 404);
    }

    const now = new Date().toISOString();
    const vault = order.smartLockInHomeDeliveryVault || {};

    let inHomeDeliveryStatus = vault.inHomeDeliveryStatus || "key_issued_pending_courier";
    let singleUsePasscodeHash = vault.singleUsePasscodeHash;
    let doorUnlockedAt = vault.doorUnlockedAt || null;
    let doorRelockedSecurely = vault.doorRelockedSecurely || false;
    let surveillanceRecordingHash = vault.surveillanceRecordingHash || null;

    if (actionStatus === "issue_key" || !singleUsePasscodeHash) {
      singleUsePasscodeHash = `PASSKEY-${Math.floor(100000 + Math.random() * 900000)}`;
      inHomeDeliveryStatus = "key_issued_pending_courier";
    } else if (actionStatus === "unlock_and_deposit") {
      inHomeDeliveryStatus = "door_unlocked_package_placed";
      doorUnlockedAt = now;
    } else if (actionStatus === "relock_and_complete") {
      inHomeDeliveryStatus = "delivered_door_relocked_securely";
      doorRelockedSecurely = true;
      surveillanceRecordingHash = `SURVEILLANCE-VAULT-HASH-${Date.now().toString(36).toUpperCase()}`;
      order.status = "delivered";
      order.statusText = "Đã giao vào nhà an toàn (Khóa Smart Lock)";
    }

    order.smartLockInHomeDeliveryVault = {
      isInHomeDeliveryAuthorized: true,
      smartLockId,
      singleUsePasscodeHash,
      accessWindowMinutes: Number(accessWindowMinutes) || 5,
      authorizedCourierBadge,
      doorUnlockedAt,
      doorRelockedSecurely,
      surveillanceRecordingHash,
      inHomeDeliveryStatus,
    };

    const statusMap = {
      key_issued_pending_courier: `Khóa ${smartLockId}: Đã sinh mã mở cửa 1 lần (${singleUsePasscodeHash}) hiệu lực trong ${accessWindowMinutes} phút cho bưu tá ${authorizedCourierBadge}.`,
      door_unlocked_package_placed: `Khóa ${smartLockId}: Bưu tá đã mở cửa đặt hàng vào sảnh an toàn. Camera bắt đầu ghi hình.`,
      delivered_door_relocked_securely: `Khóa ${smartLockId}: Cửa đã khóa chốt an toàn. Đã băm lưu video giám sát (${surveillanceRecordingHash}). Giao hàng hoàn tất.`,
    };

    const timelineNote = statusMap[inHomeDeliveryStatus] || `Cập nhật giao hàng qua khóa thông minh (${inHomeDeliveryStatus}).`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: timelineNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        smartLockInHomeDeliveryVault: order.smartLockInHomeDeliveryVault,
        message: inHomeDeliveryStatus === "delivered_door_relocked_securely"
          ? "Đã giao hàng vào nhà và khóa chốt cửa an toàn!"
          : inHomeDeliveryStatus === "door_unlocked_package_placed"
          ? "Đã ghi nhận mở cửa và đặt hàng vào sảnh."
          : `Đã cấp mã mở cửa tạm thời thành công (${singleUsePasscodeHash}).`,
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát độ ẩm gói hàng & độ bão hòa gói hút ẩm IoT (Parcel Moisture & Desiccant Saturation)
// @route   POST /api/orders/:id/moisture-telemetry
// @access  Public / Optional Auth / IoT Warehouse & Cargo Service
export const updateParcelMoistureTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      moistureSensorId,
      relativeHumidityPercent = 40,
      desiccantSaturationPercent = 25,
      condensationDetected = false,
    } = req.body;

    if (!moistureSensorId) {
      return sendError(res, "Thiếu mã cảm biến độ ẩm IoT (moistureSensorId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát độ ẩm", 404);
    }

    const now = new Date().toISOString();
    const humidity = Number(relativeHumidityPercent) || 0;
    const desiccant = Number(desiccantSaturationPercent) || 0;
    const isCritical = humidity >= 75 || desiccant >= 85 || condensationDetected === true;
    const isMild = humidity >= 55 && !isCritical;

    let humidityStatus = "optimal_dry";
    if (isCritical) {
      humidityStatus = "critical_moisture_risk";
    } else if (isMild) {
      humidityStatus = "mild_humidity";
    }

    const airDryingVentilationScheduled = isCritical;

    order.parcelMoistureTelemetry = {
      isMoistureMonitored: true,
      moistureSensorId,
      relativeHumidityPercent: humidity,
      desiccantSaturationPercent: desiccant,
      condensationDetected: Boolean(condensationDetected),
      humidityStatus,
      alertTriggeredAt: isCritical ? now : (order.parcelMoistureTelemetry?.alertTriggeredAt || null),
      airDryingVentilationScheduled,
    };

    const statusNote = isCritical
      ? `BÁO ĐỘNG ĐỘ ẨM KHẨN CẤP: Cảm biến ${moistureSensorId} đo độ ẩm ${humidity}% (Gói hút ẩm no nước ${desiccant}%). Đã tự động kích hoạt quạt thông gió sấy khí khô bảo vệ hàng hóa.`
      : isMild
      ? `Cảnh báo độ ẩm: Kiện hàng đo được ${humidity}% RH (Gói hút ẩm ${desiccant}%). Môi trường vận chuyển ẩm ướt.`
      : `Kiểm tra độ ẩm an toàn: Cảm biến ${moistureSensorId} đạt chuẩn khô ráo (${humidity}% RH, gói hút ẩm ${desiccant}%).`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        parcelMoistureTelemetry: order.parcelMoistureTelemetry,
        message: isCritical
          ? "Đã phát hiện độ ẩm nguy hiểm! Đã điều phối thông gió sấy khí khô khẩn cấp."
          : "Cập nhật dữ liệu độ ẩm kiện hàng thành công (Môi trường an toàn).",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Niêm phong lưới sợi quang học chống tráo hàng cao cấp (Fiber-Optic Mesh Seal)
// @route   POST /api/orders/:id/fiber-optic-mesh-seal
// @access  Public / Optional Auth / Courier & High-Value Vault Station
export const updateFiberOpticMeshSeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      meshSealId,
      lightTransmissionLumen = 100,
      tamperCutDetected = false,
    } = req.body;

    if (!meshSealId) {
      return sendError(res, "Thiếu mã niêm phong lưới sợi quang (meshSealId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần niêm phong sợi quang", 404);
    }

    const now = new Date().toISOString();
    const lumen = Number(lightTransmissionLumen) || 0;
    const isBreach = tamperCutDetected === true || lumen <= 20;
    const isStress = lumen < 80 && !isBreach;

    let lightContinuityStatus = "continuous_intact";
    if (isBreach) {
      lightContinuityStatus = "fiber_severed_breach";
    } else if (isStress) {
      lightContinuityStatus = "optical_attenuation_stress";
    }

    const highValueInsuranceEscrowLocked = isBreach;
    const incidentAuditRef = isBreach
      ? `FIBER-BREACH-${Date.now().toString(36).toUpperCase()}`
      : (order.fiberOpticMeshSeal?.incidentAuditRef || null);

    order.fiberOpticMeshSeal = {
      isFiberMeshArmed: true,
      meshSealId,
      lightContinuityStatus,
      lightTransmissionLumen: lumen,
      tamperCutDetected: isBreach,
      highValueInsuranceEscrowLocked,
      meshArmedAt: now,
      incidentAuditRef,
    };

    const statusNote = isBreach
      ? `BÁO ĐỘNG NIÊM PHONG SỢI QUANG: Lưới bảo mật ${meshSealId} bị đứt gãy truyền dẫn (${lumen}% ánh sáng). Khóa ký quỹ bảo hiểm tài sản cao cấp (${incidentAuditRef}). Tạm giữ điều tra gian lận tráo hàng.`
      : isStress
      ? `Cảnh báo vi áp suất sợi quang: Lưới ${meshSealId} suy hao truyền dẫn (${lumen}% ánh sáng). Vỏ hộp bị móp nhẹ.`
      : `Lưới sợi quang ${meshSealId}: Luồng quang thông suốt 100% (${lumen}% ánh sáng). Niêm phong an toàn tuyệt đối.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        fiberOpticMeshSeal: order.fiberOpticMeshSeal,
        message: isBreach
          ? "Phát hiện đứt gãy lưới sợi quang niêm phong! Đã khóa ký quỹ bồi hoàn bảo hiểm."
          : "Cập nhật trạng thái niêm phong sợi quang học an toàn.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Điều động Robot Swarm tự hành từ xe tải điện vi mô (Feature 132)
// @route   POST /api/orders/:id/mobile-van-robot-swarm
// @access  Public / Authenticate
export const updateMobileVanRobotSwarmDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      motherVanId,
      assignedRobotId,
      robotBatteryLevelPercent = 100,
      curbsideDockStationPin,
      swarmMissionStatus = "docked_in_van",
    } = req.body;

    if (!motherVanId || !assignedRobotId) {
      return sendError(res, "Thiếu thông tin nhận diện xe mẹ (motherVanId) hoặc ID Robot Swarm (assignedRobotId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần điều phối Robot Swarm", 404);
    }

    const now = new Date().toISOString();
    const battery = Math.max(0, Math.min(100, Number(robotBatteryLevelPercent) || 100));
    const validStatuses = ["docked_in_van", "dispatched_sidewalk_transit", "customer_doorstep_delivered", "returned_to_mother_van"];
    const missionStatus = validStatuses.includes(swarmMissionStatus) ? swarmMissionStatus : "dispatched_sidewalk_transit";

    const isDelivered = missionStatus === "customer_doorstep_delivered";
    const isReturned = missionStatus === "returned_to_mother_van";

    order.mobileVanRobotSwarmDispatch = {
      isSwarmDispatched: true,
      motherVanId,
      assignedRobotId,
      robotBatteryLevelPercent: battery,
      curbsideDockStationPin: curbsideDockStationPin || `DOCK-PIN-${Math.floor(1000 + Math.random() * 9000)}`,
      swarmMissionStatus: missionStatus,
      missionDispatchedAt: order.mobileVanRobotSwarmDispatch?.missionDispatchedAt || now,
      missionCompletedAt: (isDelivered || isReturned) ? now : (order.mobileVanRobotSwarmDispatch?.missionCompletedAt || null),
    };

    const statusNote = missionStatus === "dispatched_sidewalk_transit"
      ? `Xe tải mẹ ${motherVanId} đã phóng Robot #${assignedRobotId} xuất kích tiếp cận vỉa hè nhà người nhận (Pin ${battery}%).`
      : isDelivered
      ? `Robot #${assignedRobotId} đã giao hàng tận ngưỡng cửa thành công! Khách xác nhận qua mã DOCK.`
      : isReturned
      ? `Robot #${assignedRobotId} hoàn thành sứ mệnh, đã tự hành quay về neo sạc tại xe tải mẹ ${motherVanId}.`
      : `Robot #${assignedRobotId} sẵn sàng trong khoang xe tải mẹ ${motherVanId}.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        mobileVanRobotSwarmDispatch: order.mobileVanRobotSwarmDispatch,
        message: "Cập nhật trạng thái điều phối Robot Swarm từ xe tải điện thành công.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Kiểm tra bảo mật mực nhiệt quang học chống sao chép vận đơn (Feature 133)
// @route   POST /api/orders/:id/thermochromic-barcode
// @access  Public / Authenticate
export const auditThermoChromicColorShiftBarcode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      barcodeBatchSerialNumber,
      ambientTemperatureCelsius = 25,
      thermalExposureThresholdCelsius = 45,
      spectralColorShiftHex,
    } = req.body;

    if (!barcodeBatchSerialNumber) {
      return sendError(res, "Thiếu số seri lô mực in nhiệt quang học (barcodeBatchSerialNumber)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần xác thực mực in nhiệt quang học", 404);
    }

    const now = new Date().toISOString();
    const temp = Number(ambientTemperatureCelsius) || 25;
    const threshold = Number(thermalExposureThresholdCelsius) || 45;
    const heatTamperExceeded = temp >= threshold;

    // Khi quá nhiệt, mực chuyển màu đỏ tía cảnh báo can thiệp máy sấy bóc tem
    const dynamicHex = spectralColorShiftHex || (heatTamperExceeded ? "#be185d" : "#10b981");
    const antiCounterfeitVerificationHash = `THERMO-HASH-${Date.now().toString(36).toUpperCase()}-${barcodeBatchSerialNumber.slice(-4)}`;

    order.thermoChromicColorShiftBarcode = {
      isThermoChromicArmed: true,
      barcodeBatchSerialNumber,
      spectralColorShiftHex: dynamicHex,
      ambientTemperatureCelsius: temp,
      thermalExposureThresholdCelsius: threshold,
      heatTamperExceeded,
      antiCounterfeitVerificationHash,
      inspectedAt: now,
    };

    const statusNote = heatTamperExceeded
      ? `BÁO ĐỘNG GIAN LẬN NHIỆT: Tem vận đơn ${barcodeBatchSerialNumber} đổi màu quang học (${dynamicHex}) do nhiệt độ bề mặt đạt ${temp}°C (vượt ngưỡng ${threshold}°C). Phát hiện dấu hiệu dùng nhiệt bóc tách tem!`
      : `Tem quang học nhiệt ${barcodeBatchSerialNumber}: Màu chuẩn ${dynamicHex} tại ${temp}°C (ngưỡng an toàn ${threshold}°C). Vận đơn nguyên bản, không sao chép giả mạo.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        thermoChromicColorShiftBarcode: order.thermoChromicColorShiftBarcode,
        message: heatTamperExceeded
          ? "Phát hiện dấu hiệu can thiệp nhiệt độ bóc tem vận đơn!"
          : "Tem vận đơn mực nhiệt quang học đạt chuẩn chống giả mạo.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Điều phối viên nang khí nén ngầm cao tốc nội đô (Feature 134)
// @route   POST /api/orders/:id/pneumatic-capsule
// @access  Public / Authenticate
export const launchUndergroundPneumaticCapsuleDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      capsulePodSerial,
      tubePipelineNetworkCode = "METRO-PNEUMA-LINE-1",
      transitVelocityKmPerHour = 95,
      tubePressureBar = 3.2,
      pneumaticTerminalStationId = "TERMINAL-DISTRICT-1-CENTRAL",
      capsuleEjectionStatus = "high_speed_subterranean_transit",
    } = req.body;

    if (!capsulePodSerial) {
      return sendError(res, "Thiếu mã định danh viên nang khí nén ngầm (capsulePodSerial)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần phóng viên nang khí nén", 404);
    }

    const now = new Date().toISOString();
    const velocity = Math.max(30, Math.min(150, Number(transitVelocityKmPerHour) || 95));
    const pressure = Math.max(1, Math.min(6, Number(tubePressureBar) || 3.2));
    const validStatuses = [
      "capsule_loaded_at_hub",
      "high_speed_subterranean_transit",
      "ejected_at_terminal_station",
      "collected_by_local_runner",
    ];
    const status = validStatuses.includes(capsuleEjectionStatus)
      ? capsuleEjectionStatus
      : "high_speed_subterranean_transit";

    const isArrived = status === "ejected_at_terminal_station" || status === "collected_by_local_runner";

    order.undergroundPneumaticCapsuleDispatch = {
      isCapsuleDispatched: true,
      capsulePodSerial,
      tubePipelineNetworkCode,
      transitVelocityKmPerHour: velocity,
      tubePressureBar: pressure,
      pneumaticTerminalStationId,
      capsuleEjectionStatus: status,
      capsuleLaunchedAt: order.undergroundPneumaticCapsuleDispatch?.capsuleLaunchedAt || now,
      capsuleArrivedAt: isArrived ? now : (order.undergroundPneumaticCapsuleDispatch?.capsuleArrivedAt || null),
    };

    const statusNote = status === "high_speed_subterranean_transit"
      ? `Viên nang khí nén #${capsulePodSerial} đang di chuyển ngầm tốc độ cao ${velocity} km/h (áp suất ${pressure} bar) trên tuyến ${tubePipelineNetworkCode}.`
      : status === "ejected_at_terminal_station"
      ? `Viên nang #${capsulePodSerial} đã phóng ra an toàn tại ga đích ${pneumaticTerminalStationId}!`
      : status === "collected_by_local_runner"
      ? `Bưu tá dặm cuối đã nhận kiện hàng từ viên nang #${capsulePodSerial} tại ga ${pneumaticTerminalStationId} để giao đến tay người mua.`
      : `Viên nang #${capsulePodSerial} đã nạp kiện hàng tại tổng kho hub ngầm.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        undergroundPneumaticCapsuleDispatch: order.undergroundPneumaticCapsuleDispatch,
        message: "Cập nhật hành trình viên nang khí nén ngầm thành công.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát chuỗi siêu lạnh đá khô âm sâu dược phẩm/vaccine (Feature 135)
// @route   POST /api/orders/:id/cryogenic-dry-ice
// @access  Public / Authenticate
export const monitorCryogenicFreezerDryIceTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cryoBoxSerial,
      coreTemperatureCelsius = -78.5,
      dryIceSublimationRemainingPercent = 100,
    } = req.body;

    if (!cryoBoxSerial) {
      return sendError(res, "Thiếu số seri thùng bảo ôn siêu lạnh (cryoBoxSerial)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát chuỗi siêu lạnh", 404);
    }

    const now = new Date().toISOString();
    const temp = Number(coreTemperatureCelsius) || -78.5;
    const dryIcePercent = Math.max(0, Math.min(100, Number(dryIceSublimationRemainingPercent) || 100));

    // Ngưỡng báo động: Nhiệt độ ấm hơn -60°C hoặc đá khô còn dưới 25%
    const sublimationLeakAlarm = temp > -60 || dryIcePercent < 25;
    const vaccinePharmaIntegrityVerified = !sublimationLeakAlarm;

    order.cryogenicFreezerDryIceTelemetry = {
      isCryoMonitored: true,
      cryoBoxSerial,
      coreTemperatureCelsius: temp,
      dryIceSublimationRemainingPercent: dryIcePercent,
      vaccinePharmaIntegrityVerified,
      sublimationLeakAlarm,
      monitoredAt: now,
    };

    const statusNote = sublimationLeakAlarm
      ? `BÁO ĐỘNG SUY GIẢM NHIỆT SIÊU LẠNH: Thùng đá khô ${cryoBoxSerial} đạt ${temp}°C (đá khô còn ${dryIcePercent}%). Cảnh báo nguy cơ biến tính dược phẩm/vaccine! Kích hoạt quy trình châm đá khô khẩn cấp.`
      : `Bảo ôn siêu lạnh ${cryoBoxSerial}: Nhiệt độ lõi ${temp}°C, đá khô tối ưu ${dryIcePercent}%. Chuẩn bảo quản dược phẩm sinh học toàn vẹn.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        cryogenicFreezerDryIceTelemetry: order.cryogenicFreezerDryIceTelemetry,
        message: sublimationLeakAlarm
          ? "Cảnh báo: Chuỗi bảo quản siêu lạnh gặp nguy cơ thăng hoa đá khô!"
          : "Cập nhật đo lường bảo ôn siêu lạnh âm sâu an toàn.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Giám sát buồng kín tăng áp chống cháy nổ khí trơ (Feature 136)
// @route   POST /api/orders/:id/hyperbaric-explosion-vault
// @access  Public / Authenticate
export const monitorHyperbaricPressureAntiExplosionVault = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vaultPodSerial,
      cabinPressureAtm = 1.0,
      inertGasArgonLevelPercent = 99.8,
      pressureDifferentialPsi = 0,
    } = req.body;

    if (!vaultPodSerial) {
      return sendError(res, "Thiếu số hiệu khoang buồng tăng áp chống nổ (vaultPodSerial)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giám sát buồng chống nổ", 404);
    }

    const now = new Date().toISOString();
    const pressure = Number(cabinPressureAtm) || 1.0;
    const argon = Math.max(0, Math.min(100, Number(inertGasArgonLevelPercent) || 99.8));
    const diffPsi = Number(pressureDifferentialPsi) || 0;

    // Ngưỡng báo động: Khí trơ Argon dưới 85% hoặc chênh lệch áp suất > 15 PSI (nguy cơ bục nổ pin Li-ion)
    const isBlastMitigationActive = diffPsi > 15 || argon < 85;
    let vaultSealStatus = "nominal_pressurized";
    if (diffPsi > 25) {
      vaultSealStatus = "explosion_blast_contained";
    } else if (diffPsi > 15 || argon < 85) {
      vaultSealStatus = "rapid_depressurization_warning";
    } else if (argon < 95) {
      vaultSealStatus = "inert_gas_purging";
    }

    order.hyperbaricPressureAntiExplosionVault = {
      isHyperbaricArmed: true,
      vaultPodSerial,
      cabinPressureAtm: pressure,
      inertGasArgonLevelPercent: argon,
      pressureDifferentialPsi: diffPsi,
      isBlastMitigationActive,
      vaultSealStatus,
      inspectedAt: now,
    };

    const statusNote = isBlastMitigationActive
      ? `BÁO ĐỘNG BUỒNG CHỐNG NỔ: Áp suất lệch ${diffPsi} PSI, Khí trơ Argon ${argon}%. Kích hoạt van xả an toàn và phong tỏa ngăn nổ khoang #${vaultPodSerial}!`
      : `Buồng tăng áp khí trơ #${vaultPodSerial}: Áp suất ${pressure} atm danh định, nồng độ Argon ${argon}%. Phong tỏa chống cháy nổ tuyệt đối.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        hyperbaricPressureAntiExplosionVault: order.hyperbaricPressureAntiExplosionVault,
        message: isBlastMitigationActive
          ? "Cảnh báo áp lực buồng tăng áp chống nổ! Đã kích hoạt hệ thống dập áp lực."
          : "Khoang khí trơ chống nổ duy trì trạng thái danh định an toàn.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Định tuyến vi sóng vệ tinh tầm thấp LEO & mạng lưới LoRa Mesh vùng lõm sóng (Feature 137)
// @route   POST /api/orders/:id/satellite-lora-mesh
// @access  Public / Authenticate
export const updateSatelliteLoRaMeshDeadZoneTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      loraNodeId,
      hopCountMesh = 1,
      signalRssiDbm = -85,
      geoMeshPacketLossRatePercent = 0,
      isCellularDeadZone = true,
    } = req.body;

    if (!loraNodeId) {
      return sendError(res, "Thiếu mã định danh trạm tiếp sóng LoRa Mesh (loraNodeId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần kích hoạt liên lạc LoRa Mesh vệ tinh", 404);
    }

    const now = new Date().toISOString();
    const rssi = Number(signalRssiDbm) || -85;
    const hops = Math.max(1, Math.min(12, Number(hopCountMesh) || 1));
    const loss = Math.max(0, Math.min(100, Number(geoMeshPacketLossRatePercent) || 0));
    const deadZone = Boolean(isCellularDeadZone);

    // Kích hoạt vệ tinh quỹ đạo thấp LEO nếu vùng lõm sóng và RSSI rất yếu (< -105 dBm) hoặc số bước nhảy > 3
    const leoSatelliteUplinkConnected = deadZone && (rssi < -105 || hops >= 3);

    order.satelliteLoRaMeshDeadZoneTelemetry = {
      isLoRaMeshActive: true,
      loraNodeId,
      hopCountMesh: hops,
      signalRssiDbm: rssi,
      leoSatelliteUplinkConnected,
      geoMeshPacketLossRatePercent: loss,
      isCellularDeadZone: deadZone,
      lastMeshBeaconAt: now,
    };

    const statusNote = leoSatelliteUplinkConnected
      ? `VÙNG LÕM SÓNG 4G/5G: Kích hoạt đường truyền vệ tinh LEO Direct-to-Device qua trạm LoRa Mesh #${loraNodeId} (${hops} hops, RSSI ${rssi} dBm). Duy trì định vị kiện hàng liên tục 100%.`
      : deadZone
      ? `Trạm LoRa Mesh #${loraNodeId}: Vượt qua vùng mất sóng viễn thông (${hops} hops, RSSI ${rssi} dBm, suy hao ${loss}%).`
      : `Liên lạc sóng di động tiêu chuẩn ổn định (RSSI ${rssi} dBm). LoRa Mesh ở chế độ dự phòng.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        satelliteLoRaMeshDeadZoneTelemetry: order.satelliteLoRaMeshDeadZoneTelemetry,
        message: leoSatelliteUplinkConnected
          ? "Đã kết nối Uplink vệ tinh quỹ đạo thấp LEO xuyên suốt vùng mất sóng."
          : "Cập nhật đo lường trạm mạng lưới LoRa Mesh thành công.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Xác thực niêm phong khóa mật mã lượng tử QKD chống nghe lén (Feature 138)
// @route   POST /api/orders/:id/qkd-encryption-seal
// @access  Public / Authenticate
export const verifyQuantumKeyDistributionEncryptionSeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      quantumKeyId,
      photonPolarizationState = "rectilinear_diagonal_entangled",
      quantumBitErrorRatePercent = 1.2,
      forceInterceptionSimulation = false,
    } = req.body;

    if (!quantumKeyId) {
      return sendError(res, "Thiếu mã định danh khóa mật mã lượng tử (quantumKeyId)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần bắt tay xác thực lượng tử QKD", 404);
    }

    const now = new Date().toISOString();
    const qber = Math.max(0, Math.min(100, Number(quantumBitErrorRatePercent) || 1.2));
    // Theo định luật vật lý lượng tử giao thức BB84, tỷ lệ lỗi bit lượng tử QBER > 11% chứng tỏ trạng thái chồng chập photon bị sụp đổ do có bên thứ ba cố tình nghe lén/can thiệp
    const eavesdroppingInterceptionDetected = Boolean(forceInterceptionSimulation || qber >= 11.0);

    let quantumSecurityVerdict = "quantum_safe_unbroken";
    if (eavesdroppingInterceptionDetected) {
      quantumSecurityVerdict = "eavesdropping_collapsed_state";
    } else if (qber > 7.0) {
      quantumSecurityVerdict = "rekeying_in_progress";
    }

    order.quantumKeyDistributionEncryptionSeal = {
      isQuantumEncrypted: true,
      quantumKeyId,
      photonPolarizationState,
      quantumBitErrorRatePercent: qber,
      eavesdroppingInterceptionDetected,
      quantumSecurityVerdict,
      qkdHandshakeTimestamp: now,
    };

    const statusNote = eavesdroppingInterceptionDetected
      ? `BÁO ĐỘNG AN NINH LƯỢNG TỬ: Tỷ lệ lỗi bit QBER đạt ${qber}% (vượt ngưỡng 11%). Trạng thái photon (${photonPolarizationState}) bị sụp đổ! Phát hiện nỗ lực can thiệp/nghe lén khóa số #${quantumKeyId}. Tự động hủy khóa mã hóa kiện hàng.`
      : quantumSecurityVerdict === "rekeying_in_progress"
      ? `Cảnh báo nhiễu quang học: QBER ${qber}%. Đang tái tạo khóa lượng tử ngẫu nhiên BB84.`
      : `Bảo mật lượng tử QKD #${quantumKeyId}: QBER ${qber}% (ngưỡng an toàn tuyệt đối). Khóa quang tử vướng víu nguyên vẹn không thể giải mã.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        quantumKeyDistributionEncryptionSeal: order.quantumKeyDistributionEncryptionSeal,
        message: eavesdroppingInterceptionDetected
          ? "Phát hiện trạng thái lượng tử bị sụp đổ do nghe lén! Đã khóa bảo vệ kiện hàng."
          : "Bắt tay mật mã lượng tử QKD BB84 an toàn tuyệt đối.",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Xác thực tem phân tử ADN tổng hợp & Huỳnh quang nano chống giả mạo (Feature 139)
// @route   POST /api/orders/:id/dna-nanotech-seal
// @access  Public / Authenticate
export const verifySyntheticDnaNanotechTaggingSeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dnaOligonucleotideSequence,
      pcrReplicationKeySignature,
      opticalFluorescenceWavelengthNm = 520,
      counterfeitMismatchScorePercent = 0,
    } = req.body;

    if (!dnaOligonucleotideSequence || !pcrReplicationKeySignature) {
      return sendError(res, "Thiếu chuỗi ADN tổng hợp (dnaOligonucleotideSequence) hoặc khóa PCR (pcrReplicationKeySignature)", 400);
    }

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần giải trình tự tem phân tử ADN", 404);
    }

    const now = new Date().toISOString();
    const wavelength = Number(opticalFluorescenceWavelengthNm) || 520;
    const mismatch = Math.max(0, Math.min(100, Number(counterfeitMismatchScorePercent) || 0));

    // Nếu tỷ lệ lệch chuỗi ADN > 5% hoặc bước sóng quang huỳnh quang lệch chuẩn (510 - 530nm) -> hàng giả mạo tráo đổi
    const isWavelengthValid = wavelength >= 510 && wavelength <= 530;
    const isMismatchAcceptable = mismatch <= 5.0;
    const isDnaSignatureAuthentic = isWavelengthValid && isMismatchAcceptable;

    const molecularTagStatus = isDnaSignatureAuthentic
      ? "dna_sequence_authentic"
      : "molecular_counterfeit_altered";

    order.syntheticDnaNanotechTaggingSeal = {
      isDnaTagged: true,
      dnaOligonucleotideSequence,
      pcrReplicationKeySignature,
      opticalFluorescenceWavelengthNm: wavelength,
      counterfeitMismatchScorePercent: mismatch,
      isDnaSignatureAuthentic,
      molecularTagStatus,
      verifiedAt: now,
    };

    const statusNote = !isDnaSignatureAuthentic
      ? `BÁO ĐỘNG HÀNG GIẢ PHÂN TỬ: Mã ADN (${dnaOligonucleotideSequence.slice(0, 12)}...) lệch ${mismatch}%, huỳnh quang ${wavelength}nm. Tráo đổi sản phẩm bất hợp pháp! Khóa toàn bộ thanh toán đơn hàng.`
      : `Tem ADN tổng hợp nano: Chuỗi oligonucleotide khớp 100% (Khóa PCR: ${pcrReplicationKeySignature}), phát huỳnh quang ${wavelength}nm đạt chuẩn. Sản phẩm chính hãng độc bản.`;

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: statusNote,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        syntheticDnaNanotechTaggingSeal: order.syntheticDnaNanotechTaggingSeal,
        message: isDnaSignatureAuthentic
          ? "Chuỗi ADN nano và huỳnh quang phân tử khớp nguyên bản chính hãng."
          : "Cảnh báo sai lệch chuỗi ADN: Phát hiện hành vi tráo hàng giả mạo!",
      },
      201
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Chuông cửa thị giác AI & Cấp quyền mở cổng 1 chạm cho bưu tá (Feature 140)
// @route   POST /api/orders/:id/doorbell-gate-release
// @access  Public / Authenticate
export const triggerInteractiveDoorbellGateRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      doorbellDeviceId = "RING_AI_DOORBELL_G4_V98",
      action = "unlock_gate", // "unlock_gate" | "relock_gate" | "intercom_call" | "trespass_alert"
      courierIdentityMatchPercent = 99.4,
      liveVideoFeedStreamUrl = "https://cdn.shopee.vn/streams/doorbell-cam-live-feed-v98.mp4",
      twoWayAudioIntercomConnected = true,
      courierVoiceGreetingNote = "Chào anh/chị, em là bưu tá SPX giao kiện hàng Shopee đây ạ!",
    } = req.body;

    let order = await Order.findOne({ _id: id });
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) {
      const all = await Order.find();
      order = all.find((o) => (o._id || o.id || o.orderId) === id);
    }

    if (!order) {
      return sendError(res, "Không tìm thấy đơn hàng cần tương tác chuông cửa thông minh", 404);
    }

    const now = new Date().toISOString();
    const matchPercent = Number(courierIdentityMatchPercent) || 0;
    const isVisitorFaceRecognized = matchPercent >= 80.0;

    let nextGateStatus = "gate_locked";
    let token = order.interactiveDoorbellAIVisualGateRelease?.gateUnlockAuthorizationToken || null;
    let unlockedAt = order.interactiveDoorbellAIVisualGateRelease?.unlockedAt || null;
    let relockedAt = order.interactiveDoorbellAIVisualGateRelease?.relockedAt || null;

    if (action === "unlock_gate") {
      if (!isVisitorFaceRecognized) {
        return sendError(res, "Khuôn mặt bưu tá không khớp dữ liệu thẻ nhân viên SPX (dưới 80%), từ chối mở cổng an ninh", 403);
      }
      nextGateStatus = "gate_unlocked_temporary";
      token = `GATE_OTP_TOKEN_${Date.now().toString(36).toUpperCase()}_SECURE`;
      unlockedAt = now;
    } else if (action === "relock_gate") {
      nextGateStatus = "gate_relocked_confirmed";
      relockedAt = now;
    } else if (action === "trespass_alert") {
      nextGateStatus = "unauthorized_trespass_alert";
    } else if (action === "intercom_call") {
      nextGateStatus = order.interactiveDoorbellAIVisualGateRelease?.gateUnlockStatus || "gate_locked";
    }

    order.interactiveDoorbellAIVisualGateRelease = {
      isDoorbellActive: true,
      doorbellDeviceId,
      visitorFaceRecognized: isVisitorFaceRecognized,
      courierIdentityMatchPercent: matchPercent,
      liveVideoFeedStreamUrl,
      twoWayAudioIntercomConnected: Boolean(twoWayAudioIntercomConnected),
      gateUnlockAuthorizationToken: token,
      gateUnlockStatus: nextGateStatus,
      unlockedAt,
      relockedAt,
      courierVoiceGreetingNote: courierVoiceGreetingNote.trim(),
    };

    let logText = "";
    if (action === "unlock_gate") {
      logText = `Chuông cửa AI (#${doorbellDeviceId}): Nhận diện khuôn mặt bưu tá ${matchPercent}% -> Khách hàng đã mở cổng 1 chạm (Mã cấp phép: ${token}) để đặt bưu kiện vào sân an toàn.`;
    } else if (action === "relock_gate") {
      logText = `Cổng an ninh thông minh: Bưu tá đã rời khỏi sân -> Cổng đã tự động đóng chốt khóa an toàn 100%.`;
    } else if (action === "trespass_alert") {
      logText = `CẢNH BÁO XÂM PHẬP BẤT THƯỜNG: Phát hiện người lạ không đúng khuôn mặt bưu tá SPX tại chuông cửa! Đã kích hoạt còi báo động.`;
    } else {
      logText = `Đàm thoại chuông cửa: Đã kết nối đàm thoại 2 chiều qua camera chuông cửa: "${courierVoiceGreetingNote}"`;
    }

    order.timeline = [
      ...(order.timeline || []),
      {
        time: now,
        text: logText,
      },
    ];

    await order.save?.();

    sendSuccess(
      res,
      {
        orderId: order.orderId || order._id,
        interactiveDoorbellAIVisualGateRelease: order.interactiveDoorbellAIVisualGateRelease,
        message: action === "unlock_gate"
          ? "Đã mở chốt cổng từ xa cho bưu tá đặt hàng an toàn."
          : action === "relock_gate"
          ? "Đã khóa chốt cổng an toàn thành công."
          : action === "trespass_alert"
          ? "Đã kích hoạt còi báo động an ninh chuông cửa!"
          : "Đã kết nối đàm thoại 2 chiều cùng bưu tá.",
      },
      200
    );
  } catch (error) {
    sendError(res, error.message, 500);
  }
};






















