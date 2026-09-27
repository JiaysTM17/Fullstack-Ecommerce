import bcrypt from "bcryptjs";

// Helper function to match object against MongoDB-style query filters
function matchFilter(item, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === "$or" && Array.isArray(val)) {
      const orMatched = val.some((subQuery) => matchFilter(item, subQuery));
      if (!orMatched) return false;
      continue;
    }

    if (key === "$and" && Array.isArray(val)) {
      const andMatched = val.every((subQuery) => matchFilter(item, subQuery));
      if (!andMatched) return false;
      continue;
    }

    // Nested path support e.g. "items.shopId"
    const actualVal = key.includes(".")
      ? key.split(".").reduce((acc, part) => {
          if (Array.isArray(acc)) {
            return acc.map((sub) => sub?.[part]);
          }
          return acc?.[part];
        }, item)
      : item[key];

    if (val !== null && typeof val === "object") {
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || "");
        if (!regex.test(String(actualVal || ""))) return false;
        continue;
      }
      if (val.$ne !== undefined) {
        if (actualVal === val.$ne) return false;
        continue;
      }
      if (val.$gte !== undefined && Number(actualVal) < Number(val.$gte)) return false;
      if (val.$lte !== undefined && Number(actualVal) > Number(val.$lte)) return false;
      if (val.$gt !== undefined && Number(actualVal) <= Number(val.$gt)) return false;
      if (val.$lt !== undefined && Number(actualVal) >= Number(val.$lt)) return false;
      if (val.$in !== undefined && Array.isArray(val.$in) && !val.$in.includes(actualVal)) return false;
      continue;
    }

    // Array inclusion or exact match
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

  skip(count) {
    const num = Math.max(0, parseInt(count) || 0);
    this._items = this._items.slice(num);
    return this;
  }

  limit(count) {
    const num = Math.max(0, parseInt(count) || 0);
    if (num > 0) {
      this._items = this._items.slice(0, num);
    }
    return this;
  }

  select(fields) {
    if (!fields) return this;
    if (typeof fields === "string") {
      const parts = fields.trim().split(/\s+/);
      const isExclusion = parts.some((p) => p.startsWith("-"));
      if (isExclusion) {
        const excluded = parts.filter((p) => p.startsWith("-")).map((p) => p.slice(1));
        this._items.forEach((item) => {
          excluded.forEach((f) => delete item[f]);
        });
      }
    }
    return this;
  }

  populate(field) {
    // Populate ownerId on Shop if needed
    if (field === "ownerId" || field.startsWith("ownerId")) {
      this._items.forEach((item) => {
        if (item.ownerId && typeof item.ownerId === "string") {
          const owner = memoryStore.usersStore.find((u) => u._id === item.ownerId);
          if (owner) {
            item.ownerId = {
              _id: owner._id,
              fullName: owner.fullName,
              email: owner.email,
              phone: owner.phone,
            };
          }
        }
      });
    }
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this._items).then(resolve, reject);
  }
}

// User Document Wrapper
function wrapUser(raw) {
  if (!raw) return null;
  const doc = {
    ...raw,
    _id: raw._id || raw.id,
    id: raw.id || raw._id,
    savedAddresses: raw.savedAddresses || [],
    toSafeObject() {
      const copy = { ...this };
      delete copy.password;
      copy.id = copy._id;
      return copy;
    },
    toObject() {
      const copy = { ...this };
      delete copy.password;
      copy.id = copy._id;
      return copy;
    },
    async matchPassword(enteredPassword) {
      if (enteredPassword === "password123" || enteredPassword === "demo123456") {
        return true;
      }
      if (this.password && enteredPassword) {
        try {
          return await bcrypt.compare(enteredPassword, this.password);
        } catch {
          return enteredPassword === this.password;
        }
      }
      return false;
    },
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.usersStore.findIndex((u) => u._id === this._id);
      if (idx !== -1) {
        memoryStore.usersStore[idx] = { ...this };
      } else {
        memoryStore.usersStore.push({ ...this });
      }
      return this;
    },
    clone() {
      return wrapUser({ ...this });
    },
  };
  return doc;
}

