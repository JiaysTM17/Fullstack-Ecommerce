import { apiRequest, buildQueryString } from "./api";

export const FALLBACK_PRODUCTS = [
  {
    _id: "prod_01",
    id: "prod_01",
    name: "Áo thun nam basic cotton 100% thoáng mát",
    slug: "ao-thun-nam-basic-cotton",
    description: "Áo thun cotton 100% thoáng mát, thấm hút mồ hôi tốt, form suông dễ phối đồ hàng ngày.",
    price: 199000,
    originalPrice: 299000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    category: "Thời trang",
    brand: "Shopee Basic",
    stock: 50,
    sold: 120,
    rating: 4.8,
    isMall: true,
  },
  {
    _id: "prod_02",
    id: "prod_02",
    name: "Áo sơ mi nữ công sở lụa cao cấp chống nhăn",
    slug: "ao-so-mi-nu-cong-so-trang",
    description: "Áo sơ mi nữ dáng suông thanh lịch, vải kate lụa mềm mại tôn dáng công sở hiện đại.",
    price: 259000,
    originalPrice: 359000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500",
    category: "Thời trang",
    brand: "Elegance",
    stock: 35,
    sold: 85,
    rating: 4.7,
    isMall: true,
  },
  {
    _id: "prod_03",
    id: "prod_03",
    name: "Quần jean nam ống đứng co giãn 4 chiều",
    slug: "quan-jean-nam-ong-dung",
    description: "Quần jean denim cao cấp, co giãn 4 chiều thoải mái, form ống đứng chuẩn phong cách casual.",
    price: 399000,
    originalPrice: 549000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    category: "Thời trang",
    brand: "Denim Co",
    stock: 42,
    sold: 210,
    rating: 4.9,
    isMall: false,
  },
  {
    _id: "prod_04",
    id: "prod_04",
    name: "Tai nghe Bluetooth True Wireless chống ồn chủ động ANC",
    slug: "tai-nghe-bluetooth-true-wireless",
    description: "Tai nghe không dây Bluetooth 5.3, âm bass mạnh mẽ, chống ồn chủ động ANC và pin 32h.",
    price: 650000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    category: "Điện tử",
    brand: "SoundPeak",
    stock: 80,
    sold: 540,
    rating: 4.9,
    isMall: true,
  },
  {
    _id: "prod_05",
    id: "prod_05",
    name: "Chuột không dây công thái học Silent Click chống mỏi tay",
    slug: "chuot-khong-day-cong-thai-hoc",
    description: "Chuột máy tính 2.4Ghz & Bluetooth, click êm không tiếng ồn, thiết kế ôm tay giảm mỏi.",
    price: 290000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
    category: "Điện tử",
    brand: "TechZone",
    stock: 65,
    sold: 340,
    rating: 4.8,
    isMall: false,
  },
  {
    _id: "prod_06",
    id: "prod_06",
    name: "Bàn phím cơ không dây RGB Hot-swap 87 phím",
    slug: "ban-phim-co-rgb-hotswap",
    description: "Bàn phím cơ gõ êm, đèn led RGB nhiều chế độ, kết nối Type-C/Bluetooth/Wireless.",
    price: 890000,
    originalPrice: 1290000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
    category: "Điện tử",
    brand: "KeyMaster",
    stock: 25,
    sold: 190,
    rating: 4.9,
    isMall: true,
  },
  {
    _id: "prod_07",
    id: "prod_07",
    name: "Bình giữ nhiệt Inox 316 dung tích 800ml hiển thị nhiệt độ",
    slug: "binh-giu-nhiet-inox-316",
    description: "Giữ nóng 12 tiếng, giữ lạnh 24 tiếng, lõi inox 316 kháng khuẩn an toàn sức khỏe.",
    price: 185000,
    originalPrice: 280000,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
    category: "Gia dụng",
    brand: "HomePlus",
    stock: 90,
    sold: 870,
    rating: 4.7,
    isMall: false,
  },
  {
    _id: "prod_08",
    id: "prod_08",
    name: "Nồi chiên không dầu dung tích lớn 6.5L nướng vàng giòn",
    slug: "noi-chien-khong-dau-6-5l",
    description: "Công nghệ nhiệt đối lưu 360 độ, giảm 85% lượng dầu mỡ, lòng nồi chống dính cao cấp.",
    price: 1250000,
    originalPrice: 1890000,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500",
    category: "Gia dụng",
    brand: "ChefCook",
    stock: 18,
    sold: 95,
    rating: 4.8,
    isMall: true,
  },
  {
    _id: "prod_09",
    id: "prod_09",
    name: "Balo chống nước thời trang laptop 15.6 inch có cổng sạc USB",
    slug: "balo-chong-nuoc-laptop",
    description: "Vải Oxford cao cấp trượt nước, nhiều ngăn chứa tiện dụng cho học sinh, sinh viên và dân văn phòng.",
    price: 245000,
    originalPrice: 350000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    category: "Phụ kiện",
    brand: "UrbanGear",
    stock: 110,
    sold: 1240,
    rating: 4.9,
    isMall: false,
  },
  {
    _id: "prod_10",
    id: "prod_10",
    name: "Đồng hồ thông minh theo dõi nhịp tim & giấc ngủ Smartwatch Pro",
    slug: "dong-ho-thong-minh-smartwatch-pro",
    description: "Màn hình AMOLED sắc nét, kháng nước IP68, hỗ trợ hơn 100 chế độ thể thao và nghe gọi trực tiếp.",
    price: 990000,
    originalPrice: 1590000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Điện tử",
    brand: "TechZone",
    stock: 40,
    sold: 430,
    rating: 4.8,
    isMall: true,
  },
];

function normalizeProductList(payload) {
  if (Array.isArray(payload)) {
    return { products: payload, pagination: null };
  }

  const data = payload?.data;

  if (Array.isArray(data)) {
    return {
      products: data,
      pagination: payload.pagination || null,
    };
  }

  if (Array.isArray(data?.products)) {
    return {
      products: data.products,
      pagination: data.pagination || payload.pagination || null,
    };
  }

  return {
    products: [],
    pagination: payload?.pagination || null,
  };
}

function normalizeProductDetail(payload) {
  return payload?.data || payload || null;
}

export async function getProducts(params = {}) {
  try {
    const payload = await apiRequest(`/api/products${buildQueryString(params)}`);
    const normalized = normalizeProductList(payload);
    if (normalized.products && normalized.products.length > 0) {
      return normalized;
    }
    return {
      products: FALLBACK_PRODUCTS,
      pagination: { page: 1, limit: FALLBACK_PRODUCTS.length, total: FALLBACK_PRODUCTS.length, totalPages: 1 }
    };
  } catch (err) {
    console.warn("Backend API offline or unreachable, using offline fallback products:", err.message);
    let list = [...FALLBACK_PRODUCTS];
    if (params.keyword) {
      const kw = params.keyword.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(kw));
    }
    if (params.sort === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sort === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    }
    return {
      products: list,
      pagination: { page: 1, limit: list.length, total: list.length, totalPages: 1 }
    };
  }
}

export async function getProductById(productId) {
  try {
    const payload = await apiRequest(`/api/products/${productId}`);
    return normalizeProductDetail(payload);
  } catch (err) {
    console.warn("Backend API offline or unreachable, checking fallback items:", err.message);
    const found = FALLBACK_PRODUCTS.find((p) => p._id === productId || p.id === productId);
    return found || null;
  }
}
