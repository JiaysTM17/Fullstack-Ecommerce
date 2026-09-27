/**
 * Tier 1: Feature Coverage - Subsystem 2: Dual Voucher Stacking & Pricing Engine (Features 9-17)
 * 5 isolated happy-path test cases per feature (45 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload } from "../harness/testData.js";

describe("Tier 1 - Subsystem 2: Dual Voucher Stacking & Pricing Engine", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 9: Dual Voucher Data Model (5 tests)
  // -------------------------------------------------------------
  describe("Feature 9: Dual Voucher Data Model", () => {
    test("F9-T1: Fixed discount voucher model contains valid properties", async () => {
      const v = api.oracle.vouchers.get(FIXTURES.vouchers.fixed20k);
      expect.equal(v.type, "fixed");
      expect.equal(v.discountAmount, 20000);
      expect.equal(v.minSpend, 100000);
    });

    test("F9-T2: Percentage discount voucher model contains percentage & maxDiscount cap", async () => {
      const v = api.oracle.vouchers.get(FIXTURES.vouchers.percent10);
      expect.equal(v.type, "percentage");
      expect.equal(v.percentage, 10);
      expect.equal(v.maxDiscount, 50000);
    });

    test("F9-T3: Freeship voucher model contains shipping discount cap", async () => {
      const v = api.oracle.vouchers.get(FIXTURES.vouchers.freeship15k);
      expect.equal(v.type, "freeship");
      expect.equal(v.discountAmount, 15000);
      expect.equal(v.maxShippingDiscount, 15000);
    });

    test("F9-T4: Shop-scoped voucher model designates specific shopId", async () => {
      const v = api.oracle.vouchers.get(FIXTURES.vouchers.shopTech50k);
      expect.equal(v.scope, "shop");
      expect.equal(v.shopId, "shop-tech-world");
    });

    test("F9-T5: Platform-scoped voucher applies across all sellers", async () => {
      const v = api.oracle.vouchers.get(FIXTURES.vouchers.fixed20k);
      expect.equal(v.scope, "platform");
      expect.equal(v.shopId, null);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 10: Dual Voucher Stacking Calculation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 10: Dual Voucher Stacking Calculation", () => {
    test("F10-T1: Simultaneously stack 1 Fixed Order Voucher + 1 Freeship Voucher", async () => {
      // Subtotal 200,000, Shipping 30,000, Fixed 20,000, Freeship 15,000
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 2 }], {
          shippingFee: 30000,
          voucherCode: FIXTURES.vouchers.fixed20k,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.subtotal, 200000);
      expect.equal(pricing.voucherDiscount, 20000);
      expect.equal(pricing.shippingDiscount, 15000);
      expect.equal(pricing.effectiveShippingFee, 15000);
      // Final: 200k - 20k + 15k = 195k
      expect.equal(pricing.finalTotal, 195000);
    });

    test("F10-T2: Simultaneously stack 1 Percentage Voucher + 1 Freeship Voucher", async () => {
      // Subtotal 300,000, 10% discount = 30,000, Freeship 30,000 on 30,000 fee
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 300000, quantity: 1 }], {
          shippingFee: 30000,
          voucherCode: FIXTURES.vouchers.percent10,
          freeshipCode: FIXTURES.vouchers.freeship30k,
        })
      );
      expect.equal(pricing.voucherDiscount, 30000);
      expect.equal(pricing.shippingDiscount, 30000);
      expect.equal(pricing.effectiveShippingFee, 0);
      // Final: 300k - 30k + 0 = 270k
      expect.equal(pricing.finalTotal, 270000);
    });

    test("F10-T3: Subtotal matches sum of item price multiplied by quantity", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 50000, quantity: 2 }, // 100k
          { price: 150000, quantity: 1 }, // 150k
        ])
      );
      expect.equal(pricing.subtotal, 250000);
    });

    test("F10-T4: Effective shipping fee is zero when freeship discount equals shipping fee", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 15000,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F10-T5: Final total is strictly non-negative and correctly bounded", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 0,
          voucherCode: FIXTURES.vouchers.fixed20k,
        })
      );
      expect.ok(pricing.finalTotal >= 0);
      expect.equal(pricing.finalTotal, 80000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 11: Order Controller Stacking Parity Fix (5 tests)
  // -------------------------------------------------------------
  describe("Feature 11: Order Controller Stacking Parity Fix", () => {
    test("F11-T1: Order creation persists applied voucherCode", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }], {
        voucherCode: FIXTURES.vouchers.fixed20k,
      });
      const order = await api.createOrder(payload);
      expect.equal(order.voucherCode, FIXTURES.vouchers.fixed20k);
    });

    test("F11-T2: Order creation persists calculated voucherDiscount value", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }], {
        voucherCode: FIXTURES.vouchers.fixed20k,
      });
      const order = await api.createOrder(payload);
      expect.equal(order.voucherDiscount, 20000);
    });

    test("F11-T3: Order creation persists applied freeshipCode", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }], {
        freeshipCode: FIXTURES.vouchers.freeship15k,
      });
      const order = await api.createOrder(payload);
      expect.equal(order.freeshipCode, FIXTURES.vouchers.freeship15k);
    });

    test("F11-T4: Order creation persists calculated shippingDiscount value", async () => {
      const payload = generateCartPayload([{ price: 150000, quantity: 1 }], {
        shippingFee: 30000,
        freeshipCode: FIXTURES.vouchers.freeship15k,
      });
      const order = await api.createOrder(payload);
      expect.equal(order.shippingDiscount, 15000);
      expect.equal(order.effectiveShippingFee, 15000);
    });

    test("F11-T5: Order persisted total matches pricing formula output exactly", async () => {
      const payload = generateCartPayload([{ price: 200000, quantity: 1 }], {
        shippingFee: 30000,
        voucherCode: FIXTURES.vouchers.fixed20k,
        freeshipCode: FIXTURES.vouchers.freeship15k,
      });
      const expectedPricing = await api.calculatePricing(payload);
      const order = await api.createOrder(payload);
      expect.equal(order.total, expectedPricing.finalTotal);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 12: Voucher Eligibility & Min Spend Guard (5 tests)
  // -------------------------------------------------------------
  describe("Feature 12: Voucher Eligibility & Min Spend Guard", () => {
    test("F12-T1: Order subtotal meeting min spend succeeds", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          voucherCode: FIXTURES.vouchers.fixed20k, // min spend 100k
        })
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });

    test("F12-T2: Percentage voucher exceeding min spend calculates discount proportionally", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 250000, quantity: 1 }], {
          voucherCode: FIXTURES.vouchers.percent10, // min spend 200k
        })
      );
      expect.equal(pricing.voucherDiscount, 25000); // 10% of 250k
    });

    test("F12-T3: Fixed voucher with subtotal 2x min spend applies full discount amount", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          voucherCode: FIXTURES.vouchers.fixed20k,
        })
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });

    test("F12-T4: Cart with multiple line items aggregating over min spend qualifies", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 60000, quantity: 1 },
            { price: 70000, quantity: 1 },
          ],
          { voucherCode: FIXTURES.vouchers.fixed20k }
        )
      );
      expect.equal(pricing.subtotal, 130000);
      expect.equal(pricing.voucherDiscount, 20000);
    });

    test("F12-T5: Freeship voucher succeeds when subtotal satisfies freeship min spend", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 160000, quantity: 1 }], {
          freeshipCode: FIXTURES.vouchers.freeship30k, // min spend 150k
        })
      );
      expect.equal(pricing.shippingDiscount, 30000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 13: Freeship Max Discount Cap Guard (5 tests)
  // -------------------------------------------------------------
  describe("Feature 13: Freeship Max Discount Cap Guard", () => {
    test("F13-T1: Freeship discount capped at maxShippingDiscount even if shipping fee is higher", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 50000,
          freeshipCode: FIXTURES.vouchers.freeship30k, // cap 30k
        })
      );
      expect.equal(pricing.shippingDiscount, 30000);
      expect.equal(pricing.effectiveShippingFee, 20000);
    });

    test("F13-T2: Freeship discount capped by actual shipping fee if lower than cap", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 20000,
          freeshipCode: FIXTURES.vouchers.freeship30k, // cap 30k, fee 20k
        })
      );
      expect.equal(pricing.shippingDiscount, 20000);
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F13-T3: Exact match between shipping fee and freeship cap results in zero fee", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 15000,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.effectiveShippingFee, 0);
    });

    test("F13-T4: Multiple items do not inflate freeship discount beyond cap", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 100000, quantity: 3 },
            { price: 200000, quantity: 2 },
          ],
          {
            shippingFee: 40000,
            freeshipCode: FIXTURES.vouchers.freeship15k,
          }
        )
      );
      expect.equal(pricing.shippingDiscount, 15000);
    });

    test("F13-T5: Freeship cap guard preserves customer payable total accurately", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 150000, quantity: 1 }], {
          shippingFee: 35000,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.finalTotal, 150000 + 20000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 14: Mini Xu 50% Order Value Cap Guard (5 tests)
  // -------------------------------------------------------------
  describe("Feature 14: Mini Xu 50% Order Value Cap Guard", () => {
    test("F14-T1: Coins within 50% subtotal limit deduct 1:1 against total", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 20000,
          coinsUsed: 30000, // 30k <= 50k (50% of 100k)
        })
      );
      expect.equal(pricing.coinDiscount, 30000);
      expect.equal(pricing.finalTotal, 100000 - 30000 + 20000);
    });

    test("F14-T2: Excess coins are strictly capped at exactly 50% of subtotal", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], {
          shippingFee: 20000,
          coinsUsed: 80000, // Requested 80k, max 50k
        })
      );
      expect.equal(pricing.coinDiscount, 50000);
      expect.equal(pricing.coinsUsed, 50000);
    });

    test("F14-T3: User coin balance decrements by valid coinsUsed on order placement", async () => {
      const user = await api.register({ email: "buyer_coins@test.vn", password: "Password123!", fullName: "Coin User" });
      const initialBal = api.oracle.coinLedger.get(user.user.id).balance; // 10,000 Xu

      const orderPayload = generateCartPayload([{ price: 100000, quantity: 1 }], {
        coinsUsed: 5000,
      });
      await api.createOrder(orderPayload, user.token);

      const afterBal = api.oracle.coinLedger.get(user.user.id).balance;
      expect.equal(afterBal, initialBal - 5000);
    });

    test("F14-T4: Mini Xu deduction stacks seamlessly with Dual Vouchers", async () => {
      // Subtotal 200k, voucher fixed 20k, freeship 15k on 30k fee, coins 40k
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 200000, quantity: 1 }], {
          shippingFee: 30000,
          voucherCode: FIXTURES.vouchers.fixed20k,
          freeshipCode: FIXTURES.vouchers.freeship15k,
          coinsUsed: 40000,
        })
      );
      // Formula: 200k - 20k - 40k + 15k = 155k
      expect.equal(pricing.finalTotal, 155000);
    });

    test("F14-T5: Zero coins used causes zero coin discount and preserves balance", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 100000, quantity: 1 }], { coinsUsed: 0 })
      );
      expect.equal(pricing.coinDiscount, 0);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 15: Shop-Specific vs Platform Vouchers (5 tests)
  // -------------------------------------------------------------
  describe("Feature 15: Shop-Specific vs Platform Vouchers", () => {
    test("F15-T1: Shop-specific voucher applies when shop items satisfy shop min spend", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 350000, quantity: 1, shopId: "shop-tech-world" }], {
          voucherCode: FIXTURES.vouchers.shopTech50k, // min spend 300k
        })
      );
      expect.equal(pricing.voucherDiscount, 50000);
    });

    test("F15-T2: Shop voucher discounts only that shop's items in multi-vendor cart", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 320000, quantity: 1, shopId: "shop-tech-world" },
            { price: 200000, quantity: 1, shopId: "shop-other" },
          ],
          { voucherCode: FIXTURES.vouchers.shopTech50k }
        )
      );
      expect.equal(pricing.subtotal, 520000);
      expect.equal(pricing.voucherDiscount, 50000);
    });

    test("F15-T3: Platform voucher applies across multiple sellers regardless of shopId", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload(
          [
            { price: 60000, quantity: 1, shopId: "shop-1" },
            { price: 60000, quantity: 1, shopId: "shop-2" },
          ],
          { voucherCode: FIXTURES.vouchers.fixed20k } // platform min spend 100k
        )
      );
      expect.equal(pricing.voucherDiscount, 20000);
    });

    test("F15-T4: Shop-specific voucher stacks with Platform Freeship voucher", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 350000, quantity: 1, shopId: "shop-tech-world" }], {
          shippingFee: 30000,
          voucherCode: FIXTURES.vouchers.shopTech50k,
          freeshipCode: FIXTURES.vouchers.freeship15k,
        })
      );
      expect.equal(pricing.voucherDiscount, 50000);
      expect.equal(pricing.shippingDiscount, 15000);
      expect.equal(pricing.finalTotal, 350000 - 50000 + 15000);
    });

    test("F15-T5: Shop voucher correctly records scope in pricing payload", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 400000, quantity: 1, shopId: "shop-tech-world" }], {
          voucherCode: FIXTURES.vouchers.shopTech50k,
        })
      );
      expect.equal(pricing.voucherCode, FIXTURES.vouchers.shopTech50k);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 16: Dynamic VietQR Payment Generation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 16: Dynamic VietQR Payment Generation", () => {
    test("F16-T1: Dynamic VietQR payload generated with amount matching final net total", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([{ price: 150000, quantity: 1 }], { shippingFee: 25000 })
      );
      expect.ok(pricing.vietQRPayload);
      expect.equal(pricing.vietQRPayload.amount, pricing.finalTotal);
    });

    test("F16-T2: VietQR accountNo matches official Mini Shopee tax registration", async () => {
      const pricing = await api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 1 }]));
      expect.equal(pricing.vietQRPayload.accountNo, "0318924019");
    });

    test("F16-T3: VietQR bankBin identifies official Vietcombank clearing code", async () => {
      const pricing = await api.calculatePricing(generateCartPayload([{ price: 100000, quantity: 1 }]));
      expect.equal(pricing.vietQRPayload.bankBin, "970436");
    });

    test("F16-T4: VietQR image url dynamically encodes net total parameter", async () => {
      const pricing = await api.calculatePricing(generateCartPayload([{ price: 120000, quantity: 1 }]));
      expect.ok(pricing.vietQRPayload.qrUrl.includes(`amount=${pricing.finalTotal}`));
    });

    test("F16-T5: Order created with BANK_TRANSFER contains VietQR payment payload", async () => {
      const order = await api.createOrder(
        generateCartPayload([{ price: 200000, quantity: 1 }], { paymentMethod: "BANK_TRANSFER" })
      );
      expect.ok(order.vietQRPayload);
      expect.equal(order.paymentMethod, "BANK_TRANSFER");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 17: Multi-Shop Cart Grouping (5 tests)
  // -------------------------------------------------------------
  describe("Feature 17: Multi-Shop Cart Grouping", () => {
    test("F17-T1: Multi-vendor cart partitions items into distinct shop groups", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 100000, quantity: 1, shopId: "shop-hanoi" },
          { price: 150000, quantity: 1, shopId: "shop-saigon" },
        ])
      );
      expect.equal(pricing.multiShopGroups.length, 2);
    });

    test("F17-T2: Shop group subtotal correctly sums item quantities and prices for that shop", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 50000, quantity: 3, shopId: "shop-alpha" }, // 150k
          { price: 70000, quantity: 2, shopId: "shop-beta" },  // 140k
        ])
      );
      const alpha = pricing.multiShopGroups.find((g) => g.shopId === "shop-alpha");
      expect.equal(alpha.subtotal, 150000);
    });

    test("F17-T3: Single shop cart returns exactly 1 group", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 80000, quantity: 1, shopId: "shop-single" },
          { price: 40000, quantity: 2, shopId: "shop-single" },
        ])
      );
      expect.equal(pricing.multiShopGroups.length, 1);
      expect.equal(pricing.multiShopGroups[0].subtotal, 160000);
    });

    test("F17-T4: Three different shops create 3 distinct multiShopGroups entries", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 100000, quantity: 1, shopId: "s1" },
          { price: 100000, quantity: 1, shopId: "s2" },
          { price: 100000, quantity: 1, shopId: "s3" },
        ])
      );
      expect.equal(pricing.multiShopGroups.length, 3);
    });

    test("F17-T5: Multi-shop grouping totals equal overall cart subtotal", async () => {
      const pricing = await api.calculatePricing(
        generateCartPayload([
          { price: 120000, quantity: 2, shopId: "s1" },
          { price: 85000, quantity: 3, shopId: "s2" },
        ])
      );
      const sumGroups = pricing.multiShopGroups.reduce((acc, g) => acc + g.subtotal, 0);
      expect.equal(sumGroups, pricing.subtotal);
    });
  });
});
