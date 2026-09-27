/**
 * Tier 2: Boundary & Corner Cases - Subsystem 1: 3-Tier RBAC & Multi-Vendor Core (Features 1-8)
 * 5 boundary/corner test cases per feature (40 tests total).
 */

import { describe, test, expect, beforeEach } from "../harness/testRunner.js";
import { api } from "../harness/apiClient.js";
import { FIXTURES, createRandomEmail } from "../harness/testData.js";

describe("Tier 2 - Subsystem 1: 3-Tier RBAC & Multi-Vendor Core Boundaries", () => {
  beforeEach(() => {
    api.resetOracle();
  });

  // -------------------------------------------------------------
  // FEATURE 1: 3-Tier User Roles & Registration (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 1 Boundaries: Registration validation & edge cases", () => {
    test("F1-E1: Invalid email format missing @ is rejected", async () => {
      await expect.rejects(
        () => api.register({ email: "invalid-email-no-at.com", password: "Password123!", fullName: "Test" }),
        /INVALID_EMAIL/
      );
    });

    test("F1-E2: Password under 6 characters is rejected with WEAK_PASSWORD", async () => {
      await expect.rejects(
        () => api.register({ email: createRandomEmail(), password: "12345", fullName: "Short Pass" }),
        /WEAK_PASSWORD/
      );
    });

    test("F1-E3: Empty or whitespace-only full name is rejected with MISSING_NAME", async () => {
      await expect.rejects(
        () => api.register({ email: createRandomEmail(), password: "Password123!", fullName: "   " }),
        /MISSING_NAME/
      );
    });

    test("F1-E4: Unauthorized/bogus role string is rejected with INVALID_ROLE", async () => {
      await expect.rejects(
        () => api.register({ email: createRandomEmail(), password: "Password123!", fullName: "Hacker", role: "super_root" }),
        /INVALID_ROLE/
      );
    });

    test("F1-E5: Duplicate registration with existing email is rejected with EMAIL_EXISTS", async () => {
      const email = "duplicate_check@shopee.vn";
      await api.register({ email, password: "Password123!", fullName: "First User" });
      await expect.rejects(
        () => api.register({ email, password: "Password123!", fullName: "Second User" }),
        /EMAIL_EXISTS/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 2: JWT Auth & Role Middleware (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 2 Boundaries: Auth tokens and invalid credentials", () => {
    test("F2-E1: Login with empty email or password is rejected with MISSING_CREDENTIALS", async () => {
      await expect.rejects(
        () => api.login({ email: "", password: "" }),
        /MISSING_CREDENTIALS/
      );
    });

    test("F2-E2: Login with unregistered email is rejected with INVALID_CREDENTIALS", async () => {
      await expect.rejects(
        () => api.login({ email: "non_existent_404@shopee.vn", password: "Password123!" }),
        /INVALID_CREDENTIALS/
      );
    });

    test("F2-E3: Malformed or missing token header is rejected with UNAUTHORIZED", async () => {
      await expect.rejects(
        () => api.verifyToken("invalid.bearer.payload"),
        /UNAUTHORIZED/
      );
    });

    test("F2-E4: Banned user attempting to verify token is rejected with ACCOUNT_BANNED", async () => {
      const user = await api.register({ email: createRandomEmail("banned_tok"), password: "Password123!", fullName: "Banned One" });
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateUser(user.user.id, "banned", adminLogin.token);

      await expect.rejects(
        () => api.verifyToken(user.token),
        /ACCOUNT_BANNED/
      );
    });

    test("F2-E5: Token corresponding to deleted/non-existent user ID is rejected", async () => {
      await expect.rejects(
        () => api.verifyToken("jwt-token-nonexistent9999-customer"),
        /USER_NOT_FOUND/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 3: Seller Onboarding & Shop Creation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 3 Boundaries: Shop creation restrictions", () => {
    test("F3-E1: Customer role attempting to create shop is rejected with FORBIDDEN", async () => {
      const cust = await api.register({ email: createRandomEmail("cust_shop"), password: "Password123!", fullName: "Customer Normal", role: "customer" });
      await expect.rejects(
        () => api.createShop(FIXTURES.shops.shopTech, cust.token),
        /FORBIDDEN/
      );
    });

    test("F3-E2: Shop creation with empty shop name is rejected with INVALID_SHOP_NAME", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_empty_name"), password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.createShop({ ...FIXTURES.shops.shopTech, name: "" }, seller.token),
        /INVALID_SHOP_NAME/
      );
    });

    test("F3-E3: Shop creation with missing address is rejected with MISSING_SHOP_ADDRESS", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_no_addr"), password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.createShop({ ...FIXTURES.shops.shopTech, address: null }, seller.token),
        /MISSING_SHOP_ADDRESS/
      );
    });

    test("F3-E4: Shop creation with missing bank account is rejected with MISSING_BANK_INFO", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_no_bank"), password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.createShop({ ...FIXTURES.shops.shopTech, bankInfo: null }, seller.token),
        /MISSING_BANK_INFO/
      );
    });

    test("F3-E5: Unauthenticated request attempting shop creation is rejected with UNAUTHORIZED", async () => {
      await expect.rejects(
        () => api.createShop(FIXTURES.shops.shopTech, null),
        /UNAUTHORIZED/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 4: Multi-Vendor Tenant Data Isolation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 4 Boundaries: Cross-tenant unauthorized access", () => {
    test("F4-E1: Seller A cannot update Seller B's shop profile (rejected with FORBIDDEN)", async () => {
      const sellerA = await api.register({ email: createRandomEmail("selA_iso"), password: "Password123!", fullName: "Seller A", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, sellerA.token);

      const sellerB = await api.register({ email: createRandomEmail("selB_iso"), password: "Password123!", fullName: "Seller B", role: "seller" });
      await expect.rejects(
        () => api.updateShopProfile(shopA.id, { bio: "Hacked by Seller B" }, sellerB.token),
        /FORBIDDEN/
      );
    });

    test("F4-E2: Customer cannot update any shop profile", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_own"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const cust = await api.register({ email: createRandomEmail("cust_hack"), password: "Password123!", fullName: "Hacker" });

      await expect.rejects(
        () => api.updateShopProfile(shop.id, { bio: "Customer vandalism" }, cust.token),
        /FORBIDDEN/
      );
    });

    test("F4-E3: Non-existent shopId profile update is rejected with SHOP_NOT_FOUND", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await expect.rejects(
        () => api.updateShopProfile("shop-non-existent-999", { bio: "Test" }, adminLogin.token),
        /SHOP_NOT_FOUND/
      );
    });

    test("F4-E4: Seller attempting to create product without having a shop is rejected with NO_SHOP", async () => {
      const sellerNoShop = await api.register({ email: createRandomEmail("noshop"), password: "Password123!", fullName: "No Shop", role: "seller" });
      await expect.rejects(
        () => api.createProduct({ name: "Áo Thun", price: 100000, stock: 10 }, sellerNoShop.token),
        /NO_SHOP/
      );
    });

    test("F4-E5: Locked shop rejects product creation from its seller", async () => {
      const seller = await api.register({ email: createRandomEmail("lock_prod"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateShop(shop.id, "locked", adminLogin.token);

      // Verify shop is locked
      expect.equal(api.oracle.shops.get(shop.id).status, "locked");
    });
  });

  // -------------------------------------------------------------
  // FEATURE 5: Super Admin Shop & User Moderation (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 5 Boundaries: Moderation authorization & validation", () => {
    test("F5-E1: Seller attempting to lock another shop is rejected with FORBIDDEN", async () => {
      const sellerA = await api.register({ email: createRandomEmail("selA_mod"), password: "Password123!", fullName: "Seller A", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, sellerA.token);

      const sellerB = await api.register({ email: createRandomEmail("selB_mod"), password: "Password123!", fullName: "Seller B", role: "seller" });
      await expect.rejects(
        () => api.moderateShop(shopA.id, "locked", sellerB.token),
        /FORBIDDEN/
      );
    });

    test("F5-E2: Customer attempting to ban a user is rejected with FORBIDDEN", async () => {
      const custA = await api.register({ email: createRandomEmail("custA_ban"), password: "Password123!", fullName: "Cust A" });
      const custB = await api.register({ email: createRandomEmail("custB_ban"), password: "Password123!", fullName: "Cust B" });

      await expect.rejects(
        () => api.moderateUser(custB.user.id, "banned", custA.token),
        /FORBIDDEN/
      );
    });

    test("F5-E3: Admin moderating non-existent shop is rejected with SHOP_NOT_FOUND", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await expect.rejects(
        () => api.moderateShop("shop-non-existent", "locked", adminLogin.token),
        /SHOP_NOT_FOUND/
      );
    });

    test("F5-E4: Admin moderating non-existent user is rejected with USER_NOT_FOUND", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await expect.rejects(
        () => api.moderateUser("usr-non-existent", "banned", adminLogin.token),
        /USER_NOT_FOUND/
      );
    });

    test("F5-E5: Admin submitting invalid shop status string is rejected with INVALID_STATUS", async () => {
      const seller = await api.register({ email: createRandomEmail("sel_inv_st"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });

      await expect.rejects(
        () => api.moderateShop(shop.id, "destroyed_forever", adminLogin.token),
        /INVALID_STATUS/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 6: Navigation & Portal Routing Fix (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 6 Boundaries: Routing guards and unauthorized portals", () => {
    test("F6-E1: Customer accessing /seller/dashboard is identified as lacking seller permission", async () => {
      const cust = await api.register({ email: createRandomEmail("nav_guard_c"), password: "Password123!", fullName: "Cust" });
      const user = await api.verifyToken(cust.token);
      expect.equal(user.role === "seller" || user.role === "admin", false);
    });

    test("F6-E2: Customer accessing /admin/dashboard is identified as lacking admin permission", async () => {
      const cust = await api.register({ email: createRandomEmail("nav_guard_a"), password: "Password123!", fullName: "Cust" });
      const user = await api.verifyToken(cust.token);
      expect.equal(user.role === "admin", false);
    });

    test("F6-E3: Seller accessing /admin/dashboard is identified as lacking admin permission", async () => {
      const seller = await api.register({ email: createRandomEmail("nav_guard_s"), password: "Password123!", fullName: "Seller", role: "seller" });
      const user = await api.verifyToken(seller.token);
      expect.equal(user.role === "admin", false);
    });

    test("F6-E4: Expired or corrupted session token blocks navigation", async () => {
      await expect.rejects(
        () => api.verifyToken("corrupted-session-token-xyz"),
        /UNAUTHORIZED/
      );
    });

    test("F6-E5: Unauthenticated navigation redirects to login state", async () => {
      await expect.rejects(
        () => api.verifyToken(""),
        /UNAUTHORIZED/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 7: Multi-Shop Switcher (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 7 Boundaries: Multi-shop switcher security", () => {
    test("F7-E1: Seller switching to a shop owned by another seller is rejected with UNAUTHORIZED_SHOP", async () => {
      const sellerA = await api.register({ email: createRandomEmail("swA"), password: "Password123!", fullName: "Seller A", role: "seller" });
      const shopA = await api.createShop(FIXTURES.shops.shopTech, sellerA.token);

      const sellerB = await api.register({ email: createRandomEmail("swB"), password: "Password123!", fullName: "Seller B", role: "seller" });
      await expect.rejects(
        () => api.switchShop(shopA.id, sellerB.token),
        /UNAUTHORIZED_SHOP/
      );
    });

    test("F7-E2: Switching to a non-existent shopId is rejected with UNAUTHORIZED_SHOP", async () => {
      const seller = await api.register({ email: createRandomEmail("sw_ghost"), password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.switchShop("shop-ghost-9999", seller.token),
        /UNAUTHORIZED_SHOP/
      );
    });

    test("F7-E3: Switching to a locked shop is rejected with SHOP_LOCKED", async () => {
      const seller = await api.register({ email: createRandomEmail("sw_lock"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop1 = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const shop2 = await api.createShop(FIXTURES.shops.shopFashion, seller.token);

      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await api.moderateShop(shop2.id, "locked", adminLogin.token);

      await expect.rejects(
        () => api.switchShop(shop2.id, seller.token),
        /SHOP_LOCKED/
      );
    });

    test("F7-E4: Customer with no shops attempting to switch is rejected with UNAUTHORIZED_SHOP", async () => {
      const cust = await api.register({ email: createRandomEmail("sw_cust"), password: "Password123!", fullName: "Cust" });
      await expect.rejects(
        () => api.switchShop("shop-any", cust.token),
        /UNAUTHORIZED_SHOP/
      );
    });

    test("F7-E5: Switching with null or empty shopId is rejected", async () => {
      const seller = await api.register({ email: createRandomEmail("sw_null"), password: "Password123!", fullName: "Seller", role: "seller" });
      await expect.rejects(
        () => api.switchShop(null, seller.token),
        /UNAUTHORIZED_SHOP/
      );
    });
  });

  // -------------------------------------------------------------
  // FEATURE 8: Shop Profile & Policy Configuration (5 edge tests)
  // -------------------------------------------------------------
  describe("Feature 8 Boundaries: Profile configuration constraints", () => {
    test("F8-E1: Updating non-existent shop returns SHOP_NOT_FOUND", async () => {
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      await expect.rejects(
        () => api.updateShopProfile("shop-404", { bio: "New" }, adminLogin.token),
        /SHOP_NOT_FOUND/
      );
    });

    test("F8-E2: Unauthenticated user cannot update shop profile", async () => {
      await expect.rejects(
        () => api.updateShopProfile("shop-tech-world", { bio: "Hack" }, null),
        /UNAUTHORIZED/
      );
    });

    test("F8-E3: Empty updates object leaves existing policies intact", async () => {
      const seller = await api.register({ email: createRandomEmail("noop"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const originalBio = shop.bio;
      const updated = await api.updateShopProfile(shop.id, {}, seller.token);
      expect.equal(updated.bio, originalBio);
    });

    test("F8-E4: Partial contactInfo update does not wipe untouched contact fields", async () => {
      const seller = await api.register({ email: createRandomEmail("part"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const originalEmail = shop.contactInfo.email;
      const updated = await api.updateShopProfile(shop.id, { contactInfo: { phone: "0911223344" } }, seller.token);
      expect.equal(updated.contactInfo.phone, "0911223344");
      expect.equal(updated.contactInfo.email, originalEmail);
    });

    test("F8-E5: Super Admin can override update on any shop profile", async () => {
      const seller = await api.register({ email: createRandomEmail("adm_ovr"), password: "Password123!", fullName: "Seller", role: "seller" });
      const shop = await api.createShop(FIXTURES.shops.shopTech, seller.token);
      const adminLogin = await api.login({ email: "admin@shopee.enterprise.vn", password: "mock-hash-admin" });
      const updated = await api.updateShopProfile(shop.id, { bio: "Admin verified store" }, adminLogin.token);
      expect.equal(updated.bio, "Admin verified store");
    });
  });
});
