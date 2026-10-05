/**
 * Not Found Middleware — Xử lý route không tồn tại
 * Upgrade: Sử dụng structured logger, cập nhật endpoint list
 */

import logger from "../utils/logger.js";

const AVAILABLE_ENDPOINTS = [
  "GET    /api/health",
  "POST   /api/auth/register",
  "POST   /api/auth/login",
  "GET    /api/auth/me",
  "PUT    /api/auth/profile",
  "PUT    /api/auth/change-password",
  "POST   /api/auth/forgot-password",
  "POST   /api/auth/reset-password",
  "POST   /api/auth/refresh-token",
  "POST   /api/auth/logout",
  "GET    /api/products",
  "GET    /api/products/best-sellers",
  "GET    /api/products/new-arrivals",
  "GET    /api/products/flash-sale",
  "GET    /api/products/search",
  "GET    /api/products/:id",
  "GET    /api/products/:id/related",
  "GET    /api/products/:id/review-stats",
  "GET    /api/orders/mine",
  "GET    /api/orders/stats",
  "GET    /api/orders/search",
  "POST   /api/orders",
  "PATCH  /api/orders/:id/confirm",
  "PATCH  /api/orders/:id/ship",
  "PATCH  /api/orders/:id/deliver",
  "PATCH  /api/orders/:id/complete",
  "PATCH  /api/orders/:id/cancel",
  "POST   /api/orders/:id/repurchase",
  "GET    /api/cart",
  "GET    /api/cart/summary",
  "POST   /api/cart/apply-voucher",
  "GET    /api/vouchers",
  "POST   /api/vouchers/validate",
  "GET    /api/vouchers/my",
  "GET    /api/reviews/:productId",
  "POST   /api/reviews",
  "POST   /api/reviews/:id/reply",
  "POST   /api/reviews/:id/report",
  "GET    /api/wishlist",
  "POST   /api/wishlist/:productId",
  "GET    /api/notifications",
  "GET    /api/notifications/unread-count",
  "GET    /api/shops",
  "GET    /api/shops/:id",
  "GET    /api/seller/shop",
  "GET    /api/seller/dashboard",
  "GET    /api/seller/stats",
  "GET    /api/seller/products",
  "GET    /api/seller/orders",
  "GET    /api/seller/revenue",
  "GET    /api/seller/wallet",
  "GET    /api/admin/dashboard",
  "GET    /api/admin/overview",
  "GET    /api/admin/shops",
  "GET    /api/admin/users",
  "GET    /api/admin/finance",
  "GET    /api/admin/revenue-chart",
  "GET    /api/admin/top-products",
  "GET    /api/admin/top-shops",
  "GET    /api/admin/recent-orders",
];

const notFound = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route không tồn tại: ${req.method} ${req.originalUrl}`,
    suggestion: "Kiểm tra lại đường dẫn API. Danh sách endpoints hợp lệ bên dưới.",
    availableEndpoints: AVAILABLE_ENDPOINTS,
    requestId: req.requestId,
  });
};

export default notFound;
