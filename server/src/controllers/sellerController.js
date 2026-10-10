import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import AdsCampaign from "../models/AdsCampaign.js";
import FlashSale from "../models/FlashSale.js";
import { recordAuditLog } from "../models/AuditLog.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// @desc    Lấy thông tin gian hàng của seller hiện tại
// @route   GET /api/seller/shop
// @access  Private (Seller only)
export const getMySellerShop = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) {
    return sendError(res, "Tài khoản của bạn chưa được liên kết với gian hàng nào", 400);
  }

  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return sendError(res, "Không tìm thấy thông tin gian hàng liên kết với tài khoản", 404);
  }
  sendSuccess(res, shop);
});

// @desc    Cập nhật thông tin hồ sơ gian hàng
// @route   PUT /api/seller/shop
// @access  Private (Seller only)
export const updateMySellerShop = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) {
    return sendError(res, "Chưa liên kết gian hàng", 400);
  }

  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  if (shop.status === "locked") {
    return sendError(res, "Gian hàng đang bị khóa, không thể cập nhật thông tin", 403);
  }

  const {
    name,
    logo,
    avatar,
    banner,
    phone,
    address,
    description,
    bankAccount,
    bankName,
    bankAccountNumber,
    bankAccountName,
    shippingCarrier,
    prepTime,
    freeShippingMin,
    allowExpress2H,
    returnWindowDays,
    warrantyPolicy,
    returnShippingPayer,
  } = req.body;

  if (name) shop.name = name.trim();
  if (logo || avatar) shop.logo = logo || avatar;
  if (banner) shop.banner = banner;
  if (phone) shop.phone = phone.trim();
  if (address) shop.address = address.trim();
  if (description !== undefined) shop.description = description;

  // Bank Account update
  if (bankAccount) {
    shop.bankAccount = {
      bankName: bankAccount.bankName || shop.bankAccount?.bankName || "Vietcombank",
      accountNumber: bankAccount.accountNumber || shop.bankAccount?.accountNumber || "",
      accountName: bankAccount.accountName || shop.bankAccount?.accountName || "",
    };
  } else if (bankAccountNumber) {
    shop.bankAccount = {
      bankName: bankName || shop.bankAccount?.bankName || "Vietcombank",
      accountNumber: bankAccountNumber,
      accountName: bankAccountName || shop.bankAccount?.accountName || "",
    };
  }

  // Policy updates if provided
  if (shippingCarrier) shop.shippingCarrier = shippingCarrier;
  if (prepTime) shop.prepTime = prepTime;
  if (freeShippingMin !== undefined) shop.freeShippingMin = Number(freeShippingMin);
  if (allowExpress2H !== undefined) shop.allowExpress2H = Boolean(allowExpress2H);
  if (returnWindowDays !== undefined) shop.returnWindowDays = Number(returnWindowDays);
  if (warrantyPolicy) shop.warrantyPolicy = warrantyPolicy;
  if (returnShippingPayer) shop.returnShippingPayer = returnShippingPayer;

  const updatedShop = await shop.save();

  logger.info(`Shop ${shopId} updated profile`, {
    requestId: req.requestId,
    shopId,
  });

  sendSuccess(res, updatedShop);
});

// @desc    Đăng ký mở shop mới (Onboard Seller)
// @route   POST /api/seller/shop/onboard
// @access  Private (Authenticated Customer)
export const onboardShop = catchAsync(async (req, res) => {
  const { name, slug, logo, banner, phone, address, description, bankAccount } = req.body;

  if (!name || !phone || !address) {
    return sendError(res, "Vui lòng điền đầy đủ các thông tin bắt buộc của gian hàng", 400);
  }

  const userId = req.user.id || req.user._id;

  // Check if user already owns a shop
  const existingShop = await Shop.findOne({ ownerId: userId });
  if (existingShop || req.user.shopId) {
    return sendError(res, "Tài khoản của bạn đã sở hữu một gian hàng trên hệ thống", 400);
  }

  const finalSlug = (slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const slugExists = await Shop.findOne({ slug: finalSlug });
  if (slugExists) {
    return sendError(res, "Tên viết tắt hoặc đường dẫn gian hàng đã tồn tại, vui lòng chọn tên khác", 400);
  }

  const shopCount = await Shop.countDocuments();
  const newShopId = `shop_${String(shopCount + 1).padStart(2, "0")}_${Date.now().toString().slice(-4)}`;

  const newShop = await Shop.create({
    shopId: newShopId,
    slug: finalSlug,
    name: name.trim(),
    ownerId: userId,
    logo: logo || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: banner || "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    phone: phone.trim(),
    address: address.trim(),
    description: description || "",
    bankAccount: {
      bankName: bankAccount?.bankName || "Vietcombank",
      accountNumber: bankAccount?.accountNumber || "000000000000",
      accountName: bankAccount?.accountName || name.toUpperCase(),
    },
    commissionRate: 0.05,
    status: "active",
  });

  // Update user role to seller
  await User.findByIdAndUpdate(userId, {
    role: "seller",
    shopId: newShop.shopId,
    shopName: newShop.name,
  });

  logger.info(`New shop onboarded: ${newShop.name} (${newShop.shopId}) by user ${userId}`, {
    requestId: req.requestId,
    shopId: newShop.shopId,
    userId,
  });

  sendSuccess(res, { shop: newShop, message: "Mở gian hàng thành công!" }, 201);
});

// @desc    Lấy thống kê số liệu của riêng shop (Tenant Isolated)
// @route   GET /api/seller/stats
// @access  Private (Seller only - Isolated to req.user.shopId)
export const getSellerStats = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const shop = await Shop.findOne({ shopId });
  if (!shop) return sendError(res, "Không tìm thấy gian hàng", 404);

  const products = await Product.find({ shopId });
  const totalProducts = products.length;
  const totalSoldItems = products.reduce((sum, p) => sum + (p.sold || 0), 0);

  const orders = await Order.find({ "items.shopId": shopId });

  let totalRevenue = 0;
  let completedOrdersCount = 0;
  let pendingOrdersCount = 0;

  orders.forEach((order) => {
    const isCancelled = order.status === "cancelled";
    if (!isCancelled && Array.isArray(order.items)) {
      const shopSubtotal = order.items
        .filter((item) => item.shopId === shopId)
        .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      totalRevenue += shopSubtotal;
    }
    if (order.status === "completed") completedOrdersCount++;
    if (order.status === "pending") pendingOrdersCount++;
  });

  const platformCommission = Math.round(totalRevenue * (shop.commissionRate || 0.05));
  const netPayout = totalRevenue - platformCommission;

  sendSuccess(res, {
    shopId,
    shopName: shop.name,
    status: shop.status,
    totalRevenue,
    platformCommission,
    netPayout,
    totalOrders: orders.length,
    completedOrdersCount,
    pendingOrdersCount,
    totalProducts,
    totalSoldItems,
  });
});

