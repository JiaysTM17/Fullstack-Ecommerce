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
  },
  {
    id: "shop_03",
    name: "Beauty Cosmetics Official",
    slug: "beauty-cosmetics",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200",
    banner: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200",
    rating: 4.95,
    reviewCount: 4520,
    followers: 43200,
    responseRate: 100,
    responseTime: "Trong 3 phút",
    joinedDate: "2 năm trước",
    location: "Kho Quận 1, TP. Hồ Chí Minh",
    phone: "0909 888 999",
    description: "Gian hàng phân phối dược mỹ phẩm chính hãng hàng đầu Châu Á. Cam kết 100% nguồn gốc rõ ràng, tem phụ chống giả, đền gấp 10 lần nếu phát hiện hàng nhái.",
    badges: ["Shopee Mall", "Dược Mỹ Phẩm 100%", "Đổi Trả 30N"],
    vouchers: [
      {
        code: "BEAUTY30",
        name: "Voucher Mỹ Phẩm - Giảm 30.000₫",
        discount: 30000,
        type: "fixed",
        minOrderValue: 150000,
        expires: "31/12/2026",
        desc: "Áp dụng cho mọi sản phẩm chăm sóc da và làm đẹp"
      },
      {
        code: "BEAUTYGLOW",
        name: "Ưu Đãi Da Đẹp - Giảm 12%",
        discount: 12,
        type: "percent",
        maxDiscount: 60000,
        minOrderValue: 200000,
        expires: "31/12/2026",
        desc: "Giảm 12% tối đa 60k cho đơn từ 200k"
      }
    ]
  },
  {
    id: "shop_04",
    name: "HomePro Gia Dụng Thông Minh",
    slug: "homepro-gia-dung",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=200",
    banner: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200",
    rating: 4.88,
    reviewCount: 2680,
    followers: 19800,
    responseRate: 98,
    responseTime: "Trong 8 phút",
    joinedDate: "3 năm trước",
    location: "Kho Long Biên, Hà Nội",
    phone: "0936 789 123",
    description: "Hệ sinh thái thiết bị gia dụng và chăm sóc gia đình chuẩn công nghệ Nhật Bản. Nồi chiên không dầu, robot hút bụi, máy lọc không khí và nồi cơm điện cao tần.",
    badges: ["Shopee Mall", "Bảo Hành 24T", "Giao Nhanh 2H"],
    vouchers: [
      {
        code: "HOMEPRO80",
        name: "Voucher Gia Dụng - Giảm 80.000₫",
        discount: 80000,
        type: "fixed",
        minOrderValue: 400000,
        expires: "31/12/2026",
        desc: "Giảm ngay 80k cho thiết bị nhà bếp và đời sống"
      },
      {
        code: "HOMESHIP",
        name: "Miễn Phí Vận Chuyển Hàng Cồng Kềnh",
        discount: 40000,
        type: "shipping",
        minOrderValue: 0,
        expires: "31/12/2026",
        desc: "Hỗ trợ 40k phí giao hàng thiết bị gia dụng lớn"
      }
    ]
  },
  {
    id: "shop_05",
    name: "SportZone Thể Thao & Dã Ngoại",
    slug: "sportzone-the-thao",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200",
    banner: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200",
    rating: 4.91,
    reviewCount: 1940,
    followers: 16500,
    responseRate: 99,
    responseTime: "Trong 6 phút",
    joinedDate: "2 năm trước",
    location: "Kho Nam Từ Liêm, Hà Nội",
    phone: "0968 123 456",
    description: "Chuyên đồ thể thao, thể hình gym, yoga, lều trại dã ngoại và dụng cụ tập luyện chính hãng. Đảm bảo độ bền cao, bảo hành kỹ thuật 12 tháng.",
    badges: ["Shopee Mall", "Chính Hãng Thể Thao", "Giao Nhanh 2H"],
    vouchers: [
      { code: "SPORT50", name: "Giảm 50.000₫ Thể Thao", discount: 50000, type: "fixed", minOrderValue: 300000, expires: "31/12/2026", desc: "Giảm 50k cho đơn dụng cụ thể thao từ 300k" }
    ]
  },
  {
    id: "shop_06",
    name: "GreenFarm Nông Sản & Organic Sạch",
    slug: "greenfarm-organic",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200",
    banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200",
    rating: 4.96,
    reviewCount: 3820,
    followers: 32000,
    responseRate: 100,
    responseTime: "Trong 3 phút",
    joinedDate: "3 năm trước",
    location: "Kho Đà Lạt & TP. Hồ Chí Minh",
    phone: "0977 888 666",
    description: "Nông sản sạch, hạt dinh dưỡng macca, hạnh nhân, trà thảo mộc organic và mật ong hoa rừng nguyên chất đạt chuẩn VietGAP & Organic Quốc Tế.",
    badges: ["Shopee Mall", "100% Organic", "Thu Hoạch Tươi Mới"],
    vouchers: [
      { code: "ORGANIC25", name: "Giảm 25.000₫ Thực Phẩm Sạch", discount: 25000, type: "fixed", minOrderValue: 150000, expires: "31/12/2026", desc: "Giảm 25k cho đơn nông sản từ 150k" }
    ]
  },
  {
    id: "shop_07",
    name: "Tri Thức BookStore & Văn Phòng Phẩm",
    slug: "tri-thuc-bookstore",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200",
    banner: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200",
    rating: 4.94,
    reviewCount: 5120,
    followers: 47000,
    responseRate: 99,
    responseTime: "Trong 5 phút",
    joinedDate: "5 năm trước",
    location: "Kho Đống Đa, Hà Nội",
    phone: "0918 223 344",
    description: "Nhà sách tổng hợp uy tín. Sách kinh tế, kỹ năng sống, văn học, ngoại ngữ bản quyền 100%, kèm bút ký cao cấp, sổ tay da và văn phòng phẩm chất lượng Nhật Bản.",
    badges: ["Shopee Mall", "Sách Bản Quyền", "Bọc Sách Cẩn Thận"],
    vouchers: [
      { code: "BOOK15K", name: "Giảm 15.000₫ Mọt Sách", discount: 15000, type: "fixed", minOrderValue: 100000, expires: "31/12/2026", desc: "Ưu đãi đọc sách giảm 15k đơn từ 100k" }
    ]
  },
  {
    id: "shop_08",
    name: "AutoPro Phụ Kiện Ô Tô Xe Máy",
    slug: "autopro-phu-kien-xe",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200",
    banner: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=1200",
    rating: 4.87,
    reviewCount: 1650,
    followers: 14200,
    responseRate: 97,
    responseTime: "Trong 10 phút",
    joinedDate: "2 năm trước",
    location: "Kho Hoàng Mai, Hà Nội",
    phone: "0933 555 777",
    description: "Chuyên đồ chơi xe hơi, camera hành trình 4K, bơm lốp ô tô điện tử tự ngắt, dung dịch phủ bóng ceramic, bọc vô lăng da thật cao cấp.",
    badges: ["Shopee Mall", "Bảo Hành 1 Đổi 1", "Tương Thích Mọi Dòng Xe"],
    vouchers: [
      { code: "AUTODEAL", name: "Giảm 40.000₫ Phụ Kiện Xe", discount: 40000, type: "fixed", minOrderValue: 250000, expires: "31/12/2026", desc: "Giảm 40k cho đơn phụ kiện ô tô xe máy" }
    ]
  },
  {
    id: "shop_09",
    name: "BabyCare Siêu Thị Mẹ & Bé Yêu",
    slug: "babycare-me-va-be",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200",
    banner: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200",
    rating: 4.97,
    reviewCount: 4210,
    followers: 39000,
    responseRate: 100,
    responseTime: "Trong 2 phút",
    joinedDate: "4 năm trước",
    location: "Kho Bình Thạnh, TP. Hồ Chí Minh",
    phone: "0908 112 233",
    description: "Thế giới đồ dùng mẹ & bé an toàn tuyệt đối. Tã bỉm hữu cơ, bình sữa thủy tinh kháng khuẩn, xe đẩy gấp gọn du lịch và đồ chơi gỗ giáo dục Montessori.",
    badges: ["Shopee Mall", "Chính Hãng An Toàn Bé", "Đổi Trả 30N"],
    vouchers: [
      { code: "BABYCARE", name: "Giảm 35.000₫ Mẹ & Bé", discount: 35000, type: "fixed", minOrderValue: 200000, expires: "31/12/2026", desc: "Giảm ngay 35k cho đơn chăm sóc bé yêu" }
    ]
  },
  {
    id: "shop_10",
    name: "AudioHiFi Âm Thanh Đẳng Cấp",
    slug: "audiohifi-am-thanh",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200",
    banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",
    rating: 4.93,
    reviewCount: 2430,
    followers: 21500,
    responseRate: 98,
    responseTime: "Trong 7 phút",
    joinedDate: "3 năm trước",
    location: "Kho Quận 3, TP. Hồ Chí Minh",
    phone: "0945 667 788",
    description: "Thiết bị âm thanh chuẩn Audiophile: Loa Bluetooth công suất lớn kháng nước IPX7, tai nghe kiểm âm phòng thu, DAC giải mã âm thanh Hi-Res Lossless.",
    badges: ["Shopee Mall", "Chuẩn Âm Thanh Hi-Res", "Bảo Hành 2 Năm"],
    vouchers: [
      { code: "HIFISOUND", name: "Giảm 70.000₫ Âm Thanh HiFi", discount: 70000, type: "fixed", minOrderValue: 500000, expires: "31/12/2026", desc: "Giảm 70k cho thiết bị âm thanh đỉnh cao" }
    ]
  },
  {
    id: "shop_11",
    name: "PetParadise Vương Quốc Thú Cưng",
    slug: "petparadise-thu-cung",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=200",
    banner: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200",
    rating: 4.92,
    reviewCount: 2890,
    followers: 24800,
    responseRate: 99,
    responseTime: "Trong 4 phút",
    joinedDate: "2 năm trước",
    location: "Kho Phú Nhuận, TP. Hồ Chí Minh",
    phone: "0922 446 688",
    description: "Thiên đường cho Boss cưng: Hạt dinh dưỡng nhập khẩu, pate thơm ngon bổ dưỡng, đệm ngủ êm ái, trụ cào móng và balo phi thuyền vận chuyển mèo/chó.",
    badges: ["Shopee Mall", "Dinh Dưỡng Thú Cưng", "Giao Hỏa Tốc"],
    vouchers: [
      { code: "PETLOVE", name: "Giảm 20.000₫ Cho Boss Cưng", discount: 20000, type: "fixed", minOrderValue: 120000, expires: "31/12/2026", desc: "Giảm 20k đơn thức ăn đồ chơi thú cưng" }
    ]
  },
  {
    id: "shop_12",
    name: "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện",
    slug: "luxetime-dong-ho",
    isOfficial: true,
    avatar: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
    banner: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200",
    rating: 4.95,
    reviewCount: 1780,
    followers: 18200,
    responseRate: 99,
    responseTime: "Trong 5 phút",
    joinedDate: "3 năm trước",
    location: "Kho Ba Đình, Hà Nội",
    phone: "0915 999 111",
    description: "Đồng hồ cơ khí Automatic lộ cơ skeleton, đồng hồ Sapphire chống nước 50M, dây da bò Epsom thủ công và hộp xoay đồng hồ cơ tự động cao cấp.",
    badges: ["Shopee Mall", "Kính Sapphire Chống Xước", "Bảo Hành Máy 5 Năm"],
    vouchers: [
      { code: "LUXETIME", name: "Giảm 100.000₫ Đồng Hồ Cao Cấp", discount: 100000, type: "fixed", minOrderValue: 800000, expires: "31/12/2026", desc: "Giảm 100k cho đơn đồng hồ cơ khí" }
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
    description: "Cửa hàng bán lẻ chính hãng trên nền tảng Fullstack E-Commerce.",
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
