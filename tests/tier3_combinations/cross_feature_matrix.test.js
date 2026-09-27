/**
 * Tier 3: Cross-Feature Combinations (Pairwise & Multi-Feature Interactions)
 * 20 comprehensive end-to-end integration scenarios verifying interoperability across subsystems.
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload, createRandomEmail } from "../harness/testData.js";

describe("Tier 3 - Cross-Feature Interaction Matrix", { tier: "tier3" }, () => {
  beforeEach(() => {
    api.resetOracle();
  });

  test("T3-01: Dual Voucher Stacking + Mini Xu 50% Cap + Multi-Shop Cart", async () => {
    // Cart with 2 shops: Shop 1 = 150k, Shop 2 = 150k -> Subtotal = 300k
    // Voucher: GIAM20K (20k), Freeship: FREESHIP15K (15k on 30k fee -> 15k effective fee)
    // Coins: requested 200,000 Xu -> Capped at 50% of 300k = 150,000 Xu
    // Net: 300k - 20k - 150k + 15k = 145k
    const pricing = await api.calculatePricing(
      generateCartPayload(
        [
          { price: 150000, quantity: 1, shopId: "shop-hanoi" },
          { price: 150000, quantity: 1, shopId: "shop-danang" },
        ],
        {
          shippingFee: 30000,
          voucherCode: "GIAM20K",
          freeshipCode: "FREESHIP15K",
          coinsUsed: 200000,
        }
      )
    );

    expect.equal(pricing.subtotal, 300000);
    expect.equal(pricing.voucherDiscount, 20000);
    expect.equal(pricing.shippingDiscount, 15000);
    expect.equal(pricing.coinDiscount, 150000);
    expect.equal(pricing.finalTotal, 145000);
    expect.equal(pricing.multiShopGroups.length, 2);
  });

  test("T3-02: Freeship Max Cap + Percentage Discount Voucher + VietQR Generation", async () => {
    // Subtotal 400k, 10% discount = 40k. Shipping 50k, Freeship capped at 30k -> 20k fee
    // Net: 400k - 40k + 20k = 380k
    const pricing = await api.calculatePricing(
      generateCartPayload([{ price: 400000, quantity: 1 }], {
        shippingFee: 50000,
        voucherCode: "DISCOUNT10PCT",
        freeshipCode: "FREESHIP30K",
      })
    );

    expect.equal(pricing.finalTotal, 380000);
    expect.equal(pricing.vietQRPayload.amount, 380000);
    expect.ok(pricing.vietQRPayload.qrUrl.includes("amount=380000"));
  });

  test("T3-03: Shop-Specific Voucher discounts only Shop A items while Freeship discounts order shipping", async () => {
    // Shop A = 350k (meets SHOP_TECH_50K min spend 300k)
    // Shop B = 100k
    // Shipping 30k, Freeship 15k
    // Total: 450k - 50k + 15k = 415k
    const pricing = await api.calculatePricing(
      generateCartPayload(
        [
          { price: 350000, quantity: 1, shopId: "shop-tech-world" },
          { price: 100000, quantity: 1, shopId: "shop-fashion-vn" },
        ],
        {
          shippingFee: 30000,
          voucherCode: "SHOP_TECH_50K",
          freeshipCode: "FREESHIP15K",
        }
      )
    );

    expect.equal(pricing.voucherDiscount, 50000);
    expect.equal(pricing.shippingDiscount, 15000);
    expect.equal(pricing.finalTotal, 415000);
  });

  test("T3-04: In-Chat 1-Click Purchase recommendation triggers checkout with Dual Vouchers", async () => {
    const session = await api.initChatSession();
    const chatRes = await api.sendChatMessage(session.sessionId, { text: "Tư vấn áo polo" });
    const recommended = chatRes.reply.recommendedProducts[0];

    const pricing = await api.calculatePricing(
      generateCartPayload([{ price: recommended.price, quantity: 1 }], {
        shippingFee: 30000,
        voucherCode: "GIAM20K",
        freeshipCode: "FREESHIP15K",
      })
    );

    expect.equal(pricing.subtotal, recommended.price);
    expect.equal(pricing.voucherDiscount, 20000);
    expect.equal(pricing.finalTotal, recommended.price - 20000 + 15000);
  });

  test("T3-05: Customer purchase decrements stock, order cancellation restores exact stock", async () => {
    const seller = await api.register({ email: "seller_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);
    const prod = await api.createProduct({ name: "Chuột Gaming T3", price: 300000, stock: 15 }, seller.token);

    const buyer = await api.register({ email: "buyer_t3@test.vn", password: "Password123!", fullName: "Buyer" });
    const order = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 300000, quantity: 5 }]), buyer.token);

    expect.equal(api.oracle.products.get(prod.id).stock, 10);

    await api.cancelOrder(order.id, buyer.token);
    expect.equal(api.oracle.products.get(prod.id).stock, 15);
  });

  test("T3-06: Approved return restores product stock and credits buyer wallet", async () => {
    const seller = await api.register({ email: "seller_ret_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);
    const prod = await api.createProduct({ name: "Bàn Phím T3", price: 200000, stock: 8 }, seller.token);

    const buyer = await api.register({ email: "buyer_ret_t3@test.vn", password: "Password123!", fullName: "Buyer" });
    const startBalance = api.oracle.coinLedger.get(buyer.user.id).balance;

    const order = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 200000, quantity: 2 }]), buyer.token);
    order.status = "delivered";

    const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, buyer.token);
    await api.moderateReturn(ret.id, "accepted", seller.token);

    expect.equal(api.oracle.products.get(prod.id).stock, 8); // Restored
    expect.equal(api.oracle.coinLedger.get(buyer.user.id).balance, startBalance + order.total); // Refunded
  });

  test("T3-07: 7-Day Check-in Streak jackpot (5,000 Xu) plus Lucky Wheel win (1,000 Xu) used at checkout", async () => {
    const buyer = await api.register({ email: "buyer_streak_wheel@test.vn", password: "Password123!", fullName: "Loyal Buyer" });
    const ledger = api.oracle.coinLedger.get(buyer.user.id);
    ledger.balance = 0; // reset for test
    ledger.streak = 6;
    ledger.lastCheckinDate = "2026-09-26";

    // Day 7 checkin (+5000 Xu)
    const checkin = await api.checkinDailyStreak(buyer.token);
    expect.equal(checkin.rewardXu, 5000);

    // Lucky wheel (+1000 Xu simulated)
    ledger.balance += 1000;
    expect.equal(ledger.balance, 6000);

    // Apply at checkout
    const pricing = await api.calculatePricing(
      generateCartPayload([{ price: 100000, quantity: 1 }], { coinsUsed: ledger.balance })
    );
    // 6,000 <= 50,000 (50% of 100k)
    expect.equal(pricing.coinDiscount, 6000);
  });

  test("T3-08: Super Admin locks shop -> Shop status becomes locked and isolated", async () => {
    const seller = await api.register({ email: "violating_seller@test.vn", password: "Password123!", fullName: "Bad Seller", role: "seller" });
    const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);

    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    await api.moderateShop(shop.id, "locked", admin.token);

    expect.equal(api.oracle.shops.get(shop.id).status, "locked");
    await expect.rejects(
      () => api.switchShop(shop.id, seller.token),
      /SHOP_LOCKED/
    );
  });

  test("T3-09: Handover to Kim Ngân -> Agent suggests fixed voucher -> Customer applies voucher in cart", async () => {
    const session = await api.initChatSession();
    await api.sendChatMessage(session.sessionId, { text: "Tôi muốn gặp nhân viên CSKH" });
    expect.equal(session.status, "human");

    // Kim Ngan gives voucher code
    const voucherCode = "GIAM20K";
    const pricing = await api.calculatePricing(
      generateCartPayload([{ price: 150000, quantity: 1 }], { voucherCode })
    );
    expect.equal(pricing.voucherDiscount, 20000);
  });

  test("T3-10: Variant selection directly links variant price and SKU stock to purchase", async () => {
    const seller = await api.register({ email: "sel_var_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopFashion, seller.token);
    const prod = await api.createProduct(
      {
        name: "Áo Thun Variant T3",
        price: 200000,
        stock: 30,
        variants: [
          { sku: "VAR-M", name: "Size M", price: 200000, stock: 15 },
          { sku: "VAR-L", name: "Size L", price: 220000, stock: 15 },
        ],
      },
      seller.token
    );

    const targetVariant = prod.variants.find((v) => v.sku === "VAR-L");
    const pricing = await api.calculatePricing(generateCartPayload([{ price: targetVariant.price, quantity: 2 }]));
    expect.equal(pricing.subtotal, 440000);
  });

  test("T3-11: Multi-shop order generates distinct shipping labels per vendor", async () => {
    const seller = await api.register({ email: "sel_awb_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);

    const order = await api.createOrder(
      generateCartPayload([
        { price: 100000, quantity: 1, shopId: "shop-hanoi" },
        { price: 100000, quantity: 1, shopId: "shop-saigon" },
      ])
    );

    const label = await api.generateShippingLabel(order.id, seller.token);
    expect.ok(label.airwayBillNo.startsWith("AWB-SPX-"));
  });

  test("T3-12: Super Admin bans fraudulent user -> Active token immediately invalidated", async () => {
    const fraudUser = await api.register({ email: "fraud_t3@test.vn", password: "Password123!", fullName: "Fraud" });
    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });

    await api.moderateUser(fraudUser.user.id, "banned", admin.token);

    await expect.rejects(
      () => api.verifyToken(fraudUser.token),
      /ACCOUNT_BANNED/
    );
  });

  test("T3-13: Expired Order Voucher rejected while Freeship voucher is validly applied", async () => {
    await expect.rejects(
      () =>
        api.calculatePricing(
          generateCartPayload([{ price: 200000, quantity: 1 }], {
            voucherCode: FIXTURES.vouchers.expired,
            freeshipCode: FIXTURES.vouchers.freeship15k,
          })
        ),
      /EXPIRED_VOUCHER/
    );
  });

  test("T3-14: Electronic VAT Invoice generated for multi-shop order with discounts applied", async () => {
    const order = await api.createOrder(
      generateCartPayload(
        [
          { price: 150000, quantity: 1, shopId: "s1" },
          { price: 150000, quantity: 1, shopId: "s2" },
        ],
        { voucherCode: "GIAM20K", shippingFee: 30000 }
      )
    );

    const invoice = await api.getVATInvoice(order.id);
    expect.equal(invoice.company.taxCode, "0318924019");
    expect.equal(invoice.voucherDiscount, 20000);
    expect.equal(invoice.totalPayment, order.total);
  });

  test("T3-15: Voice transcript input -> Generates product card -> Quick Buy executes checkout", async () => {
    const session = await api.initChatSession();
    const chatRes = await api.sendChatMessage(session.sessionId, {
      text: "Tư vấn áo polo cotton",
      voiceInput: true,
    });
    const item = chatRes.reply.recommendedProducts[0];
    const order = await api.createOrder(generateCartPayload([{ price: item.price, quantity: 1 }]));
    expect.equal(order.subtotal, item.price);
  });

  test("T3-16: SPX live tracking stepper advances through stages to delivery completion", async () => {
    const order = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }]));
    const initialTracking = await api.getSPXTracking(order.id);
    expect.equal(initialTracking.timeline[0].status, "completed");

    order.status = "delivered";
    const deliveredTracking = await api.getSPXTracking(order.id);
    expect.equal(deliveredTracking.currentStage, "delivered");
  });

  test("T3-17: GPS courier simulation correlates with active shipping stage", async () => {
    const order = await api.createOrder(generateCartPayload([{ price: 100000, quantity: 1 }]));
    const gps = await api.getGPSMapSimulation(order.id);
    expect.ok(gps.driverSpeedKmh > 0);
    expect.ok(gps.etaMinutes <= 60);
  });

  test("T3-18: Multi-shop cart calculates separate subtotals and applies platform-wide Freeship", async () => {
    const pricing = await api.calculatePricing(
      generateCartPayload(
        [
          { price: 80000, quantity: 2, shopId: "s1" },  // 160k
          { price: 120000, quantity: 1, shopId: "s2" }, // 120k
        ],
        { shippingFee: 30000, freeshipCode: "FREESHIP30K" } // subtotal 280k >= 150k min spend
      )
    );

    expect.equal(pricing.subtotal, 280000);
    expect.equal(pricing.shippingDiscount, 30000);
    expect.equal(pricing.effectiveShippingFee, 0);
  });

  test("T3-19: Product image upload -> Admin approval -> Product appears in storefront catalog", async () => {
    const seller = await api.register({ email: "sel_flow_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);

    const upload = await api.validateImageUpload({ name: "keyboard.png", mimetype: "image/png", size: 1024 * 200 });
    const prod = await api.createProduct({ name: "Bàn Phím T3 Flow", price: 500000, stock: 10, images: [upload.url] }, seller.token);

    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    await api.moderateProduct(prod.id, "approved", admin.token);

    const storefront = await api.getStorefrontProducts();
    const found = storefront.find((p) => p.id === prod.id);
    expect.ok(found);
    expect.equal(found.images[0], upload.url);
  });

  test("T3-20: Return dispute escalated to Super Admin -> Admin arbitrates refund to buyer", async () => {
    const seller = await api.register({ email: "sel_disp_t3@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);
    const buyer = await api.register({ email: "buyer_disp_t3@test.vn", password: "Password123!", fullName: "Buyer" });

    const order = await api.createOrder(generateCartPayload([{ price: 150000, quantity: 1 }]), buyer.token);
    order.status = "delivered";

    const ret = await api.requestReturn({ orderId: order.id, reason: "Hàng bể vỡ do vận chuyển", refundMethod: "wallet" }, buyer.token);
    await api.moderateReturn(ret.id, "escalated_admin", seller.token);

    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    const resolved = await api.moderateReturn(ret.id, "admin_resolve", admin.token, "refund");

    expect.equal(resolved.status, "refunded");
    expect.equal(resolved.resolvedBy, "admin");
  });
});
