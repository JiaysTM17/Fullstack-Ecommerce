/**
 * Not Found Middleware — Xử lý route không tồn tại
 * Gợi ý các route hợp lệ để hỗ trợ developer debug
 */
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
  "GET    /api/seller/dashboard",
  "GET    /api/admin/dashboard",
];

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route không tồn tại: ${req.method} ${req.originalUrl}`,
    suggestion: "Kiểm tra lại đường dẫn API. Danh sách endpoints hợp lệ bên dưới.",
    availableEndpoints: AVAILABLE_ENDPOINTS,
  });
};

export default notFound;
