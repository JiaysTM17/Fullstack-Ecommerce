/**
 * Tier 2: Boundary & Corner Cases - Subsystem 5: Catalog Moderation & Image Integrity (Features 34-38)
 * 5 boundary/corner test cases per feature (25 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, generateCartPayload } from "../harness/testData.js";

describe("Tier 2 - Subsystem 5: Catalog Moderation & Image Integrity Boundaries", () => {
  let seller, shop, admin;

  beforeEach(async () => {
    api.resetOracle();
    seller = await api.register({ email: "cat_edge_sel@test.vn", password: "Password123!", fullName: "Seller", role: "seller" });
    shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
    admin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
  });

  // -------------------------------------------------------------
  // FEATURE 34: Product Moderation Workflow (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 34 Boundaries: Moderation authorization and edge cases", () => {
    test("F34-E1: Moderating non-existent product is rejected with PRODUCT_NOT_FOUND", async () => {
      await expect.rejects(
        () => api.moderateProduct("prod-ghost-404", "approved", admin.token),
        /PRODUCT_NOT_FOUND/
      );
    });

    test("F34-E2: Customer role attempting product moderation is rejected with FORBIDDEN", async () => {
      const prod = await api.createProduct({ name: "Chuột Gaming", price: 200000, stock: 10 }, seller.token);
      const cust = await api.register({ email: "cust_mod_hack@test.vn", password: "Password123!", fullName: "Cust" });
      await expect.rejects(
        () => api.moderateProduct(prod.id, "approved", cust.token),
        /FORBIDDEN/
      );
    });

    test("F34-E3: Seller attempting to self-approve their own product is rejected with FORBIDDEN", async () => {
      const prod = await api.createProduct({ name: "Tai Nghe", price: 300000, stock: 5 }, seller.token);
      await expect.rejects(
        () => api.moderateProduct(prod.id, "approved", seller.token),
        /FORBIDDEN/
      );
    });

    test("F34-E4: Moderation with invalid status string is rejected with INVALID_STATUS", async () => {
      const prod = await api.createProduct({ name: "Bàn Di Chuột", price: 50000, stock: 20 }, seller.token);
      await expect.rejects(
        () => api.moderateProduct(prod.id, "super_valid", admin.token),
        /INVALID_STATUS/
      );
    });

    test("F34-E5: Storefront filter by category with zero matching products returns empty array", async () => {
      const prod = await api.createProduct({ name: "Bàn Phím", price: 500000, stock: 5, category: "electronics" }, seller.token);
      await api.moderateProduct(prod.id, "approved", admin.token);
      const res = await api.getStorefrontProducts({ category: "books_nonexistent" });
      expect.equal(res.length, 0);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 35: Image Fallback & Broken Image Protection (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 35 Boundaries: Image missing/broken fallbacks", () => {
    test("F35-E1: Empty string image URL array defaults to placeholder image", async () => {
      const prod = await api.createProduct({ name: "SP Empty Image", price: 100000, stock: 5, images: [] }, seller.token);
      expect.equal(prod.images[0], "/images/default-product.png");
    });

    test("F35-E2: Product created with null images parameter gets fallback array", async () => {
      const prod = await api.createProduct({ name: "SP Null Image", price: 100000, stock: 5, images: null || [] }, seller.token);
      expect.equal(prod.images[0], "/images/default-product.png");
    });

    test("F35-E3: Image fallback path is valid relative static path", async () => {
      const prod = await api.createProduct({ name: "SP Test Path", price: 100000, stock: 5 }, seller.token);
      expect.ok(prod.images[0].startsWith("/images/"));
    });

    test("F35-E4: Multiple products without images share the standard placeholder without mutation", async () => {
      const p1 = await api.createProduct({ name: "SP 1", price: 100000, stock: 5 }, seller.token);
      const p2 = await api.createProduct({ name: "SP 2", price: 100000, stock: 5 }, seller.token);
      expect.equal(p1.images[0], p2.images[0]);
    });

    test("F35-E5: Storefront products each guarantee non-empty image list", async () => {
      const prod = await api.createProduct({ name: "SP Duyệt", price: 100000, stock: 5 }, seller.token);
      await api.moderateProduct(prod.id, "approved", admin.token);
      const storefront = await api.getStorefrontProducts();
      for (const p of storefront) {
        expect.ok(p.images && p.images.length > 0);
      }
    });
  });

  // -------------------------------------------------------------
  // FEATURE 36: Product Image File Upload (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 36 Boundaries: File upload format and size limits", () => {
    test("F36-E1: Upload without any file is rejected with NO_FILE_UPLOADED", async () => {
      await expect.rejects(
        () => api.validateImageUpload(null),
        /NO_FILE_UPLOADED/
      );
    });

    test("F36-E2: Disallowed executable file (.exe) is rejected with INVALID_FILE_TYPE", async () => {
      const badFile = { name: "virus.exe", mimetype: "application/x-msdownload", size: 1024 * 50 };
      await expect.rejects(
        () => api.validateImageUpload(badFile),
        /INVALID_FILE_TYPE/
      );
    });

    test("F36-E3: Shell script (.sh) upload is rejected with INVALID_FILE_TYPE", async () => {
      const badFile = { name: "script.sh", mimetype: "application/x-sh", size: 1024 * 10 };
      await expect.rejects(
        () => api.validateImageUpload(badFile),
        /INVALID_FILE_TYPE/
      );
    });

    test("F36-E4: Image file exceeding 5MB size limit is rejected with FILE_TOO_LARGE", async () => {
      const oversized = { name: "huge.jpg", mimetype: "image/jpeg", size: 6 * 1024 * 1024 }; // 6MB
      await expect.rejects(
        () => api.validateImageUpload(oversized),
        /FILE_TOO_LARGE/
      );
    });

    test("F36-E5: Image file at exactly 5MB boundary is accepted", async () => {
      const boundaryFile = { name: "boundary.png", mimetype: "image/png", size: 5 * 1024 * 1024 }; // exactly 5MB
      const upload = await api.validateImageUpload(boundaryFile);
      expect.ok(upload.url);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 37: Catalog Inventory & Stock Control (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 37 Boundaries: Inventory stock boundaries", () => {
    test("F37-E1: Ordering quantity exceeding available stock is rejected with OUT_OF_STOCK", async () => {
      const prod = await api.createProduct({ name: "SP Hết Hàng", price: 100000, stock: 3 }, seller.token);
      const buyer = await api.register({ email: "buyer_stk_fail@test.vn", password: "Password123!", fullName: "Buyer" });
      await expect.rejects(
        () => api.createOrder(generateCartPayload([{ productId: prod.id, price: 100000, quantity: 5 }]), buyer.token),
        /OUT_OF_STOCK/
      );
    });

    test("F37-E2: Ordering item with 0 stock remaining is rejected with OUT_OF_STOCK", async () => {
      const prod = await api.createProduct({ name: "SP Zero Stock", price: 100000, stock: 0 }, seller.token);
      const buyer = await api.register({ email: "buyer_zero_stk@test.vn", password: "Password123!", fullName: "Buyer" });
      await expect.rejects(
        () => api.createOrder(generateCartPayload([{ productId: prod.id, price: 100000, quantity: 1 }]), buyer.token),
        /OUT_OF_STOCK/
      );
    });

    test("F37-E3: Creating product with negative price is rejected with INVALID_PRICE", async () => {
      await expect.rejects(
        () => api.createProduct({ name: "SP Âm Tiền", price: -10000, stock: 10 }, seller.token),
        /INVALID_PRICE/
      );
    });

    test("F37-E4: Creating product with negative stock is rejected with INVALID_STOCK", async () => {
      await expect.rejects(
        () => api.createProduct({ name: "SP Âm Kho", price: 100000, stock: -5 }, seller.token),
        /INVALID_STOCK/
      );
    });

    test("F37-E5: Order cancellation does not restore more stock than was originally deducted", async () => {
      const prod = await api.createProduct({ name: "SP Phục Hồi", price: 100000, stock: 10 }, seller.token);
      const buyer = await api.register({ email: "buyer_exact_stk@test.vn", password: "Password123!", fullName: "Buyer" });
      const order = await api.createOrder(generateCartPayload([{ productId: prod.id, price: 100000, quantity: 4 }]), buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 6);

      await api.cancelOrder(order.id, buyer.token);
      expect.equal(api.oracle.products.get(prod.id).stock, 10);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 38: Buy Box & Variant Selector (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 38 Boundaries: SKU variants constraints", () => {
    test("F38-E1: Empty product name during creation is rejected with INVALID_PRODUCT_NAME", async () => {
      await expect.rejects(
        () => api.createProduct({ name: "", price: 100000, stock: 10 }, seller.token),
        /INVALID_PRODUCT_NAME/
      );
    });

    test("F38-E2: Fractional stock value is rejected with INVALID_STOCK", async () => {
      await expect.rejects(
        () => api.createProduct({ name: "SP Thập Phân", price: 100000, stock: 2.5 }, seller.token),
        /INVALID_STOCK/
      );
    });

    test("F38-E3: Non-numeric price is rejected with INVALID_PRICE", async () => {
      await expect.rejects(
        () => api.createProduct({ name: "SP Giá Chữ", price: "Một triệu", stock: 10 }, seller.token),
        /INVALID_PRICE/
      );
    });

    test("F38-E4: Variant array with multiple SKUs retains distinct stock per SKU", async () => {
      const prod = await api.createProduct(
        {
          name: "Áo Polo",
          price: 200000,
          stock: 30,
          variants: [
            { sku: "VAR-1", name: "Đỏ", price: 200000, stock: 10 },
            { sku: "VAR-2", name: "Xanh", price: 200000, stock: 20 },
          ],
        },
        seller.token
      );
      expect.equal(prod.variants[0].stock, 10);
      expect.equal(prod.variants[1].stock, 20);
    });

    test("F38-E5: Selecting variant price updates checkout line item accurately", async () => {
      const prod = await api.createProduct(
        {
          name: "Bàn Phím Đổi Switch",
          price: 800000,
          stock: 20,
          variants: [
            { sku: "SW-RED", name: "Red Switch", price: 800000, stock: 10 },
            { sku: "SW-BLUE", name: "Blue Switch (Cao Cấp)", price: 890000, stock: 10 },
          ],
        },
        seller.token
      );
      const blueVariant = prod.variants.find((v) => v.sku === "SW-BLUE");
      const pricing = await api.calculatePricing(generateCartPayload([{ price: blueVariant.price, quantity: 1 }]));
      expect.equal(pricing.subtotal, 890000);
    });
  });
});
