import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";

// @desc    Lấy thông tin gian hàng của seller hiện tại
// @route   GET /api/seller/shop
// @access  Private (Seller only)
export const getMySellerShop = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) {
      return sendError(res, "Tài khoản của bạn chưa được liên kết với gian hàng nào", 400);
    }

    const shop = await Shop.findOne({ shopId });
    if (!shop) {
      return sendError(res, "Không tìm thấy thông tin gian hàng liên kết với tài khoản", 404);
    }
    sendSuccess(res, shop);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Cập nhật thông tin hồ sơ gian hàng
// @route   PUT /api/seller/shop
// @access  Private (Seller only)
export const updateMySellerShop = async (req, res) => {
  try {
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
    sendSuccess(res, updatedShop);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Đăng ký mở shop mới (Onboard Seller)
// @route   POST /api/seller/shop/onboard
// @access  Private (Authenticated Customer)
export const onboardShop = async (req, res) => {
  try {
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

    sendSuccess(res, { shop: newShop, message: "Mở gian hàng thành công!" }, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Lấy thống kê số liệu của riêng shop (Tenant Isolated)
// @route   GET /api/seller/stats
// @access  Private (Seller only - Isolated to req.user.shopId)
export const getSellerStats = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Lấy danh sách sản phẩm thuộc shop của mình (Tenant Isolated)
// @route   GET /api/seller/products
// @access  Private (Seller only)
export const getSellerProducts = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Tạo sản phẩm mới cho shop (Tự động inject shopId)
// @route   POST /api/seller/products
// @access  Private (Seller only)
export const createSellerProduct = async (req, res) => {
  try {
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

    sendSuccess(res, newProduct, 201);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Chỉnh sửa sản phẩm của shop (Tenant Isolated via shopId)
// @route   PUT /api/seller/products/:id
// @access  Private (Seller only)
export const updateSellerProduct = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Xóa sản phẩm của shop (Tenant Isolated via shopId)
// @route   DELETE /api/seller/products/:id
// @access  Private (Seller only)
export const deleteSellerProduct = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const product = await Product.findOneAndDelete({ _id: req.params.id, shopId });

    if (!product) {
      return sendError(res, "Không tìm thấy sản phẩm hoặc bạn không có quyền xóa sản phẩm của shop khác", 404);
    }

    sendSuccess(res, { message: `Đã xóa sản phẩm ${product.name} thành công!` });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Lấy danh sách đơn hàng thuộc shop (Tenant Isolated)
// @route   GET /api/seller/orders
// @access  Private (Seller only)
export const getSellerOrders = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Cập nhật trạng thái đơn hàng từ phía Seller
// @route   PATCH /api/seller/orders/:id/status
// @access  Private (Seller only)
export const updateSellerOrderStatus = async (req, res) => {
  try {
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

    sendSuccess(res, updated);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

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
};

// @desc    Seller Dashboard — Thống kê gian hàng tổng quan
// @route   GET /api/seller/dashboard
// @access  Private (Seller)
export const getSellerDashboard = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Seller Revenue Chart — Biểu đồ doanh thu 7 ngày
// @route   GET /api/seller/revenue
// @access  Private (Seller)
export const getSellerRevenue = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Seller Pending Orders — Đơn chờ xác nhận
// @route   GET /api/seller/orders/pending
// @access  Private (Seller)
export const getSellerPendingOrders = async (req, res) => {
  try {
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
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// @desc    Seller Confirm Order
// @route   PATCH /api/seller/orders/:id/confirm
// @access  Private (Seller)
export const confirmSellerOrder = async (req, res) => {
  try {
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

    sendSuccess(res, { order, message: "Đã xác nhận đơn hàng" });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};
