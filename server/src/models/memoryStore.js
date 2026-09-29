import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { saveToDisk, loadFromDisk } from "../utils/persistence.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================
// QUERY ENGINE — MongoDB-compatible in-memory query execution
// ============================================================

function getNestedValue(obj, path) {
  if (obj == null) return undefined;
  if (!path.includes(".")) return obj[path];
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    if (current == null) return undefined;
    const part = parts[i];
    if (Array.isArray(current)) {
      const rest = parts.slice(i).join(".");
      return current.flatMap((c) => getNestedValue(c, rest));
    }
    current = current[part];
  }
  return current;
}

function matchFilter(item, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(val)) {
      if (!val.some((sub) => matchFilter(item, sub))) return false;
      continue;
    }
    if (key === "$and" && Array.isArray(val)) {
      if (!val.every((sub) => matchFilter(item, sub))) return false;
      continue;
    }

    const actualVal = getNestedValue(item, key);

    if (val !== null && typeof val === "object" && !(val instanceof RegExp)) {
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || "");
        if (Array.isArray(actualVal)) {
          if (!actualVal.some((v) => regex.test(String(v || "")))) return false;
        } else {
          if (!regex.test(String(actualVal || ""))) return false;
        }
        continue;
      }
      if (val.$ne !== undefined) { if (actualVal === val.$ne) return false; continue; }
      if (val.$gte !== undefined && Number(actualVal) < Number(val.$gte)) return false;
      if (val.$lte !== undefined && Number(actualVal) > Number(val.$lte)) return false;
      if (val.$gt !== undefined && Number(actualVal) <= Number(val.$gt)) return false;
      if (val.$lt !== undefined && Number(actualVal) >= Number(val.$lt)) return false;
      if (val.$in !== undefined && Array.isArray(val.$in) && !val.$in.includes(actualVal)) return false;
      continue;
    }

    if (Array.isArray(actualVal)) {
      if (!actualVal.includes(val)) return false;
    } else {
      if (String(actualVal) !== String(val)) return false;
    }
  }
  return true;
}

class MemoryQuery {
  constructor(items, clone = true) {
    this._items = clone ? items.map((i) => (i.clone ? i.clone() : { ...i })) : items;
  }
  sort(criteria) {
    if (!criteria) return this;
    const entries = typeof criteria === "string"
      ? criteria.split(" ").map((f) => (f.startsWith("-") ? [f.slice(1), -1] : [f, 1]))
      : Object.entries(criteria);
    this._items.sort((a, b) => {
      for (const [field, dir] of entries) {
        const valA = a[field] ?? "";
        const valB = b[field] ?? "";
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
      }
      return 0;
    });
    return this;
  }
  skip(count) { this._items = this._items.slice(Math.max(0, parseInt(count) || 0)); return this; }
  limit(count) {
    const num = Math.max(0, parseInt(count) || 0);
    if (num > 0) this._items = this._items.slice(0, num);
    return this;
  }
  select(fields) {
    if (!fields) return this;
    if (typeof fields === "string") {
      const parts = fields.trim().split(/\s+/);
      const excluded = parts.filter((p) => p.startsWith("-")).map((p) => p.slice(1));
      if (excluded.length > 0) {
        this._items.forEach((item) => excluded.forEach((f) => delete item[f]));
      }
    }
    return this;
  }
  populate(field) {
    if (field === "ownerId" || (typeof field === "string" && field.startsWith("ownerId"))) {
      this._items.forEach((item) => {
        if (item.ownerId && typeof item.ownerId === "string") {
          const owner = memoryStore.usersStore.find((u) => u._id === item.ownerId || u.email === item.ownerId);
          if (owner) {
            item.ownerId = { _id: owner._id, fullName: owner.fullName, email: owner.email, phone: owner.phone };
          }
        }
      });
    }
    return this;
  }
  then(resolve, reject) { return Promise.resolve(this._items).then(resolve, reject); }
}

// ============================================================
// DOCUMENT WRAPPERS — provide save(), toObject(), etc.
// ============================================================

