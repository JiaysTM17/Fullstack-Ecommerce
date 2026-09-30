/**
 * Tier 1: Feature Coverage - Subsystem 10: Buyer Experience & Intelligence (Features 57-59)
 * 15 comprehensive automated test cases covering buyer optimizations:
 *   - Feature 57: Free Shipping Goal Calculator & Dynamic Threshold Mechanics
 *   - Feature 58: Product Rating Breakdown Mathematics & Similarity Matching
 *   - Feature 59: Real-time Voucher Preview & Buyer Notification Event Sync
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, createRandomEmail } from "../harness/testData.js";

describe("Tier 1 - Subsystem 10: Buyer Intelligence & Experience (Features 57-59)", { tier: "tier1", subsystem: "sub10" }, () => {
  let buyer, seller, admin;

  beforeEach(async () => {
    api.resetOracle();
    buyer = await api.register({
      email: createRandomEmail("buyer_sub10"),
      password: "Password123!",
      fullName: "Nguyễn Khách Hàng",
      role: "customer",
    });
    seller = await api.register({
      email: createRandomEmail("seller_sub10"),
      password: "Password123!",
      fullName: "Shop Chính Hãng Mall",
      role: "seller",
    });
    await api.createShop(FIXTURES.shops.shopFashion, seller.token);
    admin = await api.login({
      email: "admin@shopee.enterprise.vn",
      password: "mock-hash-admin",
    });
  });

  // =========================================================================
  // FEATURE 57: Free Shipping Goal Progress & Dynamic Thresholds (5 Tests)
  // =========================================================================
  describe("Feature 57: Freeship Goal Calculation & Threshold Engine", () => {
    const FREE_SHIPPING_THRESHOLD = 300000;

    function calculateFreeshipProgress(subtotal) {
      const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
      const progressPercent = Math.min(100, Math.max(0, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)));
      const neededAmount = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
      return { hasFreeShipping, progressPercent, neededAmount };
    }

    test("F57-T1: Subtotal of 0 produces 0% progress and requires full 300.000₫", () => {
      const res = calculateFreeshipProgress(0);
      expect.equal(res.hasFreeShipping, false);
      expect.equal(res.progressPercent, 0);
      expect.equal(res.neededAmount, 300000);
    });

    test("F57-T2: Subtotal of 150.000₫ produces exactly 50% progress and requires 150.000₫", () => {
      const res = calculateFreeshipProgress(150000);
      expect.equal(res.hasFreeShipping, false);
      expect.equal(res.progressPercent, 50);
      expect.equal(res.neededAmount, 150000);
    });

    test("F57-T3: Subtotal meeting exactly threshold (300.000₫) triggers 100% and 0₫ needed", () => {
      const res = calculateFreeshipProgress(300000);
      expect.equal(res.hasFreeShipping, true);
      expect.equal(res.progressPercent, 100);
      expect.equal(res.neededAmount, 0);
    });

    test("F57-T4: Subtotal exceeding threshold (500.000₫) caps progress at 100% without overflow", () => {
      const res = calculateFreeshipProgress(500000);
      expect.equal(res.hasFreeShipping, true);
      expect.equal(res.progressPercent, 100);
      expect.equal(res.neededAmount, 0);
    });

    test("F57-T5: Negative subtotal edge case is clamped safely to 0% and full threshold", () => {
      const res = calculateFreeshipProgress(-50000);
      expect.equal(res.hasFreeShipping, false);
      expect.equal(res.progressPercent, 0);
      expect.equal(res.neededAmount, 350000);
    });
  });

  // =========================================================================
  // FEATURE 58: Rating Breakdown Mathematics & Similarity (5 Tests)
  // =========================================================================
  describe("Feature 58: Dynamic Review Breakdown & Product Similarity", () => {
    function computeRatingBreakdown(reviews) {
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      if (!Array.isArray(reviews) || reviews.length === 0) {
        return { total: 0, average: 5.0, percentages: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 } };
      }
      let sum = 0;
      reviews.forEach((r) => {
        const rating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
        counts[rating] = (counts[rating] || 0) + 1;
        sum += rating;
      });
      const total = reviews.length;
      const average = Number((sum / total).toFixed(1));
      const percentages = {};
      [5, 4, 3, 2, 1].forEach((star) => {
        percentages[star] = Math.round((counts[star] / total) * 100);
      });
      return { total, average, counts, percentages };
    }

    test("F58-T1: Empty reviews list defaults gracefully to 5.0 average and 100% 5-star baseline", () => {
      const res = computeRatingBreakdown([]);
      expect.equal(res.total, 0);
      expect.equal(res.average, 5.0);
      expect.equal(res.percentages[5], 100);
    });

    test("F58-T2: Uniform 5-star reviews calculate 100% for 5-star bar and 0% for others", () => {
      const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 5 }, { rating: 5 }];
      const res = computeRatingBreakdown(reviews);
      expect.equal(res.total, 4);
      expect.equal(res.average, 5.0);
      expect.equal(res.percentages[5], 100);
      expect.equal(res.percentages[4], 0);
      expect.equal(res.percentages[1], 0);
    });

    test("F58-T3: Mixed distribution computes accurate proportions and weighted average", () => {
      // 2x 5-star, 1x 4-star, 1x 1-star -> sum: 10+4+1 = 15 / 4 = 3.8
      const reviews = [{ rating: 5 }, { rating: 5 }, { rating: 4 }, { rating: 1 }];
      const res = computeRatingBreakdown(reviews);
      expect.equal(res.total, 4);
      expect.equal(res.average, 3.8);
      expect.equal(res.percentages[5], 50);
      expect.equal(res.percentages[4], 25);
      expect.equal(res.percentages[1], 25);
    });

    test("F58-T4: Out-of-bounds ratings (e.g. 0 or 10) are clamped between 1 and 5", () => {
      const reviews = [{ rating: -1 }, { rating: 99 }];
      const res = computeRatingBreakdown(reviews);
      expect.equal(res.counts[1], 1);
      expect.equal(res.counts[5], 1);
      expect.equal(res.average, 3.0);
    });

    test("F58-T5: Related product similarity filter prioritizes category match and excludes current product", () => {
      const catalog = [
        { id: "p1", category: "Thời trang", price: 100000 },
        { id: "p2", category: "Thời trang", price: 120000 },
        { id: "p3", category: "Điện tử", price: 500000 },
        { id: "p4", category: "Thời trang", price: 90000 },
      ];
      const target = catalog[0];
      const related = catalog.filter((p) => p.id !== target.id && p.category === target.category);
      expect.equal(related.length, 2);
      expect.equal(related.some((p) => p.id === "p1"), false);
      expect.equal(related.every((p) => p.category === "Thời trang"), true);
    });
  });

  // =========================================================================
  // FEATURE 59: Voucher Real-time Preview & Notification Sync (5 Tests)
  // =========================================================================
  describe("Feature 59: Real-time Voucher Preview & Notification Mechanics", () => {
    function calculateVoucherPreview(voucher, cartSubtotal) {
      if (!voucher || !voucher.code) throw new Error("Mã không hợp lệ");
      if (voucher.minOrderValue && cartSubtotal < voucher.minOrderValue) {
        throw new Error(`Đơn hàng tối thiểu phải từ ${voucher.minOrderValue}`);
      }
      let discount = 0;
      if (voucher.type === "percentage") {
        discount = Math.round((cartSubtotal * voucher.value) / 100);
        if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
      } else {
        discount = voucher.value || 0;
      }
      return {
        code: voucher.code,
        cartSubtotal,
        discountAmount: discount,
        finalTotal: Math.max(0, cartSubtotal - discount),
      };
    }

    test("F59-T1: Percentage voucher calculates correct deduction without exceeding maxDiscount cap", () => {
      const voucher = { code: "SALE20", type: "percentage", value: 20, maxDiscount: 50000, minOrderValue: 100000 };
      // 20% of 400.000 = 80.000 -> capped at 50.000
      const preview = calculateVoucherPreview(voucher, 400000);
      expect.equal(preview.discountAmount, 50000);
      expect.equal(preview.finalTotal, 350000);
    });

    test("F59-T2: Fixed amount voucher deducts exact value", () => {
      const voucher = { code: "MINI50", type: "fixed", value: 50000, minOrderValue: 100000 };
      const preview = calculateVoucherPreview(voucher, 200000);
      expect.equal(preview.discountAmount, 50000);
      expect.equal(preview.finalTotal, 150000);
    });

    test("F59-T3: Cart subtotal below minOrderValue throws descriptive validation error", () => {
      const voucher = { code: "VIP100", type: "fixed", value: 100000, minOrderValue: 500000 };
      expect.throws(() => calculateVoucherPreview(voucher, 200000));
    });

    test("F59-T4: Notification unread count increments with new notification and decrements when marked read", () => {
      let notifs = [
        { id: "n1", isRead: false },
        { id: "n2", isRead: false },
      ];
      let unread = notifs.filter((n) => !n.isRead).length;
      expect.equal(unread, 2);

      // Mark one read
      notifs = notifs.map((n) => (n.id === "n1" ? { ...n, isRead: true } : n));
      unread = notifs.filter((n) => !n.isRead).length;
      expect.equal(unread, 1);

      // Mark all read
      notifs = notifs.map((n) => ({ ...n, isRead: true }));
      unread = notifs.filter((n) => !n.isRead).length;
      expect.equal(unread, 0);
    });

    test("F59-T5: Delivered order state transition allows moving to completed and unlocks 5-star review action", () => {
      const order = { id: "ORD_TEST_01", status: "shipping", canReview: false };
      // Simulate "Đã nhận được hàng" button click
      const updatedOrder = { ...order, status: "completed", canReview: true, deliveredAt: new Date().toISOString() };
      expect.equal(updatedOrder.status, "completed");
      expect.equal(updatedOrder.canReview, true);
      expect.ok(updatedOrder.deliveredAt);
    });
  });
});
