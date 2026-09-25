import { apiRequest, buildQueryString } from "./api";

const PRODUCT_REVIEWS_KEY = "mini_shopee_custom_reviews";

function getLocalReviews() {
  try {
    const raw = localStorage.getItem(PRODUCT_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const FALLBACK_PRODUCTS = [
  {
    _id: "prod_01",
    id: "prod_01",
    name: "Áo thun nam basic cotton 100% thoáng mát dệt sợi tự nhiên",
    slug: "ao-thun-nam-basic-cotton",
    description: "Áo thun cotton 100% thoáng mát, thấm hút mồ hôi tối đa, form suông phong cách modern fit dễ phối đồ hàng ngày. Vải đã qua xử lý wash mềm, không co rút sau nhiều lần giặt.",
    price: 199000,
    originalPrice: 299000,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
    ],
    category: "Thời trang",
    brand: "Shopee Basic",
    badge: "Amazon's Choice",
    stock: 50,
    sold: 1240,
    rating: 4.8,
    reviewCount: 342,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Trắng Tinh Khôi", "Đen Huyền Bí", "Xanh Navy", "Xám Melange"],
      sizes: ["S", "M", "L", "XL", "XXL"],
    },
    specifications: [
      { label: "Chất liệu", value: "100% Cotton chải kỹ 220gsm" },
      { label: "Xuất xứ", value: "Việt Nam (Tiêu chuẩn xuất khẩu)" },
      { label: "Kiểu dáng", value: "Form Regular fit thoải mái" },
      { label: "Bảo hành", value: "Đổi trả 30 ngày nếu lỗi chỉ may" },
    ],
    reviews: [
      {
        id: "rev_01",
        author: "Trần Văn Huy",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        rating: 5,
        date: "24/09/2026",
        title: "Vải cực kỳ mát, form áo rất chuẩn",
        content: "Mình cao 1m75 nặng 68kg mặc size L vừa in, vải dày dặn nhưng sờ mát tay và không hề xù lông. Đã mua thêm 2 chiếc màu đen và navy.",
        verifiedPurchase: true,
      },
      {
        id: "rev_02",
        author: "Nguyễn Thu Thảo",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
        rating: 5,
        date: "20/09/2026",
        title: "Giao hàng hỏa tốc trong 2h",
        content: "Đặt hàng lúc 10h sáng mà 11h45 shipper đã bấm chuông giao. Đóng hộp lịch sự, áo thơm và đúng màu như hình.",
        verifiedPurchase: true,
      },
      {
        id: "rev_03",
        author: "Lê Hoàng Phúc",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
        rating: 4,
        date: "15/09/2026",
        title: "Chất lượng tốt so với tầm giá",
        content: "Áo đẹp, đường may tỉ mỉ, mặc cả ngày không bí bách. Điểm trừ nhẹ là mác cổ áo hơi cọ vào gáy.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_02",
    id: "prod_02",
    name: "Áo sơ mi nữ công sở lụa satin cao cấp chống nhăn thanh lịch",
    slug: "ao-so-mi-nu-cong-so-trang",
    description: "Áo sơ mi nữ dáng suông thanh lịch, chất vải lụa satin ngọc trai mềm mại tôn dáng, kháng nhăn tự nhiên không cần ủi là nhiều. Thích hợp đi làm, dự tiệc và gặp gỡ đối tác.",
    price: 259000,
    originalPrice: 359000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
      "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
    ],
    category: "Thời trang",
    brand: "Elegance",
    badge: "Best Seller",
    stock: 35,
    sold: 860,
    rating: 4.7,
    reviewCount: 198,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Trắng Ngọc Trai", "Hồng Pastel", "Xanh Mint", "Đen Quyến Rũ"],
      sizes: ["S", "M", "L", "XL"],
    },
    specifications: [
      { label: "Chất liệu", value: "Lụa Satin Tuyết cao cấp" },
      { label: "Độ dày", value: "Vừa phải, không lộ nội y" },
      { label: "Cổ áo", value: "Cổ bẻ V thanh lịch" },
      { label: "Xuất xứ", value: "Hàn Quốc" },
    ],
    reviews: [
      {
        id: "rev_04",
        author: "Đặng Mỹ Linh",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
        rating: 5,
        date: "22/09/2026",
        title: "Áo tôn dáng và sang chảnh lắm",
        content: "Chất lụa sờ mướt tay, mặc vào rất mát và tôn da. Đi làm ai cũng khen áo đẹp.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_03",
    id: "prod_03",
    name: "Quần jean nam ống đứng co giãn 4 chiều phong cách casual",
    slug: "quan-jean-nam-ong-dung",
    description: "Quần jean denim cao cấp dệt sợi Spandex co giãn 4 chiều, form ống đứng che khuyết điểm chân, màu wash công nghệ sinh học bền màu tuyệt đối qua thời gian.",
    price: 399000,
    originalPrice: 549000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800",
    ],
    category: "Thời trang",
    brand: "Denim Co",
    badge: "Hot Deal",
    stock: 42,
    sold: 950,
    rating: 4.9,
    reviewCount: 412,
    isMall: false,
    isFastDelivery: false,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xanh Indigo Đậm", "Xanh Nhạt Vintage", "Đen Tuyền"],
      sizes: ["29", "30", "31", "32", "34"],
    },
    specifications: [
      { label: "Chất liệu", value: "Denim 98% Cotton + 2% Spandex" },
      { label: "Khóa kéo", value: "YKK kim loại nguyên khối" },
      { label: "Độ co giãn", value: "Co giãn nhẹ, không xệ gối" },
    ],
    reviews: [
      {
        id: "rev_05",
        author: "Vũ Quốc Cường",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        rating: 5,
        date: "18/09/2026",
        title: "Form quần đẹp và đứng dáng",
        content: "Quần rất vừa vặn, mặc ngồi xe hay vận động đều thoải mái.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_04",
    id: "prod_04",
    name: "Tai nghe Bluetooth True Wireless chống ồn chủ động Hybrid ANC SoundPeak Pro",
    slug: "tai-nghe-bluetooth-true-wireless",
    description: "Tai nghe không dây trang bị chip Bluetooth 5.3 độ trễ cực thấp 40ms, công nghệ chống ồn chủ động Hybrid ANC -38dB, driver màng Titanium 13mm tái tạo dải bass siêu trầm cùng pin 36h kèm dock sạc Type-C.",
    price: 650000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
    ],
    category: "Điện tử",
    brand: "SoundPeak",
    badge: "Amazon's Choice",
    stock: 80,
    sold: 1890,
    rating: 4.9,
    reviewCount: 650,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Đen Nhám (Matte Black)", "Trắng Băng (Glacier White)", "Xanh Quân Đội"],
      sizes: ["Tiêu chuẩn (Kèm 3 cỡ tip tai S/M/L)"],
    },
    specifications: [
      { label: "Kết nối", value: "Bluetooth 5.3 Dual-Channel" },
      { label: "Chống ồn", value: "Hybrid ANC & 4 Mic ENC đàm thoại lọc gió" },
      { label: "Thời lượng pin", value: "7.5 giờ tai nghe, 36 giờ kèm hộp sạc" },
      { label: "Kháng nước", value: "Chuẩn IPX5 chống mồ hôi và mưa" },
      { label: "Bảo hành", value: "12 tháng 1 đổi 1 chính hãng" },
    ],
    reviews: [
      {
        id: "rev_06",
        author: "Bùi Tiến Đạt",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        rating: 5,
        date: "25/09/2026",
        title: "Chống ồn tuyệt hảo, bass căng đét",
        content: "Bật ANC lên là xung quanh im phăng phắc, nghe nhạc EDM hay pop đều rất đã tai. Pin trâu dùng 4 ngày mới phải sạc dock.",
        verifiedPurchase: true,
      },
      {
        id: "rev_07",
        author: "Phạm Hồng Ngọc",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        rating: 5,
        date: "19/09/2026",
        title: "Đáng tiền từng xu",
        content: "Thiết kế nhỏ gọn, nhét tai êm ái không bị cấn đau. Mic đàm thoại đi ngoài đường đầu dây bên kia nghe rất rõ.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_05",
    id: "prod_05",
    name: "Chuột không dây công thái học Silent Click chống mỏi cổ tay TechZone Ergo",
    slug: "chuot-khong-day-cong-thai-hoc",
    description: "Chuột công thái học góc nghiêng 57 độ tự nhiên, giảm áp lực cổ tay tới 40%. Kết nối kép Bluetooth 5.1 & Wireless 2.4Ghz, phím bấm Silent êm ái và pin sạc Lithium 500mAh dùng 60 ngày.",
    price: 290000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
    ],
    category: "Điện tử",
    brand: "TechZone",
    badge: "Best Seller",
    stock: 65,
    sold: 1420,
    rating: 4.8,
    reviewCount: 380,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Xám Không Gian", "Trắng Sữa", "Hồng Khói"],
      sizes: ["Tay vừa & lớn (Góc nghiêng 57 độ)"],
    },
    specifications: [
      { label: "Cảm biến", value: "Quang học Optical 4000 DPI (5 mức chỉnh)" },
      { label: "Pin", value: "Sạc cổng Type-C (Dùng 2 tháng/lần sạc)" },
      { label: "Độ ồn", value: "Silent Click giảm 90% tiếng ồn" },
      { label: "Tương thích", value: "Windows, macOS, iPadOS, Android" },
    ],
    reviews: [
      {
        id: "rev_08",
        author: "Hoàng Minh Quân",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
        rating: 5,
        date: "21/09/2026",
        title: "Cứu tinh cho dân văn phòng gõ máy tính cả ngày",
        content: "Dùng em này xong cổ tay không còn bị mỏi hay tê như chuột thông thường. Click siêu êm trong đêm không sợ phiền ai.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_06",
    id: "prod_06",
    name: "Bàn phím cơ không dây Bluetooth 3 Mode RGB Hot-swap Gasket Mount",
    slug: "ban-phim-co-khong-day-rgb",
    description: "Bàn phím cơ layout 75% núm xoay kim loại, cấu trúc Gasket mount 5 lớp tiêu âm cao cấp cho âm gõ êm tai thocky. Hỗ trợ 3 kết nối (Bluetooth 5.0, 2.4Ghz, Type-C) và Hot-swap 5 pin tiện lợi.",
    price: 850000,
    originalPrice: 1200000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800",
    ],
    category: "Điện tử",
    brand: "KeyMaster",
    badge: "Amazon's Choice",
    stock: 28,
    sold: 720,
    rating: 4.9,
    reviewCount: 290,
    isMall: false,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Trắng Xanh Cyberpunk", "Đen Khói Retro", "Tím Lavender"],
      sizes: ["Linear Switch (Êm ái mượt mà)", "Tactile Switch (Có khấc nảy)"],
    },
    specifications: [
      { label: "Layout", value: "75% (82 phím + Núm xoay đa năng)" },
      { label: "Switch", value: "Pre-lubed Factory Custom Switch" },
      { label: "Keycap", value: "PBT Double-shot chống bóng" },
      { label: "Pin", value: "4000mAh dùng 3 tuần khi bật LED" },
    ],
    reviews: [
      {
        id: "rev_09",
        author: "Võ Thành Nam",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100",
        rating: 5,
        date: "23/09/2026",
        title: "Âm gõ đầm, switch mượt sẵn",
        content: "Gasket mount nên gõ rất êm, không bị vang kim loại. Núm xoay chỉnh âm lượng cực kỳ tiện dụng.",
        verifiedPurchase: true,
      },
    ],
  },
  {
    _id: "prod_07",
    id: "prod_07",
    name: "Bình giữ nhiệt Lock&Lock Inox 316 hiển thị nhiệt độ thông minh 500ml",
    slug: "binh-giu-nhiet-inox-316",
    description: "Bình giữ nhiệt ruột inox 316 chuẩn y tế an toàn cho sức khỏe, nắp cảm ứng LED hiển thị nhiệt độ chính xác. Giữ nóng 14 giờ và giữ lạnh 24 giờ liên tục.",
    price: 185000,
    originalPrice: 280000,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
    ],
    category: "Đời sống",
    brand: "Lock&Lock",
    badge: "Best Seller",
    stock: 90,
    sold: 2150,
    rating: 4.8,
    reviewCount: 780,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Nhám Cổ Điển", "Bạc Inox Xước", "Xanh Sapphire", "Hồng Pastel"],
      sizes: ["500ml"],
    },
    specifications: [
      { label: "Chất liệu", value: "Inox SUS316 cao cấp (Chống ăn mòn tuyệt đối)" },
      { label: "Màn hình", value: "Cảm ứng OLED hiển thị nhiệt độ nước" },
      { label: "Dung tích", value: "500ml nhỏ gọn tiện mang đi" },
    ],
    reviews: [],
  },
  {
    _id: "prod_08",
    id: "prod_08",
    name: "Đèn bàn LED bảo vệ mắt chống cận thị có sạc không dây thông minh",
    slug: "den-ban-led-bao-ve-mat",
    description: "Đèn học làm việc LED chỉ số hoàn màu CRI Ra>95 bảo vệ thị lực tối đa, 5 dải nhiệt độ màu, tích hợp đế sạc nhanh không dây Qi 15W cho smartphone.",
    price: 320000,
    originalPrice: 480000,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
    ],
    category: "Đời sống",
    brand: "LumiHome",
    badge: "Hot Deal",
    stock: 45,
    sold: 490,
    rating: 4.7,
    reviewCount: 160,
    isMall: false,
    isFastDelivery: false,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Trắng Tinh Khiết", "Đen Kim Loại"],
      sizes: ["Bản sạc không dây 15W", "Bản cảm ứng cơ bản"],
    },
    specifications: [
      { label: "Chỉ số hoàn màu", value: "Ra > 95 (Chuẩn y khoa không hại mắt)" },
      { label: "Công suất", value: "12W tiết kiệm điện" },
      { label: "Tính năng", value: "Hẹn giờ tắt 45 phút, sạc không dây Qi" },
    ],
    reviews: [],
  },
  {
    _id: "prod_09",
    id: "prod_09",
    name: "Balo laptop chống nước có cổng sạc USB du lịch công sở chống rạch",
    slug: "balo-laptop-chong-nuoc",
    description: "Balo vải Oxford 900D trượt nước cực tốt, ngăn chống sốc chuyên dụng đựng laptop 15.6 inch, thiết kế ngăn ẩn chống trộm an toàn và đệm lưng tổ ong thoáng khí.",
    price: 350000,
    originalPrice: 520000,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    ],
    category: "Thời trang",
    brand: "UrbanBackpack",
    badge: "Amazon's Choice",
    stock: 55,
    sold: 1100,
    rating: 4.8,
    reviewCount: 390,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Doanh Nhân", "Xám Thời Thượng", "Xanh Rêu"],
      sizes: ["Vừa Laptop 15.6 inch", "Vừa Laptop 17.3 inch"],
    },
    specifications: [
      { label: "Chất liệu", value: "Vải Oxford 900D phủ PU kháng nước" },
      { label: "Kích thước", value: "46 x 31 x 16 cm (Trọng lượng 0.8kg)" },
      { label: "Ngăn đựng", value: "3 ngăn lớn + 6 ngăn phụ thông minh" },
    ],
    reviews: [],
  },
  {
    _id: "prod_10",
    id: "prod_10",
    name: "Đồng hồ thông minh Smartwatch Pro AMOLED đo SpO2 & điện tâm đồ ECG",
    slug: "dong-ho-thong-minh-smartwatch-pro",
    description: "Màn hình Super AMOLED 1.43 inch sắc nét Always-On-Display, khung viền hợp kim kẽm máy bay, hỗ trợ hơn 120 chế độ luyện tập thể thao, nghe gọi Bluetooth 2 chiều và pin 10 ngày.",
    price: 990000,
    originalPrice: 1590000,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800",
    ],
    category: "Điện tử",
    brand: "TechZone",
    badge: "Best Seller",
    stock: 40,
    sold: 1650,
    rating: 4.9,
    reviewCount: 520,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Đen Thép (Dây Silicon Đen)", "Bạc Ánh Kim (Dây Da Nâu)", "Vàng Hồng Nữ Tính"],
      sizes: ["Mặt đồng hồ 46mm (Nam/Nữ cổ tay vừa)"],
    },
    specifications: [
      { label: "Màn hình", value: "1.43 inch AMOLED 466x466 pixels, 60fps" },
      { label: "Cảm biến", value: "Đo SpO2 nồng độ oxy máu, nhịp tim 24/7, ECG" },
      { label: "Kháng nước", value: "Chuẩn 5ATM bơi lội thoải mái" },
      { label: "Thời lượng pin", value: "10 ngày sử dụng thông thường" },
    ],
    reviews: [],
  },
];

