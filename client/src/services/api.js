/**
 * API Service Layer - Trung tâm giao tiếp Frontend & Backend
 * Auto-injects JWT auth token from localStorage
 */

const DEFAULT_API_URL = "http://localhost:5000";

export const API_BASE_URL = (
  import.meta.env?.VITE_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

/**
 * Get the stored auth token
 */
function getAuthToken() {
  try {
    return localStorage.getItem("mini_shopee_token") || null;
  } catch {
    return null;
  }
}

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Core API request function — auto-injects JWT Bearer token
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Auto-inject auth token if available
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok || payload?.success === false) {
    const error = new Error(
      payload?.message || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

// ============================================================
// PRODUCT API
// ============================================================

/**
 * Fetch products from backend with filters
 */
export async function fetchProducts(params = {}) {
  const qs = buildQueryString(params);
  const result = await apiRequest(`/api/products${qs}`);
  return result?.data || result;
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(id) {
  const result = await apiRequest(`/api/products/${id}`);
  return result?.data || result;
}

/**
 * Search products
 */
export async function searchProducts(query, params = {}) {
  const qs = buildQueryString({ q: query, ...params });
  const result = await apiRequest(`/api/products/search${qs}`);
  return result?.data || result;
}

/**
 * Fetch categories with product counts
 */
export async function fetchCategories() {
  const result = await apiRequest("/api/products/categories/list");
  return result?.data || result;
}

// ============================================================
// SHOP API
// ============================================================

/**
 * Fetch all active shops
 */
export async function fetchShops() {
  const result = await apiRequest("/api/shops");
  return result?.data || result;
}

/**
 * Fetch shop by ID or slug
 */
export async function fetchShopById(identifier) {
  const result = await apiRequest(`/api/shops/${identifier}`);
  return result?.data || result;
}

/**
 * Fetch products for a shop
 */
export async function fetchShopProducts(shopId, params = {}) {
  const qs = buildQueryString(params);
  const result = await apiRequest(`/api/shops/${shopId}/products${qs}`);
  return result?.data || result;
}

// ============================================================
// CART API
// ============================================================

/**
 * Get server-side cart for current user
 */
export async function fetchCart() {
  const result = await apiRequest("/api/cart");
  return result?.data || result;
}

/**
 * Add item to server-side cart
 */
export async function addToCartAPI(productId, quantity = 1) {
  const result = await apiRequest("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  return result?.data || result;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemAPI(productId, quantity, selected) {
  const body = {};
  if (quantity !== undefined) body.quantity = quantity;
  if (selected !== undefined) body.selected = selected;

  const result = await apiRequest(`/api/cart/${productId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return result?.data || result;
}

/**
 * Remove item from server-side cart
 */
export async function removeFromCartAPI(productId) {
  const result = await apiRequest(`/api/cart/${productId}`, {
    method: "DELETE",
  });
  return result?.data || result;
}

/**
 * Clear entire server-side cart
 */
export async function clearCartAPI() {
  const result = await apiRequest("/api/cart", {
    method: "DELETE",
  });
  return result?.data || result;
}

// ============================================================
// ORDER API
// ============================================================

/**
 * Create order with stock deduction + coin earning
 */
export async function createOrderAPI(orderPayload) {
  const result = await apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(orderPayload),
  });
  return result?.data || result;
}

/**
 * Get current user's orders
 */
export async function fetchMyOrders(params = {}) {
  const qs = buildQueryString(params);
  const result = await apiRequest(`/api/orders/mine${qs}`);
  return result?.data || result;
}

/**
 * Get order by ID
 */
export async function fetchOrderById(id) {
  const result = await apiRequest(`/api/orders/${id}`);
  return result?.data || result;
}

/**
 * Cancel order
 */
export async function cancelOrderAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/cancel`, {
    method: "PATCH",
  });
  return result?.data || result;
}

// ============================================================
// VOUCHER API
// ============================================================

/**
 * Fetch available vouchers
 */
export async function fetchVouchers(params = {}) {
  const qs = buildQueryString(params);
  const result = await apiRequest(`/api/vouchers${qs}`);
  return result?.data || result;
}

/**
 * Validate and apply a voucher code
 */
export async function applyVoucherAPI(code, orderSubtotal, shopId) {
  const result = await apiRequest("/api/vouchers/apply", {
    method: "POST",
    body: JSON.stringify({ code, orderSubtotal, shopId }),
  });
  return result?.data || result;
}

/**
 * Create a voucher (seller/admin)
 */
export async function createVoucherAPI(voucherData) {
  const result = await apiRequest("/api/vouchers", {
    method: "POST",
    body: JSON.stringify(voucherData),
  });
  return result?.data || result;
}

/**
 * Delete a voucher (seller/admin)
 */
export async function deleteVoucherAPI(voucherId) {
  const result = await apiRequest(`/api/vouchers/${voucherId}`, {
    method: "DELETE",
  });
  return result?.data || result;
}

// ============================================================
// REVIEW API
// ============================================================

/**
 * Get reviews for a product
 */
export async function fetchProductReviews(productId, params = {}) {
  const qs = buildQueryString(params);
  const result = await apiRequest(`/api/reviews/${productId}${qs}`);
  return result?.data || result;
}

/**
 * Create a review
 */
export async function createReviewAPI(reviewData) {
  const result = await apiRequest("/api/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
  return result?.data || result;
}

// ============================================================
// AUTH API
// ============================================================

/**
 * Login with email/password
 */
export async function loginAPI(email, password) {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return result;
}

/**
 * Register new account
 */
export async function registerAPI(userData) {
  const result = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  return result;
}

/**
 * Demo login by role key
 */
export async function demoLoginAPI(roleKey) {
  const result = await apiRequest("/api/auth/demo", {
    method: "POST",
    body: JSON.stringify({ roleKey }),
  });
  return result;
}

/**
 * Get current user profile
 */
export async function fetchCurrentUser() {
  const result = await apiRequest("/api/auth/me");
  return result?.data || result;
}

/**
 * Update user profile
 */
export async function updateProfileAPI(data) {
  const result = await apiRequest("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return result?.data || result;
}

/**
 * Change password
 */
export async function changePasswordAPI(oldPassword, newPassword) {
  const result = await apiRequest("/api/auth/change-password", {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return result?.data || result;
}

// ============================================================
// SELLER API
// ============================================================

export async function fetchSellerShop() {
  const result = await apiRequest("/api/seller/shop");
  return result?.data || result;
}

export async function fetchSellerProducts() {
  const result = await apiRequest("/api/seller/products");
  return result?.data || result;
}

export async function createSellerProduct(productData) {
  const result = await apiRequest("/api/seller/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
  return result?.data || result;
}

export async function updateSellerProduct(productId, data) {
  const result = await apiRequest(`/api/seller/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return result?.data || result;
}

export async function deleteSellerProduct(productId) {
  const result = await apiRequest(`/api/seller/products/${productId}`, {
    method: "DELETE",
  });
  return result?.data || result;
}

export async function fetchSellerOrders() {
  const result = await apiRequest("/api/seller/orders");
  return result?.data || result;
}

export async function updateSellerOrderStatus(orderId, status) {
  const result = await apiRequest(`/api/seller/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return result?.data || result;
}

export async function fetchSellerStats() {
  const result = await apiRequest("/api/seller/stats");
  return result?.data || result;
}

// ============================================================
// ADMIN API
// ============================================================

export async function fetchAdminOverview() {
  const result = await apiRequest("/api/admin/overview");
  return result?.data || result;
}

export async function fetchAdminShops() {
  const result = await apiRequest("/api/admin/shops");
  return result?.data || result;
}

export async function fetchAdminUsers() {
  const result = await apiRequest("/api/admin/users");
  return result?.data || result;
}

export async function updateShopStatusAdmin(shopId, status, lockReason) {
  const result = await apiRequest(`/api/admin/shops/${shopId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, lockReason }),
  });
  return result?.data || result;
}

export async function updateUserStatusAdmin(userId, status) {
  const result = await apiRequest(`/api/admin/users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return result?.data || result;
}

// ============================================================
// SELLER BI & ADVANCED OPS API
// ============================================================

export async function fetchSellerFunnelAnalytics() {
  const result = await apiRequest("/api/seller/analytics/funnel");
  return result?.data || result;
}

export async function fetchSellerMarketIntelligence() {
  const result = await apiRequest("/api/seller/analytics/market");
  return result?.data || result;
}

export async function fetchSellerStaff() {
  const result = await apiRequest("/api/seller/staff");
  return result?.data?.staff || result?.staff || [];
}

export async function createSellerStaff(data) {
  return await apiRequest("/api/seller/staff", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerStaff(id, data) {
  return await apiRequest(`/api/seller/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Shopee Ads ROI Suite API
 */
export async function fetchSellerAdsAPI() {
  const result = await apiRequest("/api/seller/ads");
  return result?.data || result;
}

export async function createSellerAdsAPI(data) {
  return await apiRequest("/api/seller/ads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function toggleSellerAdsAPI(id) {
  return await apiRequest(`/api/seller/ads/${id}/toggle`, {
    method: "PATCH",
  });
}

export async function simulateSellerAdsAPI(data) {
  return await apiRequest("/api/seller/ads/simulate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Batch Inventory Matrix API
 */
export async function batchUpdateInventoryAPI(updates) {
  return await apiRequest("/api/seller/inventory/batch-update", {
    method: "POST",
    body: JSON.stringify({ updates }),
  });
}

/**
 * Flash Sale Shop API
 */
export async function fetchSellerFlashSalesAPI() {
  const result = await apiRequest("/api/seller/flash-sales");
  return result?.data || result;
}

export async function createSellerFlashSaleAPI(data) {
  return await apiRequest("/api/seller/flash-sales", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSellerFlashSaleStatusAPI(id, status) {
  return await apiRequest(`/api/seller/flash-sales/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteSellerFlashSaleAPI(id) {
  return await apiRequest(`/api/seller/flash-sales/${id}`, {
    method: "DELETE",
  });
}

/**
 * Seller Wallet Retrieval & Withdrawal API
 */
export async function fetchSellerWalletAPI() {
  const result = await apiRequest("/api/seller/wallet");
  return result?.data || result;
}

export async function requestSellerWithdrawalAPI(data) {
  return await apiRequest("/api/seller/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Seller Batch Confirm Orders API
 */
export async function batchConfirmSellerOrdersAPI(orderIds) {
  return await apiRequest("/api/seller/orders/batch-confirm", {
    method: "POST",
    body: JSON.stringify({ orderIds }),
  });
}

/**
 * Seller Return & Refund Management APIs
 */
export async function fetchSellerReturnsAPI() {
  const result = await apiRequest("/api/seller/orders/returns");
  return result?.data?.returns || result?.returns || [];
}

export async function respondSellerReturnAPI(id, decision, note = "") {
  return await apiRequest(`/api/seller/orders/${id}/return-response`, {
    method: "POST",
    body: JSON.stringify({ decision, note }),
  });
}

/**
 * Seller P&L Per-SKU Cost & Margin Analytics
 */
export async function fetchSellerProfitAndLossAPI() {
  const result = await apiRequest("/api/seller/analytics/profit-loss");
  return result?.data || result || { summary: {}, skuAnalytics: [] };
}

/**
 * Customer Return Request API
 */
export async function createCustomerReturnRequestAPI(orderId, { reason, evidence = [], refundAmount = 0 }) {
  return await apiRequest(`/api/orders/${orderId}/return-request`, {
    method: "POST",
    body: JSON.stringify({ reason, evidence, refundAmount }),
  });
}

/**
 * Seller Dynamic Shipping Policy & SPX Subsidy APIs
 */
export async function fetchSellerShippingPolicyAPI() {
  const result = await apiRequest("/api/seller/shipping-policy");
  return result?.data || result || null;
}

export async function updateSellerShippingPolicyAPI(policyData) {
  return await apiRequest("/api/seller/shipping-policy", {
    method: "PUT",
    body: JSON.stringify(policyData),
  });
}

