/**
 * Opaque-Box API Client
 * Provides high-level client-facing methods for invoking endpoints.
 * In offline/contract mode, it dispatches to the ContractOracle.
 * In live mode (TEST_TARGET=live), it dispatches real HTTP requests to BASE_URL.
 */

import { oracle } from "./contractOracle.js";

const isLive = process.env.TEST_TARGET === "live";
const baseUrl = process.env.BASE_URL || "http://localhost:5000";

class ApiClient {
  constructor() {
    this.isLive = isLive;
    this.baseUrl = baseUrl;
    this.oracle = oracle;
  }

  resetOracle() {
    this.oracle.reset();
  }

  // --- Auth & RBAC ---
  async register(payload) {
    if (this.isLive) {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "REGISTER_FAILED");
      return data;
    }
    return this.oracle.registerUser(payload);
  }

  async login(payload) {
    if (this.isLive) {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "LOGIN_FAILED");
      return data;
    }
    return this.oracle.loginUser(payload);
  }

  async verifyToken(token) {
    return this.oracle.verifyToken(token);
  }

  // --- Shop Management ---
  async createShop(payload, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.createShop(payload, user);
  }

  async switchShop(shopId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.switchShop(shopId, user);
  }

  async updateShopProfile(shopId, updates, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.updateShopProfile(shopId, updates, user);
  }

  // --- Admin Moderation ---
  async moderateShop(shopId, status, token) {
    const adminUser = this.oracle.verifyToken(token);
    return this.oracle.moderateShop(shopId, status, adminUser);
  }

  async moderateUser(userId, status, token) {
    const adminUser = this.oracle.verifyToken(token);
    return this.oracle.moderateUser(userId, status, adminUser);
  }

  // --- Pricing & Vouchers ---
  async calculatePricing(payload) {
    return this.oracle.calculatePricing(payload);
  }

  // --- Order Lifecycle ---
  async createOrder(payload, token = null) {
    const user = token ? this.oracle.verifyToken(token) : null;
    return this.oracle.createOrder(payload, user);
  }

  async cancelOrder(orderId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.cancelOrder(orderId, user);
  }

  // --- AI Chatbot & Handover ---
  async initChatSession(sessionId = null, userId = "guest") {
    return this.oracle.initChatSession(sessionId, userId);
  }

  async sendChatMessage(sessionId, { text, voiceInput = false }) {
    return this.oracle.sendChatMessage(sessionId, { text, voiceInput });
  }

  async triggerHandover(sessionId) {
    return this.oracle.triggerHandover(sessionId);
  }

  async returnToAI(sessionId) {
    return this.oracle.returnToAI(sessionId);
  }

  // --- Post-Order: Returns & Invoices ---
  async requestReturn(payload, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.requestReturn(payload, user);
  }

  async moderateReturn(returnId, decision, token, adminResolution = null) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.moderateReturn(returnId, decision, user, adminResolution);
  }

  async getVATInvoice(orderId) {
    return this.oracle.getVATInvoice(orderId);
  }

  // --- Gamification: Coins & Wheel ---
  async checkinDailyStreak(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.checkinDailyStreak(user);
  }

  async spinLuckyWheel(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.spinLuckyWheel(user);
  }

  // --- Logistics & Tracking ---
  async getSPXTracking(orderId) {
    return this.oracle.getSPXTracking(orderId);
  }

  async getGPSMapSimulation(orderId) {
    return this.oracle.getGPSMapSimulation(orderId);
  }

  async generateShippingLabel(orderId, token) {
    const seller = this.oracle.verifyToken(token);
    return this.oracle.generateShippingLabel(orderId, seller);
  }

  // --- Catalog & Moderation ---
  async createProduct(payload, token) {
    const seller = this.oracle.verifyToken(token);
    return this.oracle.createProduct(payload, seller);
  }

  async moderateProduct(productId, status, token) {
    const admin = this.oracle.verifyToken(token);
    return this.oracle.moderateProduct(productId, status, admin);
  }

  async getStorefrontProducts(filters = {}) {
    return this.oracle.getStorefrontProducts(filters);
  }

  async validateImageUpload(file) {
    return this.oracle.validateImageUpload(file);
  }

  // --- Performance & Quality ---
  async getBundleMetrics() {
    return this.oracle.getBundleMetrics();
  }

  // --- Buyer Experience (R1-R5) ---
  async addAddress(payload, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.addAddress(user.id, payload);
  }

  async getUserAddresses(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.getUserAddresses(user.id);
  }

  async updateAddress(addressId, updates, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.updateAddress(user.id, addressId, updates);
  }

  async deleteAddress(addressId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.deleteAddress(user.id, addressId);
  }

  async setDefaultAddress(addressId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.setDefaultAddress(user.id, addressId);
  }

  async submitReview(payload, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.submitReview(payload, user);
  }

  async getProductReviews(productId) {
    return this.oracle.getProductReviews(productId);
  }

  async repurchaseOrder(orderId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.repurchaseOrder(orderId, user);
  }

  async claimVoucher(voucherCode, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.claimVoucher(user.id, voucherCode);
  }

  async getUserClaimedVouchers(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.getUserClaimedVouchers(user.id);
  }

  async getOptimalVouchers(subtotal, token = null) {
    const user = token ? this.oracle.verifyToken(token) : null;
    return this.oracle.getOptimalVouchers(subtotal, user ? user.id : null);
  }

  async getCoinTransactions(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.getCoinTransactions(user.id);
  }

  async triggerNotification(payload, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.triggerNotification(user.id, payload);
  }

  async getUserNotifications(filter = "all", token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.getUserNotifications(user.id, filter);
  }

  async getUnreadNotificationCount(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.getUnreadNotificationCount(user.id);
  }

  async markNotificationAsRead(notifId, token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.markNotificationAsRead(user.id, notifId);
  }

  async markAllNotificationsAsRead(token) {
    const user = this.oracle.verifyToken(token);
    return this.oracle.markAllNotificationsAsRead(user.id);
  }
}

export const api = new ApiClient();
export default api;