// @desc    Lấy danh sách sản phẩm thuộc shop của mình (Tenant Isolated)
// @route   GET /api/seller/products
// @access  Private (Seller only)
export const getSellerProducts = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { keyword, category, page = 1, limit = 50 } = req.query;

  const query = { shopId };
  if (keyword) query.name = { $regex: keyword, $options: "i" };
  if (category) query.category = category;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
  const total = await Product.countDocuments(query);

  sendSuccess(res, {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Tạo sản phẩm mới cho shop (Tự động inject shopId)
// @route   POST /api/seller/products
// @access  Private (Seller only)
export const createSellerProduct = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const shop = await Shop.findOne({ shopId });
  if (!shop) return sendError(res, "Gian hàng không tồn tại", 404);
  if (shop.status === "locked") {
    return sendError(res, "Gian hàng đang bị khóa, không thể đăng bán sản phẩm mới", 403);
  }

  const { name, price, originalPrice, stock, category, brand, image, images, description } = req.body;

  if (!name || price === undefined || price === null) {
    return sendError(res, "Tên và giá sản phẩm là bắt buộc", 400);
  }

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

  // Anti-spoofing: always use shop.shopId and shop.name from server
  const newProduct = await Product.create({
    name: name.trim(),
    slug: uniqueSlug,
    description: description || name,
    price: Number(price),
    originalPrice: Number(originalPrice) || Number(price),
    stock: Number(stock) || 0,
    sold: 0,
    category: category || "Thời trang",
    brand: brand || "Chính Hãng",
    image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300",
    images: images || [],
    isActive: true,
    shopId: shop.shopId,
    shopName: shop.name,
    approvalStatus: "approved",
  });

  logger.info(`Product created by shop ${shopId}: ${newProduct.name}`, {
    requestId: req.requestId,
    shopId,
    productId: newProduct._id,
  });

  sendSuccess(res, newProduct, 201);
});

// @desc    Chỉnh sửa sản phẩm của shop (Tenant Isolated via shopId)
// @route   PUT /api/seller/products/:id
// @access  Private (Seller only)
export const updateSellerProduct = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const product = await Product.findOne({ _id: req.params.id, shopId });

  if (!product) {
    return sendError(res, "Không tìm thấy sản phẩm hoặc sản phẩm không thuộc quyền quản lý của shop bạn", 404);
  }

  const { name, price, originalPrice, stock, category, brand, image, images, description, isActive } = req.body;

  if (name) product.name = name.trim();
  if (price !== undefined) product.price = Number(price);
  if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (category) product.category = category;
  if (brand) product.brand = brand;
  if (image) product.image = image;
  if (images) product.images = images;
  if (description !== undefined) product.description = description;
  if (isActive !== undefined) product.isActive = Boolean(isActive);

  const updated = await product.save();
  sendSuccess(res, updated);
});

// @desc    Xóa sản phẩm của shop (Tenant Isolated via shopId)
// @route   DELETE /api/seller/products/:id
// @access  Private (Seller only)
export const deleteSellerProduct = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const product = await Product.findOneAndDelete({ _id: req.params.id, shopId });

  if (!product) {
    return sendError(res, "Không tìm thấy sản phẩm hoặc bạn không có quyền xóa sản phẩm của shop khác", 404);
  }

  logger.info(`Product ${product.name} deleted by shop ${shopId}`, {
    requestId: req.requestId,
    shopId,
    productId: req.params.id,
  });

  sendSuccess(res, { message: `Đã xóa sản phẩm ${product.name} thành công!` });
});

// @desc    Lấy danh sách đơn hàng thuộc shop (Tenant Isolated)
// @route   GET /api/seller/orders
// @access  Private (Seller only)
export const getSellerOrders = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { status, page = 1, limit = 50 } = req.query;

  const query = { "items.shopId": shopId };
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const rawOrders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
  const total = await Order.countDocuments(query);

  const scopedOrders = rawOrders.map((order) => {
    const shopItems = (order.items || []).filter((item) => item.shopId === shopId);
    const shopSubtotal = shopItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    return {
      _id: order._id,
      orderId: order.orderId || `ORD${order._id.toString().slice(-6).toUpperCase()}`,
      customerName: order.customer?.fullName || "Khách mua hàng",
      phone: order.customer?.phone || "",
      address: order.customer?.address || "",
      items: shopItems,
      total: shopSubtotal,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    };
  });

  sendSuccess(res, {
    orders: scopedOrders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Cập nhật trạng thái đơn hàng từ phía Seller
// @route   PATCH /api/seller/orders/:id/status
// @access  Private (Seller only)
export const updateSellerOrderStatus = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "shipping", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return sendError(res, "Trạng thái đơn hàng không hợp lệ", 400);
  }

  // Try finding by _id or orderId
  let order = await Order.findOne({ _id: req.params.id });
  if (!order) {
    order = await Order.findOne({ orderId: req.params.id });
  }
  if (!order) {
    const allOrders = await Order.find();
    order = allOrders.find((o) => o._id === req.params.id || o.orderId === req.params.id || o.id === req.params.id);
  }

  if (!order) {
    return sendError(res, "Không tìm thấy đơn hàng", 404);
  }

  const hasShopItem = (order.items || []).some((item) => item.shopId === shopId);
  if (!hasShopItem && req.user.role !== "admin") {
    return sendError(res, "Đơn hàng không thuộc về shop của bạn", 403);
  }

  order.status = status;
  if (status === "shipping") order.statusText = "Đang giao hàng";
  else if (status === "completed") order.statusText = "Đã hoàn thành";
  else if (status === "cancelled") {
    order.statusText = "Đã hủy";
    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({ time: new Date().toISOString(), text: "Shop đã hủy đơn hàng" });
    
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
    
    const coinsToRefund = order.coinsUsed || 0;
    if (coinsToRefund > 0 && order.userId) {
      const user = await User.findById(order.userId);
      if (user) {
        user.coins = (user.coins || 0) + coinsToRefund;
        await user.save();
      }
    }
  }
  else if (status === "confirmed") order.statusText = "Đã xác nhận";
  else if (status === "pending") order.statusText = "Chờ xác nhận";

  order.updatedAt = new Date().toISOString();
  const updated = await order.save();

  logger.info(`Shop ${shopId} updated order ${order._id} status to ${status}`, {
    requestId: req.requestId,
    shopId,
    orderId: order._id,
    status,
  });

  sendSuccess(res, updated);
});

// @desc    Seller Dashboard — Thống kê gian hàng tổng quan
// @route   GET /api/seller/dashboard
// @access  Private (Seller)
export const getSellerDashboard = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const shop = await Shop.findOne({ shopId });
  const products = await Product.find({ shopId });
  const allOrders = await Order.find({});

  // Filter orders containing this shop's items
  const shopOrders = allOrders.filter((order) =>
    (order.items || []).some((item) => item.shopId === shopId)
  );

  let totalRevenue = 0;
  let pendingOrders = 0;
  let shippingOrders = 0;
  let completedOrders = 0;
  const today = new Date().toISOString().slice(0, 10);
  let todayRevenue = 0;
  let todayOrders = 0;

  for (const order of shopOrders) {
    const shopItemsTotal = (order.items || [])
      .filter((item) => item.shopId === shopId)
      .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    if (order.status === "completed" || order.status === "delivered") {
      totalRevenue += shopItemsTotal;
      completedOrders++;
    }
    if (order.status === "pending") pendingOrders++;
    if (order.status === "shipping") shippingOrders++;

    const orderDate = (order.createdAt || "").slice(0, 10);
    if (orderDate === today) {
      todayOrders++;
      if (order.status === "completed" || order.status === "delivered") {
        todayRevenue += shopItemsTotal;
      }
    }
  }

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive && p.approvalStatus === "approved").length;
  const avgRating = products.length > 0
    ? Number((products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1))
    : 0;

  sendSuccess(res, {
    shop: { shopId, name: shop?.name || "", status: shop?.status || "active" },
    metrics: {
      totalRevenue,
      todayRevenue,
      totalOrders: shopOrders.length,
      todayOrders,
      pendingOrders,
      shippingOrders,
      completedOrders,
      totalProducts,
      activeProducts,
      avgRating,
    },
  });
});