function mergeWithCustomReviews(product) {
  if (!product) return null;
  const customMap = getLocalReviews();
  const prodId = product._id || product.id;
  const localList = customMap[prodId] || [];
  const baseReviews = product.reviews || [];
  const allReviews = [...localList, ...baseReviews];
  return {
    ...product,
    reviews: allReviews,
    reviewCount: (product.reviewCount || baseReviews.length) + localList.length,
  };
}

export async function getProducts(params = {}) {
  try {
    const payload = await apiRequest(`/api/products${buildQueryString(params)}`);
    const data = payload?.data?.products || (Array.isArray(payload?.data) ? payload.data : null);
    if (data && data.length > 0) {
      return {
        products: data.map(mergeWithCustomReviews),
        pagination: payload.data.pagination || null,
      };
    }
  } catch (err) {
    // console.warn("Backend API offline, using fallback products:", err.message);
  }

  let list = FALLBACK_PRODUCTS.map(mergeWithCustomReviews);

  // Keyword filter
  if (params.keyword) {
    const kw = params.keyword.toLowerCase().trim();
    list = list.filter((p) =>
      p.name.toLowerCase().includes(kw) ||
      (p.category && p.category.toLowerCase().includes(kw)) ||
      (p.brand && p.brand.toLowerCase().includes(kw))
    );
  }

  // Category filter
  if (params.category && params.category !== "Tất cả") {
    list = list.filter((p) => p.category === params.category);
  }

  // Price Range filter
  if (params.minPrice) {
    list = list.filter((p) => p.price >= Number(params.minPrice));
  }
  if (params.maxPrice) {
    list = list.filter((p) => p.price <= Number(params.maxPrice));
  }

  // Star Rating filter
  if (params.minRating) {
    list = list.filter((p) => p.rating >= Number(params.minRating));
  }

  // Fast delivery filter
  if (params.fastDelivery) {
    list = list.filter((p) => p.isFastDelivery === true);
  }

  // In Stock filter
  if (params.inStock) {
    list = list.filter((p) => p.stock > 0);
  }

  // Badge filter (Amazon's Choice / Best Seller)
  if (params.badge) {
    list = list.filter((p) => p.badge === params.badge);
  }

  // Sort filter
  if (params.sort === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (params.sort === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (params.sort === "rating_desc") {
    list.sort((a, b) => b.rating - a.rating);
  } else if (params.sort === "sold_desc") {
    list.sort((a, b) => b.sold - a.sold);
  }

  return {
    products: list,
    pagination: {
      page: 1,
      limit: list.length,
      total: list.length,
      totalPages: 1,
    },
  };
}

export async function getProductById(productId) {
  try {
    const payload = await apiRequest(`/api/products/${productId}`);
    if (payload?.data) {
      return mergeWithCustomReviews(payload.data);
    }
  } catch (err) {
    // console.warn("Backend API offline, fetching from fallback:", err.message);
  }
  const found = FALLBACK_PRODUCTS.find((p) => p._id === productId || p.id === productId);
  return found ? mergeWithCustomReviews(found) : null;
}

export function addProductReview(productId, reviewData) {
  const customMap = getLocalReviews();
  const current = customMap[productId] || [];
  const newRev = {
    id: `rev_custom_${Date.now()}`,
    ...reviewData,
    date: new Date().toLocaleDateString("vi-VN"),
    verifiedPurchase: true,
  };
  customMap[productId] = [newRev, ...current];
  localStorage.setItem(PRODUCT_REVIEWS_KEY, JSON.stringify(customMap));
  return newRev;
}