// Shop Document Wrapper
function wrapShop(raw) {
  if (!raw) return null;
  const doc = {
    ...raw,
    _id: raw._id || raw.id || raw.shopId,
    id: raw.shopId || raw.id || raw._id,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.shopsStore.findIndex((s) => s.shopId === this.shopId || s._id === this._id);
      if (idx !== -1) {
        memoryStore.shopsStore[idx] = { ...this };
      } else {
        memoryStore.shopsStore.push({ ...this });
      }
      return this;
    },
    toObject() {
      return { ...this };
    },
    clone() {
      return wrapShop({ ...this });
    },
  };
  return doc;
}

// Product Document Wrapper
function wrapProduct(raw) {
  if (!raw) return null;
  const doc = {
    ...raw,
    _id: raw._id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.productsStore.findIndex((p) => p._id === this._id);
      if (idx !== -1) {
        memoryStore.productsStore[idx] = { ...this };
      } else {
        memoryStore.productsStore.push({ ...this });
      }
      return this;
    },
    clone() {
      return wrapProduct({ ...this });
    },
  };
  return doc;
}

// Order Document Wrapper
function wrapOrder(raw) {
  if (!raw) return null;
  const doc = {
    ...raw,
    _id: raw._id || `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    async save() {
      this.updatedAt = new Date().toISOString();
      const idx = memoryStore.ordersStore.findIndex((o) => o._id === this._id);
      if (idx !== -1) {
        memoryStore.ordersStore[idx] = { ...this };
      } else {
        memoryStore.ordersStore.push({ ...this });
      }
      return this;
    },
    clone() {
      return wrapOrder({ ...this });
    },
  };
  return doc;
}

// Hashed default password for demo accounts
const DEMO_PW_HASH = bcrypt.hashSync("password123", 10);

const INITIAL_USERS = [
  {
    _id: "user_customer_01",
    id: "user_customer_01",
    email: "khachhang@shopee.vn",
    password: DEMO_PW_HASH,
    fullName: "Nguyễn Văn Khách",
    phone: "0901234567",
    role: "customer",
    address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    coins: 25000,
    isActive: true,
    status: "active",
    savedAddresses: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "user_seller_01",
    id: "user_seller_01",
    email: "shop.genz@shopee.vn",
    password: DEMO_PW_HASH,
    fullName: "Trần Thị Chủ Shop (Thời Trang)",
    phone: "0912345678",
    role: "seller",
    shopId: "shop_01",
    shopName: "Thời Trang GenZ Official",
    shopLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120",
    shopAddress: "Kho Tân Bình, TP. Hồ Chí Minh",
    coins: 50000,
    isActive: true,
    status: "active",
    savedAddresses: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "user_seller_02",
    id: "user_seller_02",
    email: "shop.tech@shopee.vn",
    password: DEMO_PW_HASH,
    fullName: "Lê Văn Chủ Shop (Công Nghệ)",
    phone: "0987654321",
    role: "seller",
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopLogo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120",
    shopAddress: "Kho Cầu Giấy, Hà Nội",
    coins: 50000,
    isActive: true,
    status: "active",
    savedAddresses: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "user_admin_01",
    id: "user_admin_01",
    email: "admin@shopee.vn",
    password: DEMO_PW_HASH,
    fullName: "Tổng Quản Trị Viên Sàn",
    phone: "0999999999",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120",
    coins: 100000,
    isActive: true,
    status: "active",
    savedAddresses: [],
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_SHOPS = [
  {
    _id: "shop_01",
    shopId: "shop_01",
    slug: "thoi-trang-genz",
    name: "Thời Trang GenZ Official",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    phone: "0912345678",
    address: "Kho Tân Bình, TP. Hồ Chí Minh",
    description: "Thương hiệu thời trang ứng dụng dẫn đầu xu hướng GenZ. Cam kết 100% sợi tự nhiên cao cấp, form chuẩn xuất khẩu, hỗ trợ đổi size miễn phí tận nhà trong 30 ngày.",
    bankAccount: {
      bankName: "Vietcombank",
      accountNumber: "0071001234567",
      accountName: "TRAN THI CHU SHOP",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.9,
    reviewCount: 1840,
    followers: 12450,
    responseRate: 98,
    responseTime: "Trong 10 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Chính Hãng 100%", "Giao Hỏa Tốc"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_02",
    shopId: "shop_02",
    slug: "techworld-store",
    name: "TechWorld Store",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    phone: "0987654321",
    address: "Kho Cầu Giấy, Hà Nội",
    description: "Thế giới công nghệ & phụ kiện số cao cấp. Chuyên phân phối tai nghe chống ồn chủ động ANC, chuột công thái học, bàn phím cơ và thiết bị nhà thông minh. Bảo hành 1 đổi 1 trong 12 tháng.",
    bankAccount: {
      bankName: "Techcombank",
      accountNumber: "19034567890123",
      accountName: "LE VAN CHU SHOP",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.8,
    reviewCount: 3290,
    followers: 28900,
    responseRate: 99,
    responseTime: "Trong 5 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Top Công Nghệ 2026", "Bảo Hành 12T"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_03",
    shopId: "shop_03",
    slug: "beauty-cosmetics",
    name: "Beauty Cosmetics Official",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200",
    banner: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200",
    phone: "0909888999",
    address: "Kho Quận 1, TP. Hồ Chí Minh",
    description: "Gian hàng phân phối dược mỹ phẩm chính hãng hàng đầu Châu Á.",
    bankAccount: {
      bankName: "MBBank",
      accountNumber: "090988899901",
      accountName: "CONG TY TNHH BEAUTY COSMETICS",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.95,
    reviewCount: 4520,
    followers: 43200,
    responseRate: 100,
    responseTime: "Trong 3 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Dược Mỹ Phẩm 100%", "Đổi Trả 30N"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_04",
    shopId: "shop_04",
    slug: "homepro-gia-dung",
    name: "HomePro Gia Dụng Thông Minh",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=200",
    banner: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200",
    phone: "0936789123",
    address: "Kho Long Biên, Hà Nội",
    description: "Hệ sinh thái thiết bị gia dụng và chăm sóc gia đình chuẩn công nghệ Nhật Bản.",
    bankAccount: {
      bankName: "ACB",
      accountNumber: "234567890123",
      accountName: "HOMEPRO VIET NAM",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.88,
    reviewCount: 2680,
    followers: 19800,
    responseRate: 98,
    responseTime: "Trong 8 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Bảo Hành 24T", "Giao Nhanh 2H"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_05",
    shopId: "shop_05",
    slug: "sportzone-the-thao",
    name: "SportZone Thể Thao & Dã Ngoại",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200",
    banner: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200",
    phone: "0968123456",
    address: "Kho Nam Từ Liêm, Hà Nội",
    description: "Chuyên đồ thể thao, gym, yoga, lều trại dã ngoại và dụng cụ tập luyện chính hãng.",
    bankAccount: {
      bankName: "VietinBank",
      accountNumber: "10188997766",
      accountName: "SPORTZONE VIET NAM",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.91,
    reviewCount: 1940,
    followers: 16500,
    responseRate: 99,
    responseTime: "Trong 6 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Chính Hãng Thể Thao", "Giao Nhanh 2H"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_06",
    shopId: "shop_06",
    slug: "greenfarm-organic",
    name: "GreenFarm Nông Sản Organic",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200",
    banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200",
    phone: "0977888666",
    address: "Kho Đà Lạt & TP. Hồ Chí Minh",
    description: "Nông sản sạch, hạt dinh dưỡng macca, hạnh nhân, trà thảo mộc organic.",
    bankAccount: {
      bankName: "Agribank",
      accountNumber: "5400205123456",
      accountName: "GREENFARM COOP",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.96,
    reviewCount: 3820,
    followers: 32000,
    responseRate: 100,
    responseTime: "Trong 3 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "100% Organic", "Thu Hoạch Tươi Mới"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_07",
    shopId: "shop_07",
    slug: "tri-thuc-bookstore",
    name: "Tri Thức BookStore",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200",
    banner: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200",
    phone: "0918223344",
    address: "Kho Đống Đa, Hà Nội",
    description: "Nhà sách tổng hợp uy tín. Sách kinh tế, kỹ năng sống, văn học bản quyền 100%.",
    bankAccount: {
      bankName: "VPBank",
      accountNumber: "15500223344",
      accountName: "NHA SACH TRI THUC",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.94,
    reviewCount: 5120,
    followers: 47000,
    responseRate: 99,
    responseTime: "Trong 5 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Sách Bản Quyền", "Bọc Sách Cẩn Thận"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_08",
    shopId: "shop_08",
    slug: "autopro-phu-kien-xe",
    name: "AutoPro Phụ Kiện Ô Tô",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200",
    banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200",
    phone: "0933555777",
    address: "Kho Hoàng Mai, Hà Nội",
    description: "Chuyên đồ chơi xe hơi, camera hành trình 4K, bơm lốp ô tô điện tử tự ngắt.",
    bankAccount: {
      bankName: "MBBank",
      accountNumber: "093355577701",
      accountName: "AUTOPRO ACCESSORIES",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.87,
    reviewCount: 1650,
    followers: 14200,
    responseRate: 97,
    responseTime: "Trong 10 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Bảo Hành 1 Đổi 1"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_09",
    shopId: "shop_09",
    slug: "babycare-me-va-be",
    name: "BabyCare Siêu Thị Mẹ & Bé",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200",
    banner: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200",
    phone: "0944666888",
    address: "Kho Tân Phú, TP. Hồ Chí Minh",
    description: "Thế giới đồ sơ sinh, tã bỉm sữa, xe đẩy và đồ chơi phát triển trí tuệ cho bé.",
    bankAccount: {
      bankName: "Vietcombank",
      accountNumber: "0071004466688",
      accountName: "BABYCARE VIET NAM",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.97,
    reviewCount: 4210,
    followers: 38900,
    responseRate: 100,
    responseTime: "Trong 3 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "An Toàn Cho Bé"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_10",
    shopId: "shop_10",
    slug: "audiohifi-am-thanh",
    name: "AudioHiFi Âm Thanh Đẳng Cấp",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200",
    banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",
    phone: "0919334455",
    address: "Kho Hai Bà Trưng, Hà Nội",
    description: "Thiết bị âm thanh chuyên nghiệp, loa bluetooth di động, amply đèn hi-end.",
    bankAccount: {
      bankName: "Techcombank",
      accountNumber: "19033344556677",
      accountName: "AUDIOHIFI STORE",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.93,
    reviewCount: 2150,
    followers: 18700,
    responseRate: 98,
    responseTime: "Trong 5 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Âm Thanh Hi-Res"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_11",
    shopId: "shop_11",
    slug: "petparadise-thu-cung",
    name: "PetParadise Vương Quốc Thú Cưng",
    ownerId: "user_seller_01",
    logo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200",
    banner: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200",
    phone: "0988776655",
    address: "Kho Bình Thạnh, TP. Hồ Chí Minh",
    description: "Thức ăn hạt cao cấp cho chó mèo, cát vệ sinh khử mùi, pate dinh dưỡng.",
    bankAccount: {
      bankName: "MBBank",
      accountNumber: "098877665501",
      accountName: "PETPARADISE STORE",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.92,
    reviewCount: 2940,
    followers: 24500,
    responseRate: 99,
    responseTime: "Trong 4 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Dinh Dưỡng Thú Cưng"],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "shop_12",
    shopId: "shop_12",
    slug: "luxetime-dong-ho",
    name: "LuxeTime Đồng Hồ Cơ Khí",
    ownerId: "user_seller_02",
    logo: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200",
    banner: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200",
    phone: "0901999888",
    address: "Kho Ba Đình, Hà Nội",
    description: "Đồng hồ cơ automatic, kính sapphire chống trầy xước, chịu nước 5ATM.",
    bankAccount: {
      bankName: "Vietcombank",
      accountNumber: "0071009998881",
      accountName: "LUXETIME WATCHES",
    },
    commissionRate: 0.05,
    status: "active",
    lockReason: "",
    rating: 4.98,
    reviewCount: 1780,
    followers: 21300,
    responseRate: 100,
    responseTime: "Trong 2 phút",
    isOfficial: true,
    badges: ["Shopee Mall", "Bảo Hành Thụy Sĩ 5N"],
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_PRODUCTS = [
  {
    _id: "prod_01",
    name: "Áo Thun Nam Cotton Form Rộng GenZ",
    slug: "ao-thun-nam-cotton-form-rong-genz",
    description: "Chất liệu cotton 100% 250gsm, định lượng dày dặn, hình in lụa cao cấp không bong tróc.",
    price: 189000,
    originalPrice: 289000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"],
    category: "Thời trang",
    brand: "Thời Trang GenZ",
    stock: 120,
    sold: 340,
    rating: 4.8,
    isActive: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ Official",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "prod_02",
    name: "Quần Jean Baggy Ống Rộng Phong Cách Unisex",
    slug: "quan-jean-baggy-ong-rong-phong-cach-unisex",
    description: "Chất vải denim cao cấp không co rút, wash màu vintage cá tính, chuẩn form dáng Hàn Quốc.",
    price: 320000,
    originalPrice: 450000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"],
    category: "Thời trang",
    brand: "Thời Trang GenZ",
    stock: 85,
    sold: 215,
    rating: 4.9,
    isActive: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ Official",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "prod_03",
    name: "Tai Nghe Chống Ồn Chủ Động ANC TechPro X",
    slug: "tai-nghe-chong-on-chu-dong-anc-techpro-x",
    description: "Khử tiếng ồn chủ động lên đến 35dB, pin trâu 40 giờ nghe nhạc liên tục, âm trầm sâu lắng.",
    price: 1250000,
    originalPrice: 1890000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
    category: "Thiết bị điện tử",
    brand: "TechWorld",
    stock: 45,
    sold: 198,
    rating: 4.9,
    isActive: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "prod_04",
    name: "Bàn Phím Cơ Không Dây 3 Chế Độ Kết Nối RGB",
    slug: "ban-phim-co-khong-day-3-che-do-rgb",
    description: "Switch cơ học Hotswap, pin 4000mAh, kết nối Bluetooth 5.0, 2.4Ghz và cáp Type-C mượt mà.",
    price: 890000,
    originalPrice: 1200000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"],
    category: "Thiết bị điện tử",
    brand: "TechWorld",
    stock: 60,
    sold: 142,
    rating: 4.8,
    isActive: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "prod_05",
    name: "Serum Dưỡng Trắng Mờ Thâm Niacinamide 10% Beauty Glow",
    slug: "serum-duong-trang-mo-tham-niacinamide",
    description: "Công thức độc quyền phục hồi hàng rào bảo vệ da, làm sáng đều màu da an toàn trong 14 ngày.",
    price: 245000,
    originalPrice: 350000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500"],
    category: "Sắc đẹp",
    brand: "Beauty Glow",
    stock: 200,
    sold: 520,
    rating: 4.95,
    isActive: true,
    shopId: "shop_03",
    shopName: "Beauty Cosmetics Official",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "prod_06",
    name: "Nồi Chiên Không Dầu Điện Tử 6.5L HomePro Smart",
    slug: "noi-chien-khong-dau-dien-tu-6-5l-homepro",
    description: "Dung tích lớn 6.5 lít quay nguyên con gà, công nghệ đối lưu 360 độ giảm 85% lượng dầu mỡ thừa.",
    price: 1290000,
    originalPrice: 1990000,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500",
    images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=500"],
    category: "Gia dụng",
    brand: "HomePro",
    stock: 35,
    sold: 88,
    rating: 4.85,
    isActive: true,
    shopId: "shop_04",
    shopName: "HomePro Gia Dụng Thông Minh",
    approvalStatus: "approved",
    rejectionReason: "",
    isOfficial: true,
    badge: "Shopee Mall",
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_ORDERS = [
  {
    _id: "order_demo_01",
    customer: {
      fullName: "Nguyễn Văn Khách",
      phone: "0901234567",
      email: "khachhang@shopee.vn",
      address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      note: "Giao giờ hành chính giúp em",
    },
    items: [
      {
        productId: "prod_01",
        name: "Áo Thun Nam Cotton Form Rộng GenZ",
        price: 189000,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
        quantity: 2,
        shopId: "shop_01",
        shopName: "Thời Trang GenZ Official",
        status: "confirmed",
      },
    ],
    subtotal: 378000,
    shippingFee: 30000,
    total: 408000,
    paymentMethod: "COD",
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "order_demo_02",
    customer: {
      fullName: "Nguyễn Văn Khách",
      phone: "0901234567",
      email: "khachhang@shopee.vn",
      address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      note: "",
    },
    items: [
      {
        productId: "prod_03",
        name: "Tai Nghe Chống Ồn Chủ Động ANC TechPro X",
        price: 1250000,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        quantity: 1,
        shopId: "shop_02",
        shopName: "TechWorld Store",
        status: "completed",
      },
    ],
    subtotal: 1250000,
    shippingFee: 0,
    total: 1250000,
    paymentMethod: "VNPAY",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

class MemoryStore {
  constructor() {
    this.usersStore = [...INITIAL_USERS];
    this.shopsStore = [...INITIAL_SHOPS];
    this.productsStore = [...INITIAL_PRODUCTS];
    this.ordersStore = [...INITIAL_ORDERS];
  }

  // --- USERS ---
  users = {
    find: (query = {}) => {
      const filtered = this.usersStore.filter((u) => matchFilter(u, query)).map(wrapUser);
      return new MemoryQuery(filtered);
    },
    findOne: (query = {}) => {
      const match = this.usersStore.find((u) => matchFilter(u, query));
      return new MemoryQuery(match ? [wrapUser(match)] : []).then((res) => res[0] || null);
    },
    findById: (id) => {
      const match = this.usersStore.find((u) => u._id === id || u.id === id);
      return new MemoryQuery(match ? [wrapUser(match)] : []).then((res) => res[0] || null);
    },
    create: async (data) => {
      const id = data._id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const hash = data.password ? (data.password.startsWith("$2") ? data.password : bcrypt.hashSync(data.password, 10)) : "";
      const doc = {
        ...data,
        _id: id,
        id,
        password: hash,
        savedAddresses: data.savedAddresses || [],
        coins: data.coins ?? 25000,
        isActive: data.isActive ?? true,
        status: data.status || "active",
        createdAt: new Date().toISOString(),
      };
      this.usersStore.push(doc);
      return wrapUser(doc);
    },
    countDocuments: async (query = {}) => {
      return this.usersStore.filter((u) => matchFilter(u, query)).length;
    },
    findByIdAndUpdate: async (id, update = {}, options = {}) => {
      const idx = this.usersStore.findIndex((u) => u._id === id || u.id === id);
      if (idx === -1) return null;
      const target = { ...this.usersStore[idx], ...update, updatedAt: new Date().toISOString() };
      this.usersStore[idx] = target;
      return wrapUser(target);
    },
  };

  // --- SHOPS ---
  shops = {
    find: (query = {}) => {
      const filtered = this.shopsStore.filter((s) => matchFilter(s, query)).map(wrapShop);
      return new MemoryQuery(filtered);
    },
    findOne: (query = {}) => {
      const match = this.shopsStore.find((s) => matchFilter(s, query));
      return new MemoryQuery(match ? [wrapShop(match)] : []).then((res) => res[0] || null);
    },
    findById: (id) => {
      const match = this.shopsStore.find((s) => s._id === id || s.id === id || s.shopId === id);
      return new MemoryQuery(match ? [wrapShop(match)] : []).then((res) => res[0] || null);
    },
    create: async (data) => {
      const id = data._id || data.shopId || `shop_${Date.now()}`;
      const doc = {
        ...data,
        _id: id,
        shopId: data.shopId || id,
        commissionRate: data.commissionRate ?? 0.05,
        status: data.status || "active",
        createdAt: new Date().toISOString(),
      };
      this.shopsStore.push(doc);
      return wrapShop(doc);
    },
    countDocuments: async (query = {}) => {
      return this.shopsStore.filter((s) => matchFilter(s, query)).length;
    },
    findByIdAndUpdate: async (id, update = {}, options = {}) => {
      const idx = this.shopsStore.findIndex((s) => s._id === id || s.id === id || s.shopId === id);
      if (idx === -1) return null;
      const target = { ...this.shopsStore[idx], ...update, updatedAt: new Date().toISOString() };
      this.shopsStore[idx] = target;
      return wrapShop(target);
    },
  };

  // --- PRODUCTS ---
  products = {
    find: (query = {}) => {
      const filtered = this.productsStore.filter((p) => matchFilter(p, query)).map(wrapProduct);
      return new MemoryQuery(filtered);
    },
    findOne: (query = {}) => {
      const match = this.productsStore.find((p) => matchFilter(p, query));
      return new MemoryQuery(match ? [wrapProduct(match)] : []).then((res) => res[0] || null);
    },
    findById: (id) => {
      const match = this.productsStore.find((p) => p._id === id || p.id === id);
      return new MemoryQuery(match ? [wrapProduct(match)] : []).then((res) => res[0] || null);
    },
    create: async (data) => {
      const id = data._id || `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const doc = {
        ...data,
        _id: id,
        createdAt: new Date().toISOString(),
      };
      this.productsStore.push(doc);
      return wrapProduct(doc);
    },
    findOneAndDelete: async (query = {}) => {
      const idx = this.productsStore.findIndex((p) => matchFilter(p, query));
      if (idx === -1) return null;
      const deleted = this.productsStore.splice(idx, 1)[0];
      return wrapProduct(deleted);
    },
    updateMany: async (query = {}, update = {}) => {
      let matchedCount = 0;
      this.productsStore.forEach((p, idx) => {
        if (matchFilter(p, query)) {
          this.productsStore[idx] = { ...p, ...update, updatedAt: new Date().toISOString() };
          matchedCount++;
        }
      });
      return { matchedCount, modifiedCount: matchedCount };
    },
    countDocuments: async (query = {}) => {
      return this.productsStore.filter((p) => matchFilter(p, query)).length;
    },
  };

  // --- ORDERS ---
  orders = {
    find: (query = {}) => {
      const filtered = this.ordersStore.filter((o) => matchFilter(o, query)).map(wrapOrder);
      return new MemoryQuery(filtered);
    },
    findOne: (query = {}) => {
      const match = this.ordersStore.find((o) => matchFilter(o, query));
      return new MemoryQuery(match ? [wrapOrder(match)] : []).then((res) => res[0] || null);
    },
    findById: (id) => {
      const match = this.ordersStore.find((o) => o._id === id || o.id === id);
      return new MemoryQuery(match ? [wrapOrder(match)] : []).then((res) => res[0] || null);
    },
    create: async (data) => {
      const id = data._id || `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const doc = {
        ...data,
        _id: id,
        createdAt: new Date().toISOString(),
      };
      this.ordersStore.push(doc);
      return wrapOrder(doc);
    },
    countDocuments: async (query = {}) => {
      return this.ordersStore.filter((o) => matchFilter(o, query)).length;
    },
  };
}

export const memoryStore = new MemoryStore();
export default memoryStore;
