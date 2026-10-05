import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import memoryStore from "../models/memoryStore.js";
import { sendSuccess, sendError } from "../utils/response.js";
import catchAsync from "../utils/catchAsync.js";
import logger from "../utils/logger.js";

// ==================== QUẢN TRỊ GIAN HÀNG (SHOPS) ====================

// @desc    Lấy danh sách toàn bộ các Shop trên sàn
// @route   GET /api/admin/shops
// @access  Private (Super Admin only)
export const getAllShopsAdmin = catchAsync(async (req, res) => {
  const { keyword, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { shopId: { $regex: keyword, $options: "i" } },
    ];
  }
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const shops = await Shop.find(query)
    .populate("ownerId", "fullName email phone")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Shop.countDocuments(query);

  const enrichedShops = await Promise.all(
    shops.map(async (shop) => {
      const productsCount = await Product.countDocuments({ shopId: shop.shopId });
      const plain = shop.toObject ? shop.toObject() : shop;
      return {
        ...plain,
        productsCount,
      };
    })
  );

  sendSuccess(res, {
    shops: enrichedShops,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Khóa hoặc Mở khóa gian hàng (Toggle / Update Shop Status)
// @route   PUT /api/admin/shops/:id/status
// @access  Private (Super Admin only)
export const updateShopStatusAdmin = catchAsync(async (req, res) => {
  const { status, reason } = req.body;

  if (!["active", "locked", "pending"].includes(status)) {
    return sendError(
      res,
      "Trạng thái gian hàng không hợp lệ (chỉ chấp nhận active, locked, pending)",
      400
    );
  }

  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  shop.status = status;
  if (reason !== undefined) shop.lockReason = reason;

  // Khi gian hàng bị khóa, ẩn toàn bộ sản phẩm của shop
  if (status === "locked") {
    await Product.updateMany({ shopId: shop.shopId }, { isActive: false });
  } else if (status === "active") {
    await Product.updateMany({ shopId: shop.shopId }, { isActive: true });
  }

  const updated = await shop.save();

  logger.info(`Shop status updated: ${shop.name} -> ${status}`, {
    requestId: req.requestId,
    shopId: shop.shopId,
    status,
    reason,
  });

  sendSuccess(res, {
    shop: updated,
    message:
      status === "active"
        ? `Đã mở khóa hoạt động cho gian hàng ${shop.name}`
        : `Đã khóa gian hàng ${shop.name}`,
  });
});

// @desc    Điều chỉnh tỷ lệ chiết khấu hoa hồng của Shop
// @route   PUT /api/admin/shops/:id/commission
// @access  Private (Super Admin only)
export const updateShopCommissionAdmin = catchAsync(async (req, res) => {
  const { commissionRate } = req.body;
  const rate = Number(commissionRate);

  if (isNaN(rate) || rate < 0 || rate > 0.5) {
    return sendError(res, "Tỷ lệ hoa hồng không hợp lệ (Phải từ 0% đến 50%, ví dụ: 0.05)", 400);
  }

  const shop = await Shop.findByIdAndUpdate(req.params.id, { commissionRate: rate }, { new: true });
  if (!shop) return sendError(res, "Không tìm thấy gian hàng", 404);

  logger.info(`Commission updated for shop ${shop.name}: ${(rate * 100).toFixed(1)}%`, {
    requestId: req.requestId,
    shopId: shop.shopId,
    commissionRate: rate,
  });

  sendSuccess(res, {
    shop,
    message: `Đã cập nhật hoa hồng cho gian hàng ${shop.name} thành ${(rate * 100).toFixed(1)}%`,
  });
});

// @desc    Xóa vĩnh viễn gian hàng của người bán
// @route   DELETE /api/admin/shops/:id
// @access  Private (Super Admin only)
export const deleteShopAdmin = catchAsync(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    return sendError(res, "Không tìm thấy gian hàng", 404);
  }

  const shopId = shop.shopId || shop._id;

  // Xóa tất cả sản phẩm của shop
  await Product.deleteMany({ shopId });

  // Cập nhật chủ shop về vai trò customer nếu có
  if (shop.ownerId) {
    const ownerId = typeof shop.ownerId === "object" ? (shop.ownerId._id || shop.ownerId.id) : shop.ownerId;
    const owner = await User.findById(ownerId);
    if (owner && owner.role === "seller") {
      owner.role = "customer";
      owner.shopId = null;
      owner.shopName = null;
      await owner.save();
    }
  }

  await Shop.findByIdAndDelete(req.params.id);
  await Shop.deleteOne({ $or: [{ _id: req.params.id }, { shopId: shopId }] });

  logger.info(`Shop deleted: ${shop.name} (${shopId})`, {
    requestId: req.requestId,
    shopId,
  });

  sendSuccess(res, {
    id: req.params.id,
    shopId,
    name: shop.name,
    message: `Đã xóa gian hàng "${shop.name}" và toàn bộ sản phẩm liên quan thành công.`,
  });
});

// ==================== QUẢN TRỊ NGƯỜI DÙNG (USERS) ====================

// @desc    Lấy danh sách người dùng toàn sàn
// @route   GET /api/admin/users
// @access  Private (Super Admin only)
export const getAllUsersAdmin = catchAsync(async (req, res) => {
  const { keyword, role, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (keyword) {
    query.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }
  if (role) query.role = role;
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const users = await User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum);
  const total = await User.countDocuments(query);

  sendSuccess(res, {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @desc    Khóa hoặc Mở khóa tài khoản thành viên (Bảo vệ Admin Ban Immunity)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Super Admin only)
export const updateUserStatusAdmin = catchAsync(async (req, res) => {
  const { status, reason } = req.body;

  if (!["active", "banned"].includes(status)) {
    return sendError(res, "Trạng thái tài khoản không hợp lệ (active hoặc banned)", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return sendError(res, "Không tìm thấy người dùng", 404);
  }

  // BẢO VỆ ADMIN BAN IMMUNITY RULE
  if (user.role === "admin") {
    return sendError(
      res,
      "Quy tắc an toàn: Không thể khóa hoặc đình chỉ tài khoản Quản trị viên sàn (Super Admin)",
      403
    );
  }

  user.status = status;
  user.isActive = status === "active";
  if (reason !== undefined) user.banReason = reason;

  const updated = await user.save();

  logger.info(`User status updated: ${user.email} -> ${status}`, {
    requestId: req.requestId,
    userId: user._id,
    status,
    reason,
  });

  sendSuccess(res, {
    user: updated.toSafeObject ? updated.toSafeObject() : updated,
    message:
      status === "active"
        ? `Đã mở khóa tài khoản cho ${user.fullName}`
        : `Đã tạm khóa tài khoản của ${user.fullName}`,
  });
});

// @desc    Xóa vĩnh viễn tài khoản người mua hoặc người bán (Dọn sạch liên kết để tiện test)
// @route   DELETE /api/admin/users/:id
// @access  Private (Super Admin only)
export const deleteUserAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return sendError(res, "Không tìm thấy người dùng", 404);
  }

  // BẢO VỆ ADMIN: Không thể xóa tài khoản Quản trị viên sàn
  if (user.role === "admin" || user.email === "admin@shopee.vn") {
    return sendError(
      res,
      "Quy tắc an toàn: Không thể xóa tài khoản Quản trị viên sàn (Super Admin)",
      403
    );
  }

  // Nếu tài khoản là Người bán hoặc có Shop liên kết, xóa toàn bộ Shop và sản phẩm liên quan
  let deletedShopName = null;
  const shopMatches = await Shop.find({
    $or: [
      { ownerId: user._id || user.id },
      { ownerId: String(user._id || user.id) },
      { shopId: user.shopId },
      { _id: user.shopId },
    ],
  });

  if (shopMatches && shopMatches.length > 0) {
    for (const s of shopMatches) {
      deletedShopName = s.name;
      if (s.shopId) {
        await Product.deleteMany({ shopId: s.shopId });
      }
      await Shop.findByIdAndDelete(s._id || s.id);
      await Shop.deleteOne({ $or: [{ _id: s._id || s.id }, { shopId: s.shopId }] });
    }
  }

  // Xóa giỏ hàng người dùng (nếu có)
  if (memoryStore?.carts?.clearByUserId) {
    memoryStore.carts.clearByUserId(id);
  }

  // Xóa user khỏi database
  await User.findByIdAndDelete(id);
  await User.deleteOne({ $or: [{ _id: id }, { id: id }, { email: user.email }] });

  logger.info(`User deleted: ${user.fullName} (${user.email})`, {
    requestId: req.requestId,
    userId: id,
    email: user.email,
  });

  sendSuccess(res, {
    id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    deletedShop: deletedShopName,
    message: `Đã xóa vĩnh viễn tài khoản ${user.fullName} (${user.email}). Email này hiện đã được giải phóng để bạn có thể test đăng ký mới.`,
  });
});

// ==================== BÁO CÁO TỔNG QUAN & TÀI CHÍNH TOÀN SÀN ====================

// @desc    Lấy số liệu tổng hợp toàn sàn (Overview KPIs)
// @route   GET /api/admin/overview
// @access  Private (Super Admin only)
export const getPlatformOverviewAdmin = catchAsync(async (req, res) => {
  const totalShops = await Shop.countDocuments();
  const activeShops = await Shop.countDocuments({ status: "active" });
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  const orders = await Order.find({ status: { $ne: "cancelled" } });
  const totalPlatformRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const platformCommission = Math.round(totalPlatformRevenue * 0.05);

  sendSuccess(res, {
    totalPlatformRevenue,
    platformCommission,
    totalShops,
    activeShops,
    totalUsers,
    totalProducts,
    totalOrders: orders.length,
  });
});

// @desc    Bảng đối soát tài chính của các gian hàng (Finance Settlements)
// @route   GET /api/admin/finance
// @access  Private (Super Admin only)
export const getFinanceSettlementsAdmin = catchAsync(async (req, res) => {
  const shops = await Shop.find({ status: "active" });
  const settlements = [];

  for (const shop of shops) {
    const orders = await Order.find({
      "items.shopId": shop.shopId,
      status: { $ne: "cancelled" },
    });

    let shopGMV = 0;
    orders.forEach((o) => {
      const sub = (o.items || [])
        .filter((item) => item.shopId === shop.shopId)
        .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      shopGMV += sub;
    });

    const commission = Math.round(shopGMV * (shop.commissionRate || 0.05));
    const netPayout = shopGMV - commission;

    settlements.push({
      shopId: shop.shopId,
      shopName: shop.name,
      bankAccount: shop.bankAccount,
      gmv: shopGMV,
      commissionRate: shop.commissionRate || 0.05,
      commission,
      netPayout,
      period: "Kỳ hiện tại (Tháng 09/2026)",
      status: "pending",
      statusText: "Chờ đối soát",
    });
  }

  sendSuccess(res, settlements);
});

// @desc    Admin Dashboard — Tổng quan hệ thống
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
export const getDashboard = catchAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalShops = await Shop.countDocuments();

  const allOrders = await Order.find({});
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let revenueToday = 0, revenueWeek = 0, revenueMonth = 0, revenueTotal = 0;
  let ordersToday = 0, ordersPending = 0;

  for (const order of allOrders) {
    const total = order.total || 0;
    const date = (order.createdAt || "").slice(0, 10);
    const isCompleted = order.status === "completed" || order.status === "delivered";

    if (isCompleted) revenueTotal += total;
    if (date === today) { ordersToday++; if (isCompleted) revenueToday += total; }
    if (date >= weekAgo && isCompleted) revenueWeek += total;
    if (date >= monthAgo && isCompleted) revenueMonth += total;
    if (order.status === "pending") ordersPending++;
  }

  const activeUsers = await User.countDocuments({ isActive: true });
  const activeShops = await Shop.countDocuments({ status: "active" });

  sendSuccess(res, {
    totalUsers,
    activeUsers,
    totalOrders,
    ordersToday,
    ordersPending,
    totalProducts,
    totalShops,
    activeShops,
    revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth, total: revenueTotal },
  });
});