// @desc    Seller Revenue Chart — Biểu đồ doanh thu 7 ngày
// @route   GET /api/seller/revenue
// @access  Private (Seller)
export const getSellerRevenue = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const { days = 7 } = req.query;
  const numDays = Math.min(30, Math.max(1, parseInt(days)));
  const allOrders = await Order.find({});

  const chartData = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    let revenue = 0;
    let orderCount = 0;

    for (const order of allOrders) {
      const orderDate = (order.createdAt || "").slice(0, 10);
      if (orderDate !== dateStr) continue;

      const hasShopItems = (order.items || []).some((item) => item.shopId === shopId);
      if (!hasShopItems) continue;

      orderCount++;
      if (order.status === "completed" || order.status === "delivered") {
        revenue += (order.items || [])
          .filter((item) => item.shopId === shopId)
          .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      }
    }

    chartData.push({
      date: dateStr,
      label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      revenue,
      orderCount,
    });
  }

  sendSuccess(res, { chartData, period: `${numDays} ngày gần nhất` });
});

// @desc    Seller Pending Orders — Đơn chờ xác nhận
// @route   GET /api/seller/orders/pending
// @access  Private (Seller)
export const getSellerPendingOrders = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const allOrders = await Order.find({ status: "pending" }).sort({ createdAt: -1 });

  const pendingOrders = allOrders
    .filter((order) => (order.items || []).some((item) => item.shopId === shopId))
    .map((order) => ({
      orderId: order._id || order.id,
      customer: order.customer?.fullName || "Khách hàng",
      phone: order.customer?.phone || "",
      total: order.total,
      itemCount: (order.items || []).filter((item) => item.shopId === shopId).length,
      createdAt: order.createdAt,
      trackingCode: order.trackingCode || "",
    }));

  sendSuccess(res, { orders: pendingOrders, total: pendingOrders.length });
});

// @desc    Seller Confirm Order
// @route   PATCH /api/seller/orders/:id/confirm
// @access  Private (Seller)
export const confirmSellerOrder = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

  const hasShopItems = (order.items || []).some((item) => item.shopId === shopId);
  if (!hasShopItems) return sendError(res, "Đơn hàng không thuộc gian hàng của bạn", 403);

  if (order.status !== "pending") {
    return sendError(res, "Chỉ có thể xác nhận đơn hàng đang chờ", 400);
  }

  order.status = "confirmed";
  order.confirmedAt = new Date().toISOString();
  if (Array.isArray(order.timeline)) {
    order.timeline.push({ time: new Date().toISOString(), text: "Người bán đã xác nhận đơn hàng" });
  }
  await order.save();

  logger.info(`Shop ${shopId} confirmed order ${order._id}`, {
    requestId: req.requestId,
    shopId,
    orderId: order._id,
  });

  sendSuccess(res, { order }, "Đã xác nhận đơn hàng thành công");
});

// @desc    Seller Batch Confirm Orders — Xác nhận đơn hàng loạt
// @route   POST /api/seller/orders/batch-confirm
// @access  Private (Seller only)
export const batchConfirmSellerOrders = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const { orderIds } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return sendError(res, "Danh sách mã đơn hàng (orderIds) không hợp lệ", 400);
  }

  const confirmedOrders = [];
  const errors = [];

  for (const id of orderIds) {
    let order = await Order.findById(id);
    if (!order) {
      order = await Order.findOne({ orderId: id });
    }

    if (!order) {
      errors.push({ id, message: "Không tìm thấy đơn hàng" });
      continue;
    }

    const hasShopItems = (order.items || []).some((item) => item.shopId === shopId);
    if (!hasShopItems && req.user.role !== "admin") {
      errors.push({ id, message: "Đơn hàng không thuộc gian hàng của bạn" });
      continue;
    }

    if (order.status !== "pending") {
      errors.push({ id, message: `Đơn hàng đang ở trạng thái '${order.status}', không thể xác nhận` });
      continue;
    }

    order.status = "confirmed";
    order.statusText = "Đã xác nhận";
    order.confirmedAt = new Date().toISOString();
    if (!Array.isArray(order.timeline)) order.timeline = [];
    order.timeline.push({ time: new Date().toISOString(), text: "Người bán đã xác nhận đơn hàng (Xử lý hàng loạt)" });
    await order.save();

    confirmedOrders.push({
      orderId: order._id || order.id || order.orderId,
      status: "confirmed",
      total: order.total,
    });
  }

  logger.info(`Shop ${shopId} batch confirmed ${confirmedOrders.length} orders`, {
    requestId: req.requestId,
    shopId,
    confirmedCount: confirmedOrders.length,
    errorCount: errors.length,
  });

  sendSuccess(res, {
    confirmedCount: confirmedOrders.length,
    confirmedOrders,
    errors,
    message: `Đã xác nhận thành công ${confirmedOrders.length} đơn hàng${errors.length > 0 ? ` (${errors.length} đơn bị bỏ qua)` : ""}`,
  });
});

// @desc    Lấy thông tin ví và lịch sử giao dịch ví của gian hàng
// @route   GET /api/seller/wallet
// @access  Private (Seller only)
export const getSellerWallet = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const shop = await Shop.findOne({ shopId });
  if (!shop) return sendError(res, "Không tìm thấy gian hàng", 404);

  const balance = shop.walletBalance || 0;
  const transactions = Array.isArray(shop.walletTransactions) ? shop.walletTransactions : [];

  sendSuccess(res, {
    shopId,
    shopName: shop.name,
    balance,
    walletBalance: balance,
    transactions,
    bankAccount: shop.bankAccount || null,
  });
});

