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
  const headers = {};
  if (orderPayload?.idempotencyKey) {
    headers["x-idempotency-key"] = orderPayload.idempotencyKey;
  }
  const result = await apiRequest("/api/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(orderPayload),
  });
  return result?.data || result;
}

/**
 * Reserve stock for cart items (TTL default 15 mins)
 */
export async function reserveStockAPI({ items, ttlMinutes = 15 }) {
  const result = await apiRequest("/api/orders/reserve-stock", {
    method: "POST",
    body: JSON.stringify({ items, ttlMinutes }),
  });
  return result?.data || result;
}

/**
 * Release reserved stock early if user backs out or cancels
 */
export async function releaseStockAPI({ reservationId }) {
  const result = await apiRequest("/api/orders/release-stock", {
    method: "POST",
    body: JSON.stringify({ reservationId }),
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

/**
 * Seller Operational SLA & Shopee Penalty Points Engine API
 */
export async function fetchSellerOperationalSLA_API() {
  const result = await apiRequest("/api/seller/operational-sla");
  return result?.data || result || null;
}

/**
 * Triple Voucher Stacking & Mini Xu Offset API
 */
export async function applyTripleVouchersAPI({ items = [], freeshipCode, shopVoucherCode, platformVoucherCode, shippingFee = 25000, requestedCoins = 0, userCoins = 0 }) {
  const result = await apiRequest("/api/vouchers/apply-triple", {
    method: "POST",
    body: JSON.stringify({
      items,
      freeshipCode,
      shopVoucherCode,
      platformVoucherCode,
      shippingFee,
      requestedCoins,
      userCoins,
    }),
  });
  return result?.data || result || null;
}

/**
 * Seller Auto-Reply Assistant APIs
 */
export async function fetchSellerAutoReplyAPI() {
  const result = await apiRequest("/api/seller/auto-reply");
  return result?.data || result || null;
}

export async function updateSellerAutoReplyAPI(autoReplyData) {
  return await apiRequest("/api/seller/auto-reply", {
    method: "PUT",
    body: JSON.stringify(autoReplyData),
  });
}

export async function simulateSellerAutoReplyAPI(payload) {
  return await apiRequest("/api/seller/auto-reply/simulate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 3PL Carrier Webhook Simulation API
 */
export async function simulateCarrierWebhookAPI(orderId, payload) {
  return await apiRequest(`/api/orders/${orderId}/carrier-webhook`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Customer Post-Delivery CSAT Feedback API
 */
export async function submitOrderCsatFeedbackAPI(orderId, feedbackData) {
  return await apiRequest(`/api/orders/${orderId}/csat-feedback`, {
    method: "POST",
    body: JSON.stringify(feedbackData),
  });
}

/**
 * Seller Automated Shipping Label & Dispatch Manifest APIs (Feature 86)
 */
export async function fetchSellerShippingManifestAPI(orderId) {
  const result = await apiRequest(`/api/seller/orders/${orderId}/shipping-manifest`);
  return result?.data?.manifest || result?.manifest || null;
}

export async function batchDispatchSellerOrdersAPI(orderIds) {
  return await apiRequest("/api/seller/orders/batch-dispatch", {
    method: "POST",
    body: JSON.stringify({ orderIds }),
  });
}

/**
 * Smart Multi-tier Loyalty & VIP Membership Club API (Feature 87)
 */
export async function fetchLoyaltyProfileAPI() {
  const result = await apiRequest("/api/auth/loyalty");
  return result?.data?.loyalty || result?.loyalty || null;
}

/**
 * Real-time Live Stream & Product Showcase Floating Widget API (Feature 88)
 */
export async function fetchActiveLiveStreamAPI() {
  const result = await apiRequest("/api/products/live-stream/active");
  return result?.data?.session || result?.session || null;
}

/**
 * Seller COD Cash-on-Delivery Settlement & Remittance Reconciliation API (Feature 89)
 */
export async function fetchSellerCodReconciliationAPI() {
  const result = await apiRequest("/api/seller/orders/cod-reconciliation");
  return result?.data || result || null;
}

export async function reconcileSellerCodOrdersAPI(orderIds) {
  return await apiRequest("/api/seller/orders/cod-reconciliation/reconcile", {
    method: "POST",
    body: JSON.stringify({ orderIds }),
  });
}

/**
 * Smart Price Comparison & Competitor Monitoring Radar API (Feature 91)
 */
export async function fetchSellerPriceRadarAPI() {
  const result = await apiRequest("/api/seller/analytics/price-radar");
  return result?.data || result || null;
}

/**
 * Gift Wrapping & Personalized Greeting Card Customizer API (Feature 92)
 */
export async function updateOrderGiftWrapAPI(orderId, giftWrapData) {
  return await apiRequest(`/api/orders/${orderId}/gift-wrap`, {
    method: "PATCH",
    body: JSON.stringify(giftWrapData),
  });
}

/**
 * Social Commerce Group Buy & Team Purchase Suite API (Feature 93)
 */
export async function fetchGroupBuyDealsAPI() {
  const result = await apiRequest("/api/products/group-buy/deals");
  return result?.data?.deals || result?.deals || [];
}

export async function joinGroupBuyTeamAPI(productId, teamId, memberName) {
  return await apiRequest("/api/products/group-buy/join", {
    method: "POST",
    body: JSON.stringify({ productId, teamId, memberName }),
  });
}

/**
 * Flexible Delivery Slot & Doorstep Rescheduling Hub API (Feature 94)
 */
export async function rescheduleOrderDeliveryAPI(orderId, { requestedDate, timeSlot, note } = {}) {
  return await apiRequest(`/api/orders/${orderId}/reschedule-delivery`, {
    method: "POST",
    body: JSON.stringify({ requestedDate, timeSlot, note }),
  });
}

/**
 * Smart Restock Alert & Supplier Reorder PO Generator API (Feature 95)
 */
export async function fetchSellerRestockRadarAPI() {
  const result = await apiRequest("/api/seller/inventory/restock-radar");
  return result?.data || result || null;
}

export async function createSellerPurchaseOrderAPI(poPayload) {
  return await apiRequest("/api/seller/inventory/purchase-orders", {
    method: "POST",
    body: JSON.stringify(poPayload),
  });
}

/**
 * Automated Dynamic Bundling & Volume Discount Upsell Engine API (Feature 96)
 */
export async function calculateProductVolumeDiscountAPI(productId, quantity = 1) {
  const result = await apiRequest(`/api/products/${productId}/volume-discount`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
  return result?.data || result || null;
}

/**
 * Co-Inspection (Đồng Kiểm Khi Nhận Hàng) Hub API (Feature 97)
 */
export async function updateOrderDoorstepInspectionAPI(orderId, inspectionPayload) {
  return await apiRequest(`/api/orders/${orderId}/doorstep-inspection`, {
    method: "PATCH",
    body: JSON.stringify(inspectionPayload),
  });
}

/**
 * Smart Shopee Live In-Stream Flash Voucher Dropper API (Feature 98)
 */
export async function fetchLiveFlashVoucherDropAPI() {
  const result = await apiRequest("/api/vouchers/live-stream/active-drop");
  return result?.data?.drop || result?.drop || null;
}

export async function dropLiveFlashVoucherAPI(dropPayload) {
  return await apiRequest("/api/vouchers/live-stream/drop", {
    method: "POST",
    body: JSON.stringify(dropPayload),
  });
}

export async function claimLiveFlashVoucherAPI(dropId, userId) {
  return await apiRequest("/api/vouchers/live-stream/claim", {
    method: "POST",
    body: JSON.stringify({ dropId, userId }),
  });
}

/**
 * Extended Warranty & Accidental Damage Protection Suite (Shopee Care+) API (Feature 99)
 */
export async function fetchProductWarrantyPlansAPI(productId) {
  const result = await apiRequest(`/api/products/${productId}/warranty-plans`);
  return result?.data?.warrantyPlans || result?.warrantyPlans || [];
}

/**
 * Smart Price Drop Alert & Target Price Radar API (Feature 100)
 */
export async function subscribePriceDropAlertAPI(productId, targetPrice, email, userId) {
  return await apiRequest(`/api/products/${productId}/price-drop-alert`, {
    method: "POST",
    body: JSON.stringify({ targetPrice, email, userId }),
  });
}

export async function fetchPriceDropAlertStatusAPI(productId, userId, email) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (email) params.append("email", email);
  const result = await apiRequest(`/api/products/${productId}/price-drop-alert/status?${params.toString()}`);
  return result?.data || result || null;
}

/**
 * Multi-Attempt Delivery Retry & Failed Handover Protocol Suite (Feature 101)
 */
export async function recordDeliveryAttemptAPI(orderId, attemptPayload) {
  return await apiRequest(`/api/orders/${orderId}/delivery-attempts`, {
    method: "POST",
    body: JSON.stringify(attemptPayload),
  });
}

export async function fetchDeliveryAttemptsAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/delivery-attempts`);
  return result?.data || result || null;
}

/**
 * Vault of Video Unboxing Evidence & Instant Dispute Arbitration API (Feature 102)
 */
export async function uploadUnboxingVideoProofAPI(orderId, { videoUrl, durationSeconds, sha256Hash }) {
  return await apiRequest(`/api/orders/${orderId}/unboxing-video`, {
    method: "POST",
    body: JSON.stringify({ videoUrl, durationSeconds, sha256Hash }),
  });
}

export async function verifyUnboxingVideoProofAPI(orderId, { status, verifiedBy, verificationNote }) {
  return await apiRequest(`/api/orders/${orderId}/unboxing-video/verify`, {
    method: "PATCH",
    body: JSON.stringify({ status, verifiedBy, verificationNote }),
  });
}

/**
 * Smart 1-Click Reorder Suite & Loyalty Voucher (Feature 103)
 */
export async function executeSmartOneClickReorderAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/smart-reorder`, {
    method: "POST",
  });
  return result?.data || result;
}

/**
 * Seller Multi-Warehouse Stock Splitting & Geo-Proximity Routing (Feature 104)
 */
export async function calculateMultiWarehouseRoutingAPI(orderId, { buyerProvince } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/warehouse-routing`, {
    method: "POST",
    body: JSON.stringify({ buyerProvince }),
  });
  return result?.data || result;
}

/**
 * Dynamic In-Flight Delivery Address Correction Suite (Feature 105)
 */
export async function updateDynamicDeliveryAddressAPI(orderId, { newAddress, reason }) {
  const result = await apiRequest(`/api/orders/${orderId}/dynamic-address`, {
    method: "PATCH",
    body: JSON.stringify({ newAddress, reason }),
  });
  return result?.data || result;
}

/**
 * Eco-Friendly Packaging & Carbon Offsetting Contribution Suite (Feature 106)
 */
export async function updateEcoPackagingOptionAPI(orderId, { isOptedIn, boxType, treePlantContribution }) {
  const result = await apiRequest(`/api/orders/${orderId}/eco-packaging`, {
    method: "PATCH",
    body: JSON.stringify({ isOptedIn, boxType, treePlantContribution }),
  });
  return result?.data || result;
}

/**
 * Contactless Smart Locker Station Auto-Handoff Suite (Feature 107)
 */
export async function assignSmartLockerDeliveryAPI(orderId, { lockerStationId, lockerStationName, lockerStationAddress } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/smart-locker`, {
    method: "POST",
    body: JSON.stringify({ lockerStationId, lockerStationName, lockerStationAddress }),
  });
  return result?.data || result;
}

/**
 * Digital Carbon Offset Certificate & Green NFT Badge Suite (Feature 108)
 */
export async function issueCarbonOffsetCertificateAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/carbon-certificate`, {
    method: "POST",
  });
  return result?.data || result;
}

/**
 * Doorstep Return & Exchange Courier Dispatch Suite (Feature 109)
 */
export async function scheduleDoorstepReturnPickupAPI(orderId, { appointmentDate, timeWindow, pickupAddress, pickupNote } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/doorstep-return-pickup`, {
    method: "POST",
    body: JSON.stringify({ appointmentDate, timeWindow, pickupAddress, pickupNote }),
  });
  return result?.data || result;
}

/**
 * Automated Fraud Risk Radar & COD Protection Suite (Feature 110)
 */
export async function evaluateOrderFraudRiskAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/fraud-risk-audit`, {
    method: "POST",
  });
  return result?.data || result;
}

/**
 * Automated COD Courier Reconciliation & Wallet Settlement Suite (Feature 111)
 */
export async function reconcileAutomatedCodSettlementAPI(orderId, { amountCollected, courierHandoverStatus } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/cod-reconcile`, {
    method: "POST",
    body: JSON.stringify({ amountCollected, courierHandoverStatus }),
  });
  return result?.data || result;
}