// @desc    Revenue chart data — 7 ngày gần nhất
// @route   GET /api/admin/revenue-chart
// @access  Private (Admin)
export const getRevenueChart = catchAsync(async (req, res) => {
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
      if (orderDate === dateStr) {
        orderCount++;
        if (order.status === "completed" || order.status === "delivered") {
          revenue += order.total || 0;
        }
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

// @desc    Top sản phẩm bán chạy nhất
// @route   GET /api/admin/top-products
// @access  Private (Admin)
export const getTopProducts = catchAsync(async (req, res) => {
  const { limit = 5 } = req.query;
  const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

  const products = await Product.find({ isActive: true })
    .sort({ sold: -1 })
    .limit(limitNum);

  const topProducts = products.map((p, idx) => ({
    rank: idx + 1,
    productId: p._id,
    name: p.name,
    price: p.price,
    sold: p.sold || 0,
    revenue: (p.price || 0) * (p.sold || 0),
    rating: p.rating || 0,
    shopName: p.shopName || "",
    image: p.image,
  }));

  sendSuccess(res, { topProducts });
});

// @desc    Top gian hàng doanh thu cao nhất
// @route   GET /api/admin/top-shops
// @access  Private (Admin)
export const getTopShops = catchAsync(async (req, res) => {
  const { limit = 5 } = req.query;
  const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

  const allOrders = await Order.find({});
  const shops = await Shop.find({});

  // Calculate revenue per shop
  const shopRevenueMap = new Map();
  for (const order of allOrders) {
    if (order.status !== "completed" && order.status !== "delivered") continue;
    for (const item of order.items || []) {
      const shopId = item.shopId || "shop_01";
      shopRevenueMap.set(shopId, (shopRevenueMap.get(shopId) || 0) + ((item.price || 0) * (item.quantity || 1)));
    }
  }

  const topShops = shops
    .map((shop) => ({
      shopId: shop.shopId,
      name: shop.name,
      revenue: shopRevenueMap.get(shop.shopId) || 0,
      status: shop.status,
      commissionRate: shop.commissionRate || 0.05,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limitNum)
    .map((s, idx) => ({ rank: idx + 1, ...s }));

  sendSuccess(res, { topShops });
});

// @desc    Đơn hàng gần nhất
// @route   GET /api/admin/recent-orders
// @access  Private (Admin)
export const getRecentOrders = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(limitNum);

  const recentOrders = orders.map((o) => ({
    orderId: o._id || o.id,
    customer: o.customer?.fullName || "Khách hàng",
    phone: o.customer?.phone || "",
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod || "COD",
    trackingCode: o.trackingCode || "",
    createdAt: o.createdAt,
    itemCount: (o.items || []).length,
  }));

  sendSuccess(res, { recentOrders });
});

export default {
  getAllShopsAdmin,
  updateShopStatusAdmin,
  updateShopCommissionAdmin,
  deleteShopAdmin,
  getAllUsersAdmin,
  updateUserStatusAdmin,
  deleteUserAdmin,
  getPlatformOverviewAdmin,
  getFinanceSettlementsAdmin,
  getDashboard,
  getRevenueChart,
  getTopProducts,
  getTopShops,
  getRecentOrders,
};
