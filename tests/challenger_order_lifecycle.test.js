/**
 * Challenger 1: Empirical Adversarial State Testing for Order Lifecycle
 * Tests Express controllers (orderController.js, reviewController.js) and ContractOracle
 * directly against edge cases, boundary conditions, and adversarial transitions.
 */

import { describe, test, it, expect } from "./harness/testRunner.js";
import {
  cancelOrder,
  repurchaseOrder,
  deliverOrder,
  confirmOrder,
  shipOrder,
  completeOrder,
} from "../server/src/controllers/orderController.js";
import { createReview } from "../server/src/controllers/reviewController.js";
import memoryStore from "../server/src/models/memoryStore.js";
import api from "./harness/apiClient.js";

// Helper to create mock Express response
function mockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

const runTag = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

describe("Challenger 1: Order Lifecycle & Adversarial State Testing (Real Controllers)", () => {
  const testUserId = `user_ch1_${runTag}`;
  const otherUserId = `user_other_${runTag}`;
  const adminUserId = `user_admin_${runTag}`;
  const prodAId = `prod_A_${runTag}`;
  const prodBId = `prod_B_${runTag}`;
  const prodInactiveId = `prod_inactive_${runTag}`;

  test("Setup unique test fixtures in memoryStore", async () => {
    // 1. Setup users
    await memoryStore.users.create({
      _id: testUserId,
      id: testUserId,
      email: `${testUserId}@shopee.vn`,
      fullName: "Challenger One",
      role: "customer",
      coins: 1000,
    });

    await memoryStore.users.create({
      _id: otherUserId,
      id: otherUserId,
      email: `${otherUserId}@shopee.vn`,
      fullName: "Other User",
      role: "customer",
      coins: 500,
    });

    await memoryStore.users.create({
      _id: adminUserId,
      id: adminUserId,
      email: `${adminUserId}@shopee.vn`,
      fullName: "Admin Challenger",
      role: "admin",
      coins: 0,
    });

    // 2. Setup products
    await memoryStore.products.create({
      _id: prodAId,
      id: prodAId,
      name: "Sản phẩm A Thử Nghiệm",
      price: 100000,
      stock: 20,
      sold: 5,
      soldCount: 5,
      isActive: true,
      shopId: "shop_01",
    });

    await memoryStore.products.create({
      _id: prodBId,
      id: prodBId,
      name: "Sản phẩm B Thử Nghiệm",
      price: 200000,
      stock: 5,
      sold: 2,
      soldCount: 2,
      isActive: true,
      shopId: "shop_01",
    });

    await memoryStore.products.create({
      _id: prodInactiveId,
      id: prodInactiveId,
      name: "Sản phẩm C Ngưng Bán",
      price: 150000,
      stock: 10,
      sold: 1,
      soldCount: 1,
      isActive: false,
      shopId: "shop_01",
    });

    const user = await memoryStore.users.findById(testUserId);
    expect.equal(user.coins, 1000);
  });

  // ==========================================
  // SECTION 1: ORDER CANCELLATION CHALLENGES
  // ==========================================

  test("CH1-01: Cancel order when status === 'pending' restores exact stock and coins", async () => {
    const orderId = `order_pending_${runTag}_1`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 3, status: "pending" },
      ],
      subtotal: 300000,
      coinsUsed: 400,
      total: 299600,
      status: "pending",
      timeline: [],
    });

    const prodBefore = await memoryStore.products.findById(prodAId);
    expect.equal(prodBefore.stock, 20);

    const req = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { cancelReason: "Đổi ý muốn mua món khác" },
    };
    const res = mockResponse();

    await cancelOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.success, true);
    expect.equal(res.body.data.status, "cancelled");
    expect.equal(res.body.data.items[0].status, "cancelled");

    // Stock restored: 20 + 3 = 23
    const prodAfter = await memoryStore.products.findById(prodAId);
    expect.equal(prodAfter.stock, 23);

    // Coins refunded: 1000 + 400 = 1400
    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, 1400);
  });

  test("CH1-02: Cancel order when status === 'confirmed' succeeds and restores stock/coins", async () => {
    const orderId = `order_confirmed_${runTag}_1`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: prodBId, name: "Sản phẩm B", price: 200000, quantity: 2, status: "confirmed" },
      ],
      subtotal: 400000,
      coinsUsed: 200,
      total: 399800,
      status: "confirmed",
      timeline: [],
    });

    const prodBefore = await memoryStore.products.findById(prodBId);
    expect.equal(prodBefore.stock, 5);

    const req = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { cancelReason: "Tìm thấy giá rẻ hơn ở nơi khác" },
    };
    const res = mockResponse();

    await cancelOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.success, true);
    expect.equal(res.body.data.status, "cancelled");

    const prodAfter = await memoryStore.products.findById(prodBId);
    expect.equal(prodAfter.stock, 7); // 5 + 2

    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, 1600); // 1400 + 200
  });

  test("CH1-03: Cancel order is strictly rejected (400) for 'shipping', 'delivering', 'delivered', 'completed', and 'cancelled'", async () => {
    const prohibitedStatuses = ["shipping", "delivering", "delivered", "completed", "cancelled"];

    for (const st of prohibitedStatuses) {
      const orderId = `order_prohibited_${runTag}_${st}`;
      await memoryStore.orders.create({
        _id: orderId,
        userId: testUserId,
        items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
        subtotal: 100000,
        coinsUsed: 100,
        total: 99900,
        status: st,
        timeline: [],
      });

      const prodBefore = await memoryStore.products.findById(prodAId);
      const stockBefore = prodBefore.stock;
      const userBefore = await memoryStore.users.findById(testUserId);
      const coinsBefore = userBefore.coins;

      const req = {
        params: { id: orderId },
        user: { _id: testUserId, role: "customer" },
        body: {},
      };
      const res = mockResponse();

      await cancelOrder(req, res);

      expect.equal(res.statusCode, 400);
      expect.equal(res.body.success, false);

      // Verify NO side-effects occurred:
      const prodAfter = await memoryStore.products.findById(prodAId);
      expect.equal(prodAfter.stock, stockBefore);

      const userAfter = await memoryStore.users.findById(testUserId);
      expect.equal(userAfter.coins, coinsBefore);
    }
  });

  test("CH1-04: Coin refund handles null, undefined, 0, or negative coinsUsed safely without error", async () => {
    const testCases = [
      { coinsUsed: 0, desc: "zero coins" },
      { coinsUsed: null, desc: "null coins" },
      { coinsUsed: undefined, desc: "undefined coins" },
      { coinsUsed: -50, desc: "negative coins" },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const orderId = `order_coin_edge_${runTag}_${i}`;
      await memoryStore.orders.create({
        _id: orderId,
        userId: testUserId,
        items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
        subtotal: 100000,
        coinsUsed: tc.coinsUsed,
        total: 100000,
        status: "pending",
        timeline: [],
      });

      const userBefore = await memoryStore.users.findById(testUserId);
      const coinsBefore = userBefore.coins;

      const req = {
        params: { id: orderId },
        user: { _id: testUserId, role: "customer" },
      };
      const res = mockResponse();

      await cancelOrder(req, res);

      expect.equal(res.statusCode, 200);
      const userAfter = await memoryStore.users.findById(testUserId);
      expect.equal(userAfter.coins, coinsBefore); // Exactly equal, no changes
    }
  });

  test("CH1-05: Order cancellation handles deleted/missing product in catalog gracefully", async () => {
    const orderId = `order_deleted_prod_${runTag}_1`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: `non_existent_product_${runTag}`, name: "Sản phẩm Đã Xóa", price: 50000, quantity: 2 },
        { productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 },
      ],
      subtotal: 200000,
      coinsUsed: 50,
      total: 199950,
      status: "pending",
      timeline: [],
    });

    const prodABefore = await memoryStore.products.findById(prodAId);
    const stockABefore = prodABefore.stock;
    const userBefore = await memoryStore.users.findById(testUserId);
    const coinsBefore = userBefore.coins;

    const req = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
    };
    const res = mockResponse();

    // Must not crash
    await cancelOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.data.status, "cancelled");

    // ProdA stock restored, non-existent skipped safely
    const prodAAfter = await memoryStore.products.findById(prodAId);
    expect.equal(prodAAfter.stock, stockABefore + 1);

    // Coins refunded
    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, coinsBefore + 50);
  });

  test("CH1-06: Order cancellation supports alternate lookup fields (trackingCode, orderId)", async () => {
    const tracking = `SPX-VN-${runTag}-999`;
    const orderId = `order_lookup_${runTag}_1`;
    await memoryStore.orders.create({
      _id: orderId,
      trackingCode: tracking,
      userId: testUserId,
      items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
      status: "pending",
      timeline: [],
    });

    const req = {
      params: { id: tracking }, // Lookup by trackingCode
      user: { _id: testUserId, role: "customer" },
    };
    const res = mockResponse();

    await cancelOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.data.status, "cancelled");
    expect.equal(res.body.data.trackingCode, tracking);
  });

  test("CH1-07: Cancellation authorization: non-owner gets 403, Admin gets 200", async () => {
    const orderId = `order_auth_${runTag}_1`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
      status: "pending",
      timeline: [],
    });

    // 1. Non-owner (other user) tries to cancel
    const reqOther = {
      params: { id: orderId },
      user: { _id: otherUserId, role: "customer" },
    };
    const resOther = mockResponse();
    await cancelOrder(reqOther, resOther);
    expect.equal(resOther.statusCode, 403);

    // 2. Admin tries to cancel
    const reqAdmin = {
      params: { id: orderId },
      user: { _id: adminUserId, role: "admin" },
      body: { cancelReason: "Admin can thiệp hủy đơn do khiếu nại" },
    };
    const resAdmin = mockResponse();
    await cancelOrder(reqAdmin, resAdmin);
    expect.equal(resAdmin.statusCode, 200);
    expect.equal(resAdmin.body.data.status, "cancelled");
  });

  // ==========================================
  // SECTION 2: REPURCHASE ENDPOINT CHALLENGES
  // ==========================================

  test("CH1-08: Repurchase order when all products are in stock -> canReorderFully: true", async () => {
    const orderId = `order_repurchase_valid_${runTag}`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 2 },
        { productId: prodBId, name: "Sản phẩm B", price: 200000, quantity: 1 },
      ],
      status: "delivered",
    });

    const req = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { addToCart: true },
    };
    const res = mockResponse();

    await repurchaseOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.success, true);
    expect.equal(res.body.data.canReorderFully, true);
    expect.equal(res.body.data.itemsToReorder.length, 2);
    expect.equal(res.body.data.outOfStockItems.length, 0);

    // Cart in memoryStore updated
    const cart = memoryStore.carts.findByUserId(testUserId);
    expect.ok(cart);
    expect.ok(cart.items.some((i) => i.productId === prodAId));
  });

  test("CH1-09: Repurchase detects out-of-stock and inactive products and flags them cleanly", async () => {
    // Temporarily set prodB stock to 0
    const prodB = await memoryStore.products.findById(prodBId);
    const originalStock = prodB.stock;
    prodB.stock = 0;
    await prodB.save();

    const orderId = `order_repurchase_depleted_${runTag}`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 2 },
        { productId: prodBId, name: "Sản phẩm B", price: 200000, quantity: 1 },
        { productId: prodInactiveId, name: "Sản phẩm C", price: 150000, quantity: 1 },
        { productId: `deleted_prod_${runTag}`, name: "Sản phẩm D", price: 50000, quantity: 1 },
      ],
      status: "delivered",
    });

    const req = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { addToCart: false },
    };
    const res = mockResponse();

    await repurchaseOrder(req, res);

    expect.equal(res.statusCode, 200);
    expect.equal(res.body.data.canReorderFully, false);
    // ProdA is in stock
    expect.equal(res.body.data.itemsToReorder.length, 1);
    expect.equal(res.body.data.itemsToReorder[0].productId, prodAId);

    // ProdB (stock=0), ProdInactive (isActive=false), deleted_product (not found) are in outOfStockItems
    expect.equal(res.body.data.outOfStockItems.length, 3);

    const reasons = res.body.data.outOfStockItems.map((o) => o.reason);
    expect.ok(reasons.includes("Hết hàng hoặc không đủ tồn kho"));
    expect.ok(reasons.includes("Sản phẩm đã ngưng bán"));
    expect.ok(reasons.includes("Sản phẩm không còn tồn tại"));

    // Reset prodB stock back for future tests
    prodB.stock = originalStock;
    await prodB.save();
  });

  test("CH1-10: Repurchase supports itemIds subset filtering and returns 400 on non-matching target", async () => {
    const orderId = `order_repurchase_subset_${runTag}`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [
        { productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 },
        { productId: prodBId, name: "Sản phẩm B", price: 200000, quantity: 1 },
      ],
      status: "delivered",
    });

    // 1. Request only prodAId
    const req1 = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { itemIds: [prodAId], addToCart: false },
    };
    const res1 = mockResponse();
    await repurchaseOrder(req1, res1);

    expect.equal(res1.statusCode, 200);
    expect.equal(res1.body.data.itemsToReorder.length, 1);
    expect.equal(res1.body.data.itemsToReorder[0].productId, prodAId);

    // 2. Request an itemId not in order
    const req2 = {
      params: { id: orderId },
      user: { _id: testUserId, role: "customer" },
      body: { itemIds: ["non_existent_item_id_999"] },
    };
    const res2 = mockResponse();
    await repurchaseOrder(req2, res2);

    expect.equal(res2.statusCode, 400);
    expect.equal(res2.body.success, false);
  });

  // ==========================================
  // SECTION 3: ORDER LIFECYCLE & DELIVERY
  // ==========================================

  test("CH1-11: Deliver order allows 'shipping' and 'delivering' and blocks 'pending', 'confirmed', 'completed'", async () => {
    // 1. Order in shipping -> Deliver succeeds
    const orderShippingId = `order_shipping_${runTag}`;
    await memoryStore.orders.create({
      _id: orderShippingId,
      userId: testUserId,
      items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
      status: "shipping",
      timeline: [],
    });

    const req1 = {
      params: { id: orderShippingId },
      user: { _id: testUserId, role: "customer" },
    };
    const res1 = mockResponse();
    await deliverOrder(req1, res1);

    expect.equal(res1.statusCode, 200);
    expect.equal(res1.body.data.status, "delivered");

    // 2. Order in pending -> Deliver fails with 400
    const orderPendingId = `order_pending_deliver_${runTag}`;
    await memoryStore.orders.create({
      _id: orderPendingId,
      userId: testUserId,
      items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
      status: "pending",
      timeline: [],
    });

    const req2 = {
      params: { id: orderPendingId },
      user: { _id: testUserId, role: "customer" },
    };
    const res2 = mockResponse();
    await deliverOrder(req2, res2);

    expect.equal(res2.statusCode, 400);
  });

  // ==========================================
  // SECTION 4: REVIEW BONUS LOGIC (+200 MINI XU)
  // ==========================================

  test("CH1-12: Review creation for delivered order awards +200 Mini Xu to buyer", async () => {
    const orderId = `order_review_delivered_${runTag}`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [{ productId: prodAId, name: "Sản phẩm A", price: 100000, quantity: 1 }],
      status: "delivered",
    });

    const userBefore = await memoryStore.users.findById(testUserId);
    const coinsBefore = userBefore.coins;

    const req = {
      user: { _id: testUserId, id: testUserId, fullName: "Challenger One" },
      body: {
        orderId,
        productId: prodAId,
        rating: 5,
        comment: "Sản phẩm chất lượng vượt trội, đóng gói rất cẩn thận!",
      },
    };
    const res = mockResponse();

    await createReview(req, res);

    expect.equal(res.statusCode, 201);
    expect.equal(res.body.success, true);
    expect.equal(res.body.data.rewardCoins, 200);

    // Verify +200 Mini Xu in DB
    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, coinsBefore + 200);
  });

  test("CH1-13: Review creation is rejected (400) if order is NOT delivered yet", async () => {
    const orderId = `order_review_not_delivered_${runTag}`;
    await memoryStore.orders.create({
      _id: orderId,
      userId: testUserId,
      items: [{ productId: prodBId, name: "Sản phẩm B", price: 200000, quantity: 1 }],
      status: "shipping",
    });

    const userBefore = await memoryStore.users.findById(testUserId);
    const coinsBefore = userBefore.coins;

    const req = {
      user: { _id: testUserId, id: testUserId, fullName: "Challenger One" },
      body: {
        orderId,
        productId: prodBId,
        rating: 5,
        comment: "Sản phẩm chưa nhận nhưng muốn đánh giá trước",
      },
    };
    const res = mockResponse();

    await createReview(req, res);

    expect.equal(res.statusCode, 400);
    expect.equal(res.body.success, false);

    // Verify no coins were awarded
    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, coinsBefore);
  });

  test("CH1-14: Duplicate review on same order & product is rejected (400) and does NOT double-award coins", async () => {
    const orderId = `order_review_delivered_${runTag}`;
    const userBefore = await memoryStore.users.findById(testUserId);
    const coinsBefore = userBefore.coins;

    const req = {
      user: { _id: testUserId, id: testUserId, fullName: "Challenger One" },
      body: {
        orderId, // SAME order and SAME product as CH1-12
        productId: prodAId,
        rating: 4,
        comment: "Cố tình gửi đánh giá lần thứ 2 cho cùng một đơn hàng",
      },
    };
    const res = mockResponse();

    await createReview(req, res);

    expect.equal(res.statusCode, 400);
    expect.equal(res.body.success, false);
    expect.equal(res.body.message, "Bạn đã đánh giá sản phẩm này rồi");

    // Coins unchanged - no double bonus!
    const userAfter = await memoryStore.users.findById(testUserId);
    expect.equal(userAfter.coins, coinsBefore);
  });

  test("CH1-15: Invalid ratings (0, 6, 3.5, string 'good') are strictly rejected with 400", async () => {
    const invalidRatings = [0, 6, -1, 3.5, "five", null, undefined];

    for (const r of invalidRatings) {
      const req = {
        user: { _id: testUserId, id: testUserId, fullName: "Challenger One" },
        body: {
          productId: prodBId,
          rating: r,
          comment: "Rating test",
        },
      };
      const res = mockResponse();

      await createReview(req, res);

      expect.equal(res.statusCode, 400);
      expect.equal(res.body.success, false);
    }
  });

  // ==========================================
  // SECTION 5: CONTRACT ORACLE ALIGNMENT
  // ==========================================

  test("CH1-16: ContractOracle parity on cancelOrder, repurchaseOrder, and deliverOrder", async () => {
    // 1. Test Oracle cancelOrder
    const buyer = api.oracle.registerUser({
      email: `oracle_buyer_${runTag}@shopee.vn`,
      password: "password123",
      fullName: "Oracle Buyer",
    });

    const seller = api.oracle.registerUser({
      email: `oracle_seller_${runTag}@shopee.vn`,
      password: "password123",
      fullName: "Oracle Seller",
      role: "seller",
    });

    const shop = api.oracle.createShop({
      name: `Oracle Shop ${runTag}`,
      address: "123 Test St",
      bankInfo: { accountNumber: "123456", bankName: "VCB" },
    }, seller.user);

    const product = api.oracle.createProduct({
      name: "Oracle Test Prod",
      price: 100000,
      stock: 10,
      shopId: shop.id,
    }, seller.user);

    const order = await api.createOrder({
      items: [{ productId: product.id, name: product.name, price: 100000, quantity: 2, shopId: shop.id }],
      subtotal: 200000,
      shippingFee: 0,
      total: 200000,
      coinsUsed: 100,
    }, buyer.token);

    // Initial stock was 10 - 2 = 8
    expect.equal(api.oracle.products.get(product.id).stock, 8);

    // Cancel order
    const cancelled = await api.cancelOrder(order.id, buyer.token);
    expect.equal(cancelled.status, "cancelled");

    // Stock restored in oracle: 8 + 2 = 10
    expect.equal(api.oracle.products.get(product.id).stock, 10);

    // Repurchase
    const repurchase = await api.repurchaseOrder(order.id, buyer.token);
    expect.equal(repurchase.canReorderFully, true);
    expect.equal(repurchase.itemsToReorder.length, 1);
  });
});
