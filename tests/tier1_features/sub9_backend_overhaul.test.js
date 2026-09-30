/**
 * Tier 1: Feature Coverage - Subsystem 9: Backend Full Overhaul (Features 52-56 / R1-R10)
 * 25 comprehensive test cases covering backend enterprise enhancements:
 *   - Feature 52 (R1): Middleware Layer & Security Helpers (Rate Limiter, Validator, Request Logger, Error Handler)
 *   - Feature 53 (R2): Enhanced Authentication & Credential Management (Change Password, Forgot/Reset, Refresh Token)
 *   - Feature 54 (R3): Complete Order Lifecycle State Machine (Pending -> Confirmed -> Shipping -> Delivered -> Completed & Stats/Search)
 *   - Feature 55 (R4, R5): Advanced Product Discovery & Cart Intelligence (Related, Best-Sellers, New Arrivals, Flash Sale, Voucher Preview)
 *   - Feature 56 (R6-R10): Wishlist, Admin/Seller Dashboards & Review Replies (Wishlist CRUD, Dashboards, Review Interaction)
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload, createRandomEmail } from "../harness/testData.js";
import { isValidEmail, isValidVietnamesePhone, sanitizeString, validateStrongPassword } from "../../server/src/middlewares/validator.js";

describe("Tier 1 - Subsystem 9: Backend Full Overhaul (Features 52-56)", { tier: "tier1", subsystem: "sub9" }, () => {
  let buyer, seller, admin;

  beforeEach(async () => {
    api.resetOracle();
    buyer = await api.register({
      email: createRandomEmail("buyer_bo"),
      password: "Password123!",
      fullName: "Nguyễn Văn Backend",
      role: "customer",
    });
    seller = await api.register({
      email: createRandomEmail("seller_bo"),
      password: "Password123!",
      fullName: "Chủ Gian Hàng Pro",
      role: "seller",
    });
    await api.createShop(FIXTURES.shops.shopFashion, seller.token);
    admin = await api.login({
      email: "admin@shopee.enterprise.vn",
      password: "mock-hash-admin",
    });

    const p1 = await api.createProduct(FIXTURES.products.phoneCase, seller.token);
    await api.moderateProduct(p1.id, "approved", admin.token);

    const p2 = await api.createProduct(FIXTURES.products.poloShirt, seller.token);
    await api.moderateProduct(p2.id, "approved", admin.token);
  });

  // =========================================================================
  // FEATURE 52: Middleware & Security Validation Layer (R1) - 5 Tests
  // =========================================================================
  describe("Feature 52: Middleware & Input Validation Security Layer (R1)", () => {
    test("F52-T1: Email validation correctly accepts valid formats and rejects invalid formats", () => {
      expect.equal(isValidEmail("user@example.com"), true);
      expect.equal(isValidEmail("test.student@univ.edu.vn"), true);
      expect.equal(isValidEmail("invalid-email"), false);
      expect.equal(isValidEmail("@missingusername.com"), false);
      expect.equal(isValidEmail(""), false);
    });

    test("F52-T2: Vietnamese phone validation strictly enforces 10 digits starting with 0", () => {
      expect.equal(isValidVietnamesePhone("0912345678"), true);
      expect.equal(isValidVietnamesePhone("0389998888"), true);
      expect.equal(isValidVietnamesePhone("1234567890"), false); // Doesn't start with 0
      expect.equal(isValidVietnamesePhone("091234567"), false);  // Only 9 digits
      expect.equal(isValidVietnamesePhone("09123456789"), false); // 11 digits
    });

    test("F52-T3: SanitizeString neutralizes embedded HTML tags and script injections", () => {
      const dirty = "<script>alert('xss')</script><b>Sản phẩm tốt</b>";
      const clean = sanitizeString(dirty);
      expect.equal(clean.includes("<script>"), false);
      expect.equal(clean.includes("<b>"), false);
      expect.equal(clean.includes("Sản phẩm tốt"), true);
    });

    test("F52-T4: Strong password policy enforces min 8 chars with uppercase and numeric requirements", () => {
      expect.equal(validateStrongPassword("Short1").valid, false);
      expect.equal(validateStrongPassword("alllowercase123").valid, false);
      expect.equal(validateStrongPassword("ALLUPPERCASE123").valid, true);
      expect.equal(validateStrongPassword("NoNumbersHere!").valid, false);
      expect.equal(validateStrongPassword("SecurePass2026!").valid, true);
    });

    test("F52-T5: Password validation returns informative error messages for end users", () => {
      const res = validateStrongPassword("weak");
      expect.equal(res.valid, false);
      expect.ok(res.message.length > 0);
    });
  });

  // =========================================================================
  // FEATURE 53: Enhanced Authentication & Credential Management (R2) - 5 Tests
  // =========================================================================
  describe("Feature 53: Enhanced Authentication & Credential Management (R2)", () => {
    test("F53-T1: Authenticated user can change password with compliant new password", async () => {
      const res = await api.changePassword("Password123!", "NewSecret2026!", buyer.token);
      expect.equal(res.success, true);
      expect.ok(res.message.includes("thành công"));
    });

    test("F53-T2: Changing password with weak password fails validation", async () => {
      let failed = false;
      try {
        await api.changePassword("Password123!", "123", buyer.token);
      } catch (err) {
        failed = true;
        expect.ok(err.message.includes("WEAK_NEW_PASSWORD"));
      }
      expect.equal(failed, true);
    });

    test("F53-T3: Forgot password issues a recovery reset code for registered email", async () => {
      const res = await api.forgotPassword(buyer.user.email);
      expect.equal(res.success, true);
      expect.ok(res.resetCode);
    });

    test("F53-T4: Reset password with valid code successfully updates user credentials", async () => {
      const forgotRes = await api.forgotPassword(buyer.user.email);
      const resetRes = await api.resetPassword(buyer.user.email, forgotRes.resetCode, "BrandNew2026!");
      expect.equal(resetRes.success, true);
      expect.ok(resetRes.message.includes("thành công"));
    });

    test("F53-T5: Refresh token generates a new valid authentication session token", async () => {
      const res = await api.refreshToken(buyer.token);
      expect.equal(res.success, true);
      expect.ok(res.token);
      expect.ok(res.token !== buyer.token);
    });
  });

  // =========================================================================
  // FEATURE 54: Order Lifecycle State Machine & Analytics (R3) - 5 Tests
  // =========================================================================
  describe("Feature 54: Complete Order Lifecycle Transitions & Search (R3)", () => {
    test("F54-T1: Seller can transition pending order to confirmed state", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 200000, quantity: 1 }]), buyer.token);
      expect.equal(order.status, "pending");

      const confirmed = await api.confirmOrder(order.id, seller.token);
      expect.equal(confirmed.status, "confirmed");
      expect.ok(confirmed.confirmedAt);
    });

    test("F54-T2: Confirmed order advances to shipping state upon carrier dispatch", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      await api.confirmOrder(order.id, seller.token);
      const shipped = await api.shipOrder(order.id, seller.token);

      expect.equal(shipped.status, "shipping");
      expect.ok(shipped.shippedAt);
    });

    test("F54-T3: Buyer marks shipping order as delivered upon receiving parcel", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      await api.confirmOrder(order.id, seller.token);
      await api.shipOrder(order.id, seller.token);
      const delivered = await api.deliverOrder(order.id, buyer.token);

      expect.equal(delivered.status, "delivered");
      expect.ok(delivered.deliveredAt);
    });

    test("F54-T4: Delivered order transitions to completed status finalizing transaction", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      await api.confirmOrder(order.id, seller.token);
      await api.shipOrder(order.id, seller.token);
      await api.deliverOrder(order.id, buyer.token);
      const completed = await api.completeOrder(order.id, admin.token);

      expect.equal(completed.status, "completed");
      expect.ok(completed.completedAt);
    });

    test("F54-T5: Order stats endpoint summarizes order counts and aggregate revenue", async () => {
      await api.createOrder(generateCartPayload([{ price: 300000, quantity: 1 }]), buyer.token);
      const stats = await api.getOrderStats(admin.token);

      expect.ok(stats.totalOrders >= 1);
      expect.ok(stats.statusBreakdown);
      expect.ok(typeof stats.totalRevenue === "number");
    });
  });

  // =========================================================================
  // FEATURE 55: Product Intelligence & Cart Preview (R4, R5) - 5 Tests
  // =========================================================================
  describe("Feature 55: Product Discovery & Cart Voucher Preview (R4, R5)", () => {
    test("F55-T1: GetRelatedProducts returns items sharing identical category while excluding self", async () => {
      const products = await api.getProducts();
      if (products.length > 0) {
        const target = products[0];
        const related = await api.getRelatedProducts(target.id || target._id);
        expect.equal(Array.isArray(related), true);
        const selfIncluded = related.some((p) => (p.id || p._id) === (target.id || target._id));
        expect.equal(selfIncluded, false);
      }
    });

    test("F55-T2: GetBestSellers sorts products by descending sales volume", async () => {
      const bestSellers = await api.getBestSellers(5);
      expect.ok(Array.isArray(bestSellers));
      if (bestSellers.length >= 2) {
        expect.ok((bestSellers[0].sold || 0) >= (bestSellers[1].sold || 0));
      }
    });

    test("F55-T3: GetFlashSale returns items with active discount percentage", async () => {
      const flashSale = await api.getFlashSale(10);
      expect.ok(Array.isArray(flashSale));
      for (const item of flashSale) {
        expect.ok(item.originalPrice > item.price);
        expect.ok(item.discountPercent > 0);
      }
    });

    test("F55-T4: Product review stats aggregates star ratings breakdown accurately", async () => {
      const products = await api.getProducts();
      if (products.length > 0) {
        const target = products[0];
        const stats = await api.getProductReviewStats(target.id || target._id);
        expect.equal(stats.productId, target.id || target._id);
        expect.ok(stats.ratingBreakdown);
        expect.ok(stats.ratingBreakdown[5] !== undefined);
      }
    });

    test("F55-T5: PreviewCartVoucher computes exact discount without finalizing order", async () => {
      const preview = await api.previewCartVoucher("FREESHIP15K", 200000, buyer.token);
      expect.equal(preview.voucherCode, "FREESHIP15K");
      expect.equal(preview.discountAmount, 15000);
      expect.equal(preview.finalTotal, 185000);
    });
  });

  // =========================================================================
  // FEATURE 56: Wishlist, Notifications & Seller Dashboard (R6-R10) - 5 Tests
  // =========================================================================
  describe("Feature 56: Wishlist Management, Dashboards & Review Interaction (R6-R10)", () => {
    test("F56-T1: Buyer can add product to wishlist and query current wishlist items", async () => {
      const products = await api.getProducts();
      const targetId = products[0].id || products[0].subId || products[0]._id;

      const addRes = await api.addToWishlist(targetId, buyer.token);
      expect.equal(addRes.success, true);

      const check = await api.checkWishlist(targetId, buyer.token);
      expect.equal(check.isInWishlist, true);

      const wishlist = await api.getWishlist(buyer.token);
      expect.ok(wishlist.items.length >= 1);
    });

    test("F56-T2: Buyer can remove product from wishlist or clear entirely", async () => {
      const products = await api.getProducts();
      const targetId = products[0].id || products[0].subId || products[0]._id;

      await api.addToWishlist(targetId, buyer.token);
      const removeRes = await api.removeFromWishlist(targetId, buyer.token);
      expect.equal(removeRes.success, true);

      const check = await api.checkWishlist(targetId, buyer.token);
      expect.equal(check.isInWishlist, false);
    });

    test("F56-T3: Admin dashboard consolidates system-wide key metrics", async () => {
      const dashboard = await api.getAdminDashboard(admin.token);
      expect.ok(dashboard.totalUsers >= 1);
      expect.ok(dashboard.revenue);
      expect.ok(dashboard.revenue.total >= 0);
    });

    test("F56-T4: Seller dashboard aggregates shop specific order & product metrics", async () => {
      const sellerDash = await api.getSellerDashboard(seller.user.shopId || "shop-fashion", seller.token);
      expect.ok(sellerDash.metrics);
      expect.ok(sellerDash.metrics.totalProducts !== undefined);
      expect.ok(sellerDash.metrics.avgRating !== undefined);
    });

    test("F56-T5: Seller can submit a reply to buyer product review and mark reviews as helpful", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }]), buyer.token);
      await api.confirmOrder(order.id, seller.token);
      await api.shipOrder(order.id, seller.token);
      await api.deliverOrder(order.id, buyer.token);
      const prodId = order.items[0].productId;

      const reviewRes = await api.submitReview({
        orderId: order.id,
        productId: prodId,
        rating: 5,
        comment: "Sản phẩm chất lượng cao!",
      }, buyer.token);

      const revId = reviewRes.review.id || reviewRes.review._id;

      const replyRes = await api.replyToReview(prodId, revId, {
        content: "Cảm ơn bạn đã ủng hộ shop!",
        author: "Chủ shop",
      }, seller.token);

      expect.ok(replyRes.reply);
      expect.equal(replyRes.reply.content, "Cảm ơn bạn đã ủng hộ shop!");

      const helpfulRes = await api.markReviewHelpful(prodId, revId);
      expect.ok(helpfulRes.helpfulCount >= 1);
    });
  });
});