/**
 * Shopee On-Time Delivery Guarantee & Automated Delay Compensation Suite (Feature 112)
 */
export async function claimLateDeliveryCompensationAPI(orderId) {
  const result = await apiRequest(`/api/orders/${orderId}/claim-late-compensation`, {
    method: "POST",
  });
  return result?.data || result;
}

/**
 * Intelligent AI Damage Claim Vision Evaluator & Instant Partial Refund (Feature 113)
 */
export async function evaluateAiDamageClaimAPI(orderId, { imageUrls = [], buyerNote = "", acceptPartialRefund = true } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/ai-damage-claim`, {
    method: "POST",
    body: JSON.stringify({ imageUrls, buyerNote, acceptPartialRefund }),
  });
  return result?.data || result;
}

/**
 * Multi-Store Consolidated Packaging & Unified Box Shipping (Feature 114)
 */
export async function consolidateOrderPackagingAPI(orderId, { consolidationHub, participatingShops } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/consolidate-packaging`, {
    method: "POST",
    body: JSON.stringify({ consolidationHub, participatingShops }),
  });
  return result?.data || result;
}

/**
 * Priority Cold-Chain Perishable Logistics & IoT Thermal Tracker (Feature 115)
 */
export async function updatePriorityColdChainDispatchAPI(orderId, { sensorSerial, minTempCelsius, maxTempCelsius, currentTempCelsius, thermalInsulationBox } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/cold-chain`, {
    method: "POST",
    body: JSON.stringify({ sensorSerial, minTempCelsius, maxTempCelsius, currentTempCelsius, thermalInsulationBox }),
  });
  return result?.data || result;
}

/**
 * Doorstep Old Appliance Trade-In & E-Waste Direct Subsidy (Feature 116)
 */
export async function submitDoorstepApplianceTradeInAPI(orderId, { applianceType, deviceBrandModel, cosmeticCondition, subsidyCreditAmount } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/doorstep-trade-in`, {
    method: "POST",
    body: JSON.stringify({ applianceType, deviceBrandModel, cosmeticCondition, subsidyCreditAmount }),
  });
  return result?.data || result;
}

