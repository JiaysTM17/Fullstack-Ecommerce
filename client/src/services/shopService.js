import { FALLBACK_PRODUCTS } from "./productService";

const SHOPS_DATA = [
  {
    id: "shop_01",
    name: "Thời Trang GenZ Official",
    slug: "thoi-trang-genz",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    rating: 4.9,
    reviewCount: 1840,
    followers: 12450,
    responseRate: 98,
    responseTime: "Trong 10 phút",
    joinedDate: "3 năm trước",
    location: "Kho Tân Bình, TP. Hồ Chí Minh",
    phone: "0912 345 678",
    description: "Thương hiệu thời trang ứng dụng dẫn đầu xu hướng GenZ. Cam kết 100% sợi tự nhiên cao cấp, form chuẩn xuất khẩu, hỗ trợ đổi size miễn phí tận nhà trong 30 ngày.",
    badges: ["Shopee Mall", "Chính Hãng 100%", "Giao Hỏa Tốc"],
    vouchers: [
      {
        code: "SHOPGENZ",
        name: "Voucher Shop - Giảm 20.000₫",
        discount: 20000,
        type: "fixed",
        minOrderValue: 100000,
        expires: "31/12/2026",
        desc: "Áp dụng cho mọi sản phẩm thuộc Thời Trang GenZ"
      },
      {
        code: "GENZ10",
        name: "Tri Ân Khách Mới - Giảm 10%",
        discount: 10,
        type: "percent",
        maxDiscount: 50000,
        minOrderValue: 0,
        expires: "31/12/2026",
        desc: "Không giới hạn đơn tối thiểu, giảm tối đa 50k"
      }
    ]
  },
  {
    id: "shop_02",
    name: "TechWorld Store",
    slug: "techworld-store",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=200",
    banner: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200",
    rating: 4.8,
    reviewCount: 3290,
    followers: 28900,
    responseRate: 99,
    responseTime: "Trong 5 phút",
    joinedDate: "4 năm trước",
    location: "Kho Cầu Giấy, Hà Nội",
    phone: "0987 654 321",
    description: "Thế giới công nghệ & phụ kiện số cao cấp. Chuyên phân phối tai nghe chống ồn chủ động ANC, chuột công thái học, bàn phím cơ và thiết bị nhà thông minh. Bảo hành 1 đổi 1 trong 12 tháng.",
    badges: ["Shopee Mall", "Top Công Nghệ 2026", "Bảo Hành 12T"],
    vouchers: [
      {
        code: "TECHDEAL",
        name: "Voucher Công Nghệ - Giảm 50.000₫",
        discount: 50000,
        type: "fixed",
        minOrderValue: 200000,
        expires: "31/12/2026",
        desc: "Giảm trực tiếp 50k cho đơn từ 200k thiết bị công nghệ"
      },
      {
        code: "FREESHIPTECH",
        name: "Freeship Đồ Công Nghệ - Miễn 30.000₫",
        discount: 30000,
        type: "shipping",
        minOrderValue: 0,
        expires: "31/12/2026",
        desc: "Miễn phí vận chuyển toàn quốc không giới hạn giá trị đơn"
      }
    ]
  }
];

const FOLLOWED_SHOPS_KEY = "mini_shopee_followed_shops";

export function getShopById(shopId) {
  const normalizedId = shopId || "shop_01";
  const found = SHOPS_DATA.find((s) => s.id === normalizedId || s.slug === normalizedId);
  if (found) return found;

  // Fallback dynamic shop if unknown
  return {
    id: normalizedId,
    name: normalizedId === "shop_02" ? "TechWorld Store" : "Thời Trang GenZ Official",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200",
    rating: 4.9,
    reviewCount: 1200,
    followers: 10500,
    responseRate: 98,
    responseTime: "Trong 10 phút",
    joinedDate: "2 năm trước",
    location: "Việt Nam",
    phone: "1900 6868",
    description: "Cửa hàng bán lẻ chính hãng trên nền tảng Mini Shopee.",
    badges: ["Gian Hàng Uy Tín", "Chính Hãng"],
    vouchers: []
  };
}

export function getAllShops() {
  return SHOPS_DATA;
}

export function getProductsByShop(shopId) {
  const normalizedId = shopId || "shop_01";
  
  // Try to load any updated custom products first
  try {
    const custom = localStorage.getItem("mini_shopee_seller_products");
    if (custom) {
      const parsed = JSON.parse(custom);
      const matched = parsed.filter((p) => (p.shopId || "shop_01") === normalizedId && p.isActive !== false);
      if (matched.length > 0) return matched;
    }
  } catch {
    // fallback
  }

  // Filter from FALLBACK_PRODUCTS
  const filtered = FALLBACK_PRODUCTS.filter((p) => (p.shopId || "shop_01") === normalizedId);
  return filtered.length > 0 ? filtered : FALLBACK_PRODUCTS.slice(0, 4);
}

export function isShopFollowed(shopId) {
  try {
    const list = JSON.parse(localStorage.getItem(FOLLOWED_SHOPS_KEY) || "[]");
    return list.includes(shopId);
  } catch {
    return false;
  }
}

export function toggleFollowShop(shopId) {
  try {
    const list = JSON.parse(localStorage.getItem(FOLLOWED_SHOPS_KEY) || "[]");
    let nextList;
    let isNowFollowed;
    if (list.includes(shopId)) {
      nextList = list.filter((id) => id !== shopId);
      isNowFollowed = false;
    } else {
      nextList = [...list, shopId];
      isNowFollowed = true;
    }
    localStorage.setItem(FOLLOWED_SHOPS_KEY, JSON.stringify(nextList));
    return isNowFollowed;
  } catch {
    return false;
  }
}
