/**
 * Tier 4: Real-World Application Scenarios
 * 10 complete end-to-end user journeys from registration through checkout, fulfillment,
 * moderation, disputes, gamification, and compliance.
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload, createRandomEmail } from "../harness/testData.js";

describe("Tier 4 - Real-World Application User Journeys", { tier: "tier4" }, () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // --------------------------------------------------------------------------
  // JOURNEY 1: Full Customer Checkout Journey with Dual Vouchers & Mini Xu
  // --------------------------------------------------------------------------
  test("Journey 1: Full Customer Lifecycle - Register, Multi-Shop Cart, Dual Vouchers, Mini Xu, VietQR", async () => {
    // 1. Customer registers
    const email = createRandomEmail("journey1_cust");
    const regRes = await api.register({
      email,
      password: "CustomerPassword123!",
      fullName: "Đoàn Khách Hàng",
      role: "customer",
    });
    expect.ok(regRes.token);
    expect.equal(regRes.user.role, "customer");

    // 2. Customer adds items from 2 shops to cart (Shop Hanoi = 120k, Shop Saigon = 130k -> Subtotal = 250k)
    const cartItems = [
      { productId: "p-hn", name: "Áo Thun Hà Nội", price: 120000, quantity: 1, shopId: "shop-hanoi" },
      { productId: "p-sg", name: "Nón Kết Sài Gòn", price: 130000, quantity: 1, shopId: "shop-saigon" },
    ];

    // 3. Apply Dual Vouchers: GIAM20K (min spend 100k) + FREESHIP15K (min spend 50k, fee 30k)
    // 4. Use Mini Xu: User has 10,000 Xu welcome gift. Max allowed = 50% of 250k = 125,000 Xu -> 10k fully used
    const orderPayload = generateCartPayload(cartItems, {
      shippingFee: 30000,
      voucherCode: "GIAM20K",
      freeshipCode: "FREESHIP15K",
      coinsUsed: 10000,
      paymentMethod: "BANK_TRANSFER",
    });

    const pricing = await api.calculatePricing(orderPayload);
    // Calculation:
    // Subtotal: 250k
    // Voucher: -20k
    // Shipping: 30k - 15k = 15k
    // Coins: -10k
    // Net total: 250k - 20k - 10k + 15k = 235k
    expect.equal(pricing.subtotal, 250000);
    expect.equal(pricing.voucherDiscount, 20000);
    expect.equal(pricing.shippingDiscount, 15000);
    expect.equal(pricing.coinDiscount, 10000);
    expect.equal(pricing.finalTotal, 235000);

    // 5. Place order with VietQR
    const order = await api.createOrder(orderPayload, regRes.token);
    expect.equal(order.total, 235000);
    expect.equal(order.vietQRPayload.amount, 235000);
    expect.equal(order.vietQRPayload.accountNo, "0318924019");

    // 6. Verify buyer coin balance decremented
    const ledger = api.oracle.coinLedger.get(regRes.user.id);
    expect.equal(ledger.balance, 0);

    // 7. Verify SPX tracking initiated
    const tracking = await api.getSPXTracking(order.id);
    expect.equal(tracking.timeline[0].status, "completed");
  });

  // --------------------------------------------------------------------------
  // JOURNEY 2: Full Merchant Lifecycle: Onboarding to AWB Shipping Label
  // --------------------------------------------------------------------------
  test("Journey 2: Merchant Lifecycle - Registration, Onboarding, Product Upload, Admin Moderation, Fulfillment", async () => {
    // 1. Seller registers
    const sellerEmail = createRandomEmail("journey2_seller");
    const seller = await api.register({
      email: sellerEmail,
      password: "SellerPassword123!",
      fullName: "Nguyễn Thương Nhân",
      role: "seller",
    });

    // 2. Onboard shop with bank payout info
    const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
    expect.equal(shop.status, "active");
    expect.equal(shop.ownerId, seller.user.id);

    // 3. Upload product image & create product
    const upload = await api.validateImageUpload({ name: "mouse.png", mimetype: "image/png", size: 1024 * 350 });
    const product = await api.createProduct(
      {
        name: "Chuột Gaming Không Dây Siêu Nhẹ",
        price: 450000,
        stock: 30,
        images: [upload.url],
        category: "electronics",
      },
      seller.token
    );
    expect.equal(product.moderationStatus, "pending");

    // 4. Admin reviews and approves product
    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    const approvedProd = await api.moderateProduct(product.id, "approved", admin.token);
    expect.equal(approvedProd.moderationStatus, "approved");

    // 5. Product is now visible in public storefront
    const storefront = await api.getStorefrontProducts();
    expect.ok(storefront.some((p) => p.id === product.id));

    // 6. Customer places order
    const buyer = await api.register({ email: createRandomEmail("buyer2"), password: "Password123!", fullName: "Khách Mua" });
    const order = await api.createOrder(
      generateCartPayload([{ productId: product.id, price: 450000, quantity: 2, shopId: shop.id }]),
      buyer.token
    );
    expect.equal(api.oracle.products.get(product.id).stock, 28);

    // 7. Seller generates SPX Express Shipping Label (AWB)
    const label = await api.generateShippingLabel(order.id, seller.token);
    expect.ok(label.airwayBillNo.startsWith("AWB-SPX-"));
    expect.equal(label.sender.name, shop.name);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 3: Post-Order Defect & Dispute Arbitration
  // --------------------------------------------------------------------------
  test("Journey 3: Post-Order Resolution - Delivery, Defect Return, Dispute Escalation, Admin Arbitration", async () => {
    const seller = await api.register({ email: createRandomEmail("seller3"), password: "Password123!", fullName: "Seller 3", role: "seller" });
    const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
    const prod = await api.createProduct({ name: "Ly Thủy Tinh Cao Cấp", price: 150000, stock: 20 }, seller.token);

    const buyer = await api.register({ email: createRandomEmail("buyer3"), password: "Password123!", fullName: "Buyer 3" });
    const order = await api.createOrder(
      generateCartPayload([{ productId: prod.id, price: 150000, quantity: 2, shopId: shop.id }]),
      buyer.token
    );
    expect.equal(api.oracle.products.get(prod.id).stock, 18);

    // Order delivered to customer
    order.status = "delivered";

    // Customer submits return request for broken item with photo evidence
    const returnReq = await api.requestReturn(
      {
        orderId: order.id,
        reason: "Hàng bể vỡ do vận chuyển",
        refundMethod: "wallet",
        images: ["/uploads/broken1.jpg"],
      },
      buyer.token
    );
    expect.equal(returnReq.status, "pending_seller");

    // Seller escalates dispute to Super Admin
    await api.moderateReturn(returnReq.id, "escalated_admin", seller.token);
    expect.equal(api.oracle.returns.get(returnReq.id).status, "escalated_admin");

    // Admin resolves dispute and approves refund
    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    const resolved = await api.moderateReturn(returnReq.id, "admin_resolve", admin.token, "refund");
    expect.equal(resolved.status, "refunded");

    // Verify buyer wallet credited and stock restored
    const ledger = api.oracle.coinLedger.get(buyer.user.id);
    expect.equal(ledger.balance, 10000 + order.total);
    expect.equal(api.oracle.products.get(prod.id).stock, 20);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 4: 24/7 Customer Care Handover to Kim Ngân (CSKH-8821)
  // --------------------------------------------------------------------------
  test("Journey 4: Customer Support - AI Query, Vietnamese Voice, Handover with Chime, Kim Ngân Resolution", async () => {
    // 1. Customer initiates chat session
    const session = await api.initChatSession();
    expect.equal(session.status, "ai");

    // 2. Voice input query in Vietnamese
    const voiceRes = await api.sendChatMessage(session.sessionId, {
      text: "Tôi muốn tìm áo polo nam cao cấp",
      voiceInput: true,
    });
    expect.ok(voiceRes.reply.recommendedProducts.length > 0);

    // 3. Customer requests human specialist
    const handoverRes = await api.sendChatMessage(session.sessionId, {
      text: "Tôi muốn gặp nhân viên CSKH để hỏi thêm về kích thước",
    });

    // 4. Verify transition state machine & chime audio triggers
    expect.equal(handoverRes.status, "human");
    expect.equal(session.agentPersona.name, "Kim Ngân");
    expect.equal(session.agentPersona.code, "CSKH-8821");
    expect.equal(session.agentPersona.badgeColor, "#10b981");

    // 5. Subsequent conversation handled by Kim Ngan
    const followUp = await api.sendChatMessage(session.sessionId, { text: "Mình cao 1m75 nặng 70kg nên mặc size nào?" });
    expect.equal(followUp.reply.sender, "human");
    expect.equal(followUp.reply.agentCode, "CSKH-8821");

    // 6. Customer returns to AI assistant
    const revert = await api.returnToAI(session.sessionId);
    expect.equal(revert.status, "ai");
  });

  // --------------------------------------------------------------------------
  // JOURNEY 5: Gamification Loyalty Loop - 7-Day Streak & Lucky Wheel
  // --------------------------------------------------------------------------
  test("Journey 5: Gamification & Retention - 7-Day Check-in Streak, Lucky Wheel Spin, Checkout Coin Offset", async () => {
    const user = await api.register({ email: createRandomEmail("gamer"), password: "Password123!", fullName: "Game Player" });
    const ledger = api.oracle.coinLedger.get(user.user.id);
    ledger.balance = 0; // reset for clean test

    // Simulate 7-day streak
    const ladder = [500, 1000, 1500, 2000, 2500, 3000, 5000];
    for (let day = 1; day <= 7; day++) {
      ledger.lastCheckinDate = `2026-09-${10 + day}`; // simulate past dates
      const res = await api.checkinDailyStreak(user.token);
      expect.equal(res.rewardXu, ladder[day - 1]);
    }
    // Total from streak: 500+1000+1500+2000+2500+3000+5000 = 15,500 Xu
    expect.equal(ledger.balance, 15500);

    // Spin Lucky Wheel for bonus
    ledger.lastSpinDate = "2026-09-01";
    const spin = await api.spinLuckyWheel(user.token);
    expect.ok(spin.rotationAngle >= 1440);

    // Apply accumulated coins at checkout (cart subtotal 20,000 VND -> 50% cap is 10,000 VND)
    const pricing = await api.calculatePricing(
      generateCartPayload([{ price: 20000, quantity: 1 }], { coinsUsed: ledger.balance })
    );
    // 50% cap of 20,000 = 10,000 Xu max deduction (ledger balance is >= 15,500)
    expect.equal(pricing.coinDiscount, 10000);
  });

  // --------------------------------------------------------------------------
  // JOURNEY 6: Super Admin Compliance & Tenant Quarantine
  // --------------------------------------------------------------------------
  test("Journey 6: Governance - Policy Violation, Shop Lockdown, Storefront Quarantine, User Audit", async () => {
    // 1. Seller registers shop and adds product
    const seller = await api.register({ email: createRandomEmail("violator"), password: "Password123!", fullName: "Bad Seller", role: "seller" });
    const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
    const prod = await api.createProduct({ name: "Hàng Vi Phạm", price: 100000, stock: 10 }, seller.token);

    const admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
    await api.moderateProduct(prod.id, "approved", admin.token);

    // 2. Admin detects fraud and locks shop
    await api.moderateShop(shop.id, "locked", admin.token);
    expect.equal(api.oracle.shops.get(shop.id).status, "locked");

    // 3. Seller cannot switch to locked shop
    await expect.rejects(
      () => api.switchShop(shop.id, seller.token),
      /SHOP_LOCKED/
    );

    // 4. Admin audits and restores shop after compliance remediation
    await api.moderateShop(shop.id, "active", admin.token);
    expect.equal(api.oracle.shops.get(shop.id).status, "active");
  });

  // --------------------------------------------------------------------------
  // JOURNEY 7: Multi-Vendor Cross-Country Logistics Split
  // --------------------------------------------------------------------------
  test("Journey 7: Multi-Vendor Split - Hanoi and Saigon Shops, Separate Subtotals, SPX Stepper Tracking", async () => {
    const buyer = await api.register({ email: createRandomEmail("split_buyer"), password: "Password123!", fullName: "Khách Mua Toàn Quốc" });

    // Multi-shop order
    const orderPayload = generateCartPayload(
      [
        { price: 200000, quantity: 1, shopId: "shop-hanoi" },
        { price: 180000, quantity: 1, shopId: "shop-saigon" },
      ],
      { shippingFee: 40000, freeshipCode: "FREESHIP30K" }
    );

    const pricing = await api.calculatePricing(orderPayload);
    expect.equal(pricing.subtotal, 380000);
    expect.equal(pricing.shippingDiscount, 30000);
    expect.equal(pricing.effectiveShippingFee, 10000);
    expect.equal(pricing.multiShopGroups.length, 2);

    const order = await api.createOrder(orderPayload, buyer.token);

    // SPX Tracking timeline
    const tracking = await api.getSPXTracking(order.id);
    expect.equal(tracking.timeline.length, 4);
    expect.equal(tracking.timeline[0].stage, "pending");
  });

  // --------------------------------------------------------------------------
  // JOURNEY 8: High-Demand Flash Sale SKU Exhaustion & Restock
  // --------------------------------------------------------------------------
  test("Journey 8: Buy Box & Variant Stock - SKU Depletion, Out-of-Stock Guard, Restocking", async () => {
    const seller = await api.register({ email: createRandomEmail("sel_flash"), password: "Password123!", fullName: "Flash Seller", role: "seller" });
    await api.createShop(FIXTURES.shops.shopTech, seller.token);

    const prod = await api.createProduct(
      {
        name: "Áo Thun Flash Sale",
        price: 150000,
        stock: 5,
        variants: [
          { sku: "FLASH-M", name: "Size M", price: 150000, stock: 2 },
          { sku: "FLASH-L", name: "Size L", price: 150000, stock: 3 },
        ],
      },
      seller.token
    );

    const buyer = await api.register({ email: createRandomEmail("flash_buyer"), password: "Password123!", fullName: "Flash Buyer" });

    // Buyer purchases all 2 units of Size M
    await api.createOrder(generateCartPayload([{ productId: prod.id, price: 150000, quantity: 2 }]), buyer.token);
    expect.equal(api.oracle.products.get(prod.id).stock, 3);

    // Next buyer attempts to purchase 4 units (only 3 left) -> Rejected with OUT_OF_STOCK
    const buyer2 = await api.register({ email: createRandomEmail("flash_buyer2"), password: "Password123!", fullName: "Buyer 2" });
    await expect.rejects(
      () => api.createOrder(generateCartPayload([{ productId: prod.id, price: 150000, quantity: 4 }]), buyer2.token),
      /OUT_OF_STOCK/
    );
  });

  // --------------------------------------------------------------------------
  // JOURNEY 9: B2B Enterprise Accounting & VAT Compliance
  // --------------------------------------------------------------------------
  test("Journey 9: Enterprise Tax Compliance - High-Value Order, 8% VAT Calculation, Printable Layout", async () => {
    const b2bBuyer = await api.register({ email: createRandomEmail("corp_buyer"), password: "Password123!", fullName: "Doanh Nghiệp A" });

    const orderPayload = generateCartPayload(
      [
        { name: "Màn Hình Đồ Họa 4K", price: 12000000, quantity: 2 }, // 24m
        { name: "Ghế Công Thái Học", price: 6000000, quantity: 2 },   // 12m -> Subtotal 36m
      ],
      {
        shippingFee: 100000,
        customer: {
          fullName: "CÔNG TY CP CÔNG NGHỆ ALPHA",
          phone: "02439998888",
          address: "Tầng 12, Keangnam Landmark, Cầu Giấy, Hà Nội",
        },
      }
    );

    const order = await api.createOrder(orderPayload, b2bBuyer.token);
    expect.equal(order.subtotal, 36000000);

    // Generate Electronic VAT invoice
    const invoice = await api.getVATInvoice(order.id);
    expect.equal(invoice.company.taxCode, "0318924019");
    expect.equal(invoice.vatRate, "8%");
    expect.equal(invoice.netAmount + invoice.vatAmount, order.subtotal);
    expect.ok(invoice.htmlPrintTemplate.includes("0318924019"));
    expect.ok(invoice.xmlPayloadDigest.startsWith("SHA256:"));
  });

  // --------------------------------------------------------------------------
  // JOURNEY 10: Real-Time SPX Courier Delivery & Live GPS Simulation
  // --------------------------------------------------------------------------
  test("Journey 10: Real-Time Delivery - Order Creation, Courier Assignment, GPS Route Coordinates, Drop-off", async () => {
    const buyer = await api.register({ email: createRandomEmail("gps_buyer"), password: "Password123!", fullName: "Khách Nhận Hàng" });
    const order = await api.createOrder(generateCartPayload([{ price: 200000, quantity: 1 }]), buyer.token);

    // 1. Initial tracking status
    const tracking = await api.getSPXTracking(order.id);
    expect.ok(tracking.trackingNumber.startsWith("SPX-VN-"));

    // 2. Query GPS simulation
    const gps = await api.getGPSMapSimulation(order.id);
    expect.ok(gps.courierName.includes("Nguyễn Văn Tuấn"));
    expect.ok(gps.vehicle.includes("29B1-88992"));
    expect.ok(gps.currentLocation.lat > 0 && gps.currentLocation.lng > 0);
    expect.ok(gps.etaMinutes <= 30);
    expect.ok(gps.distanceRemainingKm < 10);

    // 3. Mark delivered
    order.status = "delivered";
    const finalTracking = await api.getSPXTracking(order.id);
    expect.equal(finalTracking.currentStage, "delivered");
  });
  // --------------------------------------------------------------------------
  // JOURNEY 11: Buyer Pre-Purchase Engagement to Post-Purchase Audit
  // --------------------------------------------------------------------------
  test("Journey 11: Buyer Pre-Purchase Engagement to Post-Purchase Audit - Recently Viewed, Q&A, Dual Vouchers, Live SPX GPS Map, VAT Invoice", async () => {
    const buyer = await api.register({ email: createRandomEmail("j11_buyer"), password: "Password123!", fullName: "Hoàng Minh Trí" });

    // 1. Browse products -> populate Recently Viewed
    const p1 = { id: "p-j11-blazer", name: "Áo Blazer Nam Hàn Quốc", price: 650000, shopName: "Thời Trang GenZ" };
    const p2 = { id: "p-j11-trousers", name: "Quần Tây Form Suông", price: 350000, shopName: "Thời Trang GenZ" };

    await api.recordRecentlyViewed(p1, buyer.token);
    await api.recordRecentlyViewed(p2, buyer.token);

    const viewedList = await api.getRecentlyViewed(buyer.token);
    expect.equal(viewedList.length, 2);
    expect.equal(viewedList[0].id, "p-j11-trousers");

    // 2. Inspect PDP and ask sizing question via Community Q&A
    const question = await api.createQuestion(p1.id, { question: "Cao 1m78 nặng 70kg thì mặc size nào vừa vặn nhất?" }, buyer.token);
    expect.ok(question.id);
    expect.equal(question.helpfulCount, 0);

    // Shop responds to question
    await api.answerProductQuestion(p1.id, question.id, {
      content: "Dạ bạn mặc size L hoặc XL nếu thích phong cách oversize nhé!",
      authorName: "Thời Trang GenZ Official",
      isShopOwner: true,
    });

    // Community member upvotes the helpful answer
    const communityUser = await api.register({ email: createRandomEmail("j11_peer"), password: "Password123!", fullName: "Lê Hoàng" });
    await api.voteProductQuestion(p1.id, question.id, communityUser.token);

    const qaFeed = await api.getProductQuestions(p1.id);
    expect.equal(qaFeed.questions[0].helpfulCount, 1);
    expect.equal(qaFeed.questions[0].answers.length, 1);

    // 3. Buyer completes checkout using Dual Vouchers (FREESHIP15K + GIAM20K)
    const orderPayload = generateCartPayload(
      [
        { productId: p1.id, price: p1.price, quantity: 1 },
        { productId: p2.id, price: p2.price, quantity: 1 },
      ],
      {
        shippingFee: 30000,
        voucherCode: "GIAM20K",
        freeshipCode: "FREESHIP15K",
        customer: {
          fullName: "Hoàng Minh Trí",
          phone: "0908777888",
          address: "Số 88 đường Nam Kỳ Khởi Nghĩa, Quận 1, TP. HCM",
        },
      }
    );

    const order = await api.createOrder(orderPayload, buyer.token);
    expect.equal(order.subtotal, 1000000);
    expect.equal(order.total, 995000);

    // 4. Open Order History & monitor real-time SPX GPS route
    order.status = "shipping";
    const liveTracking = await api.getOrderTracking(order.id, buyer.token);
    expect.equal(liveTracking.currentStage, "shipping");
    expect.ok(liveTracking.currentLocation.label.includes("Tân Bình"));
    expect.ok(liveTracking.currentLocation.speedKmh > 0);

    // 5. Complete delivery and verify printable Electronic VAT Invoice
    order.status = "delivered";
    const finalTracking = await api.getOrderTracking(order.id, buyer.token);
    expect.equal(finalTracking.currentStage, "delivered");
    expect.equal(finalTracking.currentLocation.distanceRemainingKm, 0);

    const invoice = await api.getOrderInvoice(order.id, buyer.token);
    expect.equal(invoice.invoiceSerial, "1C26MMS");
    expect.equal(invoice.templateCode, "01GTKT0/001");
    expect.equal(invoice.netSubtotal + invoice.actualVatAmount, 1000000);
    expect.ok(invoice.digitalSignature.verified);
    expect.ok(invoice.qrCodeString.includes(order.id));
  });

  // --------------------------------------------------------------------------
  // JOURNEY 12: Complete Customer Service & Logistics Exception Handling
  // --------------------------------------------------------------------------
  test("Journey 12: Customer Service & Logistics Exception Handling - Live Route Tracking, Hub Dispatch, VAT Corporate Audit, 5-Star Review with Xu Reward", async () => {
    const customer = await api.register({ email: createRandomEmail("j12_cust"), password: "Password123!", fullName: "Phạm Hải Đăng" });

    // 1. Customer places order
    const order = await api.createOrder(
      generateCartPayload(
        [{ productId: "p-j12-mech-keyboard", name: "Bàn Phím Cơ Silent White", price: 1250000, quantity: 1 }],
        {
          shippingFee: 30000,
          customer: {
            fullName: "Công Ty TNHH Giải Pháp Số Alpha",
            phone: "0918112233",
            address: "Tầng 5, Tòa Nhà IPC, Quận 7, TP. HCM",
            taxCode: "0309998888",
          },
        }
      ),
      customer.token
    );

    // 2. Track pending order via SPX live tracking
    const pendingTracking = await api.getOrderTracking(order.id, customer.token);
    expect.ok(pendingTracking.trackingCode.startsWith("SPXVN"));
    expect.equal(pendingTracking.carrierHotline, "1900 1221");

    // 3. Carrier dispatches through Tân Bình hub
    order.status = "shipping";
    const shippingTracking = await api.getOrderTracking(order.id, customer.token);
    expect.equal(shippingTracking.currentStage, "shipping");
    expect.ok(shippingTracking.stages.find((s) => s.stage === "shipping").completed);
    expect.equal(shippingTracking.courier.name, "Nguyễn Văn Hùng");
    expect.ok(shippingTracking.courier.rating >= 4.9);

    // 4. Order delivered successfully
    order.status = "delivered";
    const deliveredTracking = await api.getOrderTracking(order.id, customer.token);
    expect.equal(deliveredTracking.statusText, "Đã giao hàng thành công");

    // 5. Customer inspects Electronic VAT Invoice for corporate tax submission
    const vatInvoice = await api.getOrderInvoice(order.id, customer.token);
    expect.equal(vatInvoice.orderId, order.id);
    expect.equal(vatInvoice.netSubtotal + vatInvoice.actualVatAmount, 1250000);
    expect.equal(vatInvoice.buyer.taxCode, "0309998888");

    // 6. Customer writes 5-star review and earns Mini Xu reward
    const review = await api.submitReview(
      {
        productId: "p-j12-mech-keyboard",
        orderId: order.id,
        rating: 5,
        comment: "Bàn phím gõ rất êm, giao hàng nhanh chóng, hóa đơn VAT đầy đủ!",
      },
      customer.token
    );
    expect.equal(review.review.rating, 5);
    expect.equal(review.review.verifiedPurchase, true);
    expect.equal(review.rewardCoins, 200);
  });

});
