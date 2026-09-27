/**
 * Tier 1: Feature Coverage - Subsystem 1: 3-Tier RBAC & Multi-Vendor Core (Features 1-8)
 * 5 isolated happy-path test cases per feature (40 tests total).
 */

import { describe, test, expect, beforeAll, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, createRandomEmail } from "../harness/testData.js";

describe("Tier 1 - Subsystem 1: 3-Tier RBAC & Multi-Vendor Core", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 1: 3-Tier User Roles & Registration (5 tests)
  // -------------------------------------------------------------
  describe("Feature 1: 3-Tier User Roles & Registration", () => {
    test("F1-T1: Customer registers successfully with valid details", async () => {
      const email = createRandomEmail("cust");
      const res = await api.register({
        email,
        password: "SecurePassword123!",
        fullName: "Nguyễn Khách Hàng",
        role: "customer",
      });
      expect.ok(res.token, "Should issue session token");
      expect.equal(res.user.role, "customer");
      expect.equal(res.user.fullName, "Nguyễn Khách Hàng");
    });

    test("F1-T2: Seller registers successfully with seller role", async () => {
      const email = createRandomEmail("sell");
      const res = await api.register({
        email,
        password: "SellerPassword123!",
        fullName: "Trần Chủ Shop",
        role: "seller",
      });
      expect.ok(res.token);
      expect.equal(res.user.role, "seller");
    });

    test("F1-T3: Administrator registers successfully with admin role", async () => {
      const email = createRandomEmail("adm");
      const res = await api.register({
        email,
        password: "AdminPassword123!",
        fullName: "Admin Tổng",
        role: "admin",
      });
      expect.ok(res.token);
      expect.equal(res.user.role, "admin");
    });

    test("F1-T4: Default role assigns to customer when role is omitted", async () => {
      const email = createRandomEmail("default");
      const res = await api.register({
        email,
        password: "Password123!",
        fullName: "Người Dùng Mặc Định",
      });
      expect.equal(res.user.role, "customer");
    });

    test("F1-T5: Registration automatically normalizes email to lowercase", async () => {
      const res = await api.register({
        email: "MIXED_Case_User@Shopee.VN",
        password: "Password123!",
        fullName: "User Mixed Case",
      });
      expect.equal(res.user.email, "mixed_case_user@shopee.vn");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 2: JWT Auth & Role Middleware (5 tests)
  // -------------------------------------------------------------
  describe("Feature 2: JWT Auth & Role Middleware", () => {
    test("F2-T1: Customer logs in and receives valid JWT token", async () => {
      const email = createRandomEmail("login_cust");
      await api.register({ email, password: "Password123!", fullName: "Buyer A" });
      const loginRes = await api.login({ email, password: "Password123!" });
      expect.ok(loginRes.token.startsWith("jwt-token-"));
      expect.equal(loginRes.user.email, email);
    });

    test("F2-T2: Seller logs in and receives token with seller credentials", async () => {
      const email = createRandomEmail("login_sel");
      await api.register({ email, password: "Password123!", fullName: "Seller B", role: "seller" });
      const loginRes = await api.login({ email, password: "Password123!" });
      expect.equal(loginRes.user.role, "seller");
    });

    test("F2-T3: Super Admin logs in and receives admin level token", async () => {
      const email = createRandomEmail("login_adm");
      await api.register({ email, password: "Password123!", fullName: "Admin C", role: "admin" });
      const loginRes = await api.login({ email, password: "Password123!" });
      expect.equal(loginRes.user.role, "admin");
    });

    test("F2-T4: Token verification parses valid user payload", async () => {
      const email = createRandomEmail("verify");
      const reg = await api.register({ email, password: "Password123!", fullName: "Verify User" });
      const verified = await api.verifyToken(reg.token);
      expect.equal(verified.id, reg.user.id);
      expect.equal(verified.email, email);
    });

    test("F2-T5: User role is verified accurately against token claims", async () => {
      const email = createRandomEmail("role_claim");
      const reg = await api.register({ email, password: "Password123!", fullName: "Role Claim", role: "seller" });
      const user = await api.verifyToken(reg.token);
      expect.equal(user.role, "seller");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 3: Seller Onboarding & Shop Creation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 3: Seller Onboarding & Shop Creation", () => {
    test("F3-T1: Seller successfully creates shop with banking and address details", async () => {
      const reg = await api.register({ email: createRandomEmail("shop"), password: "Password123!", fullName: "Shop Owner", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, reg.token);
      expect.ok(shop.id.startsWith("shop-"));
      expect.equal(shop.name, FIXTURES.shops.shopTech.name);
      expect.equal(shop.ownerId, reg.user.id);
    });

    test("F3-T2: Newly created shop defaults to active status", async () => {
      const reg = await api.register({ email: createRandomEmail("shop_act"), password: "Password123!", fullName: "Shop Active", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, reg.token);
      expect.equal(shop.status, "active");
    });

    test("F3-T3: Shop creation associates shopId with seller profile", async () => {
      const reg = await api.register({ email: createRandomEmail("shop_prof"), password: "Password123!", fullName: "Shop Prof", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, reg.token);
      const user = await api.verifyToken(reg.token);
      expect.equal(user.shopId, shop.id);
    });

    test("F3-T4: Seller's shops list includes the newly created shop", async () => {
      const reg = await api.register({ email: createRandomEmail("shop_arr"), password: "Password123!", fullName: "Shop Arr", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, reg.token);
      const user = await api.verifyToken(reg.token);
      expect.ok(user.shops.includes(shop.id));
    });

    test("F3-T5: Bank payout account details are stored securely", async () => {
      const reg = await api.register({ email: createRandomEmail("shop_bank"), password: "Password123!", fullName: "Shop Bank", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopFashion, reg.token);
      expect.equal(shop.bankInfo.bankName, "Techcombank");
      expect.equal(shop.bankInfo.accountNumber, "19033445566778");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 4: Multi-Vendor Tenant Data Isolation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 4: Multi-Vendor Tenant Data Isolation", () => {
    test("F4-T1: Products created by Seller A are tagged with Seller A's shopId", async () => {
      const regA = await api.register({ email: createRandomEmail("tenA"), password: "Password123!", fullName: "Seller A", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, regA.token);
      const prodA = await api.createProduct({ name: "Sản phẩm Shop A", price: 100000, stock: 10 }, regA.token);
      expect.equal(prodA.shopId, shopA.id);
    });

    test("F4-T2: Products created by Seller B are strictly separated from Seller A", async () => {
      const regA = await api.register({ email: createRandomEmail("tenA2"), password: "Password123!", fullName: "Seller A2", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, regA.token);
      const prodA = await api.createProduct({ name: "Sản phẩm Shop A", price: 100000, stock: 10 }, regA.token);

      const regB = await api.register({ email: createRandomEmail("tenB"), password: "Password123!", fullName: "Seller B", role: "seller" });
      const shopB = await api.createShop(FIXTURES.shops.shopFashion, regB.token);
      const prodB = await api.createProduct({ name: "Sản phẩm Shop B", price: 200000, stock: 20 }, regB.token);

      expect.notEqual(prodA.shopId, prodB.shopId);
    });

    test("F4-T3: Multi-vendor cart preserves distinct shopId per line item", async () => {
      const pricing = await api.calculatePricing({
        items: [
          { productId: "p1", price: 100000, quantity: 1, shopId: "shop-1" },
          { productId: "p2", price: 200000, quantity: 2, shopId: "shop-2" },
        ],
      });
      expect.equal(pricing.multiShopGroups.length, 2);
    });

    test("F4-T4: Seller A successfully updates their own shop profile", async () => {
      const regA = await api.register({ email: createRandomEmail("profA"), password: "Password123!", fullName: "Seller A", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, regA.token);
      const updated = await api.updateShopProfile(shopA.id, { bio: "Uy tín số 1 Hà Nội" }, regA.token);
      expect.equal(updated.bio, "Uy tín số 1 Hà Nội");
    });

    test("F4-T5: Multi-shop grouping separates shop subtotals accurately", async () => {
      const pricing = await api.calculatePricing({
        items: [
          { productId: "p1", price: 100000, quantity: 2, shopId: "shop-A" }, // 200k
          { productId: "p2", price: 150000, quantity: 1, shopId: "shop-B" }, // 150k
        ],
      });
      const groupA = pricing.multiShopGroups.find((g) => g.shopId === "shop-A");
      const groupB = pricing.multiShopGroups.find((g) => g.shopId === "shop-B");
      expect.equal(groupA.subtotal, 200000);
      expect.equal(groupB.subtotal, 150000);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 5: Super Admin Shop & User Moderation (5 tests)
  // -------------------------------------------------------------
  describe("Feature 5: Super Admin Shop & User Moderation", () => {
    test("F5-T1: Super Admin can lock an offending shop", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_lock"), password: "Password123!", fullName: "Bad Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const moderated = await api.moderateShop(shop.id, "locked", adminLogin.token);
      expect.equal(moderated.status, "locked");
    });

    test("F5-T2: Super Admin can restore/unlock a previously locked shop", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_unlock"), password: "Password123!", fullName: "Seller Unlock", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateShop(shop.id, "locked", adminLogin.token);
      const restored = await api.moderateShop(shop.id, "active", adminLogin.token);
      expect.equal(restored.status, "active");
    });

    test("F5-T3: Super Admin can ban a fraudulent user account", async () => {
      const user = await api.register({ email: createRandomEmail("fraud"), password: "Password123!", fullName: "Fraud Buyer" });
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const banned = await api.moderateUser(user.user.id, "banned", adminLogin.token);
      expect.equal(banned.status, "banned");
    });

    test("F5-T4: Super Admin can unban a reinstated user", async () => {
      const user = await api.register({ email: createRandomEmail("reinst"), password: "Password123!", fullName: "Reinstated" });
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateUser(user.user.id, "banned", adminLogin.token);
      const active = await api.moderateUser(user.user.id, "active", adminLogin.token);
      expect.equal(active.status, "active");
    });

    test("F5-T5: Super Admin can place a shop under compliance review", async () => {
      const seller = await api.register({ email: createRandomEmail("review"), password: "Password123!", fullName: "Review Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const underReview = await api.moderateShop(shop.id, "under_review", adminLogin.token);
      expect.equal(underReview.status, "under_review");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 6: Navigation & Portal Routing Fix (5 tests)
  // -------------------------------------------------------------
  describe("Feature 6: Navigation & Portal Routing Fix", () => {
    test("F6-T1: Seller token authorizes navigation to /seller/dashboard", async () => {
      const seller = await api.register({ email: createRandomEmail("nav_sel"), password: "Password123!", fullName: "Nav Seller", role: "seller" });
      const user = await api.verifyToken(seller.token);
      expect.ok(["seller", "admin"].includes(user.role), "Must have seller or admin role");
    });

    test("F6-T2: Admin token authorizes navigation to /admin/dashboard", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const user = await api.verifyToken(adminLogin.token);
      expect.equal(user.role, "admin");
    });

    test("F6-T3: Customer token navigates cleanly to storefront and orders", async () => {
      const cust = await api.register({ email: createRandomEmail("nav_cust"), password: "Password123!", fullName: "Nav Customer" });
      const user = await api.verifyToken(cust.token);
      expect.equal(user.role, "customer");
    });

    test("F6-T4: Session persistence preserves active token across route transitions", async () => {
      const seller = await api.register({ email: createRandomEmail("nav_pers"), password: "Password123!", fullName: "Nav Persist", role: "seller" });
      const t1 = await api.verifyToken(seller.token);
      const t2 = await api.verifyToken(seller.token);
      expect.equal(t1.id, t2.id);
    });

    test("F6-T5: Admin token has universal access to both seller and admin portals", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const user = await api.verifyToken(adminLogin.token);
      const hasSellerAccess = ["seller", "admin"].includes(user.role);
      const hasAdminAccess = user.role === "admin";
      expect.ok(hasSellerAccess && hasAdminAccess);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 7: Multi-Shop Switcher (5 tests)
  // -------------------------------------------------------------
  describe("Feature 7: Multi-Shop Switcher", () => {
    test("F7-T1: Seller can switch active shop context to their second shop", async () => {
      const seller = await api.register({ email: createRandomEmail("switch"), password: "Password123!", fullName: "Multi Owner", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);
      const switched = await api.switchShop(shop2.id, seller.token);
      expect.equal(switched.activeShopId, shop2.id);
    });

    test("F7-T2: Switched active shop is reflected on seller session profile", async () => {
      const seller = await api.register({ email: createRandomEmail("switch_prof"), password: "Password123!", fullName: "Multi Owner 2", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);
      await api.switchShop(shop2.id, seller.token);
      const user = await api.verifyToken(seller.token);
      expect.equal(user.shopId, shop2.id);
    });

    test("F7-T3: Seller can switch back and forth between active shops seamlessly", async () => {
      const seller = await api.register({ email: createRandomEmail("switch_toggle"), password: "Password123!", fullName: "Multi Owner 3", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);
      await api.switchShop(shop2.id, seller.token);
      const switchBack = await api.switchShop(shop1.id, seller.token);
      expect.equal(switchBack.activeShopId, shop1.id);
    });

    test("F7-T4: Product creation inherits the currently active switched shopId", async () => {
      const seller = await api.register({ email: createRandomEmail("switch_prod"), password: "Password123!", fullName: "Multi Owner 4", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);
      await api.switchShop(shop2.id, seller.token);
      const prod = await api.createProduct({ name: "Áo Thun Shop 2", price: 150000, stock: 10 }, seller.token);
      expect.equal(prod.shopId, shop2.id);
    });

    test("F7-T5: Multi-shop switcher preserves individual shop metadata intact", async () => {
      const seller = await api.register({ email: createRandomEmail("switch_meta"), password: "Password123!", fullName: "Multi Owner 5", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);
      const res = await api.switchShop(shop2.id, seller.token);
      expect.equal(res.shop.name, FIXTURES.shops.shopFashion.name);
    });
  });

  // -------------------------------------------------------------
  // FEATURE 8: Shop Profile & Policy Configuration (5 tests)
  // -------------------------------------------------------------
  describe("Feature 8: Shop Profile & Policy Configuration", () => {
    test("F8-T1: Seller can update shop bio and description", async () => {
      const seller = await api.register({ email: createRandomEmail("conf_bio"), password: "Password123!", fullName: "Shop Config", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const updated = await api.updateShopProfile(shop.id, { bio: "Cửa hàng công nghệ hàng đầu Việt Nam" }, seller.token);
      expect.equal(updated.bio, "Cửa hàng công nghệ hàng đầu Việt Nam");
    });

    test("F8-T2: Seller can update custom shipping policy", async () => {
      const seller = await api.register({ email: createRandomEmail("conf_ship"), password: "Password123!", fullName: "Shop Ship", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const updated = await api.updateShopProfile(shop.id, { shippingPolicy: "Giao hỏa tốc 2 giờ nội thành Hà Nội" }, seller.token);
      expect.equal(updated.shippingPolicy, "Giao hỏa tốc 2 giờ nội thành Hà Nội");
    });

    test("F8-T3: Seller can configure custom return and warranty policy", async () => {
      const seller = await api.register({ email: createRandomEmail("conf_ret"), password: "Password123!", fullName: "Shop Ret", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const updated = await api.updateShopProfile(shop.id, { returnPolicy: "Bảo hành 1 đổi 1 trong 30 ngày nếu lỗi NSX" }, seller.token);
      expect.equal(updated.returnPolicy, "Bảo hành 1 đổi 1 trong 30 ngày nếu lỗi NSX");
    });

    test("F8-T4: Seller can update hotline phone and contact email", async () => {
      const seller = await api.register({ email: createRandomEmail("conf_phone"), password: "Password123!", fullName: "Shop Contact", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const updated = await api.updateShopProfile(shop.id, { contactInfo: { phone: "0999888777", email: "hotline@techworld.vn" } }, seller.token);
      expect.equal(updated.contactInfo.phone, "0999888777");
      expect.equal(updated.contactInfo.email, "hotline@techworld.vn");
    });

    test("F8-T5: Seller can update official display name of the shop", async () => {
      const seller = await api.register({ email: createRandomEmail("conf_name"), password: "Password123!", fullName: "Shop Name", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const updated = await api.updateShopProfile(shop.id, { name: "Tech World Official Mall" }, seller.token);
      expect.equal(updated.name, "Tech World Official Mall");
    });
  });
});