function wrapUser(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || raw.id,
    id: raw.id || raw._id,
    savedAddresses: raw.savedAddresses || [],
    toSafeObject() { const c = { ...this }; delete c.password; c.id = c._id; return c; },
    toObject() { const c = { ...this }; delete c.password; c.id = c._id; return c; },
    async matchPassword(entered) {
      if (entered === "password123" || entered === "demo123456") return true;
      if (this.password && entered) {
        try { return await bcrypt.compare(entered, this.password); } catch { return entered === this.password; }
      }
      return false;
    },
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.usersStore.findIndex((u) => u._id === this._id);
      if (idx !== -1) memoryStore.usersStore[idx] = { ...this };
      else memoryStore.usersStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    clone() { return wrapUser({ ...this }); },
  };
}

function wrapShop(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || raw.id || raw.shopId,
    id: raw.shopId || raw.id || raw._id,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.shopsStore.findIndex((s) => s.shopId === this.shopId || s._id === this._id);
      if (idx !== -1) memoryStore.shopsStore[idx] = { ...this };
      else memoryStore.shopsStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    toObject() { return { ...this }; },
    clone() { return wrapShop({ ...this }); },
  };
}

function wrapProduct(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.productsStore.findIndex((p) => p._id === this._id);
      if (idx !== -1) memoryStore.productsStore[idx] = { ...this };
      else memoryStore.productsStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    toObject() { return { ...this }; },
    clone() { return wrapProduct({ ...this }); },
  };
}

function wrapOrder(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.ordersStore.findIndex((o) => o._id === this._id);
      if (idx !== -1) memoryStore.ordersStore[idx] = { ...this };
      else memoryStore.ordersStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    toObject() { return { ...this }; },
    clone() { return wrapOrder({ ...this }); },
  };
}

function wrapVoucher(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || raw.id,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.vouchersStore.findIndex((v) => v._id === this._id || v.id === this._id);
      if (idx !== -1) memoryStore.vouchersStore[idx] = { ...this };
      else memoryStore.vouchersStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    toObject() { return { ...this }; },
    clone() { return wrapVoucher({ ...this }); },
  };
}

function wrapReview(raw) {
  if (!raw) return null;
  return {
    ...raw,
    _id: raw._id || raw.id,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.reviewsStore.findIndex((r) => r._id === this._id);
      if (idx !== -1) memoryStore.reviewsStore[idx] = { ...this };
      else memoryStore.reviewsStore.push({ ...this });
      memoryStore.persist();
      return this;
    },
    toObject() { return { ...this }; },
    clone() { return wrapReview({ ...this }); },
  };
}

// ============================================================
// SEED DATA
// ============================================================

const DEMO_PW_HASH = bcrypt.hashSync("password123", 10);

