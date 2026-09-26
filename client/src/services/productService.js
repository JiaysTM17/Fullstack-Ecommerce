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
  {
    _id: "prod_11",
    id: "prod_11",
    name: "Serum Vitamin C 15% Sáng Da Mờ Thâm Nám PureGlow Anti-Dark Spot (30ml)",
    slug: "serum-vitamin-c-15-sang-da-pureglow",
    description: "Serum Vitamin C nguyên chất kết hợp Ferulic Acid và Vitamin E giúp chống oxy hóa mạnh mẽ, làm mờ vết thâm mụn chỉ sau 14 ngày và kích thích tăng sinh collagen cho làn da căng bóng rạng rỡ.",
    price: 380000,
    originalPrice: 550000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
      "https://images.unsplash.com/photo-1608248597359-006d649f87c8?w=800",
    ],
    category: "Sắc đẹp",
    brand: "PureGlow",
    badge: "Best Seller",
    stock: 120,
    sold: 3450,
    rating: 4.95,
    reviewCount: 890,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Beauty Cosmetics Official",
    shopRating: 4.95,
    shopResponseRate: 100,
    variants: {
      colors: ["Dung tích 30ml (Tiêu chuẩn)", "Dung tích 50ml (Tiết kiệm 20%)"],
      sizes: ["Hộp 1 chai nguyên seal"],
    },
    specifications: [
      { label: "Thành phần chính", value: "15% Pure L-Ascorbic Acid, 1% Alpha Arbutin, Hyaluronic Acid" },
      { label: "Loại da", value: "Mọi loại da, da không đều màu, có thâm mụn" },
      { label: "Dung tích", value: "30ml lọ thủy tinh tối màu chống oxy hóa" },
      { label: "Hạn sử dụng", value: "36 tháng kể từ ngày sản xuất" },
    ],
    reviews: [
      {
        id: "rev_c_1",
        author: "Lê Mỹ Duyên",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
        rating: 5,
        date: "24/09/2026",
        title: "Da sáng rõ rệt sau 2 tuần",
        content: "Chất serum thấm cực nhanh, không bết dính. Mấy vết thâm mụn mới mờ đi trông thấy, da đều màu và có độ glow tự nhiên.",
        verifiedPurchase: true,
      }
    ],
  },
  {
    _id: "prod_12",
    id: "prod_12",
    name: "Kem Chống Nắng Phổ Rộng SPF50+ PA++++ Kiềm Dầu Kháng Nước DermaShield (50ml)",
    slug: "kem-chong-nang-pho-rong-dermashield",
    description: "Kem chống nắng quang phổ cao với 5 màng lọc tiên tiến, bảo vệ toàn diện trước tia UVA/UVB và ánh sáng xanh HEV. Nâng tông tự nhiên nhẹ nhàng, kiềm dầu suốt 8 giờ không lo vón cục hay bít tắc chân lông.",
    price: 290000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
    ],
    category: "Sắc đẹp",
    brand: "DermaShield",
    badge: "Hot Deal",
    stock: 180,
    sold: 4890,
    rating: 4.9,
    reviewCount: 1120,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Beauty Cosmetics Official",
    shopRating: 4.95,
    shopResponseRate: 100,
    variants: {
      colors: ["Bản Nâng Tông Tự Nhiên (Tone-up Pink)", "Bản Không Màu Kiềm Dầu Tối Đa (Invisible Matte)"],
      sizes: ["Tuýp 50ml"],
    },
    specifications: [
      { label: "Chỉ số chống nắng", value: "SPF 50+, PA++++ (Kiểm nghiệm lâm sàng độc lập)" },
      { label: "Màng lọc", value: "Màng lọc lai Tinosorb M + Zinc Oxide quang phổ rộng" },
      { label: "Kháng nước", value: "Water-resistant 80 phút" },
    ],
    reviews: [],
  },
  {
    _id: "prod_13",
    id: "prod_13",
    name: "Son Kem Lì Dưỡng Ẩm Mịn Môi Velvet Lip Tint Soft-Blur Tone Đỏ Đất Thời Thượng",
    slug: "son-kem-li-duong-am-velvet-lip-tint",
    description: "Chất son velvet mỏng nhẹ như sương, che phủ hoàn hảo rãnh môi tạo hiệu ứng mờ lì soft-blur quyến rũ. Bổ sung dầu hạt mắc ca và vitamin E giúp môi luôn mềm mại, không gây khô tróc sau cả ngày dài.",
    price: 185000,
    originalPrice: 260000,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    images: [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    ],
    category: "Sắc đẹp",
    brand: "VelvetLuxe",
    badge: "Amazon's Choice",
    stock: 95,
    sold: 2100,
    rating: 4.85,
    reviewCount: 460,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Beauty Cosmetics Official",
    shopRating: 4.95,
    shopResponseRate: 100,
    variants: {
      colors: ["#01 Đỏ Đất Trầm (Chili Brick)", "#02 Cam Đào San Hô (Peach Coral)", "#03 Hồng Trà Sữa (Milk Rose)"],
      sizes: ["Thỏi 4.5g"],
    },
    specifications: [
      { label: "Chất son", value: "Kem lì xốp mịn Velvet Soft Mousse" },
      { label: "Độ bền màu", value: "6 - 8 tiếng, để lại lớp tint nhẹ tự nhiên" },
    ],
    reviews: [],
  },
  {
    _id: "prod_14",
    id: "prod_14",
    name: "Nước Tẩy Trang Dịu Nhẹ Da Nhạy Cảm Micellar Cleansing Water B5 Centella (400ml)",
    slug: "nuoc-tay-trang-micellar-b5-centella",
    description: "Công nghệ micellar hút sạch dầu thừa, bụi mịn PM2.5 và lớp trang điểm chống nước mà không cần chà xát mạnh. Chiết xuất rau má Centella Asiatica làm dịu da tức thì, không gây cay mắt hay rát da.",
    price: 220000,
    originalPrice: 320000,
    image: "https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=800",
    images: [
      "https://images.unsplash.com/photo-1556228722-d0b5de70b774?w=800",
    ],
    category: "Sắc đẹp",
    brand: "DermaShield",
    badge: "Hot Deal",
    stock: 150,
    sold: 3200,
    rating: 4.9,
    reviewCount: 680,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Beauty Cosmetics Official",
    shopRating: 4.95,
    shopResponseRate: 100,
    variants: {
      colors: ["Chai nắp hồng (Da nhạy cảm)", "Chai nắp xanh lá (Da dầu mụn)"],
      sizes: ["Chai 400ml tiết kiệm"],
    },
    specifications: [
      { label: "Dung tích", value: "400ml" },
      { label: "Độ pH", value: "5.5 cân bằng sinh học cho da" },
      { label: "Cam kết", value: "0% Cồn - 0% Hương liệu - 0% Paraben" },
    ],
    reviews: [],
  },
  {
    _id: "prod_15",
    id: "prod_15",
    name: "Nồi Chiên Không Dầu Điện Tử 6.5L Cảm Ứng Đa Năng HomePro Crispy Airfryer (1800W)",
    slug: "noi-chien-khong-dau-dien-tu-6-5l-homepro",
    description: "Nồi chiên không dầu công nghệ luồng khí nóng đối lưu Rapid Air 360 độ, giảm 85% lượng dầu mỡ thừa. Màn hình cảm ứng LED một chạm với 10 chương trình nấu cài đặt sẵn, giỏ chiên phủ men gốm Ceramic chống dính an toàn tuyệt đối.",
    price: 1290000,
    originalPrice: 2190000,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800",
    images: [
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    ],
    category: "Gia dụng",
    brand: "HomePro",
    badge: "Best Seller",
    stock: 45,
    sold: 1540,
    rating: 4.9,
    reviewCount: 420,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "HomePro Gia Dụng Thông Minh",
    shopRating: 4.88,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Kim Cương (Bóng Bẩy)", "Trắng Ngọc Trai (Hiện Đại)"],
      sizes: ["Dung tích 6.5L (Cho gia đình 4 - 6 người)"],
    },
    specifications: [
      { label: "Công suất", value: "1800W làm nóng cực nhanh" },
      { label: "Dải nhiệt độ", value: "80°C - 200°C" },
      { label: "Hẹn giờ", value: "Lên đến 60 phút tự ngắt khi lấy giỏ" },
      { label: "Bảo hành", value: "24 tháng chính hãng tại nhà" },
    ],
    reviews: [
      {
        id: "rev_hp_1",
        author: "Vũ Phương Mai",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        rating: 5,
        date: "22/09/2026",
        title: "Chiên gà giòn rụm bên ngoài mọng nước bên trong",
        content: "Nồi to nướng được nguyên con gà 2kg, cảm ứng nhạy và dễ lau chùi sau khi nấu. Đóng gói rất cẩn thận, 10 điểm cho shop!",
        verifiedPurchase: true,
      }
    ],
  },
  {
    _id: "prod_16",
    id: "prod_16",
    name: "Máy Hút Bụi Cầm Tay Không Dây Lực Hút 20000Pa Cyclone Filter Siêu Nhẹ Pin 40 Phút",
    slug: "may-hut-bui-cam-tay-khong-day-20000pa",
    description: "Động cơ không chổi than Brushless Motor thế hệ mới tạo lực hút xoáy 20.000Pa cực mạnh, hút sạch mạt bụi giường nệm và lông thú cưng. Trọng lượng siêu nhẹ chỉ 1.2kg cùng bộ lọc HEPA 4 cấp độ lọc bụi mịn.",
    price: 850000,
    originalPrice: 1350000,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
    images: [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
    ],
    category: "Gia dụng",
    brand: "HomePro",
    badge: "Hot Deal",
    stock: 60,
    sold: 980,
    rating: 4.85,
    reviewCount: 310,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "HomePro Gia Dụng Thông Minh",
    shopRating: 4.88,
    shopResponseRate: 98,
    variants: {
      colors: ["Trắng Bạc Tối Giản", "Xám Titan Sang Trọng"],
      sizes: ["Bộ tiêu chuẩn kèm 3 đầu hút đa năng"],
    },
    specifications: [
      { label: "Lực hút", value: "20.000 Pa (2 chế độ Eco & Max)" },
      { label: "Pin", value: "Lithium 2500mAh dùng liên tục 40 phút" },
      { label: "Hộp chứa bụi", value: "0.6L đổ bụi 1 nút nhấn" },
    ],
    reviews: [],
  },
  {
    _id: "prod_17",
    id: "prod_17",
    name: "Nồi Cơm Điện Cao Tần IH 1.8L Lòng Nồi Hợp Kim Gang 5 Lớp Giữ Nhiệt 24H",
    slug: "noi-com-dien-cao-tan-ih-1-8l-homepro",
    description: "Công nghệ đốt nóng cảm ứng từ IH gia nhiệt đa chiều 360 độ giúp từng hạt cơm chín đều từ trong ra ngoài, giữ trọn vị ngọt tự nhiên. Lòng nồi gang phủ chống dính Binchotan cao cấp của Nhật Bản.",
    price: 1450000,
    originalPrice: 2300000,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800",
    ],
    category: "Gia dụng",
    brand: "HomePro",
    badge: "Amazon's Choice",
    stock: 35,
    sold: 720,
    rating: 4.95,
    reviewCount: 280,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "HomePro Gia Dụng Thông Minh",
    shopRating: 4.88,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Nhám Cánh Gián", "Trắng Sữa Kim Tuyến"],
      sizes: ["Dung tích 1.8L (Cơm cho 4 - 8 người)"],
    },
    specifications: [
      { label: "Công nghệ", value: "Cao tần IH (Induction Heating)" },
      { label: "Công suất", value: "1300W" },
      { label: "Chế độ nấu", value: "12 chế độ: Gạo lứt, cơm niêu, cháo, hấp dinh dưỡng..." },
    ],
    reviews: [],
  },
  {
    _id: "prod_18",
    id: "prod_18",
    name: "Máy Lọc Không Khí Thông Minh Màng Lọc HEPA H13 Khử Khuẩn Ion Âm PM2.5",
    slug: "may-loc-khong-khi-thong-minh-hepa-h13",
    description: "Bộ lọc 3 tầng với màng lọc True HEPA H13 loại bỏ 99.97% bụi mịn 0.3 micromet, phấn hoa, vi khuẩn và khử mùi khói thuốc. Cảm biến laser đo chất lượng không khí thời gian thực và tự động điều chỉnh tốc độ quạt thông minh.",
    price: 1690000,
    originalPrice: 2800000,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    images: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
    category: "Gia dụng",
    brand: "HomePro",
    badge: "Hot Deal",
    stock: 28,
    sold: 640,
    rating: 4.9,
    reviewCount: 195,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "HomePro Gia Dụng Thông Minh",
    shopRating: 4.88,
    shopResponseRate: 98,
    variants: {
      colors: ["Trắng Pure White"],
      sizes: ["Phù hợp diện tích phòng 25 - 45 m²"],
    },
    specifications: [
      { label: "Màng lọc", value: "Lọc thô + True HEPA H13 + Than hoạt tính khử mùi" },
      { label: "Độ ồn", value: "Siêu êm 28dB ở chế độ ngủ ban đêm" },
      { label: "Kết nối", value: "App điện thoại Wifi + Màn hình cảm ứng LED" },
    ],
    reviews: [],
  },
  {
    _id: "prod_19",
    id: "prod_19",
    name: "Quần Jean Ống Suông Nam Nữ Wide Leg Denim Cotton Dày Dặn Co Giãn",
    slug: "quan-jean-ong-suong-wide-leg-denim",
    description: "Quần jean unisex form suông rộng trendy thời trang Hàn Quốc. Chất vải denim dệt thoi 12.5oz chắc chắn, bền màu, xử lý wash rách nhẹ cá tính, tôn dáng và che khuyết điểm chân cực tốt.",
    price: 320000,
    originalPrice: 480000,
    image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800",
    images: [
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800",
    ],
    category: "Thời trang",
    brand: "GenZ Studio",
    badge: "Hot Deal",
    stock: 75,
    sold: 1890,
    rating: 4.85,
    reviewCount: 540,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xanh Nhạt Vintage", "Xanh Đậm Classic", "Đen Khói Retro"],
      sizes: ["Size 28 (45-53kg)", "Size 29 (54-60kg)", "Size 30 (61-68kg)", "Size 31 (69-75kg)", "Size 32 (76-85kg)"],
    },
    specifications: [
      { label: "Chất liệu", value: "98% Cotton Denim, 2% Spandex co giãn nhẹ" },
      { label: "Xuất xứ", value: "Việt Nam gia công xuất khẩu" },
    ],
    reviews: [],
  },
  {
    _id: "prod_20",
    id: "prod_20",
    name: "Áo Khoác Gió Unisex Chống Thấm Nước 2 Lớp Chống Tia UV Trượt Nước",
    slug: "ao-khoac-gio-unisex-chong-nuoc-2-lop",
    description: "Áo gió công nghệ trượt nước Nano DWR chống mưa phùn và gió lạnh hiệu quả. Lớp lót lưới thể thao thoáng khí, có mũ trùm đầu tháo rời và túi khóa kéo tiện lợi, chống tia cực tím UPF 50+.",
    price: 280000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
    ],
    category: "Thời trang",
    brand: "GenZ Studio",
    badge: "Best Seller",
    stock: 90,
    sold: 2400,
    rating: 4.9,
    reviewCount: 710,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Huyền Bí", "Xanh Rêu Quân Đội", "Xám Tro Phối Đen"],
      sizes: ["M (45-58kg)", "L (59-68kg)", "XL (69-78kg)", "XXL (79-90kg)"],
    },
    specifications: [
      { label: "Chất liệu", value: "Poly Micro kháng nước + Lớp lót lưới CoolMesh" },
      { label: "Tính năng", value: "Chống nắng UPF50+, trượt nước, cản gió giữ ấm" },
    ],
    reviews: [],
  },
  {
    _id: "prod_21",
    id: "prod_21",
    name: "Bàn Phím Cơ Không Dây 3 Mode RGB Hot-Swap Gateron Switch TechPro K75",
    slug: "ban-phim-co-khong-day-3-mode-rgb-k75",
    description: "Bàn phím cơ layout 75% núm xoay kim loại đa phương tiện, mạch xuôi hỗ trợ thay switch nóng Hot-Swap 5 pin. 3 chế độ kết nối Bluetooth 5.1 / Wireless 2.4G / Type-C có dây, foam tiêu âm Poron cao cấp gõ êm tai.",
    price: 1150000,
    originalPrice: 1750000,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    ],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Best Seller",
    stock: 65,
    sold: 1420,
    rating: 4.95,
    reviewCount: 380,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Phối màu Retro Xám Trắng", "Phối màu Cyberpunk Tím Neon"],
      sizes: ["Red Switch (Gõ êm, mượt)", "Brown Switch (Khấc nhẹ, văn phòng)", "Blue Switch (Clicky giòn tan)"],
    },
    specifications: [
      { label: "Keycap", value: "PBT Double-Shot OEM profile bền màu" },
      { label: "Pin", value: "4000mAh dùng 3 tuần khi tắt led" },
      { label: "LED", value: "RGB 16.8 triệu màu 19 hiệu ứng nháy theo nhạc" },
    ],
    reviews: [],
  },
  {
    _id: "prod_22",
    id: "prod_22",
    name: "Webcam 4K Ultra HD Tự Động Lấy Nét Auto Focus Kèm Micro Khử Ồn AI Kép",
    slug: "webcam-4k-ultra-hd-auto-focus",
    description: "Cảm biến hình ảnh Sony CMOS 1/2.8 inch xuất hình ảnh 4K 30fps hoặc 1080p 60fps siêu mượt mà. Ống kính góc rộng 90 độ không méo hình, tích hợp nắp che bảo mật cơ học và micro kép thu âm khử ồn bán kính 5 mét.",
    price: 790000,
    originalPrice: 1250000,
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800",
    images: [
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800",
    ],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Amazon's Choice",
    stock: 50,
    sold: 890,
    rating: 4.88,
    reviewCount: 240,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Đen Nhám Chuyên Nghiệp (Kèm Tripod Mini)"],
      sizes: ["Cắm cổng USB-A / Type-C cắm là nhận Plug & Play"],
    },
    specifications: [
      { label: "Độ phân giải", value: "4K (3840 x 2160) @ 30fps / 1080p @ 60fps" },
      { label: "Lấy nét", value: "AI Fast Auto Focus lấy nét nhanh trong 0.2s" },
      { label: "Tương thích", value: "Windows, macOS, Zoom, Google Meet, OBS Studio" },
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

  // Shop filter
  if (params.shopId) {
    list = list.filter((p) => (p.shopId || "shop_01") === params.shopId);
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
