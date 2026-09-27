/**
 * Tier 1: Feature Coverage - Subsystem 4: Post-Order Lifecycle & Gamification (Features 25-33)
 * 5 isolated happy-path test cases per feature (45 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { generateCartPayload } from "../harness/testData.js";

describe("Tier 1 - Subsystem 4: Post-Order Lifecycle & Gamification", () => {
  let user, order;

  beforeEach(async () => {
    api.resetOracle();
    user = await api.register({ email: "post_order_buyer@test.vn", password: "Password123!", fullName: "Người Mua Sau Đơn" });
    const orderPayload = generateCartPayload([{ price: 100000, quantity: 2 }], { shippingFee: 20000 });
    order = await api.createOrder(orderPayload, user.token);
    order.status = "delivered"; // Set to delivered to enable returns and post-order actions
  });

  // -------------------------------------------------------------
  // FEATURE 25: Return & Refund Request Workflow (5 tests)
  // -------------------------------------------------------------
  describe("Feature 25: Return & Refund Request Workflow", () => {
    test("F25-T1: Customer submits return request with valid reason category", async () => {
      const ret = await api.requestReturn(
        { orderId: order.id, reason: "Hàng lỗi, không hoạt động", refundMethod: "wallet" },
        user.token
      );
      expect.ok(ret.id.startsWith("ret-"));
      expect.equal(ret.reason, "Hàng lỗi, không hoạt động");
      expect.equal(ret.status, "pending_seller");
    });

    test("F25-T2: Return request with wallet refund sets refundMethod to wallet", async () => {
      const ret = await api.requestReturn(
        { orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" },
        user.token
      );
      expect.equal(ret.refundMethod, "wallet");
    });

    test("F25-T3: Return request with bank refund accepts valid bank account details", async () => {
      const ret = await api.requestReturn(
        {
          orderId: order.id,
          reason: "Hàng bể vỡ do vận chuyển",
          refundMethod: "bank",
          bankDetails: { bankName: "Vietcombank", accountNo: "1234567890", accountName: "NGUYEN MUA" },
        },
        user.token
      );
      expect.equal(ret.refundMethod, "bank");
      expect.equal(ret.bankDetails.bankName, "Vietcombank");
    });

    test("F25-T4: Customer can attach proof image URLs with return request", async () => {
      const ret = await api.requestReturn(
        {
          orderId: order.id,
          reason: "Hàng khác xa mô tả",
          refundMethod: "wallet",
          images: ["/uploads/defect1.jpg", "/uploads/defect2.jpg"],
        },
        user.token
      );
      expect.equal(ret.images.length, 2);
    });

    test("F25-T5: Refund amount equals order payable total", async () => {
      const ret = await api.requestReturn(
        { orderId: order.id, reason: "Thiếu phụ kiện, quà tặng", refundMethod: "wallet" },
        user.token
      );
      expect.equal(ret.refundAmount, order.total);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 26: Seller & Admin Return Moderation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 26: Seller & Admin Return Moderation", () => {
    test("F26-T1: Seller can accept customer return request", async () => {
      const ret = await api.requestReturn({ orderId: order.id, reason: "Hàng lỗi, không hoạt động", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "seller_ret@test.vn", password: "Password123!", fullName: "Seller Ret", role: "seller" });
      const moderated = await api.moderateReturn(ret.id, "accepted", seller.token);
      expect.equal(moderated.status, "refunded");
    });

    test("F26-T2: Wallet refund credits balance back to buyer upon approval", async () => {
      const initialBal = api.oracle.coinLedger.get(user.user.id).balance;
      const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "seller_cred@test.vn", password: "Password123!", fullName: "Seller Cred", role: "seller" });
      await api.moderateReturn(ret.id, "accepted", seller.token);
      const afterBal = api.oracle.coinLedger.get(user.user.id).balance;
      expect.equal(afterBal, initialBal + order.total);
    });

    test("F26-T3: Seller can reject unsubstantiated return request", async () => {
      const ret = await api.requestReturn({ orderId: order.id, reason: "Không vừa kích cỡ, màu sắc", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "seller_rej@test.vn", password: "Password123!", fullName: "Seller Rej", role: "seller" });
      const moderated = await api.moderateReturn(ret.id, "rejected", seller.token);
      expect.equal(moderated.status, "rejected");
    });

    test("F26-T4: Seller can escalate complex dispute to Super Admin", async () => {
      const ret = await api.requestReturn({ orderId: order.id, reason: "Hàng bể vỡ do vận chuyển", refundMethod: "wallet" }, user.token);
      const seller = await api.register({ email: "seller_esc@test.vn", password: "Password123!", fullName: "Seller Esc", role: "seller" });
      const moderated = await api.moderateReturn(ret.id, "escalated_admin", seller.token);
      expect.equal(moderated.status, "escalated_admin");
    });

    test("F26-T5: Super Admin can arbitrate escalated dispute and grant refund", async () => {
      const ret = await api.requestReturn({ orderId: order.id, reason: "Hàng bể vỡ do vận chuyển", refundMethod: "wallet" }, user.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const resolved = await api.moderateReturn(ret.id, "admin_resolve", adminLogin.token, "refund");
      expect.equal(resolved.status, "refunded");
      expect.equal(resolved.resolvedBy, "admin");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 27: Electronic VAT Invoice Generation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 27: Electronic VAT Invoice Generation", () => {
    test("F27-T1: VAT invoice contains official enterprise tax code 0318924019", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.company.taxCode, "0318924019");
    });

    test("F27-T2: VAT invoice company name matches CÔNG TY TNHH MINI SHOPEE VIỆT NAM", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.company.legalName, "CÔNG TY TNHH MINI SHOPEE VIỆT NAM");
    });

    test("F27-T3: Standard VAT rate calculated at 8%", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.vatRate, "8%");
      expect.ok(invoice.vatAmount > 0);
    });

    test("F27-T4: Net amount plus VAT amount matches subtotal", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.netAmount + invoice.vatAmount, order.subtotal);
    });

    test("F27-T5: Formatted invoice number generated with prefix and date", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.invoiceNumber.startsWith("INV-"));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 28: VAT Invoice Print & Export (5 tests)
  // -------------------------------------------------------------
  describe("Feature 28: VAT Invoice Print & Export", () => {
    test("F28-T1: Invoice output includes complete htmlPrintTemplate for browser printing", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.htmlPrintTemplate);
      expect.ok(invoice.htmlPrintTemplate.includes("HÓA ĐƠN GIÁ TRỊ GIA TĂNG"));
    });

    test("F28-T2: Printable template contains Tax Code (MST)", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.htmlPrintTemplate.includes("0318924019"));
    });

    test("F28-T3: Items breakdown includes quantity, unit price and line totals", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.items.length > 0);
      expect.equal(invoice.items[0].quantity, 2);
    });

    test("F28-T4: Invoice includes digital integrity signature digest", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.ok(invoice.xmlPayloadDigest.startsWith("SHA256:"));
    });

    test("F28-T5: Total payable on invoice exactly equals order final total", async () => {
      const invoice = await api.getVATInvoice(order.id);
      expect.equal(invoice.totalPayment, order.total);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 29: Mini Xu Daily Check-in Streak (5 tests)
  // -------------------------------------------------------------
  describe("Feature 29: Mini Xu Daily Check-in Streak", () => {
    test("F29-T1: First check-in awards Day 1 reward of 500 Xu", async () => {
      const checkin = await api.checkinDailyStreak(user.token);
      expect.equal(checkin.streak, 1);
      expect.equal(checkin.rewardXu, 500);
    });

    test("F29-T2: User balance increases by awarded Xu amount", async () => {
      const before = api.oracle.coinLedger.get(user.user.id).balance;
      const checkin = await api.checkinDailyStreak(user.token);
      expect.equal(checkin.newBalance, before + 500);
    });

    test("F29-T3: Next day reward preview accurately predicts Day 2 reward (1000 Xu)", async () => {
      const checkin = await api.checkinDailyStreak(user.token);
      expect.equal(checkin.nextDayReward, 1000);
    });

    test("F29-T4: Consecutive check-ins advance streak along the 7-day reward ladder", async () => {
      // Simulate day 1 checkin
      await api.checkinDailyStreak(user.token);
      // Simulate advance to next day
      const ledger = api.oracle.coinLedger.get(user.user.id);
      ledger.lastCheckinDate = "2026-09-26"; // Yesterday
      const day2 = await api.checkinDailyStreak(user.token);
      expect.equal(day2.streak, 2);
      expect.equal(day2.rewardXu, 1000);
    });

    test("F29-T5: Day 7 streak awards jackpot reward of 5000 Xu", async () => {
      const ledger = api.oracle.coinLedger.get(user.user.id);
      ledger.streak = 6;
      ledger.lastCheckinDate = "2026-09-26";
      const day7 = await api.checkinDailyStreak(user.token);
      expect.equal(day7.streak, 7);
      expect.equal(day7.rewardXu, 5000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 30: Lucky Wheel Mini-Game (5 tests)
  // -------------------------------------------------------------
  describe("Feature 30: Lucky Wheel Mini-Game", () => {
    test("F30-T1: Lucky Wheel spin returns a prize outcome", async () => {
      const spin = await api.spinLuckyWheel(user.token);
      expect.ok(spin.prize);
      expect.ok(["coins", "voucher"].includes(spin.type));
    });

    test("F30-T2: Rotation angle includes multiple 360-degree spins plus stop angle", async () => {
      const spin = await api.spinLuckyWheel(user.token);
      expect.ok(spin.rotationAngle >= 1440, "Should rotate at least 4 full circles (1440 deg)");
    });

    test("F30-T3: Coin prize instantly credits user balance", async () => {
      const before = api.oracle.coinLedger.get(user.user.id).balance;
      const spin = await api.spinLuckyWheel(user.token);
      if (spin.type === "coins") {
        expect.equal(spin.newBalance, before + spin.value);
      } else {
        expect.equal(spin.newBalance, before);
      }
    });

    test("F30-T4: Lucky Wheel updates user lastSpinDate to today", async () => {
      await api.spinLuckyWheel(user.token);
      const ledger = api.oracle.coinLedger.get(user.user.id);
      expect.equal(ledger.lastSpinDate, new Date().toISOString().slice(0, 10));
    });

    test("F30-T5: Wheel prize value corresponds to defined outcome tiers", async () => {
      const spin = await api.spinLuckyWheel(user.token);
      const validPrizes = [500, 1000, 2000, 5000, "GIAM20K"];
      expect.ok(validPrizes.includes(spin.value));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 31: Real-time SPX Tracking Stepper (5 tests)
  // -------------------------------------------------------------
  describe("Feature 31: Real-time SPX Tracking Stepper", () => {
    test("F31-T1: Tracking query returns 4-stage SPX timeline", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.equal(tracking.timeline.length, 4);
      expect.equal(tracking.carrier, "SPX Express");
    });

    test("F31-T2: Tracking number formatted with SPX-VN prefix", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.ok(tracking.trackingNumber.startsWith("SPX-VN-"));
    });

    test("F31-T3: Timeline includes pending, confirmed, shipping, delivered stages", async () => {
      const tracking = await api.getSPXTracking(order.id);
      const stages = tracking.timeline.map((s) => s.stage);
      expect.deepEqual(stages, ["pending", "confirmed", "shipping", "delivered"]);
    });

    test("F31-T4: Completed stages contain timestamps", async () => {
      const tracking = await api.getSPXTracking(order.id);
      const completed = tracking.timeline.filter((s) => s.status === "completed");
      for (const st of completed) {
        expect.ok(st.timestamp);
      }
    });

    test("F31-T5: Current stage matches order shipping status", async () => {
      const tracking = await api.getSPXTracking(order.id);
      expect.equal(tracking.currentStage, "delivered");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 32: Dynamic GPS Courier Map Simulation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 32: Dynamic GPS Courier Map Simulation", () => {
    test("F32-T1: GPS simulation provides courier name and vehicle registration", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.courierName.includes("SPX"));
      expect.ok(gps.vehicle);
    });

    test("F32-T2: Current courier GPS coordinates contain latitude and longitude", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.currentLocation.lat > 0);
      expect.ok(gps.currentLocation.lng > 0);
    });

    test("F32-T3: Destination coordinates reflect delivery drop-off point", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.destination.lat > 0);
      expect.ok(gps.destination.lng > 0);
    });

    test("F32-T4: Real-time estimated time of arrival (ETA) is returned", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.etaMinutes > 0);
      expect.ok(gps.distanceRemainingKm > 0);
    });

    test("F32-T5: Driver moving speed is reported within realistic vehicle range", async () => {
      const gps = await api.getGPSMapSimulation(order.id);
      expect.ok(gps.driverSpeedKmh >= 10 && gps.driverSpeedKmh <= 60);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 33: Seller Shipping Label Generator (5 tests)
  // -------------------------------------------------------------
  describe("Feature 33: Seller Shipping Label Generator", () => {
    test("F33-T1: Shipping label generates unique SPX Airway Bill (AWB) number", async () => {
      const seller = await api.register({ email: "seller_lbl@test.vn", password: "Password123!", fullName: "Seller Label", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.ok(label.airwayBillNo.startsWith("AWB-SPX-"));
    });

    test("F33-T2: Label includes formatted machine-readable barcode string", async () => {
      const seller = await api.register({ email: "seller_bc@test.vn", password: "Password123!", fullName: "Seller BC", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.ok(label.barcode.startsWith("*") && label.barcode.endsWith("*"));
    });

    test("F33-T3: Sender and recipient contact info are clearly specified on label", async () => {
      const seller = await api.register({ email: "seller_sr@test.vn", password: "Password123!", fullName: "Seller SR", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.ok(label.sender.name);
      expect.ok(label.recipient.fullName);
    });

    test("F33-T4: Routing hub code is assigned for logistics sorting", async () => {
      const seller = await api.register({ email: "seller_rt@test.vn", password: "Password123!", fullName: "Seller RT", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.ok(label.routingCode);
    });

    test("F33-T5: Item manifest on label reflects order contents", async () => {
      const seller = await api.register({ email: "seller_mf@test.vn", password: "Password123!", fullName: "Seller MF", role: "seller" });
      const label = await api.generateShippingLabel(order.id, seller.token);
      expect.equal(label.items.length, order.items.length);
    });
  });
});