// @desc    Tạo yêu cầu rút tiền từ Ví người bán về Tài khoản ngân hàng
// @route   POST /api/seller/wallet/withdraw
// @access  Private (Seller only)
export const requestSellerWithdrawal = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const { amount, bankName, accountNumber, accountName } = req.body;
  const withdrawAmount = Number(amount);

  if (!withdrawAmount || withdrawAmount < 50000) {
    return sendError(res, "Số tiền rút tối thiểu là 50.000₫", 400);
  }

  const shop = await Shop.findOne({ shopId });
  if (!shop) return sendError(res, "Không tìm thấy gian hàng", 404);

  const currentBalance = Number(shop.walletBalance) || 0;
  if (currentBalance < withdrawAmount) {
    return sendError(res, `Số dư ví không đủ (Khả dụng: ${currentBalance.toLocaleString("vi-VN")}₫)`, 400);
  }

  // Khấu trừ số dư ví người bán
  shop.walletBalance = currentBalance - withdrawAmount;
  if (!Array.isArray(shop.walletTransactions)) {
    shop.walletTransactions = [];
  }

  const txId = `WTX_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const newTx = {
    id: txId,
    type: "WITHDRAWAL",
    amount: -withdrawAmount,
    balanceAfter: shop.walletBalance,
    status: "PROCESSING",
    description: `Rút tiền về ${bankName || shop.bankAccount?.bankName || "Ngân hàng"} (${accountNumber || shop.bankAccount?.accountNumber || "STK"})`,
    createdAt: new Date().toISOString(),
  };

  shop.walletTransactions.unshift(newTx);
  await shop.save();

  await recordAuditLog({
    userId: req.user?._id || req.user?.id || shop.ownerId,
    userName: req.user?.name || req.user?.fullName || "Seller",
    userRole: req.user?.role || "seller",
    action: "SELLER_WITHDRAWAL_REQUESTED",
    entityType: "WALLET_WITHDRAWAL",
    entityId: shop._id || shop.shopId,
    details: {
      shopId,
      amount: withdrawAmount,
      bankAccount: req.body.bankAccount || {
        bankName: bankName || shop.bankAccount?.bankName,
        accountNumber: accountNumber || shop.bankAccount?.accountNumber,
        accountName: accountName || shop.bankAccount?.accountName,
      },
      txId,
    },
    ip: req.ip || "127.0.0.1",
  });

  logger.info(`Shop ${shopId} requested withdrawal of ${withdrawAmount} VND. TxId: ${txId}`, {
    requestId: req.requestId,
    shopId,
    amount: withdrawAmount,
    txId,
  });

  sendSuccess(res, {
    transaction: newTx,
    remainingBalance: shop.walletBalance,
    message: `Đã tạo lệnh rút ${withdrawAmount.toLocaleString("vi-VN")}₫ thành công. Hệ thống đang tiến hành chuyển khoản.`,
  }, 201);
});

// ==================== BỔ SUNG: PHÂN TÍCH CHUYÊN SÂU & BI SELLER ====================

// @desc    Lấy phân tích phễu chuyển đổi, SKU sinh lời và dự báo cạn kho
// @route   GET /api/seller/analytics/funnel
// @access  Private (Seller only)
export const getSellerAnalyticsFunnel = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const shopOrders = await Order.find({ "items.shopId": shopId });
  const shopProducts = await Product.find({ shopId });

  // Tính toán conversion funnel
  const totalViews = shopProducts.reduce((sum, p) => sum + ((p.sold || 0) * 18 + 120), 0);
  const totalCartAdds = Math.round(totalViews * 0.28);
  const totalCheckoutInitiated = Math.round(totalCartAdds * 0.45);
  const totalPaidOrders = shopOrders.filter((o) => o.status === "completed" || o.status === "shipping" || o.status === "confirmed").length;

  // SKU Analytics
  const skuPerformance = shopProducts.map((p) => {
    const sold = p.sold || 0;
    const stock = p.stock || 0;
    const revenue = sold * (p.price || 0);
    const dailyVelocity = Math.max(0.5, (sold / 30).toFixed(1));
    const daysOfInventory = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : 999;
    return {
      productId: p._id,
      name: p.name,
      price: p.price,
      stock,
      sold,
      revenue,
      dailyVelocity,
      daysOfInventory,
      stockAlert: daysOfInventory <= 7 ? "CRITICAL" : daysOfInventory <= 15 ? "WARNING" : "HEALTHY",
    };
  }).sort((a, b) => b.revenue - a.revenue);

  sendSuccess(res, {
    funnel: {
      views: totalViews,
      cartAdds: totalCartAdds,
      checkouts: totalCheckoutInitiated,
      purchases: totalPaidOrders,
      conversionRate: totalViews > 0 ? ((totalPaidOrders / totalViews) * 100).toFixed(2) + "%" : "0%",
      dropOffCartToCheckout: totalCartAdds > 0 ? (((totalCartAdds - totalCheckoutInitiated) / totalCartAdds) * 100).toFixed(1) + "%" : "0%",
      dropOffCheckoutToPaid: totalCheckoutInitiated > 0 ? (((totalCheckoutInitiated - totalPaidOrders) / totalCheckoutInitiated) * 100).toFixed(1) + "%" : "0%",
    },
    topProfitableSkus: skuPerformance.slice(0, 5),
    inventoryForecast: skuPerformance.filter((s) => s.stockAlert !== "HEALTHY"),
  });
});

// @desc    Lấy thị trường & chuẩn ngành hàng (Market Intelligence & Benchmark)
// @route   GET /api/seller/analytics/market
// @access  Private (Seller only)
export const getSellerMarketIntelligence = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const shop = await Shop.findOne({ shopId });
  const category = shop?.category || "Thời trang";

  const hotKeywords = [
    { keyword: "áo thun oversize cotton 100%", searchVolume: "128,400", change: "+42%", trend: "up" },
    { keyword: "quần jean ống suông", searchVolume: "95,200", change: "+18%", trend: "up" },
    { keyword: "tai nghe bluetooth anc", searchVolume: "84,000", change: "+25%", trend: "up" },
    { keyword: "váy hoa nhí vintage", searchVolume: "63,100", change: "-5%", trend: "down" },
    { keyword: "kem chống nắng nâng tone", searchVolume: "112,000", change: "+33%", trend: "up" },
    { keyword: "nồi chiên không dầu điện tử", searchVolume: "48,500", change: "+8%", trend: "up" },
  ];

  const benchmark = {
    category,
    shopConversionRate: "3.8%",
    industryAverageConversionRate: "2.5%",
    shopAvgPrepTime: "2.4 giờ",
    industryAvgPrepTime: "6.8 giờ",
    shopReturnRate: "1.2%",
    industryAvgReturnRate: "3.5%",
    priceCompetitivenessScore: 92, // trên 100
    recommendations: [
      "Ngành hàng đang có lượng tìm kiếm tăng 42% cho từ khóa 'cotton 100%'. Nên bổ sung từ khóa vào tiêu đề sản phẩm.",
      "Tỷ lệ chuẩn bị hàng của bạn (2.4h) nhanh hơn mức trung bình ngành (6.8h) — hãy kích hoạt huy hiệu 'Giao Hỏa Tốc'.",
      "Khuyến nghị tham gia Flash Sale khung giờ 12:00 - 15:00 để tăng thêm 28% lượt truy cập tự nhiên.",
    ],
  };

  sendSuccess(res, {
    category,
    hotKeywords,
    benchmark,
  });
});

// @desc    Quản lý nhân viên gian hàng (Sub-accounts & Staff)
// @route   GET /api/seller/staff
// @access  Private (Seller owner only)
export const getSellerStaffList = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const staff = await User.find({ shopId });
  const safeList = staff.map((u) => (u.toSafeObject ? u.toSafeObject() : u));
  sendSuccess(res, { staff: safeList });
});

// @desc    Tạo tài khoản phụ cho nhân viên gian hàng
// @route   POST /api/seller/staff
// @access  Private (Seller owner only)
export const addSellerStaff = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { fullName, email, phone, subRole, permissions } = req.body;

  if (!email || !fullName) return sendError(res, "Họ tên và email là bắt buộc", 400);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return sendError(res, "Email nhân viên đã tồn tại trên hệ thống", 409);

  const newStaff = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone ? phone.trim() : "",
    password: "password123",
    role: "seller",
    subRole: subRole || "inventory_staff",
    permissions: Array.isArray(permissions) ? permissions : ["manage_products", "manage_orders"],
    shopId,
    shopName: req.user.shopName,
    isActive: true,
    status: "active",
  });

  sendSuccess(res, {
    staff: newStaff.toSafeObject ? newStaff.toSafeObject() : newStaff,
    message: "Tạo tài khoản nhân viên phụ thành công",
  }, 201);
});

// @desc    Cập nhật quyền hạn hoặc khóa nhân viên gian hàng
// @route   PUT /api/seller/staff/:id
// @access  Private (Seller owner only)
export const updateSellerStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const staff = await User.findById(id);
  if (!staff || staff.shopId !== req.user.shopId) {
    return sendError(res, "Không tìm thấy nhân viên thuộc gian hàng của bạn", 404);
  }

  const { subRole, permissions, isActive } = req.body;
  if (subRole) staff.subRole = subRole;
  if (Array.isArray(permissions)) staff.permissions = permissions;
  if (isActive !== undefined) staff.isActive = Boolean(isActive);

  await staff.save();
  sendSuccess(res, { staff: staff.toSafeObject ? staff.toSafeObject() : staff });
});

// ==================== BỔ SUNG: SHOPEE ADS ROI SUITE & ADVANCED INVENTORY MATRIX ====================

// @desc    Lấy danh sách các chiến dịch quảng cáo đấu thầu từ khóa của Shop
// @route   GET /api/seller/ads
// @access  Private (Seller only)
export const getSellerAdsCampaigns = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const ads = await AdsCampaign.find({ shopId });
  const totalSpent = (ads || []).reduce((sum, a) => sum + (a.spent || 0), 0);
  const totalRevenue = (ads || []).reduce((sum, a) => sum + (a.conversionRevenue || 0), 0);
  const overallRoas = totalSpent > 0 ? Number((totalRevenue / totalSpent).toFixed(2)) : 0;
  const totalImpressions = (ads || []).reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = (ads || []).reduce((sum, a) => sum + (a.clicks || 0), 0);
  const overallCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  sendSuccess(res, {
    campaigns: ads || [],
    metrics: {
      totalSpent,
      totalRevenue,
      overallRoas,
      totalImpressions,
      totalClicks,
      overallCtr,
    },
  });
});

// @desc    Tạo chiến dịch đấu thầu từ khóa tìm kiếm (Shopee Ads)
// @route   POST /api/seller/ads
// @access  Private (Seller only)
export const createSellerAdsCampaign = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const { campaignName, type, budgetDaily, budgetTotal, targetKeywords } = req.body;
  if (!campaignName || !campaignName.trim()) {
    return sendError(res, "Tên chiến dịch quảng cáo là bắt buộc", 400);
  }

  const {
    campaignName,
    type,
    budgetDaily,
    budgetTotal,
    targetKeywords,
    impressions,
    clicks,
    ctr,
    cpc,
    conversions,
    conversionRevenue,
    roas,
  } = req.body;

  const campaign = await AdsCampaign.create({
    shopId,
    shopName: req.user.shopName || "Gian Hàng Shopee",
    campaignName: campaignName.trim(),
    type: type || "SEARCH_ADS",
    status: "active",
    budgetDaily: Number(budgetDaily) || 50000,
    budgetTotal: Number(budgetTotal) || 1000000,
    spent: 0,
    targetKeywords: Array.isArray(targetKeywords) && targetKeywords.length > 0
      ? targetKeywords
      : [{ keyword: "sản phẩm hot", bidPrice: 1500, matchType: "exact" }],
    impressions: typeof impressions === "number" ? impressions : 120,
    clicks: typeof clicks === "number" ? clicks : 6,
    ctr: typeof ctr === "number" ? ctr : 5.0,
    cpc: typeof cpc === "number" ? cpc : 1200,
    conversions: typeof conversions === "number" ? conversions : 1,
    conversionRevenue: typeof conversionRevenue === "number" ? conversionRevenue : 350000,
    roas: typeof roas === "number" ? roas : 2.9,
  });

  sendSuccess(res, { campaign, message: "Tạo chiến dịch Shopee Ads thành công" }, 201);
});

// @desc    Bật / Tắt tạm dừng chiến dịch quảng cáo
// @route   PATCH /api/seller/ads/:id/toggle
// @access  Private (Seller only)
export const toggleSellerAdsCampaign = catchAsync(async (req, res) => {
  const { id } = req.params;
  const campaign = await AdsCampaign.findById(id);
  if (!campaign || campaign.shopId !== req.user.shopId) {
    return sendError(res, "Không tìm thấy chiến dịch quảng cáo", 404);
  }

  campaign.status = campaign.status === "active" ? "paused" : "active";
  await campaign.save();

  sendSuccess(res, { campaign, message: `Chiến dịch đã chuyển sang trạng thái ${campaign.status}` });
});

// @desc    Mô phỏng kết quả đấu thầu từ khóa Shopee Ads (Simulator)
// @route   POST /api/seller/ads/simulate
// @access  Private (Seller only)
export const simulateSellerAds = catchAsync(async (req, res) => {
  const { keywords, budgetDaily = 100000, productPrice = 250000, category = "Thời trang" } = req.body;

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return sendError(res, "Danh sách từ khóa (keywords) không được để trống", 400);
  }

  const dailyBudgetNum = Math.max(10000, Number(budgetDaily) || 100000);
  const aov = Math.max(10000, Number(productPrice) || 250000);

  const keywordBreakdown = [];
  let totalPotentialClicks = 0;
  let weightedCpcSum = 0;
  let totalPotentialImpressions = 0;

  for (const kw of keywords) {
    const keywordText = (kw.keyword || "").trim();
    if (!keywordText) continue;

    const bid = Math.max(500, Number(kw.bidPrice) || 1000);
    const matchType = kw.matchType === "broad" ? "broad" : "exact";

    // Second-price auction discounted CPC (min 500đ)
    const cpc = Math.max(500, Math.round(bid * 0.88));

    // CTR standard: exact ~5.6%, broad ~3.8%
    const ctr = matchType === "broad" ? 3.8 : 5.6;

    // Base search volume heuristic (approx 8,000 - 20,000 queries/day)
    const baseVolume = 12000 + ((keywordText.length * 373) % 8000);

    // WinRate based on bidPrice and matchType
    const winRate = Math.min(0.95, Math.max(0.15, (bid / 1500) * 0.6 + (matchType === "broad" ? 0.25 : 0.10)));

    const projectedImpressions = Math.round(baseVolume * winRate);
    const potentialClicks = Math.round(projectedImpressions * (ctr / 100));

    totalPotentialImpressions += projectedImpressions;
    totalPotentialClicks += potentialClicks;
    weightedCpcSum += potentialClicks * cpc;

    keywordBreakdown.push({
      keyword: keywordText,
      matchType,
      bidPrice: bid,
      cpc,
      ctr,
      rawImpressions: projectedImpressions,
      rawClicks: potentialClicks,
    });
  }

  if (keywordBreakdown.length === 0) {
    return sendError(res, "Không có từ khóa hợp lệ để mô phỏng", 400);
  }

  const avgCpc = totalPotentialClicks > 0 ? Math.round(weightedCpcSum / totalPotentialClicks) : 1000;
  // Budget capping
  const maxClicksBudget = Math.floor(dailyBudgetNum / (avgCpc || 1000));
  const actualDailyClicks = Math.min(totalPotentialClicks, maxClicksBudget);
  const scale = totalPotentialClicks > 0 ? actualDailyClicks / totalPotentialClicks : 1;

  const actualSpend = Math.min(dailyBudgetNum, Math.round(actualDailyClicks * avgCpc));
  const overallCtr = keywordBreakdown.some((k) => k.matchType === "exact") ? 4.8 : 3.8;
  const effectiveImpressions = actualDailyClicks > 0 ? Math.round(actualDailyClicks / (overallCtr / 100)) : 0;

  // Conversion rate (exact ~4.5%, broad ~3.2%)
  const avgCr = 4.2;
  const projectedOrders = Math.max(1, Math.round(actualDailyClicks * (avgCr / 100)));
  const adGmv = projectedOrders * aov;
  const roas = actualSpend > 0 ? Number((adGmv / actualSpend).toFixed(2)) : 0;
  const roi = actualSpend > 0 ? Number((((adGmv - actualSpend) / actualSpend) * 100).toFixed(1)) : 0;

  // Breakdown detail scaling
  const formattedBreakdown = keywordBreakdown.map((item) => {
    const itemClicks = Math.max(1, Math.round(item.rawClicks * scale));
    const itemImpressions = Math.round(itemClicks / (item.ctr / 100));
    const itemCr = item.matchType === "broad" ? 3.5 : 4.8;
    const itemOrders = Math.max(1, Math.round(itemClicks * (itemCr / 100)));
    const itemGmv = itemOrders * aov;
    return {
      keyword: item.keyword,
      matchType: item.matchType,
      bidPrice: item.bidPrice,
      cpc: item.cpc,
      ctr: item.ctr,
      projectedImpressions: itemImpressions,
      projectedClicks: itemClicks,
      projectedOrders: itemOrders,
      adGmv: itemGmv,
    };
  });

  const projectedDaily = {
    impressions: effectiveImpressions,
    clicks: actualDailyClicks,
    ctr: overallCtr,
    cpc: avgCpc,
    spend: actualSpend,
    orders: projectedOrders,
    adGmv,
    roas,
    roi,
  };

  const projectedMonthly = {
    impressions: effectiveImpressions * 30,
    clicks: actualDailyClicks * 30,
    spend: actualSpend * 30,
    orders: projectedOrders * 30,
    adGmv: adGmv * 30,
    roas,
    roi,
  };

  sendSuccess(res, {
    projectedDaily,
    projectedMonthly,
    keywordBreakdown: formattedBreakdown,
  });
});

// @desc    Nhập kho hoặc điều chỉnh tồn kho an toàn hàng loạt (Batch Stock Matrix)
// @route   POST /api/seller/inventory/batch-update
// @access  Private (Seller only)
export const batchUpdateSellerInventory = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { updates } = req.body; // Array of { productId, stock, addStock, replenishQuantity, safetyThreshold, expiryDate, clearanceStatus, clearanceDiscount, batchCode }

  if (!Array.isArray(updates) || updates.length === 0) {
    return sendError(res, "Danh sách cập nhật tồn kho (updates) không hợp lệ", 400);
  }

  const results = [];
  for (const item of updates) {
    const prod = await Product.findById(item.productId);
    if (prod && prod.shopId === shopId) {
      const prevStock = prod.stock ?? 0;

      // Additive replenishment if addStock or replenishQuantity is provided
      if (typeof item.addStock === "number") {
        prod.stock = Math.max(0, (Number(prod.stock) || 0) + item.addStock);
      } else if (typeof item.replenishQuantity === "number") {
        prod.stock = Math.max(0, (Number(prod.stock) || 0) + item.replenishQuantity);
      } else if (typeof item.stock === "number" && item.stock >= 0) {
        prod.stock = item.stock;
      }

      if (typeof item.safetyThreshold === "number" && item.safetyThreshold >= 0) {
        prod.safetyThreshold = item.safetyThreshold;
      }

      if (item.expiryDate !== undefined) {
        prod.expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
      }

      if (item.clearanceStatus && ["normal", "near_expiry", "clearance"].includes(item.clearanceStatus)) {
        prod.clearanceStatus = item.clearanceStatus;
      }

      if (typeof item.clearanceDiscount === "number" && item.clearanceDiscount >= 0) {
        prod.clearanceDiscount = item.clearanceDiscount;
      }

      if (typeof item.batchCode === "string") {
        prod.batchCode = item.batchCode.trim();
      }

      await prod.save();

      const threshold = prod.safetyThreshold ?? 10;
      let status = "HEALTHY";
      if (prod.stock === 0) {
        status = "OUT_OF_STOCK";
      } else if (prod.stock <= threshold) {
        status = "LOW_STOCK";
      }

      results.push({
        productId: prod._id,
        name: prod.name,
        previousStock: prevStock,
        stock: prod.stock,
        safetyThreshold: threshold,
        status,
        expiryDate: prod.expiryDate,
        clearanceStatus: prod.clearanceStatus || "normal",
        clearanceDiscount: prod.clearanceDiscount || 0,
        batchCode: prod.batchCode || "",
      });
    }
  }

  sendSuccess(res, {
    updatedCount: results.length,
    inventory: results,
    message: `Đã cập nhật tồn kho hàng loạt cho ${results.length} sản phẩm thành công`,
  });
});

// @desc    Lấy danh sách các phiên Flash Sale của Shop
// @route   GET /api/seller/flash-sales
// @access  Private (Seller only)
export const getSellerFlashSales = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const list = await FlashSale.find({ shopId });
  sendSuccess(res, { flashSales: list || [] });
});

// @desc    Tạo hoặc đăng ký tham gia Flash Sale cho Shop
// @route   POST /api/seller/flash-sales
// @access  Private (Seller only)
export const createSellerFlashSale = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { slotTime, startTime, endTime, items } = req.body;

  if (!slotTime || !Array.isArray(items) || items.length === 0) {
    return sendError(res, "Khung giờ và danh sách sản phẩm tham gia không được để trống", 400);
  }

  // Validate each flash sale item
  const validatedItems = [];
  for (const it of items) {
    let originalPrice = Number(it.originalPrice) || 0;
    const flashPrice = Number(it.flashPrice) || 0;
    const stockLimit = Number(it.stockLimit) || 0;

    let prod = null;
    if (it.productId) {
      prod = await Product.findById(it.productId);
      if (prod && !originalPrice) {
        originalPrice = Number(prod.originalPrice) || Number(prod.price) || 0;
      }
    }

    if (flashPrice <= 0) {
      return sendError(res, "Giá Flash Sale phải lớn hơn 0", 400);
    }

    if (originalPrice <= 0 || flashPrice >= originalPrice) {
      return sendError(
        res,
        `Giá Flash Sale (${flashPrice.toLocaleString()}đ) phải nhỏ hơn giá gốc (${originalPrice.toLocaleString()}đ) của sản phẩm "${it.name || prod?.name || it.productId}"`,
        400
      );
    }

    if (stockLimit <= 0) {
      return sendError(res, "Số lượng suất bán Flash Sale phải lớn hơn 0", 400);
    }

    if (prod && stockLimit > (prod.stock ?? 0)) {
      return sendError(
        res,
        `Số lượng suất bán Flash Sale (${stockLimit}) vượt quá tồn kho khả dụng (${prod.stock ?? 0}) của sản phẩm "${prod.name}"`,
        400
      );
    }

    const discountPercent = Math.round(((originalPrice - flashPrice) / originalPrice) * 100);

    validatedItems.push({
      productId: it.productId,
      name: it.name || prod?.name || "Sản phẩm Flash Sale",
      originalPrice,
      flashPrice,
      discountPercent: discountPercent > 0 ? discountPercent : 0,
      stockLimit,
      soldCount: 0,
    });
  }

  const shop = await Shop.findOne({ shopId });
  const newFlashSale = await FlashSale.create({
    shopId,
    shopName: shop?.name || req.user.shopName || "Shop đối tác",
    slotTime,
    status: "upcoming",
    startTime: startTime || new Date(Date.now() + 3600000).toISOString(),
    endTime: endTime || new Date(Date.now() + 10800000).toISOString(),
    items: validatedItems,
  });

  sendSuccess(res, { flashSale: newFlashSale, message: "Đã đăng ký tham gia Flash Sale thành công" }, 201);
});

// @desc    Cập nhật trạng thái slot Flash Sale (active, paused, ended, upcoming)
// @route   PATCH /api/seller/flash-sales/:id/status
// @access  Private (Seller only)
export const updateSellerFlashSaleStatus = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["active", "paused", "ended", "upcoming"];
  if (status && !validStatuses.includes(status)) {
    return sendError(res, `Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(", ")}`, 400);
  }

  const flashSale = await FlashSale.findById(id);
  if (!flashSale || (flashSale.shopId && flashSale.shopId !== shopId)) {
    return sendError(res, "Không tìm thấy phiên Flash Sale của Shop", 404);
  }

  if (status) {
    flashSale.status = status;
  } else {
    flashSale.status = flashSale.status === "active" ? "paused" : "active";
  }

  await flashSale.save();
  sendSuccess(res, {
    flashSale,
    message: `Trạng thái phiên Flash Sale đã được cập nhật thành "${flashSale.status}"`,
  });
});

// @desc    Xóa phiên Flash Sale của Shop
// @route   DELETE /api/seller/flash-sales/:id
// @access  Private (Seller only)
export const deleteSellerFlashSale = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { id } = req.params;

  const flashSale = await FlashSale.findById(id);
  if (!flashSale || (flashSale.shopId && flashSale.shopId !== shopId)) {
    return sendError(res, "Không tìm thấy phiên Flash Sale của Shop", 404);
  }

  await FlashSale.findByIdAndDelete(id);
  sendSuccess(res, {
    message: "Đã xóa phiên Flash Sale thành công",
  });
});

// @desc    Lấy danh sách yêu cầu Trả hàng / Hoàn tiền của gian hàng
// @route   GET /api/seller/orders/returns
// @access  Private (Seller only)
export const getSellerReturnRequests = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const allOrders = await Order.find({ "returnRequest.status": { $ne: "none" } });
  const returnOrders = allOrders.filter((order) =>
    (order.items || []).some((item) => item.shopId === shopId)
  );

  const returns = returnOrders.map((o) => ({
    orderId: o._id || o.id,
    customerName: o.customer?.fullName || "Khách hàng",
    phone: o.customer?.phone || "",
    total: o.total,
    refundAmount: o.returnRequest?.refundAmount || o.total,
    reason: o.returnRequest?.reason || "Không vừa ý sản phẩm",
    evidence: o.returnRequest?.evidence || [],
    status: o.returnRequest?.status || "pending",
    requestedAt: o.returnRequest?.requestedAt || o.updatedAt,
    responseNote: o.returnRequest?.responseNote || "",
    respondedAt: o.returnRequest?.respondedAt || null,
    items: (o.items || []).filter((item) => item.shopId === shopId),
  }));

  sendSuccess(res, { returns });
});

// @desc    Phản hồi yêu cầu Trả hàng / Hoàn tiền (Chấp thuận hoặc Bác bỏ)
// @route   POST /api/seller/orders/:id/return-response
// @access  Private (Seller only)
export const respondSellerReturnRequest = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  const { id } = req.params;
  const { decision, note } = req.body; // decision: "approved" | "rejected"

  if (!["approved", "rejected"].includes(decision)) {
    return sendError(res, "Quyết định xử lý không hợp lệ ('approved' hoặc 'rejected')", 400);
  }

  let order = await Order.findById(id);
  if (!order) order = await Order.findOne({ orderId: id });
  if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);

  const hasShopItems = (order.items || []).some((it) => it.shopId === shopId);
  if (!hasShopItems && req.user.role !== "admin") {
    return sendError(res, "Đơn hàng không thuộc gian hàng của bạn", 403);
  }

  if (!order.returnRequest || order.returnRequest.status !== "pending") {
    return sendError(res, "Đơn hàng không có yêu cầu hoàn tiền đang chờ xử lý", 400);
  }

  order.returnRequest.status = decision;
  order.returnRequest.responseNote = note || (decision === "approved" ? "Shop đồng ý hoàn tiền" : "Shop từ chối yêu cầu");
  order.returnRequest.respondedAt = new Date().toISOString();

  if (decision === "approved") {
    order.status = "returning";
    order.statusText = "Đang hoàn hàng/hoàn tiền";
    // Tự động hoàn lại tồn kho cho sản phẩm của shop
    for (const it of order.items || []) {
      if (it.shopId === shopId) {
        const prod = await Product.findById(it.productId);
        if (prod) {
          prod.stock = (prod.stock || 0) + (it.quantity || 1);
          await prod.save();
        }
      }
    }
  }

  await order.save();

  sendSuccess(res, {
    orderId: order._id,
    returnStatus: decision,
    message: decision === "approved" ? "Đã chấp thuận hoàn tiền và nhập lại tồn kho sản phẩm" : "Đã từ chối yêu cầu trả hàng",
  });
});

// @desc    Báo cáo Lợi Nhuận & Phân Tích Biên Lợi Nhuận Từng SKU (P&L Per-SKU Cost & Margin Analysis)
// @route   GET /api/seller/analytics/profit-loss
// @access  Private (Seller only)
export const getSellerProfitAndLoss = catchAsync(async (req, res) => {
  const shopId = req.user.shopId;
  if (!shopId) return sendError(res, "Chưa liên kết gian hàng", 400);

  const shopProducts = await Product.find({ shopId });
  const allOrders = await Order.find();
  const shopOrders = allOrders.filter(
    (o) => o.status !== "cancelled" && (o.items || []).some((it) => it.shopId === shopId)
  );

  let totalRevenue = 0;
  let totalCogs = 0; // Cost of Goods Sold
  let totalUnitsSold = 0;

  const skuAnalytics = shopProducts.map((p) => {
    const pid = String(p._id || p.id);
    const cost = Number(p.costPrice) || Math.round((Number(p.price) || 0) * 0.6); // Mặc định 60% giá bán nếu chưa nhập giá vốn
    const price = Number(p.price) || 0;

    let unitsSold = 0;
    let revenue = 0;

    shopOrders.forEach((ord) => {
      (ord.items || []).forEach((item) => {
        const itemPid = String(item.productId || item._id || item.id);
        if (itemPid === pid || item.name === p.name) {
          const qty = Number(item.quantity) || 1;
          unitsSold += qty;
          revenue += (Number(item.price) || price) * qty;
        }
      });
    });

    // Nếu dữ liệu đơn hàng chưa tích lũy đủ thì lấy theo sold thực tế của sản phẩm
    if (unitsSold === 0 && (p.sold || 0) > 0) {
      unitsSold = Number(p.sold) || 0;
      revenue = unitsSold * price;
    }

    const cogs = unitsSold * cost;
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : (price > 0 ? Number((((price - cost) / price) * 100).toFixed(1)) : 0);

    totalRevenue += revenue;
    totalCogs += cogs;
    totalUnitsSold += unitsSold;

    return {
      productId: pid,
      sku: p.sku || `SKU-${pid.slice(-6).toUpperCase()}`,
      name: p.name,
      image: p.image,
      category: p.category,
      price,
      costPrice: cost,
      stock: p.stock || 0,
      unitsSold,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      status: grossMargin < 15 ? "low_margin" : grossMargin > 40 ? "high_margin" : "healthy",
    };
  });

  const grossProfitTotal = totalRevenue - totalCogs;
  const averageMargin = totalRevenue > 0 ? Number(((grossProfitTotal / totalRevenue) * 100).toFixed(1)) : 0;

  sendSuccess(res, {
    summary: {
      totalRevenue,
      totalCogs,
      grossProfit: grossProfitTotal,
      averageMargin,
      totalUnitsSold,
      totalSkus: shopProducts.length,
    },
    skuAnalytics: skuAnalytics.sort((a, b) => b.revenue - a.revenue),
  });
});

// @desc    Lấy chính sách vận chuyển động & trợ giá SPX của shop
// @route   GET /api/seller/shipping-policy
// @access  Private (Seller)
export const getSellerShippingPolicy = catchAsync(async (req, res) => {
  const shopId = req.user.shopId || "shop_01";
  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  const policy = shop.shippingPolicy || {
    baseFee: 22000,
    freeShipThreshold: 300000,
    spxSubsidized: true,
    expressAvailable: true,
    expressSurcharge: 15000,
  };

  sendSuccess(res, {
    shopId,
    shippingPolicy: policy,
    spxLogisticsTier: {
      provider: "SPX Express Vietnam",
      fulfillmentSpeed: "24h - 48h toàn quốc",
      sellerSubsidyRate: policy.spxSubsidized ? "50% hỗ trợ bởi sàn Shopee" : "0%",
      activeRoutes: ["Nội thành", "Liên tỉnh", "Hỏa tốc 2H"],
    },
  });
});

// @desc    Cập nhật chính sách vận chuyển động & trợ giá SPX của shop
// @route   PUT /api/seller/shipping-policy
// @access  Private (Seller)
export const updateSellerShippingPolicy = catchAsync(async (req, res) => {
  const shopId = req.user.shopId || "shop_01";
  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  const { baseFee, freeShipThreshold, spxSubsidized, expressAvailable, expressSurcharge } = req.body;

  if (baseFee !== undefined && (typeof baseFee !== "number" || baseFee < 0)) {
    return sendError(res, "Cước vận chuyển cơ bản không hợp lệ", 400);
  }

  if (freeShipThreshold !== undefined && (typeof freeShipThreshold !== "number" || freeShipThreshold < 0)) {
    return sendError(res, "Hạn mức miễn phí vận chuyển không hợp lệ", 400);
  }

  shop.shippingPolicy = {
    baseFee: baseFee !== undefined ? baseFee : (shop.shippingPolicy?.baseFee ?? 22000),
    freeShipThreshold: freeShipThreshold !== undefined ? freeShipThreshold : (shop.shippingPolicy?.freeShipThreshold ?? 300000),
    spxSubsidized: spxSubsidized !== undefined ? Boolean(spxSubsidized) : (shop.shippingPolicy?.spxSubsidized ?? true),
    expressAvailable: expressAvailable !== undefined ? Boolean(expressAvailable) : (shop.shippingPolicy?.expressAvailable ?? true),
    expressSurcharge: expressSurcharge !== undefined ? expressSurcharge : (shop.shippingPolicy?.expressSurcharge ?? 15000),
  };

  await shop.save();

  recordAuditLog({
    userId: req.user._id || req.user.id,
    action: "UPDATE_SHIPPING_POLICY",
    resourceType: "SHOP",
    resourceId: shopId,
    details: shop.shippingPolicy,
  });

  sendSuccess(res, {
    message: "Đã cập nhật chính sách vận chuyển động thành công",
    shippingPolicy: shop.shippingPolicy,
  });
});

// @desc    Lấy chỉ số vận hành SLA & điểm phạt Sao Quả Tạ của shop
// @route   GET /api/seller/operational-sla
// @access  Private (Seller)
export const getSellerOperationalSLA = catchAsync(async (req, res) => {
  const shopId = req.user.shopId || "shop_01";
  const shop = await Shop.findOne({ shopId });
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  const allOrders = await Order.find({ "items.shopId": shopId });
  const totalOrders = allOrders.length || 1;
  const lateOrders = allOrders.filter(o => o.status === "shipping" && o.shippingFee > 40000).length;
  const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;
  const returnedOrders = allOrders.filter(o => o.status === "returning" || o.returnRequest?.status === "approved").length;

  const lateShipmentRate = Number(((lateOrders / totalOrders) * 100).toFixed(1));
  const cancellationRate = Number(((cancelledOrders / totalOrders) * 100).toFixed(1));
  const returnRate = Number(((returnedOrders / totalOrders) * 100).toFixed(1));
  const onTimeShipmentRate = Number((100 - lateShipmentRate).toFixed(1));

  // Tính điểm phạt Sao Quả Tạ
  let penaltyPoints = 0;
  if (lateShipmentRate > 10) penaltyPoints += 2;
  if (cancellationRate > 5) penaltyPoints += 3;
  if (returnRate > 15) penaltyPoints += 2;

  let penaltyTier = "TIER_0";
  let tierDescription = "Tài khoản sạch (Không bị hạn chế quyền lợi)";
  if (penaltyPoints >= 6) {
    penaltyTier = "TIER_3";
    tierDescription = "Tạm ngưng tham gia các chiến dịch Mega Sale và mất huy hiệu Shopee Mall";
  } else if (penaltyPoints >= 3) {
    penaltyTier = "TIER_2";
    tierDescription = "Giảm 30% mức độ hiển thị trong kết quả tìm kiếm tự nhiên";
  } else if (penaltyPoints >= 1) {
    penaltyTier = "TIER_1";
    tierDescription = "Cảnh cáo mức 1: Cần cải thiện thời gian đóng gói & bàn giao cho SPX";
  }

  const metrics = {
    onTimeShipmentRate,
    lateShipmentRate,
    cancellationRate,
    returnRate,
    sellerPenaltyPoints: penaltyPoints,
    penaltyTier,
    tierDescription,
    targetBenchmarks: {
      onTimeMin: 98.0,
      lateMax: 2.0,
      cancelMax: 1.0,
      returnMax: 3.0,
    },
  };

  shop.operationalMetrics = metrics;
  await shop.save();

  sendSuccess(res, {
    shopId,
    shopName: shop.name,
    operationalMetrics: metrics,
    totalOrdersAnalyzed: totalOrders,
  });
});

export default {
  getMySellerShop,
  updateMySellerShop,
  onboardShop,
  getSellerStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerDashboard,
  getSellerRevenue,
  getSellerPendingOrders,
  confirmSellerOrder,
  batchConfirmSellerOrders,
  getSellerWallet,
  getSellerAnalyticsFunnel,
  getSellerMarketIntelligence,
  getSellerStaffList,
  addSellerStaff,
  updateSellerStaff,
  getSellerAdsCampaigns,
  createSellerAdsCampaign,
  toggleSellerAdsCampaign,
  simulateSellerAds,
  batchUpdateSellerInventory,
  getSellerFlashSales,
  createSellerFlashSale,
  updateSellerFlashSaleStatus,
  deleteSellerFlashSale,
  requestSellerWithdrawal,
  getSellerReturnRequests,
  respondSellerReturnRequest,
  getSellerProfitAndLoss,
  getSellerShippingPolicy,
  updateSellerShippingPolicy,
  getSellerOperationalSLA,
};

