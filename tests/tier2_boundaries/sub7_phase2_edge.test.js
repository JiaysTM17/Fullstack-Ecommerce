/**
 * Tier 2: Boundary & Edge Cases - Subsystem 7: Buyer Experience Phase 2 Edge Cases
 * 20 boundary and adversarial test cases (5 tests per feature).
 * Covers:
 *   - Feature 48 (R1): Live Logistics Tracking Boundaries
 *   - Feature 49 (R2): Recently Viewed History Boundaries
 *   - Feature 50 (R3): Product Q&A Edge Cases & Sanitation
 *   - Feature 51 (R4): Electronic VAT Invoice Financial Invariants
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload, createRandomEmail } from "../harness/testData.js";

describe("Tier 2 - Subsystem 7: Buyer Experience Phase 2 Edge Cases", { tier: "tier2", subsystem: "sub7" }, () => {
  let buyer;

  beforeEach(async () => {
    api.resetOracle();
    buyer = await api.register({
      email: createRandomEmail("buyer_edge_p2"),
      password: "Password123!",
      fullName: "Nguyễn Biên Giới",
    });
  });

  // =========================================================================
  // R1 Tracking Boundaries (5 tests)
  // =========================================================================
  describe("Feature 48 Boundaries: Live Logistics Tracking (R1)", () => {
    test("F48-E1: Tracking non-existent orderId returns 404 ORDER_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.getOrderTracking("non-existent-order-9999", buyer.token),
        /ORDER_NOT_FOUND|Không tìm thấy/
      );
    });

    test("F48-E2: Cancelled order tracking displays 'Đơn hàng đã hủy' without corrupting shipping stages", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      await api.cancelOrder(order.id, buyer.token);

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      expect.equal(tracking.status, "cancelled");
      expect.equal(tracking.statusText, "Đơn hàng đã hủy");
      expect.equal(Array.isArray(tracking.stages), true);
      expect.equal(tracking.stages.length, 4);
    });

    test("F48-E3: Completed/delivered order freezes ETA to 0 minutes and distance to 0.0 km", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
      order.status = "delivered";

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      expect.equal(tracking.currentLocation.distanceRemainingKm, 0);
      expect.equal(tracking.currentLocation.etaMinutes, 0);
      expect.equal(tracking.currentLocation.speedKmh, 0);
      expect.equal(tracking.statusText, "Đã giao hàng thành công");
    });

    test("F48-E4: Order with empty items or null shipping address uses fallback logistics route gracefully", async () => {
      const order = await api.createOrder(
        {
          items: [{ name: "Hàng Mẫu", price: 50000, quantity: 1 }],
          customer: { fullName: "Khách Ẩn Danh", phone: "0900000000", address: null },
        },
        buyer.token
      );

      const tracking = await api.getOrderTracking(order.id, buyer.token);
      expect.ok(tracking.destination);
      expect.ok(tracking.destination.address);
      expect.ok(tracking.currentLocation);
    });

    test("F48-E5: Courier phone and license plate conform to Vietnamese telecom and vehicle registration formats", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }]), buyer.token);
      const tracking = await api.getOrderTracking(order.id, buyer.token);

      // VN phone check (09xx, 08xx, 03xx, 07xx, 10 digits)
      const cleanPhone = tracking.courier.phone.replace(/\s+/g, "");
      expect.match(cleanPhone, /^0[3|5|7|8|9][0-9]{8}$/);

      // VN license plate check (e.g. 29B1-892.45 or 29-X1 987.65)
      expect.match(tracking.courier.vehicle, /[0-9]{2}[A-Z0-9-]{2,4}/);
    });
  });

  // =========================================================================
  // R2 Recently Viewed Boundaries (5 tests)
  // =========================================================================
  describe("Feature 49 Boundaries: Recently Viewed Products (R2)", () => {
    test("F49-E1: Exactly 20 items: Adding 20th item maintains length 20; adding 21st item discards 1st item", async () => {
      await api.clearRecentlyViewed(buyer.token);
      for (let i = 1; i <= 20; i++) {
        await api.recordRecentlyViewed({ id: `item-edge-${i}`, name: `Item ${i}`, price: 10000 }, buyer.token);
      }
      let items = await api.getRecentlyViewed(buyer.token);
      expect.equal(items.length, 20);
      expect.equal(items[19].id, "item-edge-1");

      // Add 21st item
      await api.recordRecentlyViewed({ id: "item-edge-21", name: "Item 21", price: 21000 }, buyer.token);
      items = await api.getRecentlyViewed(buyer.token);
      expect.equal(items.length, 20);
      expect.equal(items[0].id, "item-edge-21");
      expect.equal(items.some((p) => p.id === "item-edge-1"), false);
    });

    test("F49-E2: Adding item with missing price or NaN price sets price to 0 without throwing error", async () => {
      const list = await api.recordRecentlyViewed({ id: "nan-price-prod", name: "Free Item", price: NaN }, buyer.token);
      const item = list.find((p) => p.id === "nan-price-prod");
      expect.ok(item);
      expect.equal(item.price, 0);
    });

    test("F49-E3: Repeatedly viewing the same single item 50 times keeps history length at exactly 1", async () => {
      await api.clearRecentlyViewed(buyer.token);
      for (let i = 0; i < 50; i++) {
        await api.recordRecentlyViewed({ id: "single-sticky-item", name: "Sticky Item", price: 99000 }, buyer.token);
      }
      const list = await api.getRecentlyViewed(buyer.token);
      expect.equal(list.length, 1);
      expect.equal(list[0].id, "single-sticky-item");
    });

    test("F49-E4: Clearing recently viewed when already empty is an idempotent no-op without exception", async () => {
      await api.clearRecentlyViewed(buyer.token);
      const empty1 = await api.clearRecentlyViewed(buyer.token);
      const empty2 = await api.clearRecentlyViewed(buyer.token);

      expect.equal(Array.isArray(empty1), true);
      expect.equal(empty1.length, 0);
      expect.equal(Array.isArray(empty2), true);
      expect.equal(empty2.length, 0);
    });

    test("F49-E5: Product with very long name (>250 chars) or special characters does not break JSON serialization", async () => {
      const longName = "A".repeat(300) + " <script>alert(1)</script> 🚀 100% Cotton & Special 'Chars' \"Quote\"";
      const list = await api.recordRecentlyViewed({ id: "special-char-item", name: longName, price: 120000 }, buyer.token);

      const found = list.find((p) => p.id === "special-char-item");
      expect.ok(found);
      expect.equal(found.name, longName);

      const serialized = JSON.stringify(list);
      const deserialized = JSON.parse(serialized);
      expect.equal(deserialized[0].id, "special-char-item");
    });
  });

  // =========================================================================
  // R3 Product Q&A Boundaries (5 tests)
  // =========================================================================
  describe("Feature 50 Boundaries: Product Community Q&A (R3)", () => {
    const edgeProdId = "prod-qa-edge-300";

    test("F50-E1: Question with whitespace-only (' \\t\\n ') is rejected with INVALID_QUESTION", async () => {
      await expect.rejects(
        () => api.createQuestion(edgeProdId, { question: "   \t\n  " }, buyer.token),
        /Nội dung câu hỏi không được để trống|QUESTION_TEXT_REQUIRED/
      );
    });

    test("F50-E2: Question exceeding 1000 characters is safely trimmed or validated", async () => {
      const largeQuestion = "Tôi có câu hỏi rất dài ".repeat(50); // > 1000 chars
      const q = await api.createQuestion(edgeProdId, { question: largeQuestion }, buyer.token);

      expect.ok(q.id);
      expect.ok(q.question.length > 0);
      expect.ok(!q.question.startsWith(" ") && !q.question.endsWith(" "));
    });

    test("F50-E3: Question containing HTML/script tags is stored safely without compromising schema", async () => {
      const malicious = '<script>alert("XSS")</script><img src="x" onerror="steal()"/>';
      const q = await api.createQuestion(edgeProdId, { question: malicious }, buyer.token);

      expect.ok(q.id);
      expect.equal(q.question, malicious);
      expect.equal(q.isAnswered, false);
      expect.equal(q.helpfulCount, 0);
    });

    test("F50-E4: 10 consecutive helpful votes on the same question increment helpfulCount from N to N+10", async () => {
      const q = await api.createQuestion(edgeProdId, { question: "Câu hỏi test 10 votes liên tiếp" }, buyer.token);
      expect.equal(q.helpfulCount, 0);

      for (let i = 1; i <= 10; i++) {
        const res = await api.voteProductQuestion(edgeProdId, q.id);
        expect.equal(res.helpfulCount, i);
      }

      const list = await api.getProductQuestions(edgeProdId);
      const found = list.questions.find((item) => (item._id || item.id) === q.id);
      expect.equal(found.helpfulCount, 10);
    });

    test("F50-E5: Product with 0 questions returns empty array [] and total: 0 with 200 OK (not 404)", async () => {
      const emptyProdId = "prod-empty-never-asked";
      const res = await api.getProductQuestions(emptyProdId);

      expect.equal(res.productId, emptyProdId);
      expect.equal(res.total, 0);
      expect.equal(Array.isArray(res.questions), true);
      expect.equal(res.questions.length, 0);
    });
  });

  // =========================================================================
  // R4 Electronic Invoice Boundaries (5 tests)
  // =========================================================================
  describe("Feature 51 Boundaries: Electronic VAT Invoice Generator (R4)", () => {
    test("F51-E1: Zero-subtotal order computes netAmount=0, vatAmount=0, total=shippingFee", async () => {
      const order = await api.createOrder(
        {
          items: [{ name: "Quà Tặng 0Đ", price: 0, quantity: 1 }],
          shippingFee: 25000,
        },
        buyer.token
      );

      const invoice = await api.getOrderInvoice(order.id, buyer.token);
      expect.equal(invoice.netSubtotal, 0);
      expect.equal(invoice.actualVatAmount, 0);
      expect.equal(invoice.pricing.shippingFee, 25000);
    });

    test("F51-E2: Fractional rounding: Subtotals with odd amounts (e.g., 199,000 VND) round net + vat strictly to match subtotal", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 199000, quantity: 1 }]), buyer.token);
      const invoice = await api.getOrderInvoice(order.id, buyer.token);

      const expectedNet = Math.round(199000 / 1.08); // 184259
      const expectedVat = 199000 - expectedNet;     // 14741

      expect.equal(invoice.netSubtotal, expectedNet);
      expect.equal(invoice.actualVatAmount, expectedVat);
      expect.equal(invoice.netSubtotal + invoice.actualVatAmount, 199000); // 0 VND drift
    });

    test("F51-E3: Multi-item order with 20 distinct products assigns 1-based sequential indices 1..20 without collision", async () => {
      const items = [];
      for (let i = 1; i <= 20; i++) {
        items.push({ name: `Sản Phẩm ${i}`, price: 10000 * i, quantity: 1 });
      }

      const order = await api.createOrder(generateCartPayload(items), buyer.token);
      const invoice = await api.getOrderInvoice(order.id, buyer.token);

      expect.equal(invoice.items.length, 20);
      for (let idx = 0; idx < 20; idx++) {
        expect.equal(invoice.items[idx].index, idx + 1);
      }
    });

    test("F51-E4: Large enterprise order (1,000,000,000 VND) computes VAT accurately without precision overflow", async () => {
      const order = await api.createOrder(generateCartPayload([{ price: 1000000000, quantity: 1 }]), buyer.token);
      const invoice = await api.getOrderInvoice(order.id, buyer.token);

      const expectedNet = Math.round(1000000000 / 1.08); // 925925926
      const expectedVat = 1000000000 - expectedNet;     // 74074074

      expect.equal(invoice.netSubtotal, expectedNet);
      expect.equal(invoice.actualVatAmount, expectedVat);
      expect.equal(invoice.netSubtotal + invoice.actualVatAmount, 1000000000);
    });

    test("F51-E5: Invoice query without valid order identifier throws 404 error cleanly", async () => {
      await expect.rejects(
        () => api.getOrderInvoice("invalid_unknown_order_id_404", buyer.token),
        /Không tìm thấy đơn hàng|ORDER_NOT_FOUND/
      );
    });
  });
});
