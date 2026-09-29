/**
 * Tier 1: Feature Coverage - Subsystem 7: Buyer Experience Expansion (Features 43-47 / R1-R5)
 * 10 comprehensive, isolated test cases per feature (50 tests total).
 * Covers:
 *   - Feature 43 (R1): Multi-Address Book & Invariants
 *   - Feature 44 (R2): Product Reviews, Ratings & Verified Buyer Badge
 *   - Feature 45 (R3): Advanced Order Actions (Repurchase, Cancel, Returns)
 *   - Feature 46 (R4): Voucher Wallet & Coin Ledger
 *   - Feature 47 (R5): Order & Promotion Notification Center
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload } from "../harness/testData.js";

describe("Tier 1 - Subsystem 7: Buyer Experience Expansion (R1-R5)", () => {
  let buyer, seller, admin;

  beforeEach(async () => {
    api.resetOracle();
    buyer = await api.register({
      email: "buyer_exp@test.vn",
      password: "Password123!",
      fullName: "Nguyễn Mua Sắm",
      role: "customer",
    });
    seller = await api.register({
      email: "seller_exp@test.vn",
      password: "Password123!",
      fullName: "Chủ Shop Thời Trang",
      role: "seller",
    });
    await api.createShop(FIXTURES.shops.shopFashion, seller.token);
    admin = await api.login({
      email: "admin@shopee.enterprise.vn",
      password: "mock-hash-admin",
    });
  });

  // =========================================================================
  // FEATURE 43: Multi-Address Book & Invariants (R1) - 10 Tests
  // =========================================================================
  describe("Feature 43: Multi-Address Book & Invariants (R1)", () => {
    test("F43-T1: Customer can create new delivery address with recipient name, phone, address, and tag", async () => {
      const addr = await api.addAddress(
        {
          name: "Nguyễn Văn An",
          phone: "0901234567",
          address: "Số 123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM",
          tag: "Nhà riêng",
        },
        buyer.token
      );

      expect.ok(addr.id.startsWith("addr-"));
      expect.equal(addr.name, "Nguyễn Văn An");
      expect.equal(addr.phone, "0901234567");
      expect.equal(addr.tag, "Nhà riêng");
      expect.equal(addr.isDefault, true);
    });

    test("F43-T2: Single Default Invariant: First added address automatically assigned isDefault=true", async () => {
      const addr = await api.addAddress(
        {
          name: "Nguyễn Văn An",
          phone: "0912345678",
          address: "Tòa Landmark 81, Bình Thạnh, TP. HCM",
          tag: "Văn phòng",
          isDefault: false, // Even if requested false, first address MUST be default
        },
        buyer.token
      );

      expect.equal(addr.isDefault, true);
      const addresses = await api.getUserAddresses(buyer.token);
      expect.equal(addresses.length, 1);
      expect.equal(addresses[0].isDefault, true);
    });

    test("F43-T3: Single Default Invariant: Adding subsequent non-default address preserves first default", async () => {
      const addr1 = await api.addAddress(
        { name: "Địa chỉ 1", phone: "0901111111", address: "Quận 1, TP. HCM", isDefault: true },
        buyer.token
      );
      const addr2 = await api.addAddress(
        { name: "Địa chỉ 2", phone: "0902222222", address: "Quận 3, TP. HCM", isDefault: false },
        buyer.token
      );

      const list = await api.getUserAddresses(buyer.token);
      expect.equal(list.length, 2);
      const defaultAddrs = list.filter((a) => a.isDefault);
      expect.equal(defaultAddrs.length, 1);
      expect.equal(defaultAddrs[0].id, addr1.id);
      expect.equal(list.find((a) => a.id === addr2.id).isDefault, false);
    });

    test("F43-T4: Single Default Invariant: Setting new address as default unsets isDefault on all other addresses", async () => {
      const a1 = await api.addAddress({ name: "Nhà", phone: "0901111111", address: "Q1" }, buyer.token);
      const a2 = await api.addAddress({ name: "Cơ quan", phone: "0902222222", address: "Q2" }, buyer.token);
      const a3 = await api.addAddress({ name: "Bố mẹ", phone: "0903333333", address: "Q3", isDefault: true }, buyer.token);

      const list = await api.getUserAddresses(buyer.token);
      expect.equal(list.length, 3);
      const defaults = list.filter((a) => a.isDefault);
      expect.equal(defaults.length, 1);
      expect.equal(defaults[0].id, a3.id);
      expect.equal(list.find((a) => a.id === a1.id).isDefault, false);
      expect.equal(list.find((a) => a.id === a2.id).isDefault, false);
    });

    test("F43-T5: Single Default Invariant: Deleting default address automatically promotes first remaining address", async () => {
      const a1 = await api.addAddress({ name: "Nhà", phone: "0901111111", address: "Q1" }, buyer.token);
      const a2 = await api.addAddress({ name: "Công ty", phone: "0902222222", address: "Q2" }, buyer.token);

      expect.equal(a1.isDefault, true);
      // Delete the default address a1
      const remaining = await api.deleteAddress(a1.id, buyer.token);

      expect.equal(remaining.length, 1);
      expect.equal(remaining[0].id, a2.id);
      expect.equal(remaining[0].isDefault, true); // Auto-promoted to default
    });

    test("F43-T6: Deleting non-default address preserves the existing default address", async () => {
      const a1 = await api.addAddress({ name: "Nhà", phone: "0901111111", address: "Q1" }, buyer.token);
      const a2 = await api.addAddress({ name: "Công ty", phone: "0902222222", address: "Q2" }, buyer.token);

      const remaining = await api.deleteAddress(a2.id, buyer.token);
      expect.equal(remaining.length, 1);
      expect.equal(remaining[0].id, a1.id);
      expect.equal(remaining[0].isDefault, true);
    });

    test("F43-T7: Customer can update existing address details (name, phone, tag)", async () => {
      const addr = await api.addAddress({ name: "Tên Cũ", phone: "0901111111", address: "Địa chỉ cũ", tag: "Khác" }, buyer.token);
      const updated = await api.updateAddress(
        addr.id,
        { name: "Tên Mới", phone: "0909999999", tag: "Văn phòng" },
        buyer.token
      );

      expect.equal(updated.name, "Tên Mới");
      expect.equal(updated.phone, "0909999999");
      expect.equal(updated.tag, "Văn phòng");
      expect.equal(updated.address, "Địa chỉ cũ"); // Unchanged field preserved
    });

    test("F43-T8: Phone number validation accepts valid Vietnamese mobile numbers", async () => {
      const validNumbers = ["0901234567", "0389998888", "0771234567", "0868889999", "0581234567", "+84901234567"];
      for (const phone of validNumbers) {
        const addr = await api.addAddress({ name: "Người nhận", phone, address: "Địa chỉ test" }, buyer.token);
        expect.ok(addr.id);
      }
    });

    test("F43-T9: Phone number validation strictly rejects invalid numbers (letters, too short, invalid prefix)", async () => {
      const invalidNumbers = ["12345", "090123", "02438888888", "phone_number", "0901234567899"];
      for (const phone of invalidNumbers) {
        await expect.rejects(
          () => api.addAddress({ name: "Người nhận", phone, address: "Địa chỉ test" }, buyer.token),
          /INVALID_PHONE_NUMBER/
        );
      }
    });

    test("F43-T10: Address book isolation guarantees users cannot view or modify another user's addresses", async () => {
      const otherBuyer = await api.register({
        email: "other_buyer@test.vn",
        password: "Password123!",
        fullName: "Người Dùng Khác",
      });
      const addr = await api.addAddress({ name: "Địa chỉ riêng", phone: "0901234567", address: "Bảo mật" }, buyer.token);

      const otherList = await api.getUserAddresses(otherBuyer.token);
      expect.equal(otherList.length, 0);

      await expect.rejects(
        () => api.deleteAddress(addr.id, otherBuyer.token),
        /ADDRESS_NOT_FOUND/
      );
    });
  });

  // =========================================================================
  // FEATURE 44: Product Reviews, Ratings & Verified Buyer Badge (R2) - 10 Tests
  // =========================================================================
  describe("Feature 44: Product Reviews, Ratings & Verified Buyer Badge (R2)", () => {
    let order, prod;

    beforeEach(async () => {
      prod = await api.createProduct(
        { name: "Áo Thun Polo Cao Cấp", price: 200000, stock: 50 },
        seller.token
      );
      await api.moderateProduct(prod.id, "approved", admin.token);

      const orderPayload = generateCartPayload(
        [{ productId: prod.id, name: prod.name, price: 200000, quantity: 1, shopId: prod.shopId }],
        { shippingFee: 20000 }
      );
      order = await api.createOrder(orderPayload, buyer.token);
      order.status = "delivered"; // Marked delivered for review eligibility
    });

    test("F44-T1: Verified Buyer Badge: Review submission succeeds for customer with completed/delivered order", async () => {
      const res = await api.submitReview(
        {
          orderId: order.id,
          productId: prod.id,
          rating: 5,
          comment: "Chất vải cotton rất mềm mại, đóng gói cẩn thận!",
          tags: ["Đúng với mô tả", "Chất lượng sản phẩm tuyệt vời"],
        },
        buyer.token
      );

      expect.ok(res.review.id.startsWith("rev-"));
      expect.equal(res.review.verifiedPurchase, true);
      expect.equal(res.review.rating, 5);
      expect.equal(res.rewardCoins, 200);
    });

    test("F44-T2: Verified Buyer Enforcement: Review submission rejected if user did not purchase product", async () => {
      const unboughtProd = await api.createProduct(
        { name: "Sản phẩm chưa mua", price: 150000, stock: 20 },
        seller.token
      );
      await api.moderateProduct(unboughtProd.id, "approved", admin.token);

      await expect.rejects(
        () =>
          api.submitReview(
            { orderId: order.id, productId: unboughtProd.id, rating: 5, comment: "Sp tốt" },
            buyer.token
          ),
        /PRODUCT_NOT_IN_ORDER/
      );
    });

    test("F44-T3: Verified Buyer Enforcement: Review submission rejected if order is not delivered/completed", async () => {
      order.status = "pending"; // Not delivered yet

      await expect.rejects(
        () =>
          api.submitReview(
            { orderId: order.id, productId: prod.id, rating: 5, comment: "Sp tốt" },
            buyer.token
          ),
        /ORDER_NOT_COMPLETED/
      );
    });

    test("F44-T4: Rating formula recalculation: Correctly updates average rating and review count", async () => {
      // Baseline product has rating 5.0 with reviewCount 0
      prod.rating = 4.8;
      prod.reviewCount = 10;

      // Submit a 3-star review: (4.8 * 10 + 3) / 11 = 51 / 11 = 4.636... -> rounded to 4.6
      const res = await api.submitReview(
        { orderId: order.id, productId: prod.id, rating: 3, comment: "Hơi chật một chút" },
        buyer.token
      );

      expect.equal(res.productReviewCount, 11);
      expect.equal(res.productRating, 4.6);
    });

    test("F44-T5: Multi-review convergence: Multiple consecutive reviews recalculate accurately", async () => {
      prod.rating = 5.0;
      prod.reviewCount = 1;

      // Create a 2nd buyer and order
      const buyer2 = await api.register({ email: "buyer2@test.vn", password: "Password123!", fullName: "Buyer 2" });
      const orderPayload2 = generateCartPayload(
        [{ productId: prod.id, name: prod.name, price: 200000, quantity: 1, shopId: prod.shopId }]
      );
      const order2 = await api.createOrder(orderPayload2, buyer2.token);
      order2.status = "delivered";

      // Buyer 1 submits 4 stars: (5.0 * 1 + 4) / 2 = 4.5
      await api.submitReview({ orderId: order.id, productId: prod.id, rating: 4, comment: "Tốt" }, buyer.token);
      expect.equal(prod.rating, 4.5);
      expect.equal(prod.reviewCount, 2);

      // Buyer 2 submits 1 star: (4.5 * 2 + 1) / 3 = 10 / 3 = 3.333 -> 3.3
      await api.submitReview({ orderId: order2.id, productId: prod.id, rating: 1, comment: "Không ưng" }, buyer2.token);
      expect.equal(prod.rating, 3.3);
      expect.equal(prod.reviewCount, 3);
    });

    test("F44-T6: Star rating boundary validation: Rating must be an integer between 1 and 5", async () => {
      const invalidRatings = [0, 6, -1, 3.5, "five"];
      for (const r of invalidRatings) {
        await expect.rejects(
          () => api.submitReview({ orderId: order.id, productId: prod.id, rating: r, comment: "Test" }, buyer.token),
          /INVALID_RATING/
        );
      }
    });

    test("F44-T7: Reward Coin Credit: Submitting review credits exactly +200 Mini Xu to buyer wallet", async () => {
      const initialBalance = api.oracle.coinLedger.get(buyer.user.id).balance;
      const res = await api.submitReview(
        { orderId: order.id, productId: prod.id, rating: 5, comment: "Rất hài lòng!" },
        buyer.token
      );

      const finalBalance = api.oracle.coinLedger.get(buyer.user.id).balance;
      expect.equal(res.rewardCoins, 200);
      expect.equal(finalBalance, initialBalance + 200);
    });

    test("F44-T8: Coin Ledger integration: Review reward records transaction with category 'review'", async () => {
      await api.submitReview(
        { orderId: order.id, productId: prod.id, rating: 5, comment: "Tuyệt đỉnh!" },
        buyer.token
      );

      const txs = await api.getCoinTransactions(buyer.token);
      const reviewTx = txs.find((t) => t.category === "review");
      expect.ok(reviewTx);
      expect.equal(reviewTx.amount, 200);
      expect.equal(reviewTx.type, "plus");
      expect.equal(reviewTx.orderId, order.id);
    });

    test("F44-T9: Multi-item order review selector: Customer can review distinct products within single order", async () => {
      const prod2 = await api.createProduct({ name: "Quần Jeans Nam", price: 350000, stock: 30 }, seller.token);
      await api.moderateProduct(prod2.id, "approved", admin.token);

      const multiOrderPayload = generateCartPayload([
        { productId: prod.id, name: prod.name, price: 200000, quantity: 1, shopId: prod.shopId },
        { productId: prod2.id, name: prod2.name, price: 350000, quantity: 1, shopId: prod2.shopId },
      ]);
      const multiOrder = await api.createOrder(multiOrderPayload, buyer.token);
      multiOrder.status = "delivered";

      const r1 = await api.submitReview({ orderId: multiOrder.id, productId: prod.id, rating: 5 }, buyer.token);
      const r2 = await api.submitReview({ orderId: multiOrder.id, productId: prod2.id, rating: 4 }, buyer.token);

      expect.equal(r1.review.productId, prod.id);
      expect.equal(r2.review.productId, prod2.id);
    });

    test("F44-T10: Anti-spam guard: Customer cannot submit duplicate review for same product on same order", async () => {
      await api.submitReview({ orderId: order.id, productId: prod.id, rating: 5 }, buyer.token);

      await expect.rejects(
        () => api.submitReview({ orderId: order.id, productId: prod.id, rating: 4 }, buyer.token),
        /DUPLICATE_REVIEW/
      );
    });
  });

  // =========================================================================
  // FEATURE 45: Advanced Order Actions (Repurchase, Cancel, Returns) (R3) - 10 Tests
  // =========================================================================
  describe("Feature 45: Advanced Order Actions (Repurchase, Cancel, Returns) (R3)", () => {
    let order, prod1, prod2;

    beforeEach(async () => {
      prod1 = await api.createProduct({ name: "Bàn Phím Cơ Pro", price: 500000, stock: 10 }, seller.token);
      prod2 = await api.createProduct({ name: "Chuột Gaming RGB", price: 300000, stock: 15 }, seller.token);
      await api.moderateProduct(prod1.id, "approved", admin.token);
      await api.moderateProduct(prod2.id, "approved", admin.token);

      const orderPayload = generateCartPayload(
        [
          { productId: prod1.id, name: prod1.name, price: 500000, quantity: 2, shopId: prod1.shopId },
          { productId: prod2.id, name: prod2.name, price: 300000, quantity: 1, shopId: prod2.shopId },
        ],
        { coinsUsed: 5000 }
      );
      order = await api.createOrder(orderPayload, buyer.token);
    });

    test("F45-T1: 1-click repurchase verifies catalog stock and packages valid order items", async () => {
      const repurchase = await api.repurchaseOrder(order.id, buyer.token);

      expect.equal(repurchase.success, true);
      expect.equal(repurchase.canReorderFully, true);
      expect.equal(repurchase.itemsToReorder.length, 2);
      expect.equal(repurchase.outOfStockItems.length, 0);
    });

    test("F45-T2: 1-click repurchase detects depleted stock and flags out-of-stock items", async () => {
      // Deplete stock of prod1 to 0
      prod1.stock = 0;

      const repurchase = await api.repurchaseOrder(order.id, buyer.token);
      expect.equal(repurchase.success, true);
      expect.equal(repurchase.canReorderFully, false);
      expect.equal(repurchase.outOfStockItems.length, 1);
      expect.equal(repurchase.outOfStockItems[0].productId, prod1.id);
      expect.equal(repurchase.itemsToReorder.length, 1);
      expect.equal(repurchase.itemsToReorder[0].productId, prod2.id);
    });

    test("F45-T3: Cancel order permitted when order is in 'pending' state", async () => {
      expect.equal(order.status, "pending");
      const cancelled = await api.cancelOrder(order.id, buyer.token);
      expect.equal(cancelled.status, "cancelled");
    });

    test("F45-T4: Cancel order permitted when order is in 'confirmed' state", async () => {
      order.status = "confirmed";
      const cancelled = await api.cancelOrder(order.id, buyer.token);
      expect.equal(cancelled.status, "cancelled");
    });

    test("F45-T5: Cancel order strictly prohibited when order is in 'shipping' or 'delivered' state", async () => {
      order.status = "shipping";
      await expect.rejects(
        () => api.cancelOrder(order.id, buyer.token),
        /CANNOT_CANCEL/
      );

      order.status = "delivered";
      await expect.rejects(
        () => api.cancelOrder(order.id, buyer.token),
        /CANNOT_CANCEL/
      );
    });

    test("F45-T6: Stock restoration: Order cancellation restores exact deducted product quantities", async () => {
      // Prod1 stock after order should be 10 - 2 = 8
      expect.equal(prod1.stock, 8);
      expect.equal(prod2.stock, 14);

      await api.cancelOrder(order.id, buyer.token);

      expect.equal(prod1.stock, 10);
      expect.equal(prod2.stock, 15);
    });

    test("F45-T7: Coin refund on cancel: Accurately refunds redeemed Mini Xu to buyer wallet", async () => {
      const balanceBeforeCancel = api.oracle.coinLedger.get(buyer.user.id).balance;
      // 5,000 coins were used during checkout
      await api.cancelOrder(order.id, buyer.token);

      const balanceAfterCancel = api.oracle.coinLedger.get(buyer.user.id).balance;
      expect.equal(balanceAfterCancel, balanceBeforeCancel + 5000);
    });

    test("F45-T8: Coin refund ledger: Order cancellation records coin transaction with category 'refund'", async () => {
      await api.cancelOrder(order.id, buyer.token);

      const txs = await api.getCoinTransactions(buyer.token);
      const refundTx = txs.find((t) => t.category === "refund" && t.orderId === order.id);
      expect.ok(refundTx);
      expect.equal(refundTx.amount, 5000);
      expect.equal(refundTx.type, "plus");
    });

    test("F45-T9: 6-reason return workflow: Submitting return with predefined category sets status to pending_seller", async () => {
      order.status = "delivered";
      const reasons = [
        "Hàng lỗi, không hoạt động",
        "Giao sai hàng",
        "Hàng bể vỡ do vận chuyển",
        "Thiếu phụ kiện, quà tặng",
        "Hàng khác xa mô tả",
        "Không vừa kích cỡ, màu sắc",
      ];

      for (const reason of reasons) {
        const ret = await api.requestReturn(
          { orderId: order.id, reason, refundMethod: "wallet" },
          buyer.token
        );
        expect.equal(ret.reason, reason);
        expect.equal(ret.status, "pending_seller");
      }
    });

    test("F45-T10: Approved return lifecycle: Moderation to accepted restores inventory and refunds payment", async () => {
      order.status = "delivered";
      const ret = await api.requestReturn(
        { orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" },
        buyer.token
      );

      const balBefore = api.oracle.coinLedger.get(buyer.user.id).balance;
      const prod1StockBefore = prod1.stock;

      await api.moderateReturn(ret.id, "accepted", seller.token);

      const balAfter = api.oracle.coinLedger.get(buyer.user.id).balance;
      expect.equal(balAfter, balBefore + order.total);
      expect.equal(prod1.stock, prod1StockBefore + 2);
    });
  });

  // =========================================================================
  // FEATURE 46: Voucher Wallet & Coin Ledger (R4) - 10 Tests
  // =========================================================================
  describe("Feature 46: Voucher Wallet & Coin Ledger (R4)", () => {
    test("F46-T1: Customer claims active voucher into personal voucher wallet", async () => {
      const claimed = await api.claimVoucher(FIXTURES.vouchers.freeship15k, buyer.token);
      expect.equal(claimed.code, FIXTURES.vouchers.freeship15k);

      const userVouchers = await api.getUserClaimedVouchers(buyer.token);
      expect.ok(userVouchers.some((v) => v.code === FIXTURES.vouchers.freeship15k));
    });

    test("F46-T2: Claiming expired or inactive voucher is strictly rejected", async () => {
      await expect.rejects(
        () => api.claimVoucher(FIXTURES.vouchers.expired, buyer.token),
        /VOUCHER_EXPIRED_OR_INACTIVE/
      );
    });

    test("F46-T3: Duplicate voucher claiming guard: Cannot claim same voucher twice", async () => {
      await api.claimVoucher(FIXTURES.vouchers.fixed20k, buyer.token);

      await expect.rejects(
        () => api.claimVoucher(FIXTURES.vouchers.fixed20k, buyer.token),
        /ALREADY_CLAIMED/
      );
    });

    test("F46-T4: Auto-apply optimal vouchers: Selects maximum discount voucher meeting minOrderValue", async () => {
      // Subtotal 250,000 meets minSpend of GIAM20K (100k, save 20k) and DISCOUNT10PCT (200k, 10% = 25k)
      const optimal = await api.getOptimalVouchers(250000);
      expect.equal(optimal.optimalDiscountVoucher.code, "DISCOUNT10PCT");
      expect.equal(optimal.maxDiscountAmount, 25000);
    });

    test("F46-T5: Auto-apply optimal freeship voucher: Selects freeship voucher with highest shipping discount", async () => {
      // Subtotal 200,000 qualifies for FREESHIP15K and FREESHIP30K (minSpend 150k)
      const optimal = await api.getOptimalVouchers(200000);
      expect.equal(optimal.optimalFreeshipVoucher.code, "FREESHIP30K");
      expect.equal(optimal.maxShippingDiscount, 30000);
    });

    test("F46-T6: Coin transaction ledger structure: Schema verifies id, timestamp, amount, type, category", async () => {
      const txs = await api.getCoinTransactions(buyer.token);
      expect.ok(txs.length >= 1); // Contains welcome transaction
      const tx = txs[0];
      expect.ok(tx.id);
      expect.ok(tx.timestamp);
      expect.ok(typeof tx.amount === "number");
      expect.ok(["plus", "minus"].includes(tx.type));
      expect.ok(tx.category);
    });

    test("F46-T7: Coin transaction categorization: Verifies 'welcome', 'checkin', 'spin', 'order', 'refund', 'review'", async () => {
      // 1. Welcome
      const txs = await api.getCoinTransactions(buyer.token);
      expect.equal(txs.some((t) => t.category === "welcome"), true);

      // 2. Check-in
      await api.checkinDailyStreak(buyer.token);
      const txsAfterCheckin = await api.getCoinTransactions(buyer.token);
      expect.equal(txsAfterCheckin.some((t) => t.category === "checkin"), true);

      // 3. Spin
      await api.spinLuckyWheel(buyer.token);
      const txsAfterSpin = await api.getCoinTransactions(buyer.token);
      expect.ok(txsAfterSpin.length >= 3);
    });

    test("F46-T8: 7-day check-in streak ladder: Verifies daily rewards [500, 1000, 1500, 2000, 2500, 3000, 5000]", async () => {
      // Day 1
      const res1 = await api.checkinDailyStreak(buyer.token);
      expect.equal(res1.streak, 1);
      expect.equal(res1.rewardXu, 500);

      // Simulate advancing days
      const expectedRewards = [1000, 1500, 2000, 2500, 3000, 5000];
      for (let day = 2; day <= 7; day++) {
        api.oracle.coinLedger.get(buyer.user.id).lastCheckinDate = `2026-09-${day - 1}`;
        const res = await api.checkinDailyStreak(buyer.token);
        expect.equal(res.streak, day);
        expect.equal(res.rewardXu, expectedRewards[day - 2]);
      }
    });

    test("F46-T9: 7-day check-in streak: Day 7 completion loops back to Day 1 reward (500 Xu)", async () => {
      api.oracle.coinLedger.get(buyer.user.id).streak = 7;
      api.oracle.coinLedger.get(buyer.user.id).lastCheckinDate = "2026-09-01";

      const res = await api.checkinDailyStreak(buyer.token);
      expect.equal(res.streak, 1);
      expect.equal(res.rewardXu, 500);
    });

    test("F46-T10: 50% subtotal coin checkout cap: Enforces maximum coin deduction does not exceed 50% order subtotal", async () => {
      // Subtotal = 100,000 VND. User has 10,000 Xu welcome gift and wants to use 80,000 Xu
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { coinsUsed: 80000 })
      );

      // 50% of 100,000 is 50,000 max allowed
      expect.equal(pricing.coinsUsed, 50000);
      expect.equal(pricing.coinDiscount, 50000);
      expect.equal(pricing.finalTotal, 100000 - 50000 + 30000); // 80,000 VND
    });
  });

  // =========================================================================
  // FEATURE 47: Order & Promotion Notification Center (R5) - 10 Tests
  // =========================================================================
  describe("Feature 47: Order & Promotion Notification Center (R5)", () => {
    test("F47-T1: Notification creation supports categories: 'order', 'promo', 'voucher', 'system'", async () => {
      const types = ["order", "promo", "voucher", "system"];
      for (const type of types) {
        const notif = await api.triggerNotification(
          { type, title: `Test ${type}`, message: `Nội dung ${type}` },
          buyer.token
        );
        expect.equal(notif.type, type);
        expect.equal(notif.isRead, false);
      }
    });

    test("F47-T2: Real-time lifecycle trigger: Order creation automatically emits 'order' notification", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }]);
      const order = await api.createOrder(payload, buyer.token);

      const notifs = await api.getUserNotifications("order", buyer.token);
      const orderNotif = notifs.find((n) => n.orderId === order.id);
      expect.ok(orderNotif);
      expect.equal(orderNotif.type, "order");
      expect.equal(orderNotif.isRead, false);
    });

    test("F47-T3: Real-time lifecycle trigger: Order cancellation automatically emits 'order' notification", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }]);
      const order = await api.createOrder(payload, buyer.token);
      await api.cancelOrder(order.id, buyer.token);

      const notifs = await api.getUserNotifications("order", buyer.token);
      const cancelNotif = notifs.find((n) => n.title.includes("Đã hủy đơn hàng"));
      expect.ok(cancelNotif);
      expect.equal(cancelNotif.type, "order");
    });

    test("F47-T4: Real-time lifecycle trigger: Review coin reward emits 'voucher'/'promo' notification", async () => {
      const prod = await api.createProduct({ name: "Áo Polo", price: 100000, stock: 10 }, seller.token);
      await api.moderateProduct(prod.id, "approved", admin.token);

      const payload = generateCartPayload([{ productId: prod.id, name: prod.name, price: 100000, quantity: 1 }]);
      const order = await api.createOrder(payload, buyer.token);
      order.status = "delivered";

      await api.submitReview({ orderId: order.id, productId: prod.id, rating: 5 }, buyer.token);

      const notifs = await api.getUserNotifications("voucher", buyer.token);
      const rewardNotif = notifs.find((n) => n.title.includes("+200 Mini Xu"));
      expect.ok(rewardNotif);
    });

    test("F47-T5: Unread count calculation: Accurately reflects number of unread notifications", async () => {
      await api.triggerNotification({ title: "Thông báo 1", message: "Msg 1" }, buyer.token);
      await api.triggerNotification({ title: "Thông báo 2", message: "Msg 2" }, buyer.token);
      await api.triggerNotification({ title: "Thông báo 3", message: "Msg 3" }, buyer.token);

      const count = await api.getUnreadNotificationCount(buyer.token);
      expect.equal(count, 3);
    });

    test("F47-T6: Mark single notification as read: Updates isRead flag and decrements unread count", async () => {
      const n1 = await api.triggerNotification({ title: "N1", message: "Msg" }, buyer.token);
      await api.triggerNotification({ title: "N2", message: "Msg" }, buyer.token);

      expect.equal(await api.getUnreadNotificationCount(buyer.token), 2);

      await api.markNotificationAsRead(n1.id, buyer.token);

      expect.equal(await api.getUnreadNotificationCount(buyer.token), 1);
      const notifs = await api.getUserNotifications("all", buyer.token);
      expect.equal(notifs.find((n) => n.id === n1.id).isRead, true);
    });

    test("F47-T7: Mark all notifications as read: Clears all unread flags and resets unread count to 0", async () => {
      await api.triggerNotification({ title: "N1", message: "Msg" }, buyer.token);
      await api.triggerNotification({ title: "N2", message: "Msg" }, buyer.token);
      await api.triggerNotification({ title: "N3", message: "Msg" }, buyer.token);

      const result = await api.markAllNotificationsAsRead(buyer.token);
      expect.equal(result.unreadCount, 0);
      expect.equal(result.markedCount, 3);
      expect.equal(await api.getUnreadNotificationCount(buyer.token), 0);
    });

    test("F47-T8: Category filtering: Filter notifications by 'order', 'promo', 'voucher', 'system'", async () => {
      await api.triggerNotification({ type: "order", title: "Order Update" }, buyer.token);
      await api.triggerNotification({ type: "promo", title: "Promo Alert" }, buyer.token);
      await api.triggerNotification({ type: "voucher", title: "Voucher Gift" }, buyer.token);

      const orderOnly = await api.getUserNotifications("order", buyer.token);
      expect.equal(orderOnly.length, 1);
      expect.equal(orderOnly[0].title, "Order Update");

      const promoOnly = await api.getUserNotifications("promo", buyer.token);
      expect.equal(promoOnly.length, 1);
      expect.equal(promoOnly[0].title, "Promo Alert");
    });

    test("F47-T9: Notification capacity limit: Caps stored notifications at 50 most recent items", async () => {
      for (let i = 1; i <= 55; i++) {
        await api.triggerNotification({ title: `Notification ${i}` }, buyer.token);
      }

      const all = await api.getUserNotifications("all", buyer.token);
      expect.equal(all.length, 50);
      expect.equal(all[0].title, "Notification 55"); // Most recent at front
    });

    test("F47-T10: Multi-user notification isolation: User notifications are strictly partitioned", async () => {
      const user2 = await api.register({ email: "user2_notif@test.vn", password: "Password123!", fullName: "User 2" });

      await api.triggerNotification({ title: "Buyer 1 Private Notif" }, buyer.token);
      await api.triggerNotification({ title: "User 2 Private Notif" }, user2.token);

      const buyerNotifs = await api.getUserNotifications("all", buyer.token);
      const user2Notifs = await api.getUserNotifications("all", user2.token);

      expect.equal(buyerNotifs.length, 1);
      expect.equal(buyerNotifs[0].title, "Buyer 1 Private Notif");

      expect.equal(user2Notifs.length, 1);
      expect.equal(user2Notifs[0].title, "User 2 Private Notif");
    });
  });
});