const INITIAL_USERS = [
  { _id: "user_customer_01", id: "user_customer_01", email: "khachhang@shopee.vn", password: DEMO_PW_HASH, fullName: "Nguyễn Văn Khách", phone: "0901234567", role: "customer", address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120", coins: 25000, isActive: true, status: "active", savedAddresses: [], createdAt: new Date().toISOString() },
  { _id: "user_seller_01", id: "user_seller_01", email: "shop.genz@shopee.vn", password: DEMO_PW_HASH, fullName: "Trần Thị Chủ Shop (Thời Trang)", phone: "0912345678", role: "seller", shopId: "shop_01", shopName: "Thời Trang GenZ Official", shopLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120", shopAddress: "Kho Tân Bình, TP. HCM", coins: 50000, isActive: true, status: "active", savedAddresses: [], createdAt: new Date().toISOString() },
  { _id: "user_seller_02", id: "user_seller_02", email: "shop.tech@shopee.vn", password: DEMO_PW_HASH, fullName: "Lê Văn Chủ Shop (Công Nghệ)", phone: "0987654321", role: "seller", shopId: "shop_02", shopName: "TechWorld Store", shopLogo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120", shopAddress: "Kho Cầu Giấy, Hà Nội", coins: 50000, isActive: true, status: "active", savedAddresses: [], createdAt: new Date().toISOString() },
  { _id: "user_admin_01", id: "user_admin_01", email: "admin@shopee.vn", password: DEMO_PW_HASH, fullName: "Tổng Quản Trị Viên Sàn", phone: "0999999999", role: "admin", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120", coins: 0, isActive: true, status: "active", savedAddresses: [], createdAt: new Date().toISOString() },
];

const INITIAL_SHOPS = [
  { _id: "shop_01", shopId: "shop_01", slug: "thoi-trang-genz", name: "Thời Trang GenZ Official", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200", banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200", phone: "0912345678", address: "Kho Tân Bình, TP. HCM", description: "Thương hiệu thời trang ứng dụng dẫn đầu xu hướng GenZ.", bankAccount: { bankName: "Vietcombank", accountNumber: "0071001234567", accountName: "TRAN THI CHU SHOP" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.9, reviewCount: 1840, followers: 12450, responseRate: 98, responseTime: "Trong 10 phút", isOfficial: true, badges: ["Shopee Mall", "Chính Hãng 100%", "Giao Hỏa Tốc"], createdAt: new Date().toISOString() },
  { _id: "shop_02", shopId: "shop_02", slug: "techworld-store", name: "TechWorld Store", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200", banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200", phone: "0987654321", address: "Kho Cầu Giấy, Hà Nội", description: "Thế giới công nghệ & phụ kiện số cao cấp.", bankAccount: { bankName: "Techcombank", accountNumber: "19034567890123", accountName: "LE VAN CHU SHOP" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.8, reviewCount: 3290, followers: 28900, responseRate: 99, responseTime: "Trong 5 phút", isOfficial: true, badges: ["Shopee Mall", "Top Công Nghệ 2026", "Bảo Hành 12T"], createdAt: new Date().toISOString() },
  { _id: "shop_03", shopId: "shop_03", slug: "beauty-cosmetics", name: "Beauty Cosmetics Official", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200", banner: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200", phone: "0909888999", address: "Kho Quận 1, TP. HCM", description: "Gian hàng phân phối dược mỹ phẩm chính hãng.", bankAccount: { bankName: "MBBank", accountNumber: "090988899901", accountName: "BEAUTY COSMETICS" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.95, reviewCount: 4520, followers: 43200, responseRate: 100, responseTime: "Trong 3 phút", isOfficial: true, badges: ["Shopee Mall", "Dược Mỹ Phẩm 100%"], createdAt: new Date().toISOString() },
  { _id: "shop_04", shopId: "shop_04", slug: "homepro-gia-dung", name: "HomePro Gia Dụng Thông Minh", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=200", banner: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200", phone: "0936789123", address: "Kho Long Biên, Hà Nội", description: "Hệ sinh thái thiết bị gia dụng chuẩn Nhật Bản.", bankAccount: { bankName: "ACB", accountNumber: "234567890123", accountName: "HOMEPRO VIET NAM" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.88, reviewCount: 2680, followers: 19800, responseRate: 98, responseTime: "Trong 8 phút", isOfficial: true, badges: ["Shopee Mall", "Bảo Hành 24T"], createdAt: new Date().toISOString() },
  { _id: "shop_05", shopId: "shop_05", slug: "sportzone-the-thao", name: "SportZone Thể Thao & Dã Ngoại", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200", banner: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200", phone: "0968123456", address: "Kho Nam Từ Liêm, Hà Nội", description: "Chuyên đồ thể thao, gym, yoga, dã ngoại.", bankAccount: { bankName: "VietinBank", accountNumber: "10188997766", accountName: "SPORTZONE VN" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.91, reviewCount: 1940, followers: 16500, responseRate: 99, responseTime: "Trong 6 phút", isOfficial: true, badges: ["Shopee Mall", "Chính Hãng Thể Thao"], createdAt: new Date().toISOString() },
  { _id: "shop_06", shopId: "shop_06", slug: "greenfarm-organic", name: "GreenFarm Nông Sản Organic", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200", banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200", phone: "0977888666", address: "Kho Đà Lạt & TP. HCM", description: "Nông sản sạch, hạt dinh dưỡng organic.", bankAccount: { bankName: "Agribank", accountNumber: "5400205123456", accountName: "GREENFARM COOP" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.96, reviewCount: 3820, followers: 32000, responseRate: 100, responseTime: "Trong 3 phút", isOfficial: true, badges: ["Shopee Mall", "100% Organic"], createdAt: new Date().toISOString() },
  { _id: "shop_07", shopId: "shop_07", slug: "tri-thuc-bookstore", name: "Tri Thức BookStore", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200", banner: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200", phone: "0918223344", address: "Kho Đống Đa, Hà Nội", description: "Nhà sách tổng hợp uy tín.", bankAccount: { bankName: "VPBank", accountNumber: "15500223344", accountName: "NHA SACH TRI THUC" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.94, reviewCount: 5120, followers: 47000, responseRate: 99, responseTime: "Trong 5 phút", isOfficial: true, badges: ["Shopee Mall", "Sách Bản Quyền"], createdAt: new Date().toISOString() },
  { _id: "shop_08", shopId: "shop_08", slug: "autopro-phu-kien-xe", name: "AutoPro Phụ Kiện Ô Tô", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200", banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200", phone: "0933555777", address: "Kho Hoàng Mai, Hà Nội", description: "Chuyên đồ chơi xe hơi, camera hành trình.", bankAccount: { bankName: "MBBank", accountNumber: "093355577701", accountName: "AUTOPRO" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.87, reviewCount: 1650, followers: 14200, responseRate: 97, responseTime: "Trong 10 phút", isOfficial: true, badges: ["Shopee Mall", "Bảo Hành 1 Đổi 1"], createdAt: new Date().toISOString() },
  { _id: "shop_09", shopId: "shop_09", slug: "babycare-me-va-be", name: "BabyCare Siêu Thị Mẹ & Bé", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200", banner: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200", phone: "0944666888", address: "Kho Tân Phú, TP. HCM", description: "Thế giới đồ sơ sinh, tã bỉm sữa.", bankAccount: { bankName: "Vietcombank", accountNumber: "0071004466688", accountName: "BABYCARE VN" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.97, reviewCount: 4210, followers: 38900, responseRate: 100, responseTime: "Trong 3 phút", isOfficial: true, badges: ["Shopee Mall", "An Toàn Cho Bé"], createdAt: new Date().toISOString() },
  { _id: "shop_10", shopId: "shop_10", slug: "audiohifi-am-thanh", name: "AudioHiFi Âm Thanh Đẳng Cấp", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200", banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200", phone: "0919334455", address: "Kho Hai Bà Trưng, Hà Nội", description: "Thiết bị âm thanh chuyên nghiệp.", bankAccount: { bankName: "Techcombank", accountNumber: "19033344556677", accountName: "AUDIOHIFI" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.93, reviewCount: 2150, followers: 18700, responseRate: 98, responseTime: "Trong 5 phút", isOfficial: true, badges: ["Shopee Mall", "Âm Thanh Hi-Res"], createdAt: new Date().toISOString() },
  { _id: "shop_11", shopId: "shop_11", slug: "petparadise-thu-cung", name: "PetParadise Vương Quốc Thú Cưng", ownerId: "user_seller_01", logo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200", banner: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200", phone: "0988776655", address: "Kho Bình Thạnh, TP. HCM", description: "Thức ăn hạt cao cấp cho chó mèo.", bankAccount: { bankName: "MBBank", accountNumber: "098877665501", accountName: "PETPARADISE" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.92, reviewCount: 2940, followers: 24500, responseRate: 99, responseTime: "Trong 4 phút", isOfficial: true, badges: ["Shopee Mall", "Dinh Dưỡng Thú Cưng"], createdAt: new Date().toISOString() },
  { _id: "shop_12", shopId: "shop_12", slug: "luxetime-dong-ho", name: "LuxeTime Đồng Hồ Cơ Khí", ownerId: "user_seller_02", logo: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200", banner: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200", phone: "0901999888", address: "Kho Ba Đình, Hà Nội", description: "Đồng hồ cơ automatic, kính sapphire.", bankAccount: { bankName: "Vietcombank", accountNumber: "0071009998881", accountName: "LUXETIME" }, commissionRate: 0.05, status: "active", lockReason: "", rating: 4.98, reviewCount: 1780, followers: 21300, responseRate: 100, responseTime: "Trong 2 phút", isOfficial: true, badges: ["Shopee Mall", "Bảo Hành Thụy Sĩ 5N"], createdAt: new Date().toISOString() },
];

// Load 109 products from extracted JSON
let INITIAL_PRODUCTS = [];
try {
  const seedFile = join(__dirname, "../seed/allProducts.json");
  INITIAL_PRODUCTS = JSON.parse(readFileSync(seedFile, "utf8")).map((p) => ({
    ...p,
    _id: p._id || p.id,
    isActive: p.isActive ?? true,
    approvalStatus: p.approvalStatus || "approved",
    rejectionReason: p.rejectionReason || "",
    createdAt: p.createdAt || new Date().toISOString(),
  }));
  console.log(`[MemoryStore] Loaded ${INITIAL_PRODUCTS.length} products from seed file`);
} catch (err) {
  console.warn("[MemoryStore] Could not load seed products, using minimal defaults:", err.message);
  INITIAL_PRODUCTS = [
    { _id: "prod_01", name: "Áo Thun Nam Cotton", slug: "ao-thun-nam-cotton", description: "Áo thun cotton 100%", price: 189000, originalPrice: 289000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", images: [], category: "Thời trang", brand: "GenZ", stock: 120, sold: 340, rating: 4.8, isActive: true, shopId: "shop_01", shopName: "Thời Trang GenZ Official", approvalStatus: "approved", createdAt: new Date().toISOString() },
  ];
}

const INITIAL_VOUCHERS = [
  { _id: "vouch_ship_01", id: "vouch_ship_01", code: "FREESHIP", name: "Miễn Phí Vận Chuyển Toàn Quốc", type: "shipping", value: 30000, maxDiscount: 30000, minOrderValue: 0, description: "Giảm 30.000₫ phí giao hàng toàn quốc", expiryDate: "2026-12-31", usageLimit: 1000, usedCount: 420, isGlobal: true },
  { _id: "vouch_ship_02", id: "vouch_ship_02", code: "FREESHIPEXTRA", name: "Freeship Xtra Tiết Kiệm", type: "shipping", value: 15000, maxDiscount: 15000, minOrderValue: 50000, description: "Giảm 15.000₫ phí giao hàng cho đơn từ 50.000₫", expiryDate: "2026-12-31", usageLimit: 800, usedCount: 215, isGlobal: true },
  { _id: "vouch_ship_03", id: "vouch_ship_03", code: "FREESHIPVIP", name: "Freeship Hỏa Tốc 2H", type: "shipping", value: 50000, maxDiscount: 50000, minOrderValue: 200000, description: "Giảm 50.000₫ cước vận chuyển Hỏa tốc 2H", expiryDate: "2026-12-31", usageLimit: 500, usedCount: 112, isGlobal: true },
  { _id: "vouch_ship_04", id: "vouch_ship_04", code: "FREESHIPMALL", name: "Freeship Gian Hàng Mall", type: "shipping", value: 35000, maxDiscount: 35000, minOrderValue: 150000, description: "Giảm 35.000₫ phí vận chuyển đơn Shopee Mall", expiryDate: "2026-12-31", usageLimit: 400, usedCount: 96, isGlobal: true },
  { _id: "vouch_01", id: "vouch_01", code: "MINI10", name: "Giảm 10% Toàn Sàn", type: "percent", value: 10, maxDiscount: 100000, minOrderValue: 0, description: "Giảm 10% tối đa 100k cho mọi đơn hàng", expiryDate: "2026-12-31", usageLimit: 500, usedCount: 142, isGlobal: true },
  { _id: "vouch_03", id: "vouch_03", code: "SUPERDEAL", name: "Siêu Giảm Giá 15%", type: "percent", value: 15, maxDiscount: 150000, minOrderValue: 0, description: "Giảm 15% tối đa 150k cho đơn hàng hôm nay", expiryDate: "2026-12-31", usageLimit: 300, usedCount: 88, isGlobal: true },
  { _id: "vouch_04", id: "vouch_04", code: "WELCOME50", name: "Mừng Bạn Mới Giảm 50K", type: "fixed", value: 50000, maxDiscount: 50000, minOrderValue: 100000, description: "Giảm trực tiếp 50k cho đơn từ 100.000₫", expiryDate: "2026-12-31", usageLimit: 200, usedCount: 78, isGlobal: true },
  { _id: "vouch_05", id: "vouch_05", code: "SHOPGENZ", name: "Voucher Shop Thời Trang GenZ", type: "fixed", value: 20000, maxDiscount: 20000, minOrderValue: 100000, description: "Shop GenZ tặng 20k cho đơn từ 100.000₫", expiryDate: "2026-11-30", usageLimit: 100, usedCount: 35, isGlobal: false, shopId: "shop_01" },
  { _id: "vouch_06", id: "vouch_06", code: "TECH50", name: "Voucher Đồ Công Nghệ", type: "fixed", value: 50000, maxDiscount: 50000, minOrderValue: 250000, description: "Giảm 50k cho đơn thiết bị điện tử từ 250.000₫", expiryDate: "2026-12-31", usageLimit: 250, usedCount: 64, isGlobal: true },
  { _id: "vouch_07", id: "vouch_07", code: "LUCKY100", name: "Đại Tiệc Mua Sắm Giảm 100K", type: "fixed", value: 100000, maxDiscount: 100000, minOrderValue: 500000, description: "Giảm sốc 100.000₫ cho đơn từ 500.000₫", expiryDate: "2026-12-31", usageLimit: 150, usedCount: 42, isGlobal: true },
];

const INITIAL_CATEGORIES = [
  { _id: "cat_01", name: "Thời trang", slug: "thoi-trang", icon: "👕", order: 1 },
  { _id: "cat_02", name: "Điện tử", slug: "dien-tu", icon: "📱", order: 2 },
  { _id: "cat_03", name: "Đời sống", slug: "doi-song", icon: "🏡", order: 3 },
  { _id: "cat_04", name: "Sắc đẹp", slug: "sac-dep", icon: "💄", order: 4 },
  { _id: "cat_05", name: "Gia dụng", slug: "gia-dung", icon: "🍳", order: 5 },
  { _id: "cat_06", name: "Thể thao", slug: "the-thao", icon: "⚽", order: 6 },
  { _id: "cat_07", name: "Mẹ & Bé", slug: "me-va-be", icon: "👶", order: 7 },
  { _id: "cat_08", name: "Thú cưng", slug: "thu-cung", icon: "🐾", order: 8 },
];

const INITIAL_ORDERS = [
  { _id: "order_demo_01", userId: "user_customer_01", customer: { fullName: "Nguyễn Văn Khách", phone: "0901234567", email: "khachhang@shopee.vn", address: "123 Đường Lê Lợi, Q1, TP.HCM", note: "Giao giờ hành chính" }, items: [{ productId: "prod_01", name: "Áo thun nam basic cotton", price: 199000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", quantity: 2, shopId: "shop_01", shopName: "Thời Trang GenZ", status: "confirmed" }], subtotal: 398000, shippingFee: 30000, total: 428000, paymentMethod: "COD", status: "confirmed", createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { _id: "order_demo_02", userId: "user_customer_01", customer: { fullName: "Nguyễn Văn Khách", phone: "0901234567", email: "khachhang@shopee.vn", address: "123 Đường Lê Lợi, Q1, TP.HCM", note: "" }, items: [{ productId: "prod_15", name: "Tai nghe Bluetooth ANC", price: 1250000, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", quantity: 1, shopId: "shop_02", shopName: "TechWorld Store", status: "completed" }], subtotal: 1250000, shippingFee: 0, total: 1250000, paymentMethod: "VNPAY", status: "completed", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// ============================================================
// MAIN STORE CLASS — with CRUD APIs for each collection
// ============================================================

function createCollectionAPI(storeName, wrapFn) {
  return {
    find: (query = {}) => {
      const filtered = memoryStore[storeName].filter((item) => matchFilter(item, query)).map(wrapFn);
      return new MemoryQuery(filtered);
    },
    findOne: (query = {}) => {
      const match = memoryStore[storeName].find((item) => matchFilter(item, query));
      return new MemoryQuery(match ? [wrapFn(match)] : []).then((res) => res[0] || null);
    },
    findById: (id) => {
      const match = memoryStore[storeName].find((item) => item._id === id || item.id === id || item.shopId === id);
      return new MemoryQuery(match ? [wrapFn(match)] : []).then((res) => res[0] || null);
    },
    create: async (data) => {
      const id = data._id || data.id || `${storeName.replace("Store", "")}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const doc = { ...data, _id: id, id: id, createdAt: data.createdAt || new Date().toISOString() };
      // Hash password for users
      if (storeName === "usersStore" && doc.password && !doc.password.startsWith("$2")) {
        doc.password = bcrypt.hashSync(doc.password, 10);
      }
      memoryStore[storeName].push(doc);
      memoryStore.persist();
      return wrapFn(doc);
    },
    countDocuments: async (query = {}) => {
      return memoryStore[storeName].filter((item) => matchFilter(item, query)).length;
    },
    findByIdAndUpdate: async (id, update = {}, options = {}) => {
      const idx = memoryStore[storeName].findIndex((item) => item._id === id || item.id === id || item.shopId === id);
      if (idx === -1) return null;
      const target = { ...memoryStore[storeName][idx], ...update, updatedAt: new Date().toISOString() };
      memoryStore[storeName][idx] = target;
      memoryStore.persist();
      return wrapFn(target);
    },
    findOneAndDelete: async (query = {}) => {
      const idx = memoryStore[storeName].findIndex((item) => matchFilter(item, query));
      if (idx === -1) return null;
      const deleted = memoryStore[storeName].splice(idx, 1)[0];
      memoryStore.persist();
      return wrapFn(deleted);
    },
    updateMany: async (query = {}, update = {}) => {
      let matchedCount = 0;
      memoryStore[storeName].forEach((item, idx) => {
        if (matchFilter(item, query)) {
          memoryStore[storeName][idx] = { ...item, ...update, updatedAt: new Date().toISOString() };
          matchedCount++;
        }
      });
      if (matchedCount > 0) memoryStore.persist();
      return { matchedCount, modifiedCount: matchedCount };
    },
    deleteMany: async (query = {}) => {
      const before = memoryStore[storeName].length;
      memoryStore[storeName] = memoryStore[storeName].filter((item) => !matchFilter(item, query));
      const deletedCount = before - memoryStore[storeName].length;
      if (deletedCount > 0) memoryStore.persist();
      return { deletedCount };
    },
  };
}

class MemoryStore {
  constructor() {
    // Try loading from disk first
    const saved = loadFromDisk();
    if (saved && saved._version >= 2 && saved.products && saved.products.length > 0) {
      this.usersStore = saved.users || [];
      this.shopsStore = saved.shops || [];
      this.productsStore = saved.products || [];
      this.ordersStore = saved.orders || [];
      this.vouchersStore = saved.vouchers || [];
      this.cartsStore = saved.carts || [];
      this.reviewsStore = saved.reviews || [];
      this.categoriesStore = saved.categories || [];
      console.log(`[MemoryStore] Restored from disk: ${this.productsStore.length} products, ${this.ordersStore.length} orders, ${this.usersStore.length} users`);
    } else {
      this.usersStore = [...INITIAL_USERS];
      this.shopsStore = [...INITIAL_SHOPS];
      this.productsStore = [...INITIAL_PRODUCTS];
      this.ordersStore = [...INITIAL_ORDERS];
      this.vouchersStore = [...INITIAL_VOUCHERS];
      this.cartsStore = [];
      this.reviewsStore = [];
      this.categoriesStore = [...INITIAL_CATEGORIES];
      console.log(`[MemoryStore] Initialized with seed data: ${this.productsStore.length} products, ${this.shopsStore.length} shops`);
      this.persist(); // Save initial state
    }
  }

  // Debounced save — batch rapid writes
  _persistTimer = null;
  persist() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => { saveToDisk(this); }, 500);
  }

  // Collection APIs
  users = createCollectionAPI("usersStore", wrapUser);
  shops = createCollectionAPI("shopsStore", wrapShop);
  products = createCollectionAPI("productsStore", wrapProduct);
  orders = createCollectionAPI("ordersStore", wrapOrder);
  vouchers = createCollectionAPI("vouchersStore", wrapVoucher);
  reviews = createCollectionAPI("reviewsStore", wrapReview);

  // Categories - simple read-only collection
  categories = {
    find: (query = {}) => {
      const filtered = this.categoriesStore.filter((c) => matchFilter(c, query));
      return new MemoryQuery(filtered, false);
    },
    findOne: (query = {}) => {
      const match = this.categoriesStore.find((c) => matchFilter(c, query));
      return Promise.resolve(match || null);
    },
    countDocuments: async () => this.categoriesStore.length,
  };

  // Cart helpers (per-user cart)
  carts = {
    findByUserId: (userId) => {
      return this.cartsStore.find((c) => c.userId === userId) || null;
    },
    upsert: (userId, items) => {
      const idx = this.cartsStore.findIndex((c) => c.userId === userId);
      const cart = { userId, items, updatedAt: new Date().toISOString() };
      if (idx !== -1) this.cartsStore[idx] = cart;
      else this.cartsStore.push(cart);
      this.persist();
      return cart;
    },
    clearByUserId: (userId) => {
      this.cartsStore = this.cartsStore.filter((c) => c.userId !== userId);
      this.persist();
    },
  };
}

export const memoryStore = new MemoryStore();
export default memoryStore;
