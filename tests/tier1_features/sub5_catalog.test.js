/**
 * Tier 1: Feature Coverage - Subsystem 5: Catalog Moderation & Image Integrity (Features 34-38)
 * 5 isolated happy-path test cases per feature (25 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload } from "../harness/testData.js";

describe("Tier 1 - Subsystem 5: Catalog Moderation & Image Integrity", () => {
  let seller, shop, admin;

  beforeEach(async () => {
    api.resetOracle();
    seller = await api.register({ email: "catalog_seller@test.vn", password: "Password123!", fullName: "Catalog Seller", role: "seller" });
    shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
    admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
  });

  // -------------------------------------------------------------
  // FEATURE 34: Product Moderation Workflow (5 tests)
  // -------------------------------------------------------------
  describe("Feature 34: Product Moderation Workflow", () => {
    test("F34-T1: Newly created product initially has 'pending' moderation status", async () => {
      const prod = await api.createProduct({ name: "Tai Nghe Bluetooth", price: 350000, stock: 25 }, seller.token);
      expect.equal(prod.moderationStatus, "pending");
    });

    test("F34-T2: Super Admin can approve pending product", async () => {
      const prod = await api.createProduct({ name: "Chuột Gaming", price: 450000, stock: 15 }, seller.token);
      const approved = await api.moderateProduct(prod.id, "approved", admin.token);
      expect.equal(approved.moderationStatus, "approved");
    });

    test("F34-T3: Approved product is visible in public storefront queries", async () => {
      const prod = await api.createProduct({ name: "Bàn Phím Cơ", price: 800000, stock: 10 }, seller.token);
      await api.moderateProduct(prod.id, "approved", admin.token);
      const storefront = await api.getStorefrontProducts();
      expect.ok(storefront.some((p) => p.id === prod.id));
    });

    test("F34-T4: Super Admin can reject a policy-violating product", async () => {
      const prod = await api.createProduct({ name: "Hàng Giả Nhái", price: 50000, stock: 100 }, seller.token);
      const rejected = await api.moderateProduct(prod.id, "rejected", admin.token);
      expect.equal(rejected.moderationStatus, "rejected");
    });

    test("F34-T5: Pending and rejected products are excluded from public storefront", async () => {
      const prodPending = await api.createProduct({ name: "Sản phẩm Chưa Duyệt", price: 100000, stock: 5 }, seller.token);
      const prodRejected = await api.createProduct({ name: "Sản phẩm Bị Từ Chối", price: 100000, stock: 5 }, seller.token);
      await api.moderateProduct(prodRejected.id, "rejected", admin.token);

      const storefront = await api.getStorefrontProducts();
      expect.ok(!storefront.some((p) => p.id === prodPending.id));
      expect.ok(!storefront.some((p) => p.id === prodRejected.id));
    });
  });

  // -------------------------------------------------------------
  // FEATURE 35: Image Fallback & Broken Image Protection (5 tests)
  // -------------------------------------------------------------
  describe("Feature 35: Image Fallback & Broken Image Protection", () => {
    test("F35-T1: Product created without image automatically gets default fallback image", async () => {
      const prod = await api.createProduct({ name: "Sản phẩm Không Ảnh", price: 100000, stock: 5, images: [] }, seller.token);
      expect.ok(prod.images.length > 0);
      expect.equal(prod.images[0], "/images/default-product.png");
    });

    test("F35-T2: Provided valid image URLs are preserved as gallery array", async () => {
      const prod = await api.createProduct(
        { name: "Sản phẩm Đủ Ảnh", price: 100000, stock: 5, images: ["/uploads/img1.png", "/uploads/img2.png"] },
        seller.token
      );
      expect.equal(prod.images.length, 2);
    });

    test("F35-T3: Fallback image URL is a valid string asset reference", async () => {
      const prod = await api.createProduct({ name: "Check Asset String", price: 100000, stock: 5 }, seller.token);
      expect.equal(typeof prod.images[0], "string");
      expect.ok(prod.images[0].startsWith("/images/"));
    });

    test("F35-T4: Shop logo defaults to placeholder when omitted during onboarding", async () => {
      const newShop = await api.createShop({ ...FIXTURES.shops.shopFashion, logo: null }, seller.token);
      expect.equal(newShop.logo, "/images/default-shop-logo.png");
    });

    test("F35-T5: System audit confirms imageFallbackActive is enabled across UI", async () => {
      const metrics = await api.getBundleMetrics();
      expect.equal(metrics.auditCompliance.imageFallbackActive, true);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 36: Product Image File Upload (5 tests)
  // -------------------------------------------------------------
  describe("Feature 36: Product Image File Upload", () => {
    test("F36-T1: JPEG image passes upload MIME type and size validation", async () => {
      const file = { name: "product.jpg", mimetype: "image/jpeg", size: 1024 * 500 }; // 500KB
      const upload = await api.validateImageUpload(file);
      expect.ok(upload.url.startsWith("/uploads/"));
    });

    test("F36-T2: PNG image passes upload validation", async () => {
      const file = { name: "product.png", mimetype: "image/png", size: 1024 * 800 };
      const upload = await api.validateImageUpload(file);
      expect.equal(upload.mimetype, "image/png");
    });

    test("F36-T3: Modern WebP image format passes upload validation", async () => {
      const file = { name: "product.webp", mimetype: "image/webp", size: 1024 * 300 };
      const upload = await api.validateImageUpload(file);
      expect.equal(upload.mimetype, "image/webp");
    });

    test("F36-T4: Sanitized upload filename removes hazardous special characters", async () => {
      const file = { name: "my product <hack> #1.png", mimetype: "image/png", size: 1024 * 100 };
      const upload = await api.validateImageUpload(file);
      expect.ok(!upload.url.includes("<"));
      expect.ok(!upload.url.includes(">"));
    });

    test("F36-T5: Upload result records accurate file size attribute", async () => {
      const file = { name: "photo.jpg", mimetype: "image/jpeg", size: 256000 };
      const upload = await api.validateImageUpload(file);
      expect.equal(upload.size, 256000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 37: Catalog Inventory & Stock Control (5 tests)
  // -------------------------------------------------------------
  describe("Feature 37: Catalog Inventory & Stock Control", () => {
    test("F37-T1: Successful order placement decrements product stock by ordered quantity", async () => {
      const prod = await api.createProduct({ name: "Cáp Sạc Nhanh", price: 80000, stock: 20 }, seller.token);
      const buyer = await api.register({ email: "buyer_stock1@test.vn", password: "Password123!", fullName: "Buyer Stock" });
      const orderPayload = generateCartPayload([{ productId: prod.id, price: 80000, quantity: 3 }]);
      await api.createOrder(orderPayload, buyer.token);

      const after = api.oracle.products.get(prod.id);
      expect.equal(after.stock, 17);
    });

    test("F37-T2: Cancelling a pending order restores product stock to inventory", async () => {
      const prod = await api.createProduct({ name: "Đế Sạc Không Dây", price: 200000, stock: 10 }, seller.token);
      const buyer = await api.register({ email: "buyer_stock2@test.vn", password: "Password123!", fullName: "Buyer Stock 2" });
      const order = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 200000, quantity: 2 }]), buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 8);

      await api.cancelOrder(order.id, buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 10);
    });

    test("F37-T3: Multi-item order decrements stock for each respective product", async () => {
      const p1 = await api.createProduct({ name: "Món 1", price: 50000, stock: 15 }, seller.token);
      const p2 = await api.createProduct({ name: "Món 2", price: 70000, stock: 25 }, seller.token);
      const buyer = await api.register({ email: "buyer_stock3@test.vn", password: "Password123!", fullName: "Buyer Stock 3" });

      await api.createOrder(
        generateCartPayload([
          { productId: p1.id, price: 50000, quantity: 5 },
          { productId: p2.id, price: 70000, quantity: 10 },
        ]),
        buyer.token
      );

      expect.equal(api.oracle.products.get(p1.id).stock, 10);
      expect.equal(api.oracle.products.get(p2.id).stock, 15);
    });

    test("F37-T4: Approved return restores product stock into inventory", async () => {
      const prod = await api.createProduct({ name: "Sản phẩm Đổi Trả", price: 150000, stock: 8 }, seller.token);
      const buyer = await api.register({ email: "buyer_ret_stk@test.vn", password: "Password123!", fullName: "Buyer Ret Stk" });
      const order = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 150000, quantity: 2 }]), buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 6);

      order.status = "delivered";
      const ret = await api.requestReturn({ orderId: order.id, reason: "Giao sai hàng", refundMethod: "wallet" }, buyer.token);
      await api.moderateReturn(ret.id, "accepted", seller.token);

      expect.equal(api.oracle.products.get(prod.id).stock, 8);
    });

    test("F37-T5: Stock never becomes negative during normal orders", async () => {
      const prod = await api.createProduct({ name: "Sản phẩm Hạn Chế", price: 100000, stock: 2 }, seller.token);
      const buyer = await api.register({ email: "buyer_stk_lim@test.vn", password: "Password123!", fullName: "Buyer Limit" });
      await api.createOrder(generateCartPayload([{ productId: prod.id, price: 100000, quantity: 2 }]), buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 0);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 38: Buy Box & Variant Selector (5 tests)
  // -------------------------------------------------------------
  describe("Feature 38: Buy Box & Variant Selector", () => {
    test("F38-T1: Product can be configured with multiple SKU variants", async () => {
      const prod = await api.createProduct(
        {
          name: FIXTURES.products.poloShirt.name,
          price: FIXTURES.products.poloShirt.price,
          stock: FIXTURES.products.poloShirt.stock,
          variants: FIXTURES.products.poloShirt.variants,
        },
        seller.token
      );
      expect.equal(prod.variants.length, 2);
    });

    test("F38-T2: Each variant contains distinct SKU and name (color/size)", async () => {
      const prod = await api.createProduct(
        {
          name: FIXTURES.products.phoneCase.name,
          price: FIXTURES.products.phoneCase.price,
          stock: FIXTURES.products.phoneCase.stock,
          variants: FIXTURES.products.phoneCase.variants,
        },
        seller.token
      );
      expect.equal(prod.variants[0].sku, "CASE-BLK");
      expect.equal(prod.variants[1].sku, "CASE-CLR");
    });

    test("F38-T3: Variant contains dedicated price and stock attributes", async () => {
      const prod = await api.createProduct(
        {
          name: FIXTURES.products.poloShirt.name,
          price: 250000,
          stock: 40,
          variants: [
            { sku: "POLO-M", name: "Size M", price: 250000, stock: 20 },
            { sku: "POLO-XL", name: "Size XL (Phụ phí)", price: 280000, stock: 20 },
          ],
        },
        seller.token
      );
      expect.equal(prod.variants[1].price, 280000);
      expect.equal(prod.variants[0].stock, 20);
    });

    test("F38-T4: Default variant generated when variants array is not supplied", async () => {
      const prod = await api.createProduct({ name: "Sản phẩm Đơn Sắc", price: 90000, stock: 30 }, seller.token);
      expect.equal(prod.variants.length, 1);
      expect.equal(prod.variants[0].name, "Default");
    });

    test("F38-T5: Variant selection resolves to targeted variant price for checkout", async () => {
      const prod = await api.createProduct(
        {
          name: "Áo Thun Cao Cấp",
          price: 200000,
          stock: 50,
          variants: [
            { sku: "AT-S", name: "Size S", price: 200000, stock: 25 },
            { sku: "AT-XXL", name: "Size XXL", price: 230000, stock: 25 },
          ],
        },
        seller.token
      );
      const selectedVariant = prod.variants.find((v) => v.sku === "AT-XXL");
      const pricing = await api.calculatePricing(generateCartPayload([{ price: selectedVariant.price, quantity: 1 }]));
      expect.equal(pricing.subtotal, 230000);
    });
  });
});
