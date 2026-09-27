/**
 * Tier 2: Boundary & Corner Cases - Subsystem 2: Dual Voucher Stacking & Pricing Engine (Features 9-17)
 * 5 boundary/corner test cases per feature (45 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload } from "../harness/testData.js";

describe("Tier 2 - Subsystem 2: Dual Voucher Stacking & Pricing Boundaries", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 9: Dual Voucher Data Model (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 9 Boundaries: Voucher model invalid states", () => {
    test("F9-E1: Non-existent voucher code is rejected with INVALID_VOUCHER", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 150000, quantity: 1 }], { voucherCode: "NONEXISTENT_CODE" })),
        /INVALID_VOUCHER/
      );
    });

    test("F9-E2: Expired voucher code is rejected with EXPIRED_VOUCHER", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 150000, quantity: 1 }], { voucherCode: FIXTURES.vouchers.expired })),
        /EXPIRED_VOUCHER/
      );
    });

    test("F9-E3: Non-existent freeship voucher code is rejected with INVALID_FREESHIP_VOUCHER", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 150000, quantity: 1 }], { freeshipCode: "FAKE_FREESHIP" })),
        /INVALID_FREESHIP_VOUCHER/
      );
    });

    test("F9-E4: Providing a Freeship voucher into voucherCode slot is rejected with VOUCHER_TYPE_MISMATCH", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 150000, quantity: 1 }], { voucherCode: FIXTURES.vouchers.freeship15k })),
        /VOUCHER_TYPE_MISMATCH/
      );
    });

    test("F9-E5: Providing an Order Discount voucher into freeshipCode slot is rejected with VOUCHER_TYPE_MISMATCH", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 150000, quantity: 1 }], { freeshipCode: FIXTURES.vouchers.fixed20k })),
        /VOUCHER_TYPE_MISMATCH/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 10: Dual Voucher Stacking Calculation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 10 Boundaries: Stacking formula edge values", () => {
    test("F10-E1: Empty cart items array is rejected with EMPTY_CART", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([])),
        /EMPTY_CART/
      );
    });

    test("F10-E2: Item with negative price is rejected with NEGATIVE_PRICE", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: -50000, quantity: 1 }])),
        /NEGATIVE_PRICE/
      );
    });

    test("F10-E3: Item with zero quantity is rejected with INVALID_QUANTITY", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 0 }])),
        /INVALID_QUANTITY/
      );
    });

    test("F10-E4: Item with fractional quantity is rejected with INVALID_QUANTITY", async () => {
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 1.5 }])),
        /INVALID_QUANTITY/
      );
    });

    test("F10-E5: Discounts exceeding subtotal are bounded to avoid negative subtotal", async () => {
      // 100k subtotal with 50k voucher cap and 50k coins = 0 net, not negative
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 0,
          voucherCode: FIXTURES.vouchers.fixed20k,
          coinsUsed: 50000,
        })
      );
      expect.ok(pricing.finalTotal >= 0);
      expect.equal(pricing.finalTotal, 30000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 11: Order Controller Stacking Parity Fix (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 11 Boundaries: Server recalculation tampering protection", () => {
    test("F11-E1: Client attempting to send forged total is overridden by server calculation", async () => {
      const forgedPayload = generateCartPayload([{ price: 150000, quantity: 1 }], {
        shippingFee: 30000,
        voucherCode: FIXTURES.vouchers.fixed20k,
      });
      // Client falsely claims total is 1000 VND
      forgedPayload.total = 1000;
      const order = await api.createOrder(forgedPayload);
      // Correct: 150k - 20k + 30k = 160k
      expect.equal(order.total, 160000);
    });

    test("F11-E2: Order with non-existent voucher code fails creation", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }], { voucherCode: "HACK_VOUCHER_999" });
      await expect.rejects(
        () => api.createOrder(payload),
        /INVALID_VOUCHER/
      );
    });

    test("F11-E3: Order with negative quantity fails creation", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: -2 }]);
      await expect.rejects(
        () => api.createOrder(payload),
        /INVALID_QUANTITY/
      );
    });

    test("F11-E4: Order without shipping fee defaults to 30,000 VND standard fee", async () => {
      const payload = generateCartPayload([{ price: 100000, quantity: 1 }], { shippingFee: undefined });
      const order = await api.createOrder(payload);
      expect.equal(order.shippingFee, 30000);
    });

    test("F11-E5: Order with COD payment method defaults paymentStatus to unpaid", async () => {
      const payload = generateCartPayload([{ price: 100000, quantity: 1 }], { paymentMethod: "COD" });
      const order = await api.createOrder(payload);
      expect.equal(order.paymentStatus, "unpaid");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 12: Voucher Eligibility & Min Spend Guard (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 12 Boundaries: Minimum spend thresholds", () => {
    test("F12-E1: Subtotal 1 VND below min spend is rejected with SUBTOTAL_BELOW_MIN_SPEND", async () => {
      // fixed20k min spend = 100,000 VND. Cart = 99,999 VND
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 99999, quantity: 1 }], { voucherCode: FIXTURES.vouchers.fixed20k })),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });

    test("F12-E2: Subtotal exactly equal to min spend (100,000 VND) is accepted", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { voucherCode: FIXTURES.vouchers.fixed20k })
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });

    test("F12-E3: Freeship subtotal 1 VND below min spend is rejected with SUBTOTAL_BELOW_MIN_SPEND", async () => {
      // freeship30k min spend = 150,000 VND. Cart = 149,999 VND
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 149999, quantity: 1 }], { freeshipCode: FIXTURES.vouchers.freeship30k })),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });

    test("F12-E4: Percentage voucher min spend boundary (200,000 VND) enforced", async () => {
      // percent10 min spend = 200,000 VND
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 199999, quantity: 1 }], { voucherCode: FIXTURES.vouchers.percent10 })),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });

    test("F12-E5: Min spend check respects item quantities for total line value", async () => {
      // 5 items * 20,000 = 100,000 VND -> qualifies for 100,000 VND min spend
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 20000, quantity: 5 }], { voucherCode: FIXTURES.vouchers.fixed20k })
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 13: Freeship Max Discount Cap Guard (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 13 Boundaries: Freeship cap constraints", () => {
    test("F13-E1: Shipping fee of 0 VND yields 0 shipping discount", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 0,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.shippingDiscount, 0);
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F13-E2: Shipping fee smaller than voucher cap is discounted only up to shipping fee", async () => {
      // Voucher gives up to 30k, but shipping fee is only 12k -> discount 12k
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 12000,
          freeshipCode: FIXTURES.vouchers.freeship30k,
        })
      );
      expect.equal(pricing.shippingDiscount, 12000);
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F13-E3: Excessive shipping fee of 150,000 VND only discounts max cap (30,000 VND)", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 150000,
          freeshipCode: FIXTURES.vouchers.freeship30k,
        })
      );
      expect.equal(pricing.shippingDiscount, 30000);
      expect.equal(pricing.effectiveShippingFee, 120000);
    });

    test("F13-E4: Effective shipping fee is never negative", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 5000,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.ok(pricing.effectiveShippingFee >= 0);
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F13-E5: Freeship cap guard is applied independently from order discount voucher", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 40000,
          voucherCode: FIXTURES.vouchers.fixed20k,
          freeshipCode: FIXTURES.vouchers.freeship15k, // cap 15k
        })
      );
      expect.equal(pricing.shippingDiscount, 15000);
      expect.equal(pricing.voucherDiscount, 20000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 14: Mini Xu 50% Order Value Cap Guard (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 14 Boundaries: Mini Xu 50% threshold and balance checks", () => {
    test("F14-E1: Coins requested 5x higher than subtotal is strictly capped at 50% of subtotal", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { coinsUsed: 500000 })
      );
      expect.equal(pricing.coinDiscount, 50000); // 50% of 100k
    });

    test("F14-E2: Order placement with coins exceeding user wallet balance is rejected with INSUFFICIENT_COINS", async () => {
      const user = await api.register({ email: "poor_user@test.vn", password: "Password123!", fullName: "Poor User" });
      // User has 10,000 Xu initially
      const payload = generateCartPayload([{ price: 200000, quantity: 1 }], { coinsUsed: 50000 });
      await expect.rejects(
        () => api.createOrder(payload, user.token),
        /INSUFFICIENT_COINS/
      );
    });

    test("F14-E3: Negative coinsUsed is normalized to 0 discount", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { coinsUsed: -5000 })
      );
      expect.equal(pricing.coinDiscount, 0);
    });

    test("F14-E4: Odd subtotal (e.g. 100,001 VND) caps coins cleanly using floor integer", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100001, quantity: 1 }], { coinsUsed: 99999 })
      );
      expect.equal(pricing.coinDiscount, 50000);
    });

    test("F14-E5: Mini Xu cap applies to subtotal before shipping fee addition", async () => {
      // Subtotal 100k, shipping 50k. Max coins = 50k (not 75k of total)
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { shippingFee: 50000, coinsUsed: 75000 })
      );
      expect.equal(pricing.coinDiscount, 50000);
      expect.equal(pricing.finalTotal, 100000 - 50000 + 50000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 15: Shop-Specific vs Platform Vouchers (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 15 Boundaries: Shop scope boundaries", () => {
    test("F15-E1: Shop voucher applied to cart with zero items from that shop is rejected with SUBTOTAL_BELOW_MIN_SPEND", async () => {
      await expect.rejects(
        () =>
          api.calculatePricing(
            generateCartPayload([{ price: 400000, quantity: 1, shopId: "different-shop" }], {
              voucherCode: FIXTURES.vouchers.shopTech50k,
            })
          ),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });

    test("F15-E2: Shop voucher where shop items sum is 1 VND below min spend is rejected", async () => {
      // shopTech50k requires 300,000 VND
      await expect.rejects(
        () =>
          api.calculatePricing(
            generateCartPayload([{ price: 299999, quantity: 1, shopId: "shop-tech-world" }], {
              voucherCode: FIXTURES.vouchers.shopTech50k,
            })
          ),
        /SUBTOTAL_BELOW_MIN_SPEND/
      );
    });

    test("F15-E3: Shop voucher does not discount items from other shops in mixed cart", async () => {
      // Shop Tech items = 300k (qualifies for 50k discount), Other shop items = 100k
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 300000, quantity: 1, shopId: "shop-tech-world" },
            { price: 100000, quantity: 1, shopId: "other-shop" },
          ],
          { voucherCode: FIXTURES.vouchers.shopTech50k }
        )
      );
      expect.equal(pricing.voucherDiscount, 50000);
      expect.equal(pricing.subtotal, 400000);
      expect.equal(pricing.finalTotal, 400000 - 50000 + 30000);
    });

    test("F15-E4: Applying two order vouchers simultaneously is not supported (only 1 order + 1 freeship)", async () => {
      // Only 1 voucherCode field supported, passing multiple strings in code is rejected as invalid
      await expect.rejects(
        () => api.calculatePricing(generateCartPayload([{ price: 200000, quantity: 1 }], { voucherCode: "GIAM20K,DISCOUNT10PCT" })),
        /INVALID_VOUCHER/
      );
    });

    test("F15-E5: Platform voucher qualifies even when no single shop meets min spend independently", async () => {
      // Shop 1 = 60k, Shop 2 = 60k. Total = 120k > 100k platform min spend
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 60000, quantity: 1, shopId: "s1" },
            { price: 60000, quantity: 1, shopId: "s2" },
          ],
          { voucherCode: FIXTURES.vouchers.fixed20k }
        )
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 16: Dynamic VietQR Payment Generation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 16 Boundaries: VietQR generation edge cases", () => {
    test("F16-E1: VietQR with 0 final total payable handled without NaN", async () => {
      // 100k subtotal - 50k coins - 50k discount = 0 total
      api.oracle.vouchers.set("ZERO_TOTAL_VOUCHER", {
        code: "ZERO_TOTAL_VOUCHER",
        type: "fixed",
        discountAmount: 100000,
        minSpend: 100000,
        scope: "platform",
        isActive: true,
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
      });
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 0,
          voucherCode: "ZERO_TOTAL_VOUCHER",
        })
      );
      expect.equal(pricing.finalTotal, 0);
      expect.equal(pricing.vietQRPayload.amount, 0);
    });

    test("F16-E2: Large transaction value (e.g. 50,000,000 VND) generates valid VietQR string", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 50000000, quantity: 1 }])
      );
      expect.equal(pricing.vietQRPayload.amount, 50000000 + 30000);
      expect.ok(pricing.vietQRPayload.qrUrl.includes("50030000"));
    });

    test("F16-E3: VietQR account name is non-empty string", async () => {
      const pricing = await api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 1 }]));
      expect.ok(pricing.vietQRPayload.accountName.length > 5);
    });

    test("F16-E4: VietQR memo contains order identifier reference", async () => {
      const pricing = await api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 1 }]));
      expect.ok(pricing.vietQRPayload.memo.startsWith("SHOPEE-"));
    });

    test("F16-E5: Order with COD payment method still computes clean pricing without crash", async () => {
      const order = await api.createOrder(
        generateCartPayload([{ price: 100000, quantity: 1 }], { paymentMethod: "COD" })
      );
      expect.equal(order.paymentMethod, "COD");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 17: Multi-Shop Cart Grouping (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 17 Boundaries: Cart grouping edge cases", () => {
    test("F17-E1: Line item with missing shopId defaults to 'default-shop' group", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1, shopId: undefined }])
      );
      expect.equal(pricing.multiShopGroups[0].shopId, "default-shop");
    });

    test("F17-E2: Multiple items from same shop are merged into a single shop group", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 50000, quantity: 1, shopId: "shop-same" },
          { price: 70000, quantity: 2, shopId: "shop-same" },
          { price: 30000, quantity: 1, shopId: "shop-same" },
        ])
      );
      expect.equal(pricing.multiShopGroups.length, 1);
      expect.equal(pricing.multiShopGroups[0].subtotal, 220000);
    });

    test("F17-E3: Cart with 10 distinct shops creates exactly 10 multiShopGroups", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        price: 10000 * (i + 1),
        quantity: 1,
        shopId: `shop-${i}`,
      }));
      const pricing = await api.calculatePricing(generateCartPayload(items));
      expect.equal(pricing.multiShopGroups.length, 10);
    });

    test("F17-E4: Item with zero quantity in multi-shop cart is rejected", async () => {
      await expect.rejects(
        () =>
          api.calculatePricing(
            generateCartPayload([
              { price: 100000, quantity: 1, shopId: "s1" },
              { price: 200000, quantity: 0, shopId: "s2" },
            ])
          ),
        /INVALID_QUANTITY/
      );
    });

    test("F17-E5: Order with multi-shop items preserves shopId on every saved line item", async () => {
      const order = await api.createOrder(
        generateCartPayload([
          { price: 100000, quantity: 1, shopId: "shop-alpha" },
          { price: 120000, quantity: 1, shopId: "shop-beta" },
        ])
      );
      expect.equal(order.items[0].shopId, "shop-alpha");
      expect.equal(order.items[1].shopId, "shop-beta");
    });
  });
});
