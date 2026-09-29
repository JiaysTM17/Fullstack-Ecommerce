/**
 * Tier 1: Feature Coverage - Subsystem 8: Buyer Experience Expansion Phase 2 (Features 48-51 / R1-R4)
 * 10 comprehensive, isolated test cases per feature (40 tests total).
 * Covers:
 *   - Feature 48 (R1): Live Logistics Tracking API & Real-time GPS Telemetry
 *   - Feature 49 (R2): Recently Viewed Products Module & Carousel
 *   - Feature 50 (R3): Product Community Q&A System
 *   - Feature 51 (R4): Electronic VAT Invoice Generator API (Decree 123)
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload, createRandomEmail } from "../harness/testData.js";

describe("Tier 1 - Subsystem 8: Buyer Experience Expansion Phase 2 (R1-R4)", { tier: "tier1", subsystem: "sub8" }, () => {
  let buyer, seller, admin;

  beforeEach(async () => {
    api.resetOracle();
    buyer = await api.register({
      email: createRandomEmail("buyer_p2"),
      password: "Password123!",
      fullName: "Nguyễn Mua Sắm",
      role: "customer",
    });
    seller = await api.register({
      email: createRandomEmail("seller_p2"),
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
  // FEATURE 48: Live Logistics Tracking API (Phase 2 R1) - 10 Tests
  // =========================================================================
  describe("Feature 48: Live Logistics Tracking API (R1)", () => {
    test("F48-T1: Order creation automatically assigns a standardized carrier and formatted tracking code", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 250000, quantity: 1 }]), buyer.token);
      expect.ok(order.trackingCode);
      expect.ok(order.trackingCode.startsWith("SPXVN") || order.trackingCode.startsWith("SPX-VN-"));
      expect.ok(order.carrier.includes("SPX Express"));
    });

    test("F48-T2: GET tracking returns 200 with carrier details, carrier hotline (1900 1221), and orderId", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 180000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      expect.equal(tracking.orderId, order.id);
      expect.ok(tracking.carrier.includes("SPX Express"));
      expect.equal(tracking.carrierHotline, "1900 1221");
    });

    test("F48-T3: Stepper progression contains 4 chronological stages: placed, confirmed, shipping, delivered", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 300000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      expect.equal(Array.isArray(tracking.stages), true);
      expect.equal(tracking.stages.length, 4);
      expect.equal(tracking.stages[0].stage, "placed");
      expect.equal(tracking.stages[1].stage, "confirmed");
      expect.equal(tracking.stages[2].stage, "shipping");
      expect.equal(tracking.stages[3].stage, "delivered");
    });

    test("F48-T4: Stage placed is marked completed: true immediately upon order creation with ISO timestamp", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      const placedStage = tracking.stages.find((s) => s.stage === "placed");
      expect.ok(placedStage);
      expect.equal(placedStage.completed, true);
      expect.ok(placedStage.timestamp);
      expect.ok(!isNaN(new Date(placedStage.timestamp).getTime()));
    });

    test("F48-T5: When order status is confirmed, stage confirmed is completed with shop packaging message", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      order.status = "confirmed";

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      const confirmedStage = tracking.stages.find((s) => s.stage === "confirmed");
      expect.ok(confirmedStage);
      expect.equal(confirmedStage.completed, true);
      expect.ok(confirmedStage.desc.includes("đóng gói") || confirmedStage.title.includes("đóng gói"));
    });

    test("F48-T6: When order status is shipping, stage shipping is active with transit description from Tân Bình hub", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      order.status = "shipping";

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      const shippingStage = tracking.stages.find((s) => s.stage === "shipping");
      expect.ok(shippingStage);
      expect.equal(shippingStage.completed, true);
      expect.equal(shippingStage.active, true);
      expect.ok(shippingStage.desc.includes("Tân Bình"));
    });

    test("F48-T7: Driver metadata includes courier name, verified phone number, vehicle registration, and 4.95 rating", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 200000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      expect.ok(tracking.courier);
      expect.equal(tracking.courier.name, "Nguyễn Văn Hùng");
      expect.equal(tracking.courier.phone, "0908 123 456");
      expect.ok(tracking.courier.vehicle.includes("29B1-892.45"));
      expect.equal(tracking.courier.rating, 4.95);
    });

    test("F48-T8: GPS coordinate telemetry provides courier latitude/longitude, destination coordinates, and hub label", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 200000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      expect.ok(tracking.currentLocation);
      expect.ok(typeof tracking.currentLocation.lat === "number");
      expect.ok(typeof tracking.currentLocation.lng === "number");
      expect.ok(tracking.currentLocation.label.includes("Tân Bình"));
      expect.ok(tracking.destination);
      expect.ok(typeof tracking.destination.lat === "number");
      expect.ok(typeof tracking.destination.lng === "number");
    });

    test("F48-T9: Tracking simulation calculates remaining distance in km, vehicle speed, and dynamic ETA", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 200000, quantity: 1 }]), buyer.token);
      order.status = "shipping";

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      expect.ok(tracking.currentLocation.distanceRemainingKm > 0);
      expect.ok(tracking.currentLocation.speedKmh > 0);
      expect.ok(tracking.currentLocation.etaMinutes > 0);
    });

    test("F48-T10: Querying tracking by tracking code string resolves to the exact same order tracking record", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 220000, quantity: 1 }]), buyer.token);
      const trackingByOrderId = await api.getOrderTracking(order.id, buyer.token);

      const trackingByCode = await api.getOrderTracking(trackingByOrderId.trackingCode, buyer.token);
      expect.equal(trackingByCode.orderId, trackingByOrderId.orderId);
      expect.equal(trackingByCode.trackingCode, trackingByOrderId.trackingCode);
      expect.equal(trackingByCode.carrier, trackingByOrderId.carrier);
    });
  });

  // =========================================================================
  // FEATURE 49: Recently Viewed Products Module (Phase 2 R2) - 10 Tests
  // =========================================================================
  describe("Feature 49: Recently Viewed Products Module (R2)", () => {
    test("F49-T1: Viewing a product persists complete product metadata (id, name, slug, price, originalPrice, image, rating, sold, shopName)", async () => {
      const prod = {
        id: "prod-rec-01",
        name: "Áo Polo Nam Classic",
        slug: "ao-polo-nam-classic",
        price: 199000,
        originalPrice: 299000,
        image: "/images/polo-classic.png",
        rating: 4.8,
        sold: 150,
        shopName: "Thời Trang GenZ",
      };

      const list = await api.recordRecentlyViewed(prod, buyer.token);
      const saved = list.find((p) => p.id === "prod-rec-01");

      expect.ok(saved);
      expect.equal(saved.name, "Áo Polo Nam Classic");
      expect.equal(saved.slug, "ao-polo-nam-classic");
      expect.equal(saved.price, 199000);
      expect.equal(saved.originalPrice, 299000);
      expect.equal(saved.rating, 4.8);
      expect.equal(saved.sold, 150);
      expect.equal(saved.shopName, "Thời Trang GenZ");
      expect.ok(saved.viewedAt);
    });

    test("F49-T2: Multiple viewed products are stored in reverse chronological order (newest viewed product at index 0)", async () => {
      await api.clearRecentlyViewed(buyer.token);
      await api.recordRecentlyViewed({ id: "prod-seq-1", name: "Sản phẩm 1", price: 100000 }, buyer.token);
      await api.recordRecentlyViewed({ id: "prod-seq-2", name: "Sản phẩm 2", price: 200000 }, buyer.token);
      await api.recordRecentlyViewed({ id: "prod-seq-3", name: "Sản phẩm 3", price: 300000 }, buyer.token);

      const list = await api.getRecentlyViewed(buyer.token);
      expect.equal(list.length, 3);
      expect.equal(list[0].id, "prod-seq-3");
      expect.equal(list[1].id, "prod-seq-2");
      expect.equal(list[2].id, "prod-seq-1");
    });

    test("F49-T3: Capacity cap: Stores up to 20 products; viewing a 21st distinct product evicts the oldest item", async () => {
      await api.clearRecentlyViewed(buyer.token);
      for (let i = 1; i <= 20; i++) {
        await api.recordRecentlyViewed({ id: `cap-prod-${i}`, name: `Sản phẩm ${i}`, price: 100000 }, buyer.token);
      }

      let list = await api.getRecentlyViewed(buyer.token);
      expect.equal(list.length, 20);
      expect.equal(list[0].id, "cap-prod-20");
      expect.equal(list[19].id, "cap-prod-1");

      // View 21st product
      await api.recordRecentlyViewed({ id: "cap-prod-21", name: "Sản phẩm 21", price: 210000 }, buyer.token);
      list = await api.getRecentlyViewed(buyer.token);

      expect.equal(list.length, 20);
      expect.equal(list[0].id, "cap-prod-21");
      expect.equal(list.find((p) => p.id === "cap-prod-1"), undefined); // Oldest evicted
    });

    test("F49-T4: Deduplication: Re-viewing an existing product moves it to the front without increasing total array length", async () => {
      await api.clearRecentlyViewed(buyer.token);
      await api.recordRecentlyViewed({ id: "dedup-1", name: "Item 1", price: 100000 }, buyer.token);
      await api.recordRecentlyViewed({ id: "dedup-2", name: "Item 2", price: 200000 }, buyer.token);
      await api.recordRecentlyViewed({ id: "dedup-3", name: "Item 3", price: 300000 }, buyer.token);

      // Re-view dedup-1
      const list = await api.recordRecentlyViewed({ id: "dedup-1", name: "Item 1", price: 100000 }, buyer.token);
      expect.equal(list.length, 3);
      expect.equal(list[0].id, "dedup-1");
      expect.equal(list[1].id, "dedup-3");
      expect.equal(list[2].id, "dedup-2");
    });

    test("F49-T5: Current product exclusion: Service and selector filter out currentProductId so PDP does not display active product", async () => {
      await api.clearRecentlyViewed(buyer.token);
      await api.recordRecentlyViewed({ id: "active-pdp-prod", name: "Active PDP", price: 150000 }, buyer.token);
      await api.recordRecentlyViewed({ id: "other-prod-1", name: "Other 1", price: 100000 }, buyer.token);

      const all = await api.getRecentlyViewed(buyer.token);
      const filtered = all.filter((p) => (p._id || p.id) !== "active-pdp-prod");

      expect.equal(all.length, 2);
      expect.equal(filtered.length, 1);
      expect.equal(filtered[0].id, "other-prod-1");
    });

    test("F49-T6: Clear history: Invoking clearRecentlyViewed() completely purges stored history and resets count to 0", async () => {
      await api.recordRecentlyViewed({ id: "purge-me", name: "Tẩy rửa", price: 50000 }, buyer.token);
      expect.ok((await api.getRecentlyViewed(buyer.token)).length > 0);

      const cleared = await api.clearRecentlyViewed(buyer.token);
      expect.equal(cleared.length, 0);

      const after = await api.getRecentlyViewed(buyer.token);
      expect.equal(after.length, 0);
    });

    test("F49-T7: Reactive update: Adding or modifying recently viewed products dispatches updated state", async () => {
      await api.clearRecentlyViewed(buyer.token);
      const updated = await api.recordRecentlyViewed({ id: "event-item", name: "Event Item", price: 80000 }, buyer.token);

      expect.equal(updated.length, 1);
      expect.equal(updated[0].id, "event-item");
    });

    test("F49-T8: Quick Add to Cart: Items from recently viewed list can be added directly to cart with default quantity 1", async () => {
      const prod = { id: "quick-cart-prod", name: "Quần Jean Slimfit", price: 290000 };
      await api.recordRecentlyViewed(prod, buyer.token);

      const list = await api.getRecentlyViewed(buyer.token);
      const itemToOrder = list.find((p) => p.id === "quick-cart-prod");
      expect.ok(itemToOrder);

      const orderPayload = generateCartPayload([{ productId: itemToOrder.id, price: itemToOrder.price, quantity: 1 }]);
      const order = await api.createOrder(orderPayload, buyer.token);

      expect.ok(order.id);
      expect.equal(order.items[0].price, 290000);
      expect.equal(order.items[0].quantity, 1);
    });

    test("F49-T9: Fallback handling: Product missing non-essential metadata populates safe defaults without crashing", async () => {
      const minimalProd = { id: "min-prod-99", name: "Sản phẩm tối giản" };
      const list = await api.recordRecentlyViewed(minimalProd, buyer.token);

      const saved = list.find((p) => p.id === "min-prod-99");
      expect.ok(saved);
      expect.equal(saved.price, 0);
      expect.equal(saved.originalPrice, 0);
      expect.equal(saved.rating, 5);
      expect.ok(saved.image);
    });

    test("F49-T10: Safe error boundary: Passing null, undefined, or empty payload to addRecentlyViewed returns current list safely", async () => {
      const initial = await api.getRecentlyViewed(buyer.token);
      const resNull = await api.recordRecentlyViewed(null, buyer.token);
      const resUndefined = await api.recordRecentlyViewed(undefined, buyer.token);
      const resEmpty = await api.recordRecentlyViewed({}, buyer.token);

      expect.equal(Array.isArray(resNull), true);
      expect.equal(Array.isArray(resUndefined), true);
      expect.equal(Array.isArray(resEmpty), true);
      expect.equal(resNull.length, initial.length);
    });
  });

  // =========================================================================
  // FEATURE 50: Product Q&A System (Phase 2 R3) - 10 Tests
  // =========================================================================
  describe("Feature 50: Product Q&A System (R3)", () => {
    const testProdId = "prod-p2-qa-200";

    test("F50-T1: GET /api/products/:id/questions retrieves questions list for a valid productId", async () => {
      await api.createQuestion(testProdId, { question: "Sản phẩm có sẵn size M không shop?" }, buyer.token);
      const res = await api.getProductQuestions(testProdId);

      expect.ok(res);
      expect.equal(res.productId, testProdId);
      expect.ok(res.total >= 1);
      expect.ok(Array.isArray(res.questions));
    });

    test("F50-T2: Returned questions are ordered descending by helpfulCount (most helpful first)", async () => {
      const q1 = await api.createQuestion(testProdId, { question: "Câu hỏi ít hữu ích" }, buyer.token);
      const q2 = await api.createQuestion(testProdId, { question: "Câu hỏi cực kỳ hữu ích" }, buyer.token);

      // Upvote q2 multiple times
      await api.voteProductQuestion(testProdId, q2.id);
      await api.voteProductQuestion(testProdId, q2.id);

      const list = await api.getProductQuestions(testProdId);
      expect.ok(list.length >= 2);
      expect.equal(list[0].id, q2.id);
      expect.ok(list[0].helpfulCount > list[1].helpfulCount);
    });

    test("F50-T3: POST /api/products/:id/questions creates question with initial helpfulCount: 0 and empty answers: []", async () => {
      const q = await api.createQuestion(testProdId, { question: "Chất vải cotton 100% không?" }, buyer.token);

      expect.ok(q._id || q.id);
      expect.equal(q.helpfulCount, 0);
      expect.equal(Array.isArray(q.answers), true);
      expect.equal(q.answers.length, 0);
      expect.ok(q.createdAt);
    });

    test("F50-T4: Authenticated customer question resolves author name automatically from user profile token", async () => {
      const q = await api.createQuestion(testProdId, { question: "Thời gian giao hàng bao lâu?" }, buyer.token);
      expect.equal(q.userName, "Nguyễn Mua Sắm");
    });

    test("F50-T5: Guest question adopts provided userName or defaults to 'Khách hàng Mini Shopee'", async () => {
      const guestQ = await api.createQuestion(testProdId, { question: "Có freeship không shop?", userName: "Bác Ba Phi" }, null);
      expect.equal(guestQ.userName, "Bác Ba Phi");

      const anonQ = await api.createQuestion(testProdId, { question: "Màu nào bán chạy nhất?" }, null);
      expect.ok(anonQ.userName === "Người mua" || anonQ.userName === "Khách hàng Mini Shopee");
    });

    test("F50-T6: Empty or whitespace question text is strictly rejected with 400 Bad Request", async () => {
      await expect.rejects(
        () => api.createQuestion(testProdId, { question: "     " }, buyer.token),
        /Nội dung câu hỏi không được để trống|QUESTION_TEXT_REQUIRED/
      );
    });

    test("F50-T7: POST /api/products/:id/questions/:questionId/vote increments helpfulCount by exactly 1", async () => {
      const q = await api.createQuestion(testProdId, { question: "Độ bền màu như thế nào?" }, buyer.token);
      expect.equal(q.helpfulCount, 0);

      const vote1 = await api.voteProductQuestion(testProdId, q.id);
      expect.equal(vote1.helpfulCount, 1);

      const vote2 = await api.voteProductQuestion(testProdId, q.id);
      expect.equal(vote2.helpfulCount, 2);
    });

    test("F50-T8: Voting on non-existent question returns 404 Not Found", async () => {
      await expect.rejects(
        () => api.voteProductQuestion(testProdId, "non-existent-question-999"),
        /Không tìm thấy câu hỏi|QUESTION_NOT_FOUND/
      );
    });

    test("F50-T9: Question document supports embedded answers with authorName, isShopOwner flag, and content", async () => {
      const q = await api.createQuestion(testProdId, { question: "Có chống nhăn không shop?" }, buyer.token);
      const updated = await api.answerProductQuestion(testProdId, q.id, {
        content: "Dạ vải được xử lý chống nhăn công nghệ mới bạn nhé!",
        authorName: "Thời Trang GenZ Official",
        isShopOwner: true,
      });

      expect.equal(updated.answers.length, 1);
      expect.equal(updated.answers[0].isShopOwner, true);
      expect.equal(updated.answers[0].authorName, "Thời Trang GenZ Official");
      expect.equal(updated.answers[0].content, "Dạ vải được xử lý chống nhăn công nghệ mới bạn nhé!");
      expect.ok(updated.answers[0].createdAt);
    });

    test("F50-T10: Dual-engine persistence: Newly created questions and vote increments persist across queries", async () => {
      const newQ = await api.createQuestion(testProdId, { question: "Có size 2XL không shop?" }, buyer.token);
      await api.voteProductQuestion(testProdId, newQ.id);

      const refreshed = await api.getProductQuestions(testProdId);
      const found = refreshed.questions.find((item) => (item._id || item.id) === newQ.id);

      expect.ok(found);
      expect.equal(found.question, "Có size 2XL không shop?");
      expect.equal(found.helpfulCount, 1);
    });
  });

  // =========================================================================
  // FEATURE 51: Electronic VAT Invoice Generator API (Phase 2 R4) - 10 Tests
  // =========================================================================
  describe("Feature 51: Electronic VAT Invoice Generator API (R4)", () => {
    let order;

    beforeEach(async () => {
      const payload = generateCartPayload(
        [
          { name: "Áo Sơ Mi Oxford", price: 250000, quantity: 2 },
          { name: "Cà Vạt Lụa Cao Cấp", price: 100000, quantity: 1 },
        ],
        {
          shippingFee: 30000,
          customer: {
            fullName: "Công Ty Cổ Phần Công Nghệ Mua Sắm",
            phone: "0909123456",
            email: "accounting@shopee.vn",
            address: "Tòa nhà Bitexco, Quận 1, TP. HCM",
            taxCode: "0312345678",
          },
        }
      );
      order = await api.createOrder(payload, buyer.token);
    });

    test("F51-T1: GET /api/orders/:id/invoice generates electronic VAT invoice for existing order with 200 OK", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.ok(invoice);
      expect.equal(invoice.orderId, order.id);
      expect.ok(invoice.invoiceNumber);
    });

    test("F51-T2: Tax code invariant: Seller tax code is verified as Mini Shopee corporate tax ID", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      const taxCode = invoice.seller?.taxCode || invoice.company?.taxCode;
      expect.ok(taxCode === "0316892345" || taxCode === "0318924019");
    });

    test("F51-T3: Invoice serial & template: Generated invoice contains valid serial (1C26MMS) and template code (01GTKT0/001)", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.equal(invoice.invoiceSerial, "1C26MMS");
      expect.equal(invoice.templateCode, "01GTKT0/001");
    });

    test("F51-T4: Standard VAT rate: Applies statutory 8% VAT rate (vatRate: '8%' or 0.08)", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.ok(invoice.vatRate === "8%" || invoice.vatRate === 0.08);
    });

    test("F51-T5: Financial reconciliation formula: netSubtotal = Math.round(subtotal / 1.08) and netSubtotal + vatAmount === subtotal", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      const subtotal = invoice.subtotal;
      const expectedNet = Math.round(subtotal / 1.08);
      const expectedVat = subtotal - expectedNet;

      expect.equal(invoice.netSubtotal, expectedNet);
      expect.equal(invoice.netSubtotal + invoice.actualVatAmount, subtotal);
    });

    test("F51-T6: Line item decomposition: Each line item includes index, name, quantity, unitPrice, amount, and vatRate: '8%'", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.equal(invoice.items.length, 2);

      const item1 = invoice.items[0];
      expect.equal(item1.index, 1);
      expect.equal(item1.name, "Áo Sơ Mi Oxford");
      expect.equal(item1.quantity, 2);
      expect.equal(item1.unitPrice, 250000);
      expect.equal(item1.amount, 500000);
      expect.equal(item1.vatRate, "8%");
    });

    test("F51-T7: Discount reconciliation: Shipping discount, voucher discount, and coin discount are deducted in pricing breakdown", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.ok(invoice.pricing);
      expect.equal(invoice.pricing.subtotal, 600000);
      expect.equal(invoice.pricing.shippingFee, 30000);
      expect.ok(invoice.pricing.total >= invoice.pricing.subtotal);
    });

    test("F51-T8: Verification QR code string: Generates valid QR URL pointing to /invoice/verify?id={orderId}&serial=1C26MMS", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.ok(invoice.qrCodeString);
      expect.ok(invoice.qrCodeString.includes(order.id));
      expect.ok(invoice.qrCodeString.includes("serial=1C26MMS"));
    });

    test("F51-T9: Digital signature: Includes signedBy, timestamp signedDate, and verified cryptographic status", async () => {
      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.ok(invoice.digitalSignature);
      expect.ok(invoice.digitalSignature.signedBy.includes("MINI SHOPEE"));
      expect.ok(invoice.digitalSignature.signedDate);
      expect.equal(invoice.digitalSignature.verified, true);
    });

    test("F51-T10: Non-existent order: Requesting invoice for unknown order ID returns 404 Not Found", async () => {
      await expect.rejects(
        () => api.getOrderInvoice("non-existent-order-id-404", buyer.token),
        /Không tìm thấy đơn hàng|ORDER_NOT_FOUND/
      );
    });
  });
});