/**
 * Autonomous Drone Flight Delivery Route & Helipad Drop Simulator (Feature 117)
 */
export async function dispatchAutonomousDroneFlightAPI(orderId, { droneCallsign, flightAltitudeMeters, flightSpeedKmh, tetherDropStatus, helipadCoordinates } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/drone-dispatch`, {
    method: "POST",
    body: JSON.stringify({ droneCallsign, flightAltitudeMeters, flightSpeedKmh, tetherDropStatus, helipadCoordinates }),
  });
  return result?.data || result;
}

/**
 * Smart In-Transit Package Temperature Breach Insurance Claim (Feature 118)
 */
export async function settleColdChainInsuranceClaimAPI(orderId, { breachConfirmed = true, payoutAmount = 350000 } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/cold-chain-insurance-claim`, {
    method: "POST",
    body: JSON.stringify({ breachConfirmed, payoutAmount }),
  });
  return result?.data || result;
}

/**
 * Smart Carbon Neutral Green Route Optimization & Solar Fleet Badge (Feature 119)
 */
export async function optimizeSolarFleetGreenRoutingAPI(orderId, { vehicleType, fleetId, routeOptimizationEfficiencyPercent } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/solar-green-fleet`, {
    method: "POST",
    body: JSON.stringify({ vehicleType, fleetId, routeOptimizationEfficiencyPercent }),
  });
  return result?.data || result;
}

/**
 * In-App Real-Time Interactive Parcel Rerouting & Scheduled Delivery Window Switcher (Feature 120)
 */
export async function updateRealTimeParcelReroutingAPI(orderId, { reroutedAddress, deliveryTimeWindow, newCoordinates } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/realtime-reroute`, {
    method: "POST",
    body: JSON.stringify({ reroutedAddress, deliveryTimeWindow, newCoordinates }),
  });
  return result?.data || result;
}

