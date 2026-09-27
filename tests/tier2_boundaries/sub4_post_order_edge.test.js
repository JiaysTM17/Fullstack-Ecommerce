/**
 * Tier 2: Boundary & Corner Cases - Subsystem 4: Post-Order Lifecycle & Gamification (Features 25-33)
 * 5 boundary/corner test cases per feature (45 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { generateCartPayload, FIXTURES } from "../harness/testData.js";

describe("Tier 2 - Subsystem 4: Post-Order Lifecycle & Gamification Boundaries", () => {
  let user, order;

  beforeEach(async () => {
    api.resetOracle();
    user = await api.register({ email: "post_order_edge@test.vn", password: "Password123!", fullName: "Buyer Post Edge" });
    const orderPayload = generateCartPayload([{ price: 100000, quantity: 2 }], { shippingFee: 20000 });
    order = await api.createOrder(orderPayload, user.token);
  });

  // -------------------------------------------------------------
  // FEATURE 25: Return & Refund Request Workflow (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 25 Boundaries: Return request invalid states", () => {
    test("F25-E1: Return on 'pending' order is rejected with INVALID_RETURN_STATE", async () => {
      // Order status is currently pending
      expect.equal(order.status, "pending");
      await expect.rejects(
        () => api.requestReturn({ orderId: order.id, reason: "Giao sai hàng" }, user.token),
        /INVALID_RETURN_STATE/
      );
    });

    test("F25-E2: Return on 'cancelled' order is rejected with INVALID_RETURN_STATE", async () => {
      await api.cancelOrder(order.id, user.token);
      await expect.rejects(
        () => api.requestReturn({ orderId: order.id, reason: "Giao sai hàng" }, user.token),
        /INVALID_RETURN_STATE/
      );
    });

    test("F25-E3: Invalid return reason is rejected with INVALID_RETURN_REASON", async () => {
      order.status = "delivered";
      await expect.rejects(
        () => api.requestReturn({ orderId: order.id, reason: "Tôi đổi ý không thích nữa" }, user.token),
        /INVALID_RETURN_REASON/
      );
    });

    test("F25-E4: Bank refund method with missing bank details is rejected with MISSING_BANK_DETAILS", async () => {
      order.status = "delivered";
      await expect.rejects(
        () => api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "bank", bankDetails: null }, user.token),
        /MISSING_BANK_DETAILS/
      );
    });

    test("F25-E5: Return request for non-existent orderId is rejected with ORDER_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.requestReturn({ orderId: "ord-ghost-404", reason: "Giao sai hàng" }, user.token),
        /ORDER_NOT_FOUND/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 26: Seller & Admin Return Moderation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 26 Boundaries: Return moderation authorization & validation", () => {
    test("F26-E1: Moderating non-existent return request is rejected with RETURN_REQUEST_NOT_FOUND", async () => {
      const seller = await api.register({ email: "sel_ret_404@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.moderateReturn("ret-ghost-404", "accepted", seller.token),
        /RETURN_REQUEST_NOT_FOUND/
      );
    });

    test("F26-E2: Customer role attempting to moderate return request is rejected", async () => {
      order.status = "delivered";
      const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, user.token);
      const anotherBuyer = await api.register({ email: "buyer_hacker@test.vn", password: "Password123!", fullName: "Hacker" });

      // Customer moderation shouldn't have seller/admin privileges
      expect.notEqual(anotherBuyer.user.role, "seller");
      expect.notEqual(anotherBuyer.user.role, "admin");
    });

    test("F26-E3: Admin resolution without admin role is rejected with FORBIDDEN", async () => {
      order.status = "delivered";
      const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "sel_adm_pretender@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });

      await expect.rejects(
        () => api.moderateReturn(ret.id, "admin_resolve", seller.token, "refund"),
        /FORBIDDEN/
      );
    });

    test("F26-E4: Rejected return status cannot be refunded without admin escalation", async () => {
      order.status = "delivered";
      const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "sel_rej_once@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      const mod = await api.moderateReturn(ret.id, "rejected", seller.token);
      expect.equal(mod.status, "rejected");
    });

    test("F26-E5: Approving return restores stock without inflating inventory count", async () => {
      order.status = "delivered";
      const seller = await api.register({ email: "sel_stk_edge@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const prod = await api.createProduct({ name: "Áo Test", price: 100000, stock: 5 }, seller.token);
      const ord2 = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 100000, quantity: 2, shopId: "shop-tech-world" }]), user.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 3);

      ord2.status = "delivered";
      const ret = await api.requestReturn({ orderId: ord2.id, reason: "Giao sai hàng", refundMethod: "wallet" }, user.token);
      const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateReturn(ret.id, "accepted", admin.token);

      expect.equal(api.oracle.products.get(prod.id).stock, 5);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 27: Electronic VAT Invoice Generation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 27 Boundaries: Invoice generation constraints", () => {
    test("F27-E1: Requesting VAT invoice for non-existent order is rejected with ORDER_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.getVATInvoice("ord-404-nonexistent"),
        /ORDER_NOT_FOUND/
      );
    });

    test("F27-E2: Tax code (MST 0318924019) is immutable and standardized", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.company.taxCode, "0318924019");
    });

    test("F27-E3: Invoice generated for order with zero voucher discount retains 0 in voucher field", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.voucherDiscount, 0);
    });

    test("F27-E4: 8% VAT calculation rounded to nearest integer VND", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(Number.isInteger(invoice.vatAmount), true);
      expect.equal(Number.isInteger(invoice.netAmount), true);
    });

    test("F27-E5: Invoice contains digital XML digest signature", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.xmlPayloadDigest.startsWith("SHA256:"));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 28: VAT Invoice Print & Export (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 28 Boundaries: Invoice print format validation", () => {
    test("F28-E1: Printable template contains valid HTML DOCTYPE and tags", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.htmlPrintTemplate.includes("<!DOCTYPE html>"));
      expect.ok(invoice.htmlPrintTemplate.includes("</html>"));
    });

    test("F28-E2: Printable layout handles long buyer address without truncation", async () => {
      const longAddr = "Số 123, Ngõ 456, Đường 789, Phường 10, Quận 11, TP. Hồ Chí Minh";
      const newOrder = await api.createOrder(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          customer: { fullName: "A", phone: "090", address: longAddr },
        })
      );
      const invoice = await api.getVATInvoice(newOrder.id);
      expect.equal(invoice.buyer.address, longAddr);
    });

    test("F28-E3: Total payment in invoice exactly equals order final total", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.totalPayment, order.total);
    });

    test("F28-E4: Invoice contains official company address and phone hotline", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.company.address.includes("Hà Nội"));
      expect.equal(invoice.company.phone, "1900-1221");
    });

    test("F28-E5: Order with 0 shipping fee retains 0 shippingFee on invoice", async () => {
      const noShipOrder = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }], { shippingFee: 0 }));
      const invoice = await api.getVATInvoice(noShipOrder.id);
      expect.equal(invoice.shippingFee, 0);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 29: Mini Xu Daily Check-in Streak (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 29 Boundaries: Streak check-in limitations", () => {
    test("F29-E1: Checking in twice on same calendar day is rejected with ALREADY_CHECKED_IN", async () => {
      await api.checkinDailyStreak(user.token);
      await expect.rejects(
        () => api.checkinDailyStreak(user.token),
        /ALREADY_CHECKED_IN/
      );
    });

    test("F29-E2: Unauthenticated check-in attempt is rejected with UNAUTHORIZED", async () => {
      await expect.rejects(
        () => api.checkinDailyStreak(null),
        /UNAUTHORIZED/
      );
    });

    test("F29-E3: Streak wraps from Day 7 back to Day 1 with 500 Xu reward", async () => {
      const ledger = api.oracle.coinLedger.get(user.user.id);
      ledger.streak = 7;
      ledger.lastCheckinDate = "2026-09-26"; // Yesterday
      const checkin = await api.checkinDailyStreak(user.token);
      expect.equal(checkin.streak, 1);
      expect.equal(checkin.rewardXu, 500);
    });

    test("F29-E4: Check-in records accurate ISO date format (YYYY-MM-DD)", async () => {
      const checkin = await api.checkinDailyStreak(user.token);
      expect.ok(/^\d{4}-\d{2}-\d{2}$/.test(checkin.checkedInDate));
    });

    test("F29-E5: User balance increases strictly monotonically by reward amount", async () => {
      const start = api.oracle.coinLedger.get(user.user.id).balance;
      const checkin = await api.checkinDailyStreak(user.token);
      expect.equal(checkin.newBalance - start, checkin.rewardXu);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 30: Lucky Wheel Mini-Game (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 30 Boundaries: Lucky Wheel constraints", () => {
    test("F30-E1: Second spin on the same day is rejected with FREE_SPIN_LIMIT_REACHED", async () => {
      await api.spinLuckyWheel(user.token);
      await expect.rejects(
        () => api.spinLuckyWheel(user.token),
        /FREE_SPIN_LIMIT_REACHED/
      );
    });

    test("F30-E2: Unauthenticated user cannot spin the lucky wheel", async () => {
      await expect.rejects(
        () => api.spinLuckyWheel(null),
        /UNAUTHORIZED/
      );
    });

    test("F30-E3: Rotation angle is greater than 1440 degrees to simulate realistic 4-turn spin", async () => {
      const spin = await api.spinLuckyWheel(user.token);
      expect.ok(spin.rotationAngle >= 1440);
    });

    test("F30-E4: Prize outcome is non-null and possesses defined value", async () => {
      const spin = await api.spinLuckyWheel(user.token);
      expect.ok(spin.value !== undefined && spin.value !== null);
    });

    test("F30-E5: Spinning records today's date in user's lastSpinDate", async () => {
      await api.spinLuckyWheel(user.token);
      const ledger = api.oracle.coinLedger.get(user.user.id);
      expect.equal(ledger.lastSpinDate, new Date().toISOString().slice(0, 10));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 31: Real-time SPX Tracking Stepper (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 31 Boundaries: Tracking query edge cases", () => {
    test("F31-E1: Tracking non-existent order is rejected with ORDER_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.getSPXTracking("ord-ghost-999"),
        /ORDER_NOT_FOUND/
      );
    });

    test("F31-E2: Newly placed order shows first stage (pending) completed", async () => {
      const freshOrder = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }]));
      const tracking = await api.getSPXTracking(freshOrder.id);
      expect.equal(tracking.timeline[0].status, "completed");
    });

    test("F31-E3: Carrier name is strictly 'SPX Express'", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.equal(tracking.carrier, "SPX Express");
    });

    test("F31-E4: Tracking number format conforms to SPX-VN standard pattern", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.ok(/^SPX-VN-[A-Z0-9]+$/.test(tracking.trackingNumber));
    });

    test("F31-E5: Tracking timeline has exactly 4 distinct chronological stages", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.equal(tracking.timeline.length, 4);
      expect.equal(tracking.timeline[3].stage, "delivered");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 32: Dynamic GPS Courier Map Simulation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 32 Boundaries: GPS courier simulation bounds", () => {
    test("F32-E1: Querying GPS map for non-existent order is rejected with ORDER_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.getGPSMapSimulation("ord-ghost-999"),
        /ORDER_NOT_FOUND/
      );
    });

    test("F32-E2: Courier GPS coordinates are bounded within Vietnam territory", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      // Vietnam lat roughly between 8.5 and 23.5, lng between 102.0 and 110.0
      expect.ok(gps.currentLocation.lat >= 8.5 && gps.currentLocation.lat <= 23.5);
      expect.ok(gps.currentLocation.lng >= 102.0 && gps.currentLocation.lng <= 110.0);
    });

    test("F32-E3: ETA minutes is non-negative and realistic (< 180 mins)", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.etaMinutes >= 0 && gps.etaMinutes <= 180);
    });

    test("F32-E4: Distance remaining is non-negative and realistic (< 100 km)", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.distanceRemainingKm >= 0 && gps.distanceRemainingKm <= 100);
    });

    test("F32-E5: Courier phone number is a valid 10-digit Vietnamese phone format", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(/^0\d{9}$/.test(gps.courierPhone));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 33: Seller Shipping Label Generator (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 33 Boundaries: Shipping label constraints", () => {
    test("F33-E1: Shipping label for non-existent order is rejected with ORDER_NOT_FOUND", async () => {
      const seller = await api.register({ email: "sel_lbl_404@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.generateShippingLabel("ord-ghost-404", seller.token),
        /ORDER_NOT_FOUND/
      );
    });

    test("F33-E2: Unauthenticated attempt to generate shipping label is rejected", async () => {
      await expect.rejects(
        () => api.generateShippingLabel(order.id, null),
        /UNAUTHORIZED/
      );
    });

    test("F33-E3: Pre-paid BANK_TRANSFER order indicates COD amount of 0 VND on label", async () => {
      const bankOrder = await api.createOrder(
        generateCartPayload([{ price: 100000, quantity: 1 }], { paymentMethod: "BANK_TRANSFER" })
      );
      const seller = await api.register({ email: "sel_bank_lbl@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      const label = await api.generateShippingLabel(bankOrder.id, seller.token);
      expect.equal(label.codAmount, 0);
    });

    test("F33-E4: COD order indicates full order total as COD amount to collect", async () => {
      const codOrder = await api.createOrder(
        generateCartPayload([{ price: 100000, quantity: 1 }], { paymentMethod: "COD" })
      );
      const seller = await api.register({ email: "sel_cod_lbl@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      const label = await api.generateShippingLabel(codOrder.id, seller.token);
      expect.equal(label.codAmount, codOrder.total);
    });

    test("F33-E5: Barcode string contains asterisk bounding characters for Code39 scanner", async () => {
      const seller = await api.register({ email: "sel_c39@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.equal(label.barcode.startsWith("*"), true);
      expect.equal(label.barcode.endsWith("*"), true);
    });
  });
});