/**
 * Smart Fragile Shock-Sensor IoT Telemetry & Impact Abuse Auto-Insurance Claim (Feature 121)
 */
export async function updateFragileShockSensorTelemetryAPI(orderId, { shockSensorId, recordedGForce, maxGForceLimit, dropEventCount } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/fragile-shock-telemetry`, {
    method: "POST",
    body: JSON.stringify({ shockSensorId, recordedGForce, maxGForceLimit, dropEventCount }),
  });
  return result?.data || result;
}

/**
 * Smart Multi-Carrier Carbon Neutrality Offset Ledger & Blockchain Verification Hash (Feature 122)
 */
export async function recordMultiCarrierCarbonLedgerAPI(orderId, { carrierCode, carrierConsortiumBatchId, carbonCreditsOffset } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/carrier-carbon-ledger`, {
    method: "POST",
    body: JSON.stringify({ carrierCode, carrierConsortiumBatchId, carbonCreditsOffset }),
  });
  return result?.data || result;
}

/**
 * AI Smart Video Return Verification & Automated Resale Grading (Feature 123)
 */
export async function evaluateVideoReturnResaleGradingAPI(orderId, { resaleGrade, videoAnalysisId, secondaryMarketChannel } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/ai-return-resale-grading`, {
    method: "POST",
    body: JSON.stringify({ resaleGrade, videoAnalysisId, secondaryMarketChannel }),
  });
  return result?.data || result;
}

/**
 * Smart In-Transit Acoustic Anti-Tamper & Package Audio Integrity Audit (Feature 124)
 */
export async function updateAcousticAntiTamperTelemetryAPI(orderId, { sensorId, decibelSpikePeak, frequencySignature, tamperEventDetected, tapeCutPatternMatch } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/acoustic-anti-tamper`, {
    method: "POST",
    body: JSON.stringify({ sensorId, decibelSpikePeak, frequencySignature, tamperEventDetected, tapeCutPatternMatch }),
  });
  return result?.data || result;
}

/**
 * Automated Courier Micro-Hub Pouch Lock Box Handoff (Feature 125)
 */
export async function updateMicroHubPouchLockBoxHandoffAPI(orderId, { microHubId, pouchBarcode, compartmentSlotNumber, carrierHandoffStatus, courierDepositBadgeId, lockerPasscodePin } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/micro-hub-pouch-handoff`, {
    method: "POST",
    body: JSON.stringify({ microHubId, pouchBarcode, compartmentSlotNumber, carrierHandoffStatus, courierDepositBadgeId, lockerPasscodePin }),
  });
  return result?.data || result;
}

/**
 * Automated Proof-of-Delivery NFC Smart Card Tapping & Geofenced Handshake (Feature 126)
 */
export async function verifyNfcGeofenceProofOfDeliveryAPI(orderId, { nfcCardUid, handshakeDistanceMeters, geofenceThresholdMeters, deviceReaderSerial, bypassOtpFallback } = {}) {
  const result = await apiRequest(`/api/orders/${orderId}/nfc-geofence-pod`, {
    method: "POST",
    body: JSON.stringify({ nfcCardUid, handshakeDistanceMeters, geofenceThresholdMeters, deviceReaderSerial, bypassOtpFallback }),
  });
  return result?.data || result;
}



















