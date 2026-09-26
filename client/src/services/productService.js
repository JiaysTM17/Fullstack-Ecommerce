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
  {
    _id: "prod_23",
    id: "prod_23",
    name: "Áo Khoác Bomber Phi Công Lót Lông Cừu Kháng Gió Trượt Nước Cao Cấp",
    slug: "ao-khoac-bomber-phi-cong-lot-long-cuu",
    description: "Chất liệu vải dù Poly mật độ cao trượt nước tuyệt đối, lớp lót lông cừu nhân tạo siêu ấm áp, cổ lông có thể tháo rời. Khóa kéo đồng YKK cao cấp chống kẹt.",
    price: 680000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
    category: "Thời trang",
    brand: "GenZ Studio",
    badge: "Hot Deal",
    stock: 45,
    sold: 430,
    rating: 4.85,
    reviewCount: 96,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xanh Rêu Quân Đội", "Đen Huyền Bí", "Nâu Cà Phê"],
      sizes: ["M", "L", "XL", "XXL"],
    },
    specifications: [
      { label: "Chất liệu ngoài", value: "Polyester Microfiber trượt nước" },
      { label: "Lớp lót", value: "Lông cừu nhân tạo giữ nhiệt 37°C" },
      { label: "Khóa kéo", value: "Đồng YKK mạ crom không gỉ" },
    ],
    reviews: [],
  },
  {
    _id: "prod_24",
    id: "prod_24",
    name: "Giày Cao Gót Nữ Mũi Nhọn Da Cừu Êm Chân Gót Nhọn 7cm Thanh Lịch",
    slug: "giay-cao-got-nu-mui-nhon-da-cuu",
    description: "Giày cao gót mũi nhọn gót 7cm tôn dáng, lót đệm cao su non êm ái nâng đỡ bàn chân, chống đau mỏi khi di chuyển cả ngày dài nơi công sở hay dạ tiệc.",
    price: 490000,
    originalPrice: 750000,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800"],
    category: "Thời trang",
    brand: "Graceful Lady",
    badge: "Best Seller",
    stock: 60,
    sold: 1120,
    rating: 4.9,
    reviewCount: 310,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Đen Quyến Rũ", "Kem Nude Thanh Nhã", "Đỏ Rượu Vang"],
      sizes: ["35", "36", "37", "38", "39"],
    },
    specifications: [
      { label: "Chất liệu ngoài", value: "Da cừu nhân tạo siêu mềm bóng nhẹ" },
      { label: "Lót trong", value: "Đệm Memory Foam êm chân chống sốc" },
      { label: "Độ cao gót", value: "7cm chuẩn dáng công sở" },
    ],
    reviews: [],
  },
  {
    _id: "prod_25",
    id: "prod_25",
    name: "Quần Tây Âu Nam Dáng Slimfit Co Giãn Nhẹ Kháng Nhăn Tuyệt Đối",
    slug: "quan-tay-au-nam-dang-slimfit",
    description: "Quần âu may đo chuẩn form âu hiện đại, cạp tăng đơ thông minh tự co giãn 3-4cm, vải tuyết mưa nhập khẩu mềm mịn không bám bụi, phẳng phiu suốt ngày.",
    price: 350000,
    originalPrice: 520000,
    image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800",
    images: ["https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800"],
    category: "Thời trang",
    brand: "Shopee Basic",
    badge: "Amazon's Choice",
    stock: 75,
    sold: 840,
    rating: 4.82,
    reviewCount: 185,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xám Tro Chì", "Đen Sang Trọng", "Xanh Than Lịch Lãm"],
      sizes: ["29", "30", "31", "32", "34"],
    },
    specifications: [
      { label: "Chất liệu", value: "Vải tuyết mưa Rayon pha Spandex 5%" },
      { label: "Thiết kế cạp", value: "Cạp thông minh co giãn ẩn 2 bên" },
      { label: "Chống nhăn", value: "Công nghệ xử lý Nano Easy-Care" },
    ],
    reviews: [],
  },
  {
    _id: "prod_26",
    id: "prod_26",
    name: "Ví Da Bò Sáp Nam Khâu Tay Thủ Công Dáng Đứng Cổ Điển Kèm Ngăn Thẻ RFID",
    slug: "vi-da-bo-sap-nam-khau-tay",
    description: "Da bò sáp Crazy Horse cao cấp lên nước càng dùng càng đẹp, khâu tay thủ công bằng chỉ sáp sáp bền bỉ 10 năm, tích hợp màng chắn RFID bảo mật tài khoản thẻ ngân hàng.",
    price: 299000,
    originalPrice: 450000,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800"],
    category: "Thời trang",
    brand: "LeatherCraft",
    badge: "Amazon's Choice",
    stock: 40,
    sold: 620,
    rating: 4.92,
    reviewCount: 140,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Nâu Sáp Vintage", "Đen Than Cổ Điển", "Xanh Rêu Độc Bản"],
      sizes: ["Kích thước 12cm x 9.5cm"],
    },
    specifications: [
      { label: "Chất da", value: "Da bò hạt sáp nhập khẩu tự nhiên" },
      { label: "Sức chứa", value: "8 ngăn thẻ, 2 ngăn tiền thẳng, 1 ngăn ảnh" },
      { label: "Bảo mật", value: "Màng chắn chống quét trộm RFID chuẩn quân đội" },
    ],
    reviews: [],
  },
  {
    _id: "prod_27",
    id: "prod_27",
    name: "Váy Dạ Tweed Nữ Tiểu Thư Kèm Cúc Ngọc Trai Phối Ren Quý Tộc",
    slug: "vay-da-tweed-nu-tieu-thu",
    description: "Chất dạ tweed dệt sợi kim tuyến lấp lánh nhẹ nhàng, lót lụa habutai mềm mướt không ngứa rát, phom chữ A tiểu thư cực kỳ tôn dáng và sang trọng trong các buổi tiệc.",
    price: 590000,
    originalPrice: 850000,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800",
    images: ["https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"],
    category: "Thời trang",
    brand: "GenZ Studio",
    badge: "Hot Deal",
    stock: 35,
    sold: 380,
    rating: 4.88,
    reviewCount: 88,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Trắng Ánh Kim", "Đen Chỉ Bạc", "Hồng Pastel"],
      sizes: ["S (40-47kg)", "M (48-54kg)", "L (55-60kg)"],
    },
    specifications: [
      { label: "Chất liệu", value: "Dạ Tweed sợi dệt cao cấp kèm lót lụa" },
      { label: "Phụ kiện", value: "Cúc ngọc trai đúc viền hợp kim mạ vàng" },
    ],
    reviews: [],
  },
  {
    _id: "prod_28",
    id: "prod_28",
    name: "Kính Mát Phi Công Polarized Phân Cực Chống Tia UV400 Gọng Titanium Siêu Nhẹ",
    slug: "kinh-mat-phi-cong-polarized-uv400",
    description: "Tròng kính phân cực 9 lớp loại bỏ hoàn toàn ánh sáng chói lóa khi lái xe hay đi biển, chống tia tử ngoại UVA/UVB 100%. Gọng hợp kim titanium siêu dẻo chỉ nặng 18 gram.",
    price: 380000,
    originalPrice: 600000,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800",
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800"],
    category: "Thời trang",
    brand: "OpticView",
    badge: "Amazon's Choice",
    stock: 90,
    sold: 1450,
    rating: 4.9,
    reviewCount: 380,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Mắt Đen Gọng Bạc", "Mắt Xanh Rêu Gọng Vàng", "Mắt Tráng Gương Bạc"],
      sizes: ["Freesize ôm khít khuôn mặt"],
    },
    specifications: [
      { label: "Tròng kính", value: "Triacetate Cellulose (TAC) Polarized 9 lớp" },
      { label: "Chống tia UV", value: "Chuẩn UV400 bảo vệ giác mạc tối đa" },
      { label: "Trọng lượng", value: "18.5g siêu nhẹ êm vành tai" },
    ],
    reviews: [],
  },
  {
    _id: "prod_29",
    id: "prod_29",
    name: "Thắt Lưng Da Bò Nguyên Miếng Khóa Tự Động Hợp Kim Chống Trầy Xước",
    slug: "that-lung-da-bo-nguyen-mieng-khoa-tu-dong",
    description: "Dây nịt da bò một lớp liền mạch không dán ép, bền bỉ uốn cong không để lại vết nứt gãy. Khóa ray trượt hợp kim vonfram sáng bóng chống xước sang trọng.",
    price: 260000,
    originalPrice: 390000,
    image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800",
    images: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800"],
    category: "Thời trang",
    brand: "LeatherCraft",
    badge: "Best Seller",
    stock: 80,
    sold: 980,
    rating: 4.86,
    reviewCount: 215,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Mặt Khóa Đen Carbon", "Mặt Khóa Bạc Xước Phay", "Mặt Khóa Vàng Gold"],
      sizes: ["Chiều dài 120cm (Có thể tự cắt ngắn vừa eo)"],
    },
    specifications: [
      { label: "Bề rộng bản", value: "3.5cm chuẩn công sở thanh lịch" },
      { label: "Chất da", value: "Da bò lớp 1 Full-Grain nguyên miếng" },
    ],
    reviews: [],
  },
  {
    _id: "prod_30",
    id: "prod_30",
    name: "Máy Tính Bảng Galaxy Tab Ultra 11 inch 120Hz Kèm Bút Cảm Ứng Lực",
    slug: "may-tinh-bang-galaxy-tab-ultra-11-inch",
    description: "Màn hình 2.5K tần số quét 120Hz mượt mà, vi xử lý 8 nhân mạnh mẽ cân mọi tác vụ vẽ đồ họa, ghi chú thông minh và chơi game đồ họa nặng. Pin trâu 8600mAh dùng 14 tiếng.",
    price: 8900000,
    originalPrice: 11500000,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800"],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Hot Deal",
    stock: 25,
    sold: 340,
    rating: 4.95,
    reviewCount: 112,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Xám Không Gian", "Bạc Ánh Trăng"],
      sizes: ["128GB (WiFi)", "256GB (WiFi + 5G LTE)"],
    },
    specifications: [
      { label: "Màn hình", value: "11 inch 2.5K IPS 120Hz 500 nits" },
      { label: "RAM / ROM", value: "8GB RAM + 128GB/256GB UFS 3.1" },
      { label: "Bút stylus", value: "Cảm ứng lực 4096 mức độ trễ 2.8ms" },
    ],
    reviews: [],
  },
  {
    _id: "prod_31",
    id: "prod_31",
    name: "Ổ Cứng Di Động SSD NVMe 1TB Tốc Độ 1050MB/s Vỏ Nhôm Tản Nhiệt Chống Sốc",
    slug: "o-cung-di-dong-ssd-nvme-1tb",
    description: "Tốc độ đọc ghi lên tới 1050MB/s truyền tệp video 4K 10GB chỉ trong 10 giây. Vỏ nhôm nguyên khối phay CNC tản nhiệt tức thì, kháng nước và chống sốc rơi vỡ từ độ cao 2m.",
    price: 1850000,
    originalPrice: 2400000,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800",
    images: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800"],
    category: "Điện tử",
    brand: "SpeedStorage",
    badge: "Amazon's Choice",
    stock: 55,
    sold: 720,
    rating: 4.92,
    reviewCount: 190,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Bạc Titan", "Xanh Midnight"],
      sizes: ["512GB", "1TB", "2TB"],
    },
    specifications: [
      { label: "Chuẩn giao tiếp", value: "USB 3.2 Gen 2 Type-C (10Gbps)" },
      { label: "Tốc độ", value: "Đọc 1050MB/s - Ghi 1000MB/s" },
      { label: "Tương thích", value: "Windows, macOS, Android, iPhone 15/16 Pro" },
    ],
    reviews: [],
  },
  {
    _id: "prod_32",
    id: "prod_32",
    name: "Củ Sạc Nhanh GaN 65W 3 Cổng PD 3.0 & QC 4.0 Sạc Cùng Lúc Laptop & Smartphone",
    slug: "cu-sac-nhanh-gan-65w-3-cong",
    description: "Công nghệ bán dẫn GaN thế hệ mới giúp kích thước nhỏ gọn bằng hộp diêm nhưng công suất cực đại 65W. Tự động điều phối dòng điện thông minh, chống quá nhiệt bảo vệ pin thiết bị.",
    price: 360000,
    originalPrice: 550000,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    images: ["https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800"],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Best Seller",
    stock: 110,
    sold: 2300,
    rating: 4.93,
    reviewCount: 540,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Trắng Tuyết", "Đen Nhám"],
      sizes: ["Kèm Cáp C-to-C 100W Bọc Dù 1.2m"],
    },
    specifications: [
      { label: "Công nghệ", value: "GaNFast III giảm nhiệt 30%" },
      { label: "Cổng ra", value: "2 x Type-C (65W Max) + 1 x USB-A (30W Max)" },
      { label: "Chứng nhận", value: "CE, FCC, RoHS bảo vệ an toàn cháy nổ" },
    ],
    reviews: [],
  },
  {
    _id: "prod_33",
    id: "prod_33",
    name: "Tai Nghe Chơi Game Chụp Tai Âm Thanh Vòm 7.1 RGB Kèm Mic Khử Ồn Đàm Thoại",
    slug: "tai-nghe-choi-game-am-thanh-vom-7-1",
    description: "Driver loa Neodymium 50mm tái hiện tiếng bước chân định vị đối thủ chính xác. Đệm tai da protein mềm mại ôm trọn vành tai không đau đầu, LED RGB đổi màu cực chiến.",
    price: 550000,
    originalPrice: 850000,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
    images: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800"],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Hot Deal",
    stock: 45,
    sold: 680,
    rating: 4.87,
    reviewCount: 165,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Đen Cyberpunk", "Trắng Băng Giá"],
      sizes: ["Cổng cắm USB 7.1 Audio Dac"],
    },
    specifications: [
      { label: "Củ loa", value: "50mm Dynamic Driver dải tần 20Hz - 20kHz" },
      { label: "Micro", value: "Mic xoay 360 lọc tiếng ồn xung quanh" },
      { label: "Dây cáp", value: "Bọc dù chống rối dài 2.2 mét" },
    ],
    reviews: [],
  },
  {
    _id: "prod_34",
    id: "prod_34",
    name: "Màn Hình Đồ Họa Chuyên Nghiệp 27 inch 4K IPS Chuẩn Màu 100% sRGB Viền Vô Cực",
    slug: "man-hinh-do-hoa-27-inch-4k-ips",
    description: "Tấm nền IPS độ phân giải 4K Ultra HD sắc nét đến từng sợi tóc, Delta E < 2 cân màu chuẩn xác từ nhà máy dành riêng cho designer, dựng phim và lập trình viên.",
    price: 6490000,
    originalPrice: 8900000,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    images: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"],
    category: "Điện tử",
    brand: "ViewTech",
    badge: "Amazon's Choice",
    stock: 20,
    sold: 190,
    rating: 4.94,
    reviewCount: 65,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Đen Tuyền Chân Xoay Nâng Hạ Đa Hướng"],
      sizes: ["27 inch 4K (3840x2160) Type-C 90W"],
    },
    specifications: [
      { label: "Tấm nền", value: "27 inch IPS 4K HDR400 độ phủ 100% sRGB, 95% DCI-P3" },
      { label: "Cổng kết nối", value: "Type-C 90W sạc laptop, HDMI 2.0, DisplayPort 1.4" },
      { label: "Bảo vệ mắt", value: "Lọc ánh sáng xanh Low Blue Light chuẩn TUV" },
    ],
    reviews: [],
  },
  {
    _id: "prod_35",
    id: "prod_35",
    name: "Pin Sạc Dự Phòng 20.000mAh 22.5W Màn Hình LED Báo Pin Chuẩn Xác",
    slug: "pin-sac-du-phong-20000mah-22-5w",
    description: "Dung lượng pin 20.000mAh nạp đầy iPhone 15 Pro được 4.5 lần. Màn hình kỹ thuật số hiển thị phần trăm pin chính xác từng 1%, hỗ trợ sạc nhanh PD 20W & SCP 22.5W.",
    price: 390000,
    originalPrice: 590000,
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800",
    images: ["https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=800"],
    category: "Điện tử",
    brand: "PowerCore",
    badge: "Best Seller",
    stock: 95,
    sold: 1850,
    rating: 4.91,
    reviewCount: 420,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Trắng Ngọc Trai", "Đen Nhám Thạch Anh", "Xanh Rêu"],
      sizes: ["Dung lượng 20.000mAh chuẩn bay quốc tế"],
    },
    specifications: [
      { label: "Lõi pin", value: "Lithium Polymer an toàn chống cháy nổ" },
      { label: "Cổng sạc", value: "2 cổng USB-A ra, 1 cổng Type-C 2 chiều" },
      { label: "Tiêu chuẩn", value: "Được phép mang lên máy bay dưới 100Wh" },
    ],
    reviews: [],
  },
  {
    _id: "prod_36",
    id: "prod_36",
    name: "Giá Đỡ Laptop Nhôm Nguyên Khối Xoay 360 Độ Công Thái Học Chống Mỏi Cổ",
    slug: "gia-do-laptop-nhom-nguyen-khoi-xoay-360",
    description: "Trục xoay kim loại xoay 360 độ kèm âm thanh click click đã tai. Nhôm dày 3mm chịu lực 10kg không rung lắc khi gõ phím, nâng tầm mắt chuẩn công thái học.",
    price: 320000,
    originalPrice: 480000,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800",
    images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800"],
    category: "Điện tử",
    brand: "ErgoDesk",
    badge: "Amazon's Choice",
    stock: 65,
    sold: 910,
    rating: 4.88,
    reviewCount: 230,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Bạc Ánh Kim (Silver)", "Xám Không Gian (Space Gray)"],
      sizes: ["Tương thích laptop 11 inch đến 17.3 inch"],
    },
    specifications: [
      { label: "Chất liệu", value: "Hợp kim nhôm hàng không phay cát mờ" },
      { label: "Tính năng", value: "Xoay vô cấp 360 độ, chỉnh độ cao từ 5cm - 30cm" },
    ],
    reviews: [],
  },
  {
    _id: "prod_37",
    id: "prod_37",
    name: "Tay Cầm Chơi Game Không Dây Cần Hall Effect Chống Trôi Rung Kép Asymmetric",
    slug: "tay-cam-choi-game-khong-day-hall-effect",
    description: "Cần xoay cảm ứng từ Hall Effect vĩnh cửu không bao giờ bị trôi analog. Kết nối đa nền tảng PC, Switch, iOS, Android qua Bluetooth 5.3 hoặc USB Receiver 2.4GHz không độ trễ.",
    price: 690000,
    originalPrice: 990000,
    image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800",
    images: ["https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800"],
    category: "Điện tử",
    brand: "TechWorld",
    badge: "Hot Deal",
    stock: 40,
    sold: 520,
    rating: 4.93,
    reviewCount: 135,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopRating: 4.95,
    shopResponseRate: 99,
    variants: {
      colors: ["Trắng Polar Ice", "Đen Phantom", "Tím Neon Retro"],
      sizes: ["Bản Full Box Kèm Giá Đỡ Điện Thoại"],
    },
    specifications: [
      { label: "Analog & Trigger", value: "Cảm ứng từ Hall Effect tuổi thọ 5 triệu lần gạt" },
      { label: "Pin", value: "1000mAh chơi liên tục 20 giờ" },
      { label: "Tương thích", value: "PC Windows, Steam, Nintendo Switch, iPhone, Android" },
    ],
    reviews: [],
  },
  {
    _id: "prod_38",
    id: "prod_38",
    name: "Tinh Chất Serum Dưỡng Ẩm Phục Hồi Da Hyaluronic Acid 2% + B5 50ml",
    slug: "serum-duong-am-phuc-hoi-da-ha-b5",
    description: "Công thức đa tầng HA cấp ẩm sâu biểu bì da, kết hợp Vitamin B5 làm dịu mẩn đỏ, phục hồi hàng rào bảo vệ da sau mụn hoặc peel da chỉ sau 7 ngày.",
    price: 280000,
    originalPrice: 420000,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"],
    category: "Sắc đẹp",
    brand: "Seoul Derm",
    badge: "Best Seller",
    stock: 120,
    sold: 3400,
    rating: 4.96,
    reviewCount: 880,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["Chai Thủy Tinh Nắp Hút 50ml"],
      sizes: ["Dung tích 50ml", "Dung tích 100ml Tiết Kiệm"],
    },
    specifications: [
      { label: "Thành phần chính", value: "Hyaluronic Acid phân tử siêu nhỏ + 5% D-Panthenol (B5)" },
      { label: "Loại da phù hợp", value: "Mọi loại da, da nhạy cảm mỏng manh, da dầu thiếu nước" },
      { label: "Xuất xứ", value: "Hàn Quốc (Nhập khẩu chính ngạch có tem phụ)" },
    ],
    reviews: [],
  },
  {
    _id: "prod_39",
    id: "prod_39",
    name: "Kem Chống Nắng Vật Lý Lai Hóa Học SPF50+ PA++++ Kiềm Dầu Nâng Tông Tự Nhiên",
    slug: "kem-chong-nang-spf50-kiem-dau-nang-tong",
    description: "Màng lọc quang phổ rộng chống tia UVA/UVB và ánh sáng xanh từ màn hình máy tính. Chất kem mỏng nhẹ thấm sau 3 giây, kiềm dầu 8 tiếng không để lại vệt trắng.",
    price: 310000,
    originalPrice: 450000,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
    images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"],
    category: "Sắc đẹp",
    brand: "Seoul Derm",
    badge: "Amazon's Choice",
    stock: 85,
    sold: 2150,
    rating: 4.9,
    reviewCount: 490,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["Tuýp 50ml Nâng Tông Trắng Hồng", "Tuýp 50ml Trong Suốt Không Màu"],
      sizes: ["50ml"],
    },
    specifications: [
      { label: "Chỉ số chống nắng", value: "SPF 50+ / PA++++ kiểm nghiệm da liễu" },
      { label: "Kháng nước", value: "Water-resistant chống trôi nước 80 phút" },
    ],
    reviews: [],
  },
  {
    _id: "prod_40",
    id: "prod_40",
    name: "Máy Rửa Mặt Sóng Âm Silicone Kháng Khuẩn 8 Tốc Độ Sạc Không Dây Chống Nước IPX7",
    slug: "may-rua-mat-song-am-silicone-ipx7",
    description: "Tần số rung sóng âm 12.000 nhịp/phút đánh bật 99.5% bụi bẩn bã nhờn sâu trong lỗ chân lông. Đầu cọ silicone y tế kháng khuẩn 0.6mm siêu êm ái cho làn da nhạy cảm.",
    price: 450000,
    originalPrice: 690000,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800"],
    category: "Sắc đẹp",
    brand: "LuxeSkin",
    badge: "Hot Deal",
    stock: 50,
    sold: 780,
    rating: 4.88,
    reviewCount: 175,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["Hồng Pastel Nữ Tính", "Xanh Mint Thanh Mát", "Tím Lavender"],
      sizes: ["Kèm Đế Sạc Từ Tính Không Dây"],
    },
    specifications: [
      { label: "Chống nước", value: "IPX7 ngâm nước 1 mét không lo hỏng hóc" },
      { label: "Thời lượng pin", value: "1 lần sạc dùng được 6 tháng" },
    ],
    reviews: [],
  },
  {
    _id: "prod_41",
    id: "prod_41",
    name: "Nước Hoa Unisex Hương Gỗ Tuyết Tùng & Hổ Phách Trầm Ấm Lưu Hương 12H 50ml",
    slug: "nuoc-hoa-unisex-huong-go-tuyet-tung-50ml",
    description: "Hương đầu cam Bergamot tươi mát, tầng hương giữa hoa diên vĩ tinh tế và đọng lại hương cuối gỗ tuyết tùng trầm lắng cuốn hút. Nồng độ EDP đậm đặc lưu hương trên 12 tiếng.",
    price: 650000,
    originalPrice: 950000,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
    images: ["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800"],
    category: "Sắc đẹp",
    brand: "Maison Scent",
    badge: "Amazon's Choice",
    stock: 30,
    sold: 490,
    rating: 4.94,
    reviewCount: 130,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["Chai Thủy Tinh Khói Nắp Nam Châm"],
      sizes: ["50ml Eau De Parfum"],
    },
    specifications: [
      { label: "Nồng độ", value: "EDP (Eau De Parfum) tinh dầu 20%" },
      { label: "Tỏa hương", value: "Trong bán kính 2 mét" },
      { label: "Phong cách", value: "Lịch lãm, sang trọng, quyến rũ bí ẩn" },
    ],
    reviews: [],
  },
  {
    _id: "prod_42",
    id: "prod_42",
    name: "Bàn Chải Điện Sóng Âm Sonic 42.000 Nhịp Rung Kèm 4 Đầu Bàn Chải DuPont",
    slug: "ban-chai-dien-song-am-sonic-42000-nhip",
    description: "Động cơ Maglev từ tính 42.000 nhịp chải/phút làm sạch mảng bám ố vàng gấp 7 lần bàn chải thông thường. Tự động hẹn giờ khoa học 2 phút, nhắc đổi vùng miệng sau mỗi 30 giây.",
    price: 390000,
    originalPrice: 590000,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800",
    images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800"],
    category: "Sắc đẹp",
    brand: "LuxeSkin",
    badge: "Best Seller",
    stock: 70,
    sold: 1600,
    rating: 4.89,
    reviewCount: 360,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["Trắng Ngà Tinh Khôi", "Hồng Phấn Pastel", "Đen Nhám Mạnh Mẽ"],
      sizes: ["Tặng kèm 4 đầu chải + Hộp đựng du lịch"],
    },
    specifications: [
      { label: "Chế độ chải", value: "5 chế độ: Clean, White, Polish, Gum Care, Sensitive" },
      { label: "Thời lượng pin", value: "Pin sạc Type-C dùng liên tục 60 ngày" },
    ],
    reviews: [],
  },
  {
    _id: "prod_43",
    id: "prod_43",
    name: "Son Kem Lì Thuần Chay Lâu Trôi Màu Đỏ Đất Thời Thượng Không Gây Khô Môi",
    slug: "son-kem-li-thuan-chay-mau-do-dat",
    description: "Chất son velvet mịn mượt như nhung, bổ sung dầu hạt jojoba và bơ hạt mỡ dưỡng môi mềm mọng suốt cả ngày. Bền màu 10 tiếng, không dính cốc khi uống nước.",
    price: 220000,
    originalPrice: 320000,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800"],
    category: "Sắc đẹp",
    brand: "Seoul Derm",
    badge: "Amazon's Choice",
    stock: 90,
    sold: 2800,
    rating: 4.92,
    reviewCount: 710,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_03",
    shopName: "Mỹ Phẩm Seoul Official",
    shopRating: 4.92,
    shopResponseRate: 97,
    variants: {
      colors: ["#01 Đỏ Đất Cổ Điển", "#02 Cam Cháy Cá Tính", "#03 Cánh Hồng Khô Dịu Dàng"],
      sizes: ["Thỏi 4.5g"],
    },
    specifications: [
      { label: "Chứng nhận", value: "100% Vegan thuần chay, không chì kiểm định Bộ Y Tế" },
      { label: "Độ bền màu", value: "Kháng nước trôi son tới 10 tiếng" },
    ],
    reviews: [],
  },
  {
    _id: "prod_44",
    id: "prod_44",
    name: "Nồi Cơm Điện Cao Tần IH 1.8L Lòng Nồi Hợp Kim Đa Lớp Chống Dính Ceramic",
    slug: "noi-com-dien-cao-tan-ih-1-8l",
    description: "Công nghệ đốt nóng cảm ứng từ IH 360 độ giúp từng hạt gạo chín đều dẻo ngọt giữ trọn dinh dưỡng. Lòng nồi gang đúc dày 3mm chống trầy xước bền bỉ 10 năm.",
    price: 1690000,
    originalPrice: 2490000,
    image: "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800",
    images: ["https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800"],
    category: "Gia dụng",
    brand: "HomeChef",
    badge: "Hot Deal",
    stock: 35,
    sold: 510,
    rating: 4.91,
    reviewCount: 145,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Trắng Ngọc Tròn Tròn", "Đen Kim Cương Cao Cấp"],
      sizes: ["Dung tích 1.8L (Dành cho gia đình 4-6 người)"],
    },
    specifications: [
      { label: "Công nghệ nấu", value: "Gia nhiệt cao tần IH từ trường 1300W" },
      { label: "Menu tự động", value: "12 chế độ: Cơm dẻo, cơm cháy, cháo, súp, làm bánh" },
      { label: "Hẹn giờ", value: "Hẹn giờ thông minh 24 tiếng" },
    ],
    reviews: [],
  },
  {
    _id: "prod_45",
    id: "prod_45",
    name: "Máy Ép Chậm Trái Cây Nguyên Quả Trục Xoắn Xoay 43 Vòng Giữ 98% Vitamin",
    slug: "may-ep-cham-trai-cay-nguyen-qua",
    description: "Ống tiếp nguyên liệu cực đại 85mm bỏ vừa cả quả táo không cần cắt nhỏ. Tốc độ ép chậm 43 vòng/phút không sinh nhiệt, bã khô kiệt và nước ép sánh mịn không phân tầng.",
    price: 1450000,
    originalPrice: 2100000,
    image: "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=800",
    images: ["https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=800"],
    category: "Gia dụng",
    brand: "HomeChef",
    badge: "Amazon's Choice",
    stock: 40,
    sold: 630,
    rating: 4.87,
    reviewCount: 160,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Đỏ Ruby Quyến Rũ", "Bạc Kim Loại Sang Trọng"],
      sizes: ["Kèm Lưới Lọc Làm Kem Trái Cây"],
    },
    specifications: [
      { label: "Công suất", value: "250W động cơ đồng nguyên chất vận hành êm ái 45dB" },
      { label: "Chất liệu cối", value: "Nhựa Tritan an toàn cho trẻ sơ sinh" },
    ],
    reviews: [],
  },
  {
    _id: "prod_46",
    id: "prod_46",
    name: "Bộ Chăn Ga Gối Lụa Tencel 60S Mát Lạnh Kháng Khuẩn Tự Nhiên 4 Món",
    slug: "bo-chan-ga-goi-lua-tencel-60s",
    description: "Dệt từ sợi bột gỗ bạch đàn sinh học Tencel 60S mát lịm da, điều hòa nhiệt độ thông minh giúp giấc ngủ sâu suốt đêm hè lẫn mùa đông. Không xù lông, bền màu.",
    price: 1290000,
    originalPrice: 1850000,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"],
    category: "Gia dụng",
    brand: "HomeLiving",
    badge: "Best Seller",
    stock: 50,
    sold: 890,
    rating: 4.93,
    reviewCount: 270,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Xanh Rêu Xám Quý Phái", "Xám Khói Hiện Đại", "Vàng Kem Nhẹ Nhàng"],
      sizes: ["Giường 1m6 x 2m", "Giường 1m8 x 2m", "Giường 2m x 2m2 King Size"],
    },
    specifications: [
      { label: "Quy cách bộ", value: "1 Ga bo chun + 1 Vỏ chăn lồng ruột + 2 Vỏ gối nằm" },
      { label: "Mật độ sợi", value: "Tencel 60S tiêu chuẩn khách sạn 5 sao" },
    ],
    reviews: [],
  },
  {
    _id: "prod_47",
    id: "prod_47",
    name: "Ghế Công Thái Học Ergonomic Lưới Thoáng Khí Ngả Lưng 135 Độ Đệm Đỡ Thắt Lưng",
    slug: "ghe-cong-thai-hoc-ergonomic-nga-135-do",
    description: "Thiết kế đệm đỡ cột sống chữ S ôm sát lưng dưới, giảm áp lực lên đĩa đệm khi ngồi làm việc lâu trước máy tính. Lưới Dragon chịu lực đàn hồi cao, ngả lưng nghỉ trưa 135 độ.",
    price: 1890000,
    originalPrice: 2800000,
    image: "https://images.unsplash.com/photo-1580481077195-c3a82105e3b5?w=800",
    images: ["https://images.unsplash.com/photo-1580481077195-c3a82105e3b5?w=800"],
    category: "Gia dụng",
    brand: "ErgoDesk",
    badge: "Hot Deal",
    stock: 25,
    sold: 430,
    rating: 4.92,
    reviewCount: 110,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Đen Huyền Bí", "Xám Bạc Sang Trọng"],
      sizes: ["Có Kê Chân Nghỉ Trưa Gấp Gọn", "Bản Tiêu Chuẩn Không Kê Chân"],
    },
    specifications: [
      { label: "Piston nâng hạ", value: "Piston Class 4 chứng nhận SGS an toàn chống nổ" },
      { label: "Tải trọng", value: "Chịu lực tối đa 150kg" },
      { label: "Tay vịn", value: "3D nâng hạ, trượt tiến lùi, xoay góc 20 độ" },
    ],
    reviews: [],
  },
  {
    _id: "prod_48",
    id: "prod_48",
    name: "Máy Massage Cổ Vai Gáy Chườm Nóng Hồng Ngoại Không Dây Giảm Đau Mỏi Tức Thì",
    slug: "may-massage-co-vai-gay-hong-ngoai",
    description: "6 con lăn mô phỏng bàn tay chuyên gia xoa bóp cơ thang vai và đốt sống cổ. Nhiệt hồng ngoại 42 độ C thúc đẩy tuần hoàn máu giảm đau mỏi do ngồi văn phòng cả ngày.",
    price: 690000,
    originalPrice: 990000,
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
    images: ["https://images.unsplash.com/photo-1544717305-2782549b5136?w=800"],
    category: "Gia dụng",
    brand: "HomeChef",
    badge: "Amazon's Choice",
    stock: 55,
    sold: 1150,
    rating: 4.91,
    reviewCount: 310,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Xám Beige Trang Nhã", "Cam Đất Trẻ Trung"],
      sizes: ["Pin Sạc Type-C Không Dây"],
    },
    specifications: [
      { label: "Công nghệ massage", value: "Xoa bóp đa điểm 3D sâu vào nhóm cơ cổ" },
      { label: "Dung lượng pin", value: "2000mAh dùng 10 ngày (15 phút/ngày)" },
    ],
    reviews: [],
  },
  {
    _id: "prod_49",
    id: "prod_49",
    name: "Thùng Rác Cảm Ứng Thông Minh Tự Động Đóng Mở 16L Khử Mùi Bằng Ozone",
    slug: "thung-rac-cam-ung-thong-minh-16l",
    description: "Cảm biến hồng ngoại nhận diện bàn tay hoặc đầu gối trong 0.2 giây tự động mở nắp không cần chạm. Đóng nắp kín mùi tuyệt đối, tích hợp ngăn khử khuẩn Ozone tự động.",
    price: 360000,
    originalPrice: 520000,
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
    images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800"],
    category: "Gia dụng",
    brand: "HomeLiving",
    badge: "Best Seller",
    stock: 65,
    sold: 870,
    rating: 4.86,
    reviewCount: 195,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_04",
    shopName: "Home & Living Concept",
    shopRating: 4.88,
    shopResponseRate: 96,
    variants: {
      colors: ["Trắng Sứ Tinh Tế", "Xanh Rêu Hiện Đại"],
      sizes: ["Dung tích 16L (Pin sạc USB Type-C)"],
    },
    specifications: [
      { label: "Cảm biến", value: "Hồng ngoại góc quét 30cm siêu nhạy" },
      { label: "Chống nước", value: "Tiêu chuẩn IPX5 an toàn đặt trong phòng tắm" },
    ],
    reviews: [],
  },
  {
    _id: "prod_50",
    id: "prod_50",
    name: "Thảm Tập Yoga Định Tuyến TPE Cao Cấp 2 Lớp Chống Trơn Trượt Tuyệt Đối 8mm",
    slug: "tham-tap-yoga-dinh-tuyen-tpe-8mm",
    description: "Chất liệu TPE thân thiện môi trường không mùi hắc, vân gai kim cương chống trượt bám dính mặt sàn tuyệt hảo. Kẻ đường định tuyến laser giúp người tập căn chuẩn tư thế asana.",
    price: 270000,
    originalPrice: 390000,
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800",
    images: ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800"],
    category: "Thể thao",
    brand: "FitLife",
    badge: "Amazon's Choice",
    stock: 80,
    sold: 1420,
    rating: 4.93,
    reviewCount: 380,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xanh Dương - Xám", "Hồng Hoa Anh Đào - Xanh", "Tím Violet - Hồng"],
      sizes: ["183cm x 61cm x 8mm (Tặng Túi Đựng + Dây Đeo)"],
    },
    specifications: [
      { label: "Độ dày", value: "8mm bảo vệ đầu gối và khớp xương tối ưu" },
      { label: "Chất liệu", value: "TPE đúc nhiệt 2 lớp không mùi, dễ lau chùi" },
    ],
    reviews: [],
  },
  {
    _id: "prod_51",
    id: "prod_51",
    name: "Bình Nước Thể Thao Tritan Chống Rơi Vỡ 1500ml Không Chứa BPA Có Vạch Nhắc Uống",
    slug: "binh-nuoc-the-thao-tritan-1500ml",
    description: "Chất liệu nhựa Tritan chịu nhiệt từ -10°C đến 100°C an toàn sức khỏe 100%. Nắp bật một chạm kèm khóa an toàn chống tràn nước khi mang đi tập gym, leo núi hay đạp xe.",
    price: 195000,
    originalPrice: 280000,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"],
    category: "Thể thao",
    brand: "FitLife",
    badge: "Best Seller",
    stock: 130,
    sold: 3100,
    rating: 4.9,
    reviewCount: 650,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Chuyển Màu Xanh - Hồng Gradient", "Đen Mờ Nhám Thể Thao", "Trắng Băng Tuyết"],
      sizes: ["Dung tích 1500ml (Kèm Ống Hút Silicone)"],
    },
    specifications: [
      { label: "Chất liệu", value: "Nhựa Eastman Tritan nhập khẩu Mỹ không chứa BPA" },
      { label: "Khóa chống rò", value: "Gioăng silicone 360 độ dốc ngược không rỉ nước" },
    ],
    reviews: [],
  },
  {
    _id: "prod_52",
    id: "prod_52",
    name: "Lều Cắm Trại Tự Bung Thủy Lực 4-6 Người Chống Mưa Chống Tia UV Hai Lớp Thoáng Khí",
    slug: "leu-cam-trai-tu-bung-thuy-luc-4-6-nguoi",
    description: "Cơ chế lò xo thủy lực tự bung chỉ mất 3 giây để dựng lều. Vải Oxford 210D phủ bạc PU3000mm chống mưa dông xối xả, kèm 4 cửa lưới chống côn trùng đón gió mát rượi.",
    price: 980000,
    originalPrice: 1450000,
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"],
    category: "Thể thao",
    brand: "OutdoorPro",
    badge: "Hot Deal",
    stock: 30,
    sold: 410,
    rating: 4.92,
    reviewCount: 105,
    isMall: true,
    isFastDelivery: true,
    shopId: "shop_01",
    shopName: "Thời Trang GenZ",
    shopRating: 4.9,
    shopResponseRate: 98,
    variants: {
      colors: ["Xanh Rêu Quân Đội Dã Ngoại", "Xanh Dương Phối Bạc"],
      sizes: ["Kích thước lớn 215cm x 215cm x 142cm (4-6 người nằm thoải mái)"],
    },
    specifications: [
      { label: "Khung lều", value: "Sợi thủy tinh 8.5mm đàn hồi chịu gió cấp 6" },
      { label: "Chống nước", value: "Vải 210D tráng keo đáy Oxford chống thấm ngược" },
      { label: "Phụ kiện kèm", value: "Bộ cọc đất, dây chằng chống gió và túi đựng xách tay" },
    ],
    reviews: [],
  },
  {
    "_id": "prod_53",
    "id": "prod_53",
    "name": "Set 3 Áo Polo Nam Phối Bo Cổ Dệt Tổ Ong Thoáng Khí Chống Nhăn Cao Cấp",
    "slug": "set-3-ao-polo-nam-phoi-bo-co",
    "description": "Bộ 3 áo thun có cổ polo chất liệu sợi gai dệt tổ ong pique cotton siêu thoáng khí, co giãn 4 chiều, giữ form cổ áo đứng dáng sau 100 lần giặt.",
    "price": 389000,
    "originalPrice": 599000,
    "image": "https://images.unsplash.com/photo-1625910513413-5bc217482fc6?w=800",
    "images": [
      "https://images.unsplash.com/photo-1625910513413-5bc217482fc6?w=800"
    ],
    "category": "Thời trang",
    "brand": "GenZ Casual",
    "badge": "Best Seller",
    "stock": 85,
    "sold": 1420,
    "rating": 4.88,
    "reviewCount": 310,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_01",
    "shopName": "Thời Trang GenZ Official",
    "shopRating": 4.9,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Set 3 Màu: Đen, Trắng, Navy",
        "Set 3 Màu: Xám, Be, Rêu"
      ],
      "sizes": [
        "M (50-62kg)",
        "L (63-72kg)",
        "XL (73-82kg)",
        "XXL (83-95kg)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "95% Cotton Pique dệt tổ ong + 5% Spandex"
      },
      {
        "label": "Xuất xứ",
        "value": "Việt Nam xuất khẩu"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_54",
    "id": "prod_54",
    "name": "Quần Jean Nam Ống Suông Baggy Denim Cotton Dày Dặn Co Giãn Nhẹ Form Rộng",
    "slug": "quan-jean-nam-ong-suong-baggy",
    "description": "Thiết kế ống rộng trendy phong cách Hàn Quốc, chất vải jean denim 13oz bền chắc, xử lý wash màu tự nhiên không phai, túi sâu tiện lợi.",
    "price": 320000,
    "originalPrice": 480000,
    "image": "https://images.unsplash.com/photo-1542272604-780c96856592?w=800",
    "images": [
      "https://images.unsplash.com/photo-1542272604-780c96856592?w=800"
    ],
    "category": "Thời trang",
    "brand": "GenZ Casual",
    "badge": "Hot Deal",
    "stock": 60,
    "sold": 890,
    "rating": 4.85,
    "reviewCount": 215,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_01",
    "shopName": "Thời Trang GenZ Official",
    "shopRating": 4.9,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Xanh Nhạt Vintage",
        "Xanh Đậm Classic",
        "Đen Khói Retro"
      ],
      "sizes": [
        "29",
        "30",
        "31",
        "32",
        "34"
      ]
    },
    "specifications": [
      {
        "label": "Vải",
        "value": "100% Cotton Denim dệt thoi"
      },
      {
        "label": "Kiểu dáng",
        "value": "Baggy ống suông thoải mái"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_55",
    "id": "prod_55",
    "name": "Đầm Nữ Dáng Xòe Voan Hoa Nhí Cổ Vuông Tiểu Thư Dự Tiệc Sang Trọng 2 Lớp",
    "slug": "dam-nu-dang-xoe-voan-hoa-nhi",
    "description": "Chất voan tơ Hàn Quốc mềm bay nhẹ nhàng, lót trong kín đáo, tay bồng nhẹ che khuyết điểm bắp tay, tôn vòng eo thon gọn.",
    "price": 349000,
    "originalPrice": 520000,
    "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800",
    "images": [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800"
    ],
    "category": "Thời trang",
    "brand": "Flora Studio",
    "badge": "Amazon's Choice",
    "stock": 45,
    "sold": 630,
    "rating": 4.92,
    "reviewCount": 178,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_01",
    "shopName": "Thời Trang GenZ Official",
    "shopRating": 4.9,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Hoa Nhí Vàng Mơ",
        "Hoa Nhí Xanh Pastel",
        "Hoa Nhí Trắng Hồng"
      ],
      "sizes": [
        "S (40-48kg)",
        "M (49-55kg)",
        "L (56-62kg)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "Voan tơ tằm nhân tạo kèm lót lụa habutai"
      },
      {
        "label": "Dài váy",
        "value": "105cm qua gối tiểu thư"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_56",
    "id": "prod_56",
    "name": "Áo Len Dệt Kim Nữ Cổ Lọ Thu Đông Giữ Nhiệt Phong Cách Ulzzang Hàn Quốc",
    "slug": "ao-len-det-kim-nu-co-lo",
    "description": "Sợi len dệt kim tơ tằm nhân tạo siêu mềm mịn, không gây ngứa ngáy hay dặm ngứa da, cổ lọ 3cm ấm áp và thanh lịch.",
    "price": 245000,
    "originalPrice": 380000,
    "image": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    "images": [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"
    ],
    "category": "Thời trang",
    "brand": "GenZ Casual",
    "badge": "Hot Deal",
    "stock": 70,
    "sold": 1120,
    "rating": 4.86,
    "reviewCount": 290,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_01",
    "shopName": "Thời Trang GenZ Official",
    "shopRating": 4.9,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Trắng Sữa",
        "Nâu Mocha",
        "Xám Khói",
        "Đen Huyền"
      ],
      "sizes": [
        "Freesize (42-60kg)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "Len dệt kim giữ nhiệt chống co giãn"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_57",
    "id": "prod_57",
    "name": "Set Bộ Đồ Ngủ Lụa Satin Cao Cấp Mềm Mịn Thoáng Mát Phối Viền Ren Quý Phái",
    "slug": "set-bo-do-ngu-lua-satin",
    "description": "Chất liệu lụa Satin cao cấp bóng mượt, đường may tỉ mỉ, cạp quần chun co giãn thoải mái cho giấc ngủ trọn vẹn cả đêm.",
    "price": 289000,
    "originalPrice": 420000,
    "image": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"
    ],
    "category": "Thời trang",
    "brand": "Flora Studio",
    "badge": "Best Seller",
    "stock": 50,
    "sold": 740,
    "rating": 4.9,
    "reviewCount": 165,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_01",
    "shopName": "Thời Trang GenZ Official",
    "shopRating": 4.9,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Hồng Phấn Ánh Kim",
        "Xanh Rêu Luxury",
        "Đỏ Rượu Vang"
      ],
      "sizes": [
        "M (42-52kg)",
        "L (53-62kg)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "100% Lụa Satin cao cấp 19 momme"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_58",
    "id": "prod_58",
    "name": "Chuột Không Dây Gaming Siêu Nhẹ 58g Cảm Biến PixArt 26.000 DPI Tần Số 1000Hz",
    "slug": "chuot-khong-day-gaming-sieu-nhe-58g",
    "description": "Trọng lượng chỉ 58g tối ưu vẩy chuột esports, switch quang học 80 triệu lần nhấn chống double click, kết nối không độ trễ 2.4G và Bluetooth.",
    "price": 890000,
    "originalPrice": 1290000,
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800",
    "images": [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800"
    ],
    "category": "Điện tử",
    "brand": "TechWorld Pro",
    "badge": "Hot Deal",
    "stock": 40,
    "sold": 520,
    "rating": 4.95,
    "reviewCount": 142,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_02",
    "shopName": "TechWorld Store",
    "shopRating": 4.8,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Trắng Tuyết Arctic",
        "Đen Nhám Carbon"
      ],
      "sizes": [
        "Form tay đối xứng vừa và nhỏ"
      ]
    },
    "specifications": [
      {
        "label": "Cảm biến",
        "value": "PixArt PAW3395 (26.000 DPI)"
      },
      {
        "label": "Pin",
        "value": "300mAh chơi liên tục 80 giờ"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_59",
    "id": "prod_59",
    "name": "Bàn Phím Cơ Không Dây 3 Chế Độ Bluetooth 5.1/2.4G/Type-C Hotswap Led RGB",
    "slug": "ban-phim-co-khong-day-3-che-do",
    "description": "Layout 75% 82 phím gọn gàng, gasket mount êm ái tiêu âm cực tốt, mạch xuôi hotswap 5 pin thay switch dễ dàng, keycap PBT doubleshot.",
    "price": 1190000,
    "originalPrice": 1650000,
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    "images": [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"
    ],
    "category": "Điện tử",
    "brand": "TechWorld Pro",
    "badge": "Best Seller",
    "stock": 35,
    "sold": 480,
    "rating": 4.93,
    "reviewCount": 168,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_02",
    "shopName": "TechWorld Store",
    "shopRating": 4.8,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Retro Grey Tone",
        "Navy White Vintage"
      ],
      "sizes": [
        "Linear Yellow Switch (Êm)",
        "Tactile Brown Switch (Có khấc)"
      ]
    },
    "specifications": [
      {
        "label": "Cấu trúc",
        "value": "Gasket Mount 5 lớp lót tiêu âm"
      },
      {
        "label": "Pin",
        "value": "4000mAh thời lượng 200 giờ"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_60",
    "id": "prod_60",
    "name": "Màn Hình Gaming Cong 27 Inch 2K QHD 165Hz IPS 1ms HDR400 Tràn Viền",
    "slug": "man-hinh-gaming-cong-27-inch-2k",
    "description": "Độ cong 1500R ôm trọn tầm nhìn mắt, tấm nền Fast IPS góc rộng 178 độ sắc nét, dải màu 100% sRGB hỗ trợ thiết kế đồ họa và chơi game mượt mà.",
    "price": 3990000,
    "originalPrice": 5200000,
    "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    "images": [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800"
    ],
    "category": "Điện tử",
    "brand": "ViewTech",
    "badge": "Amazon's Choice",
    "stock": 25,
    "sold": 310,
    "rating": 4.91,
    "reviewCount": 94,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_02",
    "shopName": "TechWorld Store",
    "shopRating": 4.8,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Đen Gaming Matte"
      ],
      "sizes": [
        "27 Inch 2K 165Hz"
      ]
    },
    "specifications": [
      {
        "label": "Độ phân giải",
        "value": "2560 x 1440 (2K QHD)"
      },
      {
        "label": "Cổng kết nối",
        "value": "2x HDMI 2.0, 1x DP 1.4, Audio 3.5mm"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_61",
    "id": "prod_61",
    "name": "Cáp Sạc Nhanh Đa Năng 100W Type-C Bọc Dù Siêu Bền Chống Đứt Gãy Dài 1.5M",
    "slug": "cap-sac-nhanh-da-nang-100w",
    "description": "Chip E-Marker thông minh điều tiết dòng điện an toàn, hỗ trợ sạc nhanh cho Laptop Macbook, iPad và điện thoại Android, truyền data 480Mbps.",
    "price": 135000,
    "originalPrice": 220000,
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800"
    ],
    "category": "Điện tử",
    "brand": "PowerCore",
    "badge": "Hot Deal",
    "stock": 120,
    "sold": 2150,
    "rating": 4.89,
    "reviewCount": 520,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_02",
    "shopName": "TechWorld Store",
    "shopRating": 4.8,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Đen Bện Dù Kevlar",
        "Xám Kim Loại"
      ],
      "sizes": [
        "1.5 Mét",
        "2.0 Mét"
      ]
    },
    "specifications": [
      {
        "label": "Công suất",
        "value": "Tối đa 100W (20V/5A) chuẩn PD 3.0"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_62",
    "id": "prod_62",
    "name": "Giá Đỡ Laptop Nhôm Nguyên Khối Công Thái Học Xoay 360 Độ Tản Nhiệt Hiệu Quả",
    "slug": "gia-do-laptop-nhom-nguyen-khoi",
    "description": "Hợp kim nhôm dày 4mm chắc chắn không rung lắc, mâm xoay bi 360 độ kèm âm thanh cơ học cực đã tai, chỉnh độ cao nâng niu cột sống cổ.",
    "price": 299000,
    "originalPrice": 450000,
    "image": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800",
    "images": [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800"
    ],
    "category": "Điện tử",
    "brand": "ErgoStand",
    "badge": "Best Seller",
    "stock": 65,
    "sold": 870,
    "rating": 4.94,
    "reviewCount": 230,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_02",
    "shopName": "TechWorld Store",
    "shopRating": 4.8,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Bạc Silver Ánh Kim",
        "Xám Space Grey"
      ],
      "sizes": [
        "Phù hợp Laptop 11 - 17.3 Inch"
      ]
    },
    "specifications": [
      {
        "label": "Vật liệu",
        "value": "Hợp kim nhôm Anodized cao cấp"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_63",
    "id": "prod_63",
    "name": "Serum Tinh Chất Rau Má Phục Hồi Da Mụn Dưỡng Ẩm Chuyên Sâu 50ml",
    "slug": "serum-tinh-chat-rau-ma-phuc-hoi",
    "description": "Chiết xuất 100% rau má Madagascar tinh khiết, làm dịu da tức thì, củng cố hàng rào bảo vệ da, giảm sưng viêm mụn và kiềm dầu hiệu quả.",
    "price": 320000,
    "originalPrice": 450000,
    "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
    "images": [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"
    ],
    "category": "Sắc đẹp",
    "brand": "Centella Skin",
    "badge": "Amazon's Choice",
    "stock": 90,
    "sold": 2400,
    "rating": 4.96,
    "reviewCount": 680,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_03",
    "shopName": "Beauty Cosmetics Official",
    "shopRating": 4.95,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Chai Thủy Tinh 50ml",
        "Chai Siêu Tiết Kiệm 100ml"
      ],
      "sizes": [
        "50ml",
        "100ml"
      ]
    },
    "specifications": [
      {
        "label": "Dung tích",
        "value": "50ml"
      },
      {
        "label": "Xuất xứ",
        "value": "Hàn Quốc chính ngạch"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_64",
    "id": "prod_64",
    "name": "Kem Dưỡng Ẩm Chống Lão Hóa Ban Đêm Collagen Thủy Phân & Peptide 50g",
    "slug": "kem-duong-am-chong-lao-hoa-ban-dem",
    "description": "Công thức phức hợp 5 loại Peptide quý và Hyaluronic Acid thẩm thấu sâu, tái tạo độ đàn hồi, mờ nếp nhăn li ti và cấp ẩm căng bóng sau 1 đêm.",
    "price": 395000,
    "originalPrice": 560000,
    "image": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800",
    "images": [
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800"
    ],
    "category": "Sắc đẹp",
    "brand": "LuxeDerma",
    "badge": "Best Seller",
    "stock": 55,
    "sold": 1320,
    "rating": 4.93,
    "reviewCount": 340,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_03",
    "shopName": "Beauty Cosmetics Official",
    "shopRating": 4.95,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Hũ Thủy Tinh Cao Cấp 50g"
      ],
      "sizes": [
        "50g"
      ]
    },
    "specifications": [
      {
        "label": "Thành phần",
        "value": "Collagen Thủy Phân, Niacinamide 5%, Multi-Peptide"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_65",
    "id": "prod_65",
    "name": "Son Kem Lì Mịn Môi Kháng Nước Lâu Trôi 12 Giờ Bảng Màu Trendy Hàn Quốc",
    "slug": "son-kem-li-min-moi-khang-nuoc",
    "description": "Chất son velvet tint xốp mịn như nhung, che rãnh môi hoàn hảo, không gây khô môi, hương vani dịu ngọt với bảng màu chuẩn sắc.",
    "price": 185000,
    "originalPrice": 280000,
    "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
    "images": [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800"
    ],
    "category": "Sắc đẹp",
    "brand": "GlowVelvet",
    "badge": "Hot Deal",
    "stock": 80,
    "sold": 3100,
    "rating": 4.91,
    "reviewCount": 890,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_03",
    "shopName": "Beauty Cosmetics Official",
    "shopRating": 4.95,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "#01 Đỏ Nâu Gạch Chilli",
        "#02 Cam Đất MLBB",
        "#03 Hồng Trà Sữa Nhẹ Nhàng"
      ],
      "sizes": [
        "Thỏi 4.5g"
      ]
    },
    "specifications": [
      {
        "label": "Độ bền màu",
        "value": "Lên đến 12 tiếng không dính cốc chén"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_66",
    "id": "prod_66",
    "name": "Nước Tẩy Trang Micellar Water Dịu Nhẹ Không Cồn Cho Da Nhạy Cảm 400ml",
    "slug": "nuoc-tay-trang-micellar-water",
    "description": "Công nghệ hạt micelle hút sạch dầu thừa và cặn trang điểm chống nước mà không cần chà xát mạnh, duy trì độ ẩm tự nhiên của da.",
    "price": 219000,
    "originalPrice": 320000,
    "image": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800",
    "images": [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"
    ],
    "category": "Sắc đẹp",
    "brand": "PureCleanse",
    "badge": "Amazon's Choice",
    "stock": 75,
    "sold": 1980,
    "rating": 4.94,
    "reviewCount": 410,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_03",
    "shopName": "Beauty Cosmetics Official",
    "shopRating": 4.95,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Chai Nắp Hồng (Da nhạy cảm)",
        "Chai Nắp Xanh (Da dầu mụn)"
      ],
      "sizes": [
        "400ml"
      ]
    },
    "specifications": [
      {
        "label": "Dung tích",
        "value": "400ml dùng 4-5 tháng"
      },
      {
        "label": "Tiêu chuẩn",
        "value": "Không cồn, không paraben, không hương liệu"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_67",
    "id": "prod_67",
    "name": "Mặt Nạ Đất Sét Khoáng Hút Sạch Dầu Thừa Se Khít Lỗ Chân Lông Tro Núi Lửa 100g",
    "slug": "mat-na-dat-set-khoang-tro-nui-lua",
    "description": "Chiết xuất bùn khoáng tro núi lửa Jeju hấp thụ bã nhờn sâu trong lỗ chân lông, tẩy tế bào chết dịu nhẹ và ngăn ngừa mụn đầu đen.",
    "price": 245000,
    "originalPrice": 350000,
    "image": "https://images.unsplash.com/photo-1567928805192-d35d641494b8?w=800",
    "images": [
      "https://images.unsplash.com/photo-1567928805192-d35d641494b8?w=800"
    ],
    "category": "Sắc đẹp",
    "brand": "PureCleanse",
    "badge": "Hot Deal",
    "stock": 60,
    "sold": 1450,
    "rating": 4.88,
    "reviewCount": 312,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_03",
    "shopName": "Beauty Cosmetics Official",
    "shopRating": 4.95,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Hũ Đất Sét Khoáng 100g"
      ],
      "sizes": [
        "100g tặng cọ quét mặt nạ"
      ]
    },
    "specifications": [
      {
        "label": "Thành phần",
        "value": "Bột tro núi lửa, đất sét bentonite, chiết xuất rau má"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_68",
    "id": "prod_68",
    "name": "Máy Lọc Không Khí Kháng Khuẩn Bụi Mịn PM2.5 Ion Âm Cảm Biến Thông Minh",
    "slug": "may-loc-khong-khi-khang-khuan-pm25",
    "description": "Màng lọc HEPA H13 lọc sạch 99.97% hạt bụi siêu mịn và vi khuẩn, diện tích sử dụng 35-50m2, màn hình cảm ứng LED hiển thị chỉ số không khí theo thời gian thực.",
    "price": 1890000,
    "originalPrice": 2600000,
    "image": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
    "images": [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800"
    ],
    "category": "Gia dụng",
    "brand": "HomePro",
    "badge": "Hot Deal",
    "stock": 30,
    "sold": 380,
    "rating": 4.93,
    "reviewCount": 115,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_04",
    "shopName": "HomePro Gia Dụng Thông Minh",
    "shopRating": 4.88,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Trắng Ngọc Trai Tối Giản"
      ],
      "sizes": [
        "Công suất lọc CADR 380m3/h"
      ]
    },
    "specifications": [
      {
        "label": "Độ ồn",
        "value": "Chế độ ngủ chỉ 28dB cực êm"
      },
      {
        "label": "Bảo hành",
        "value": "24 tháng chính hãng"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_69",
    "id": "prod_69",
    "name": "Nồi Cơm Điện Cao Tần IH 1.8L Lòng Nồi Hợp Kim 8 Lớp Chống Dính Chuẩn Nhật",
    "slug": "noi-com-dien-cao-tan-ih-18l",
    "description": "Công nghệ đốt nóng cảm ứng từ IH nhiệt lượng lan tỏa 360 độ hạt cơm chín đều dẻo ngọt, 12 chế độ nấu tự động: cơm gạo lứt, cháo dinh dưỡng, làm bánh.",
    "price": 1590000,
    "originalPrice": 2250000,
    "image": "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800",
    "images": [
      "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800"
    ],
    "category": "Gia dụng",
    "brand": "HomePro",
    "badge": "Best Seller",
    "stock": 25,
    "sold": 490,
    "rating": 4.95,
    "reviewCount": 138,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_04",
    "shopName": "HomePro Gia Dụng Thông Minh",
    "shopRating": 4.88,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Đen Titan Ánh Kim"
      ],
      "sizes": [
        "Dung tích 1.8L (4-8 người ăn)"
      ]
    },
    "specifications": [
      {
        "label": "Công nghệ",
        "value": "Gia nhiệt IH cảm ứng từ trường"
      },
      {
        "label": "Lòng nồi",
        "value": "Hợp kim đúc dày 3mm tráng men kim cương"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_70",
    "id": "prod_70",
    "name": "Máy Hút Bụi Cầm Tay Không Dây Lực Hút 25.000Pa Lọc HEPA Pin Rời Siêu Nhẹ",
    "slug": "may-hut-bui-cam-tay-khong-day",
    "description": "Động cơ không chổi than tốc độ cao 100.000 vòng/phút, lực hút bão táp 25.000Pa hút sạch bụi mịn thảm sofa, đầu hút đa năng 4 trong 1 linh hoạt.",
    "price": 1750000,
    "originalPrice": 2490000,
    "image": "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
    "images": [
      "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"
    ],
    "category": "Gia dụng",
    "brand": "HomePro",
    "badge": "Amazon's Choice",
    "stock": 28,
    "sold": 340,
    "rating": 4.9,
    "reviewCount": 96,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_04",
    "shopName": "HomePro Gia Dụng Thông Minh",
    "shopRating": 4.88,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Xám Bạc Phối Đỏ Sport"
      ],
      "sizes": [
        "Trọng lượng thân máy 1.4kg"
      ]
    },
    "specifications": [
      {
        "label": "Lực hút",
        "value": "25.000Pa"
      },
      {
        "label": "Pin",
        "value": "Lithium 2500mAh dùng 45 phút liên tục"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_71",
    "id": "prod_71",
    "name": "Quạt Tháp Không Cánh Tạo Ion Mát Lạnh Êm Ái Điều Khiển Từ Xa 9 Cấp Gió",
    "slug": "quat-thap-khong-canh-tao-ion",
    "description": "Thiết kế không cánh an toàn tuyệt đối cho trẻ nhỏ và thú cưng, luồng gió mềm tự nhiên góc xoay 90 độ, chế độ hẹn giờ thông minh 12 tiếng.",
    "price": 1350000,
    "originalPrice": 1950000,
    "image": "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800",
    "images": [
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800"
    ],
    "category": "Gia dụng",
    "brand": "HomePro",
    "badge": "Hot Deal",
    "stock": 35,
    "sold": 410,
    "rating": 4.87,
    "reviewCount": 110,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_04",
    "shopName": "HomePro Gia Dụng Thông Minh",
    "shopRating": 4.88,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Trắng Sứ Tối Giản",
        "Đen Huyền Bí"
      ],
      "sizes": [
        "Chiều cao 105cm"
      ]
    },
    "specifications": [
      {
        "label": "Công suất",
        "value": "45W tiết kiệm điện"
      },
      {
        "label": "Độ ồn",
        "value": "Dưới 35dB cực êm"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_72",
    "id": "prod_72",
    "name": "Ấm Đun Nước Siêu Tốc Thủy Tinh Giữ Nhiệt Đèn LED Cảm Ứng 1.7L Thông Minh",
    "slug": "am-dun-nuoc-sieu-toc-thuy-tinh",
    "description": "Thủy tinh Borosilicate chịu nhiệt độ cao 200 độ C không thôi nhiễm chất độc hại, đèn LED đổi màu theo nhiệt độ, tính năng giữ ấm 40-90 độ C pha sữa, pha trà.",
    "price": 360000,
    "originalPrice": 520000,
    "image": "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800",
    "images": [
      "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800"
    ],
    "category": "Gia dụng",
    "brand": "HomePro",
    "badge": "Best Seller",
    "stock": 70,
    "sold": 1100,
    "rating": 4.92,
    "reviewCount": 260,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_04",
    "shopName": "HomePro Gia Dụng Thông Minh",
    "shopRating": 4.88,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Thủy Tinh Trong Suốt Viền Inox 304"
      ],
      "sizes": [
        "Dung tích 1.7L"
      ]
    },
    "specifications": [
      {
        "label": "Công suất",
        "value": "1850W đun sôi chỉ 3 phút"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_73",
    "id": "prod_73",
    "name": "Bộ 5 Dây Kháng Lực Đàn Hồi Tập Gym Yoga Full Body Đa Năng Cao Cấp Kèm Túi",
    "slug": "bo-5-day-khang-luc-dan-hoi",
    "description": "Chất liệu cao su tự nhiên 100% siêu dai không đứt, 5 mức kháng lực từ 10 lbs đến 50 lbs phù hợp tập luyện mông đùi, cánh tay và ngực tại nhà.",
    "price": 149000,
    "originalPrice": 250000,
    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
    "images": [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800"
    ],
    "category": "Thể thao",
    "brand": "SportZone",
    "badge": "Best Seller",
    "stock": 110,
    "sold": 3400,
    "rating": 4.91,
    "reviewCount": 780,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_05",
    "shopName": "SportZone Thể Thao & Dã Ngoại",
    "shopRating": 4.91,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Set 5 Dây Gradient Màu"
      ],
      "sizes": [
        "Trọn bộ 5 dây + Túi rút bảo quản"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "Cao su latex tự nhiên thân thiện môi trường"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_74",
    "id": "prod_74",
    "name": "Thảm Tập Yoga Định Tuyến Chống Trượt TPE 2 Lớp Dày 8mm Kèm Dây Buộc & Túi Đựng",
    "slug": "tham-tap-yoga-dinh-tuyen-chong-truot",
    "description": "Đường kẻ định tuyến chuẩn xác giúp người mới tập đúng tư thế, bề mặt vân kim cương bám dính tuyệt hảo chống trơn trượt mồ hôi, êm ái bảo vệ khớp gối.",
    "price": 265000,
    "originalPrice": 390000,
    "image": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    "images": [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"
    ],
    "category": "Thể thao",
    "brand": "SportZone",
    "badge": "Amazon's Choice",
    "stock": 80,
    "sold": 1850,
    "rating": 4.95,
    "reviewCount": 420,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_05",
    "shopName": "SportZone Thể Thao & Dã Ngoại",
    "shopRating": 4.91,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Xanh Rêu Pastel",
        "Hồng Tím Lavender",
        "Xanh Biển Tươi Mát"
      ],
      "sizes": [
        "183cm x 61cm x 8mm"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "TPE nguyên sinh không mùi an toàn"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_75",
    "id": "prod_75",
    "name": "Vợt Cầu Lông Carbon Khung Siêu Nhẹ 4U Căng Sẵn 10.5kg Kèm Bao Đựng Vợt",
    "slug": "vot-cau-long-carbon-khung-sieu-nhe",
    "description": "Thân vợt dẻo trợ lực tối đa cho những cú đập cầu uy lực và phòng thủ linh hoạt, khung khí động học vát cạnh cản gió tối ưu tốc độ vung vợt.",
    "price": 490000,
    "originalPrice": 750000,
    "image": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800",
    "images": [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"
    ],
    "category": "Thể thao",
    "brand": "SportZone",
    "badge": "Hot Deal",
    "stock": 50,
    "sold": 920,
    "rating": 4.93,
    "reviewCount": 235,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_05",
    "shopName": "SportZone Thể Thao & Dã Ngoại",
    "shopRating": 4.91,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Trắng Cam Năng Động",
        "Đen Vàng Hoàng Gia"
      ],
      "sizes": [
        "Trọng lượng 4U (82-84g)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "High Carbon Fiber siêu bền"
      },
      {
        "label": "Sức căng",
        "value": "Căng sẵn cước 10.5kg (Chịu lực tối đa 13kg)"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_76",
    "id": "prod_76",
    "name": "Giày Chạy Bộ Nam Nữ Siêu Nhẹ Đệm Khí Êm Chân Thoáng Khí Kháng Khuẩn",
    "slug": "giay-chay-bo-sieu-nhe-dem-khi",
    "description": "Đế đệm khí Air-Cushion đàn hồi hấp thụ xung lực khi tiếp đất, vải dệt Flyknit ôm sát bàn chân thoáng khí mát mẻ, đế ngoài cao su ma sát chống trượt.",
    "price": 520000,
    "originalPrice": 790000,
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
    ],
    "category": "Thể thao",
    "brand": "SportZone",
    "badge": "Best Seller",
    "stock": 65,
    "sold": 1420,
    "rating": 4.89,
    "reviewCount": 360,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_05",
    "shopName": "SportZone Thể Thao & Dã Ngoại",
    "shopRating": 4.91,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Đỏ Phối Trắng Thể Thao",
        "Đen Full Black",
        "Xám Trắng Phản Quang"
      ],
      "sizes": [
        "38",
        "39",
        "40",
        "41",
        "42",
        "43",
        "44"
      ]
    },
    "specifications": [
      {
        "label": "Đế giày",
        "value": "Phylong đệm khí Air kết hợp cao su tự nhiên"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_77",
    "id": "prod_77",
    "name": "Con Lăn Tập Cơ Bụng 4 Bánh Có Lò Xo Trợ Lực Tự Thu Hồi Kèm Đệm Gối",
    "slug": "con-lan-tap-co-bung-4-banh",
    "description": "Cơ chế lò xo carbon trợ lực tự động kéo về giúp bài tập gập bụng an toàn, không lo sụp hông hay đau lưng dưới, tay cầm bọc mút êm ái chống chai tay.",
    "price": 219000,
    "originalPrice": 340000,
    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
    "images": [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800"
    ],
    "category": "Thể thao",
    "brand": "SportZone",
    "badge": "Hot Deal",
    "stock": 75,
    "sold": 1670,
    "rating": 4.9,
    "reviewCount": 310,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_05",
    "shopName": "SportZone Thể Thao & Dã Ngoại",
    "shopRating": 4.91,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Cam Đen Thể Thao",
        "Xanh Dương Dynamic"
      ],
      "sizes": [
        "Trọn bộ con lăn + Thảm lót gối"
      ]
    },
    "specifications": [
      {
        "label": "Tải trọng",
        "value": "Chịu lực lên đến 200kg"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_78",
    "id": "prod_78",
    "name": "Hạt Dinh Dưỡng Hỗn Hợp Macca Hạnh Nhân Óc Chó Nho Khô Hũ 500g Chuẩn Organic",
    "slug": "hat-dinh-duong-hon-hop-organic",
    "description": "Sấy mộc không đường không muối bảo toàn trọn vẹn vị béo ngậy giòn rụm tự nhiên, giàu Omega-3, vitamin E và khoáng chất tốt cho tim mạch và mẹ bầu.",
    "price": 185000,
    "originalPrice": 280000,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    "images": [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
    ],
    "category": "Đời sống",
    "brand": "GreenFarm",
    "badge": "Best Seller",
    "stock": 150,
    "sold": 3800,
    "rating": 4.97,
    "reviewCount": 920,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_06",
    "shopName": "GreenFarm Nông Sản & Organic Sạch",
    "shopRating": 4.96,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Hũ Nắp Nhôm 500g",
        "Combo 2 Hũ 1000g Tiết Kiệm"
      ],
      "sizes": [
        "500g",
        "1kg"
      ]
    },
    "specifications": [
      {
        "label": "Thành phần",
        "value": "Hạt Macca Đắk Lắk, Hạnh nhân Mỹ, Óc chó vàng, Nho khô Chile"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_79",
    "id": "prod_79",
    "name": "Trà Thảo Mộc Hoa Cúc Gạo Lứt Xạ Đen Thanh Nhiệt Giải Độc Ngủ Ngon Túi 30 Gói",
    "slug": "tra-thao-moc-hoa-cuc-gao-lut",
    "description": "Sự kết hợp giữa gạo lứt huyết rồng sao vàng, hoa cúc kim ngân, xạ đen và cỏ ngọt tạo nên tách trà thơm dịu thanh mát giúp an thần ngủ sâu giấc.",
    "price": 125000,
    "originalPrice": 190000,
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800",
    "images": [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800"
    ],
    "category": "Đời sống",
    "brand": "GreenFarm",
    "badge": "Amazon's Choice",
    "stock": 120,
    "sold": 2900,
    "rating": 4.94,
    "reviewCount": 650,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_06",
    "shopName": "GreenFarm Nông Sản & Organic Sạch",
    "shopRating": 4.96,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Túi Zip 30 Gói Lọc Tam Giác"
      ],
      "sizes": [
        "Túi 450g"
      ]
    },
    "specifications": [
      {
        "label": "Hạn sử dụng",
        "value": "18 tháng kể từ ngày sản xuất"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_80",
    "id": "prod_80",
    "name": "Mật Ong Hoa Rừng Tự Nhiên Nguyên Chất 100% Chai Thủy Tinh 1000ml",
    "slug": "mat-ong-hoa-rung-tu-nhien-nguyen-chat",
    "description": "Mật ong tự nhiên thu hoạch từ hoa rừng cao nguyên đại ngàn, sánh đặc màu cánh gián thơm ngát, hàm lượng đường tự nhiên cao không bị kết tinh đường giả.",
    "price": 240000,
    "originalPrice": 350000,
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800",
    "images": [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800"
    ],
    "category": "Đời sống",
    "brand": "GreenFarm",
    "badge": "Hot Deal",
    "stock": 90,
    "sold": 2100,
    "rating": 4.96,
    "reviewCount": 540,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_06",
    "shopName": "GreenFarm Nông Sản & Organic Sạch",
    "shopRating": 4.96,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Chai Thủy Tinh 1000ml"
      ],
      "sizes": [
        "1 Lít (khoảng 1.35kg)"
      ]
    },
    "specifications": [
      {
        "label": "Độ ẩm",
        "value": "Dưới 19% tiêu chuẩn xuất khẩu"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_81",
    "id": "prod_81",
    "name": "Hạt Chia Đen Hữu Cơ Nam Mỹ Giàu Omega-3 & Chất Xơ Gói 500g Nhập Khẩu",
    "slug": "hat-chia-den-huu-co-nam-my",
    "description": "100% hạt chia hữu cơ nhập khẩu Nam Mỹ, hỗ trợ tiêu hóa tốt, tạo cảm giác no lâu hỗ trợ chế độ ăn kiêng eat clean giữ dáng thon gọn.",
    "price": 135000,
    "originalPrice": 200000,
    "image": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    "images": [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800"
    ],
    "category": "Đời sống",
    "brand": "GreenFarm",
    "badge": "Best Seller",
    "stock": 80,
    "sold": 1780,
    "rating": 4.92,
    "reviewCount": 380,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_06",
    "shopName": "GreenFarm Nông Sản & Organic Sạch",
    "shopRating": 4.96,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Túi Hút Chân Không 500g"
      ],
      "sizes": [
        "500g"
      ]
    },
    "specifications": [
      {
        "label": "Chứng nhận",
        "value": "USDA Organic & EU Organic"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_82",
    "id": "prod_82",
    "name": "Tinh Bột Nghệ Vàng Nguyên Chất Tách Tinh Dầu Curcumin Hũ 500g",
    "slug": "tinh-bot-nghe-vang-nguyen-chat",
    "description": "Nghệ tươi Nghệ An được lọc bỏ tạp chất và dầu nghệ chống nóng trong, hạt tinh nghệ siêu mịn tan hoàn toàn trong nước ấm, hỗ trợ dạ dày và sáng đẹp da.",
    "price": 195000,
    "originalPrice": 300000,
    "image": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800",
    "images": [
      "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800"
    ],
    "category": "Đời sống",
    "brand": "GreenFarm",
    "badge": "Hot Deal",
    "stock": 60,
    "sold": 1250,
    "rating": 4.93,
    "reviewCount": 290,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_06",
    "shopName": "GreenFarm Nông Sản & Organic Sạch",
    "shopRating": 4.96,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Hũ Nhựa Nắp Nhôm 500g"
      ],
      "sizes": [
        "500g"
      ]
    },
    "specifications": [
      {
        "label": "Hàm lượng Curcumin",
        "value": "Cao gấp 3 lần nghệ thông thường"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_83",
    "id": "prod_83",
    "name": "Sách Đắc Nhân Tâm - Nghệ Thuật Thu Phục Lòng Người Bản Bìa Cứng Độc Quyền",
    "slug": "sach-dac-nhan-tam-bia-cung",
    "description": "Tác phẩm kinh điển vượt thời gian của Dale Carnegie về giao tiếp ứng xử, bản in chất lượng cao trên giấy xốp Phần Lan chống mỏi mắt.",
    "price": 98000,
    "originalPrice": 148000,
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
    "images": [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"
    ],
    "category": "Đời sống",
    "brand": "First News",
    "badge": "Best Seller",
    "stock": 200,
    "sold": 5600,
    "rating": 4.98,
    "reviewCount": 1450,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_07",
    "shopName": "Tri Thức BookStore & Văn Phòng Phẩm",
    "shopRating": 4.94,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Bản Bìa Cứng Ánh Vàng",
        "Bản Bìa Mềm Tiêu Chuẩn"
      ],
      "sizes": [
        "Khổ 14.5 x 20.5 cm"
      ]
    },
    "specifications": [
      {
        "label": "Số trang",
        "value": "320 trang"
      },
      {
        "label": "NXB",
        "value": "NXB Tổng Hợp TP.HCM"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_84",
    "id": "prod_84",
    "name": "Sách Tư Duy Nhanh Và Chậm (Thinking, Fast and Slow) Tái Bản Đặc Biệt",
    "slug": "sach-tu-duy-nhanh-va-cham",
    "description": "Kiệt tác của nhà tâm lý học đoạt giải Nobel Daniel Kahneman giải mã hai hệ thống vận hành trong não bộ con người khi ra quyết định kinh tế.",
    "price": 175000,
    "originalPrice": 250000,
    "image": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    "images": [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800"
    ],
    "category": "Đời sống",
    "brand": "Alpha Books",
    "badge": "Amazon's Choice",
    "stock": 90,
    "sold": 2100,
    "rating": 4.95,
    "reviewCount": 620,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_07",
    "shopName": "Tri Thức BookStore & Văn Phòng Phẩm",
    "shopRating": 4.94,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Bìa Mềm Giấy Dày"
      ],
      "sizes": [
        "612 trang"
      ]
    },
    "specifications": [
      {
        "label": "Tác giả",
        "value": "Daniel Kahneman"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_85",
    "id": "prod_85",
    "name": "Sổ Tay Bìa Da Khóa Nam Châm Cao Cấp Kèm Bút Ký Kim Loại Hộp Quà Sang Trọng",
    "slug": "so-tay-bia-da-khoa-nam-cham",
    "description": "Chất da PU mềm mịn chống thấm nước, giấy kẻ ngang 100gsm dày dặn không thấm mực bút máy, kèm bút ký kim loại khắc hoa văn mạ vàng tinh xảo.",
    "price": 169000,
    "originalPrice": 250000,
    "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800",
    "images": [
      "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800"
    ],
    "category": "Đời sống",
    "brand": "LuxeNote",
    "badge": "Hot Deal",
    "stock": 80,
    "sold": 1450,
    "rating": 4.91,
    "reviewCount": 310,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_07",
    "shopName": "Tri Thức BookStore & Văn Phòng Phẩm",
    "shopRating": 4.94,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Xanh Navy Doanh Nhân",
        "Đen Quý Phái",
        "Nâu Da Bò Cổ Điển"
      ],
      "sizes": [
        "Khổ A5 (200 trang)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu giấy",
        "value": "Giấy Dowling chống mỏi mắt 100gsm"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_86",
    "id": "prod_86",
    "name": "Bộ 12 Bút Gel Mực Đen Ngòi 0.5mm Nét Mịn Không Lem Chuẩn Học Sinh Sinh Viên",
    "slug": "bo-12-but-gel-muc-den",
    "description": "Mực gel gốc nước cao cấp ra đều êm tay không đứt nét, khô nhanh trong 1 giây không lem khi quẹt tay, thân bút đệm cao su êm ái chống mỏi tay.",
    "price": 49000,
    "originalPrice": 85000,
    "image": "https://images.unsplash.com/photo-1585336261026-621532f1a5f4?w=800",
    "images": [
      "https://images.unsplash.com/photo-1585336261026-621532f1a5f4?w=800"
    ],
    "category": "Đời sống",
    "brand": "Deli Stationery",
    "badge": "Best Seller",
    "stock": 300,
    "sold": 7200,
    "rating": 4.89,
    "reviewCount": 1680,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_07",
    "shopName": "Tri Thức BookStore & Văn Phòng Phẩm",
    "shopRating": 4.94,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Hộp 12 Bút Mực Đen",
        "Hộp 12 Bút Mực Xanh"
      ],
      "sizes": [
        "Ngòi kim 0.5mm"
      ]
    },
    "specifications": [
      {
        "label": "Số lượng",
        "value": "12 cây / hộp"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_87",
    "id": "prod_87",
    "name": "Balo Đựng Laptop 15.6 Inch Chống Thấm Nước Có Cổng Sạc USB Văn Phòng Nam Nữ",
    "slug": "balo-dung-laptop-156-inch",
    "description": "Vải Oxford 900D chống xước và kháng nước mưa tuyệt đối, ngăn chống sốc đệm tổ ong bảo vệ máy tính an toàn, quai đeo trợ lực giảm 30% áp lực vai.",
    "price": 350000,
    "originalPrice": 550000,
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    "images": [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"
    ],
    "category": "Đời sống",
    "brand": "Tigernu",
    "badge": "Amazon's Choice",
    "stock": 60,
    "sold": 1390,
    "rating": 4.93,
    "reviewCount": 380,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_07",
    "shopName": "Tri Thức BookStore & Văn Phòng Phẩm",
    "shopRating": 4.94,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Xám Khói Hiện Đại",
        "Đen Carbon Doanh Nhân"
      ],
      "sizes": [
        "Kích thước 45 x 31 x 16cm"
      ]
    },
    "specifications": [
      {
        "label": "Tương thích",
        "value": "Laptop 13 đến 16 inch"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_88",
    "id": "prod_88",
    "name": "Bơm Lốp Ô Tô Điện Tử Tự Ngắt Cầm Tay Không Dây 150 PSI Kèm Đèn LED Khẩn Cấp",
    "slug": "bom-lop-o-to-dien-tu-tu-ngat",
    "description": "Tự động ngắt khi đạt áp suất cài đặt chính xác, bơm căng lốp xe chỉ trong 3 phút, tích hợp đèn pin cứu hộ SOS và pin dự phòng sạc điện thoại.",
    "price": 490000,
    "originalPrice": 750000,
    "image": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    "images": [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"
    ],
    "category": "Đời sống",
    "brand": "AutoPro Gear",
    "badge": "Hot Deal",
    "stock": 50,
    "sold": 980,
    "rating": 4.92,
    "reviewCount": 260,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_08",
    "shopName": "AutoPro Phụ Kiện Ô Tô Xe Máy",
    "shopRating": 4.87,
    "shopResponseRate": 97,
    "variants": {
      "colors": [
        "Đen Nhám Cầm Tay Không Dây"
      ],
      "sizes": [
        "Pin sạc 6000mAh"
      ]
    },
    "specifications": [
      {
        "label": "Áp suất tối đa",
        "value": "150 PSI (Dùng cho ô tô, xe máy, xe đạp, bóng thể thao)"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_89",
    "id": "prod_89",
    "name": "Camera Hành Trình Ô Tô Trước Sau 4K Ultra HD Tích Hợp GPS & WiFi Cảnh Báo",
    "slug": "camera-hanh-trinh-o-to-4k",
    "description": "Cảm biến Sony Starvis quay đêm sắc nét như ban ngày, góc rộng 170 độ ghi trọn 4 làn đường, cảnh báo biển báo giao thông bằng giọng nói tiếng Việt.",
    "price": 1650000,
    "originalPrice": 2350000,
    "image": "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800",
    "images": [
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800"
    ],
    "category": "Điện tử",
    "brand": "AutoPro Gear",
    "badge": "Best Seller",
    "stock": 35,
    "sold": 620,
    "rating": 4.95,
    "reviewCount": 175,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_08",
    "shopName": "AutoPro Phụ Kiện Ô Tô Xe Máy",
    "shopRating": 4.87,
    "shopResponseRate": 97,
    "variants": {
      "colors": [
        "Trọn Bộ Cam Trước 4K + Cam Sau 1080P Kèm Thẻ 64GB"
      ],
      "sizes": [
        "Thẻ nhớ 64GB chuyên dụng"
      ]
    },
    "specifications": [
      {
        "label": "Độ phân giải",
        "value": "4K (3840x2160) @30fps"
      },
      {
        "label": "Bảo hành",
        "value": "12 tháng đổi mới"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_90",
    "id": "prod_90",
    "name": "Bộ Dung Dịch Rửa Xe Phủ Ceramic Bóng Sơn Xe Chống Bám Nước Lá Sen 500ml",
    "slug": "dung-dich-rua-xe-phu-ceramic",
    "description": "Tạo lớp màng bảo vệ ceramic nano siêu bóng, chống bám bụi bẩn và tia UV làm phai màu sơn xe, hiệu ứng lá sen trôi tuột nước mưa cực đỉnh.",
    "price": 180000,
    "originalPrice": 290000,
    "image": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
    "images": [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800"
    ],
    "category": "Đời sống",
    "brand": "AutoPro Gear",
    "badge": "Hot Deal",
    "stock": 80,
    "sold": 1450,
    "rating": 4.89,
    "reviewCount": 310,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_08",
    "shopName": "AutoPro Phụ Kiện Ô Tô Xe Máy",
    "shopRating": 4.87,
    "shopResponseRate": 97,
    "variants": {
      "colors": [
        "Chai Xịt 500ml Kèm Khăn Lau Chuyên Dụng"
      ],
      "sizes": [
        "500ml"
      ]
    },
    "specifications": [
      {
        "label": "Công nghệ",
        "value": "Nano Ceramic Polymer cao cấp"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_91",
    "id": "prod_91",
    "name": "Gối Tựa Cổ Đầu Tựa Lưng Ô Tô Cao Su Non Công Thái Học Chống Mỏi Cổ",
    "slug": "goi-tua-co-dau-tua-lung-o-to",
    "description": "Lõi cao su non đúc nguyên khối mềm mại phục hồi chậm, nâng đỡ cột sống cổ và thắt lưng hoàn hảo, vải bọc thoáng khí 4 mùa tháo giặt dễ dàng.",
    "price": 290000,
    "originalPrice": 420000,
    "image": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800",
    "images": [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800"
    ],
    "category": "Đời sống",
    "brand": "AutoPro Gear",
    "badge": "Amazon's Choice",
    "stock": 55,
    "sold": 890,
    "rating": 4.91,
    "reviewCount": 195,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_08",
    "shopName": "AutoPro Phụ Kiện Ô Tô Xe Máy",
    "shopRating": 4.87,
    "shopResponseRate": 97,
    "variants": {
      "colors": [
        "Đen Sport Chỉ Đỏ",
        "Nâu Da Bò Luxury",
        "Kem Be Thanh Lịch"
      ],
      "sizes": [
        "Combo Gối Đầu + Tựa Lưng"
      ]
    },
    "specifications": [
      {
        "label": "Ruột gối",
        "value": "100% Cao su non Memory Foam đàn hồi chậm"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_92",
    "id": "prod_92",
    "name": "Tẩu Sạc Ô Tô Nhanh 60W 2 Cổng Type-C & USB Sạc Đồng Thời Đèn Báo Điện Áp",
    "slug": "tau-sac-o-to-nhanh-60w",
    "description": "Vỏ hợp kim nhôm tản nhiệt cực nhanh, hỗ trợ sạc nhanh chuẩn PD & QC 3.0 cho 2 thiết bị cùng lúc với tốc độ tối đa, an toàn chống cháy nổ.",
    "price": 165000,
    "originalPrice": 250000,
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800",
    "images": [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800"
    ],
    "category": "Điện tử",
    "brand": "AutoPro Gear",
    "badge": "Best Seller",
    "stock": 90,
    "sold": 1620,
    "rating": 4.88,
    "reviewCount": 320,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_08",
    "shopName": "AutoPro Phụ Kiện Ô Tô Xe Máy",
    "shopRating": 4.87,
    "shopResponseRate": 97,
    "variants": {
      "colors": [
        "Xám Không Gian Hợp Kim Nhôm"
      ],
      "sizes": [
        "Cổng Type-C 30W + Cổng USB-A 30W"
      ]
    },
    "specifications": [
      {
        "label": "Điện áp vào",
        "value": "12V - 24V tương thích mọi dòng xe"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_93",
    "id": "prod_93",
    "name": "Bình Sữa Thủy Tinh Cổ Rộng Kháng Khuẩn PPSU Chống Đầy Hơi 240ml Cho Trẻ Sơ Sinh",
    "slug": "binh-sua-thuy-tinh-co-rong-ppsu",
    "description": "Chất liệu nhựa y tế PPSU nhập khẩu Đức không chứa BPA, chịu nhiệt 180 độ C tiệt trùng thoải mái, núm ty silicone siêu mềm mô phỏng ty mẹ chống sặc sữa.",
    "price": 285000,
    "originalPrice": 420000,
    "image": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800",
    "images": [
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800"
    ],
    "category": "Mẹ & Bé",
    "brand": "BabyCare",
    "badge": "Best Seller",
    "stock": 80,
    "sold": 2150,
    "rating": 4.97,
    "reviewCount": 540,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_09",
    "shopName": "BabyCare Siêu Thị Mẹ & Bé Yêu",
    "shopRating": 4.97,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Vàng Mật Ong Tự Nhiên PPSU"
      ],
      "sizes": [
        "160ml (0-3 tháng)",
        "240ml (3 tháng trở lên)"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "Nhựa y tế cao cấp PPSU siêu bền không độc hại"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_94",
    "id": "prod_94",
    "name": "Tã Dán Quần Hữu Cơ Cotton Mềm Mịn Siêu Mỏng Thoáng Khí Chống Hăm Đủ Size",
    "slug": "ta-dan-quan-huu-co-cotton",
    "description": "Lõi thấm hút 3D chứa hàng triệu hạt SAP khóa ẩm thần tốc trong 5 giây, bề mặt 100% sợi cotton hữu cơ mềm mại nâng niu làn da non nớt của bé.",
    "price": 299000,
    "originalPrice": 390000,
    "image": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800",
    "images": [
      "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800"
    ],
    "category": "Mẹ & Bé",
    "brand": "BabyCare",
    "badge": "Hot Deal",
    "stock": 120,
    "sold": 3400,
    "rating": 4.96,
    "reviewCount": 780,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_09",
    "shopName": "BabyCare Siêu Thị Mẹ & Bé Yêu",
    "shopRating": 4.97,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Tã Dán",
        "Tã Quần"
      ],
      "sizes": [
        "Size NB/S (60 miếng)",
        "Size M (54 miếng)",
        "Size L (48 miếng)",
        "Size XL (42 miếng)"
      ]
    },
    "specifications": [
      {
        "label": "Độ mỏng",
        "value": "Chỉ 1.8mm siêu thoáng mát chống hăm tã"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_95",
    "id": "prod_95",
    "name": "Xe Đẩy Trẻ Em Gấp Gọn Siêu Nhẹ Khung Nhôm Hàng Không Đẩy 2 Chiều Du Lịch",
    "slug": "xe-day-tre-em-gap-gon-sieu-nhe",
    "description": "Thao tác gập mở bằng 1 tay chỉ trong 1 giây, trọng lượng siêu nhẹ 5.4kg xách lên máy bay tiện lợi, giảm xóc lò xo 4 bánh êm ái trên mọi cung đường.",
    "price": 1450000,
    "originalPrice": 2100000,
    "image": "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800",
    "images": [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800"
    ],
    "category": "Mẹ & Bé",
    "brand": "BabyCare",
    "badge": "Amazon's Choice",
    "stock": 30,
    "sold": 490,
    "rating": 4.95,
    "reviewCount": 140,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_09",
    "shopName": "BabyCare Siêu Thị Mẹ & Bé Yêu",
    "shopRating": 4.97,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Xám Khói Châu Âu",
        "Xanh Mint Dịu Nhẹ",
        "Đen Huyền Bí"
      ],
      "sizes": [
        "Trọng lượng 5.4kg cho bé 0-4 tuổi (Tải trọng 30kg)"
      ]
    },
    "specifications": [
      {
        "label": "Góc ngả lưng",
        "value": "Chỉnh 100 đến 175 độ nằm ngồi thoải mái"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_96",
    "id": "prod_96",
    "name": "Bộ Đồ Chơi Gỗ Xếp Hình Trí Tuệ Giáo Dục Phát Triển Tư Duy Montessori Cho Bé",
    "slug": "bo-do-choi-go-xep-hinh-montessori",
    "description": "Gỗ sồi tự nhiên bo tròn góc cạnh phủ sơn gốc nước không độc hại, rèn luyện tư duy logic, phối hợp tay mắt và nhận biết màu sắc hình khối.",
    "price": 175000,
    "originalPrice": 260000,
    "image": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800",
    "images": [
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800"
    ],
    "category": "Mẹ & Bé",
    "brand": "Montessori Toys",
    "badge": "Best Seller",
    "stock": 90,
    "sold": 1820,
    "rating": 4.93,
    "reviewCount": 390,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_09",
    "shopName": "BabyCare Siêu Thị Mẹ & Bé Yêu",
    "shopRating": 4.97,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Bộ Xếp Khối Màu Sắc Gỗ Mộc"
      ],
      "sizes": [
        "Bộ 60 chi tiết kèm túi vải canvas"
      ]
    },
    "specifications": [
      {
        "label": "Độ tuổi",
        "value": "Thích hợp cho trẻ từ 1 đến 6 tuổi"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_97",
    "id": "prod_97",
    "name": "Máy Tiệt Trùng Sấy Khô Bình Sữa Tia UV Diệt Khuẩn 99.9% Đa Năng Giữ Ấm",
    "slug": "may-tiet-trung-say-kho-binh-sua-uv",
    "description": "Đèn UV Philips không sinh ozone diệt sạch virus nấm mốc, công nghệ sấy khô khí ấm PTC chống tái nhiễm khuẩn, khoang chứa 16L khử khuẩn cả đồ chơi.",
    "price": 1890000,
    "originalPrice": 2600000,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
    "images": [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800"
    ],
    "category": "Mẹ & Bé",
    "brand": "BabyCare",
    "badge": "Hot Deal",
    "stock": 25,
    "sold": 380,
    "rating": 4.98,
    "reviewCount": 110,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_09",
    "shopName": "BabyCare Siêu Thị Mẹ & Bé Yêu",
    "shopRating": 4.97,
    "shopResponseRate": 100,
    "variants": {
      "colors": [
        "Trắng Sữa Viền Vàng Kim"
      ],
      "sizes": [
        "Dung tích 16L chứa 12 bình sữa cùng lúc"
      ]
    },
    "specifications": [
      {
        "label": "Chức năng",
        "value": "Tự động tiệt trùng, sấy khô, bảo quản vô trùng 24 giờ"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_98",
    "id": "prod_98",
    "name": "Loa Bluetooth Di Động Công Suất 40W Kháng Nước IPX7 Pin 15 Giờ Âm Bass Trầm Sâu",
    "slug": "loa-bluetooth-di-dong-40w",
    "description": "Củ loa kép toàn dải kết hợp 2 màng rung thụ động tăng cường âm trầm uy lực, chuẩn chống nước ngâm IPX7 thả ga tiệc tùng hồ bơi ngoài trời.",
    "price": 890000,
    "originalPrice": 1350000,
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800",
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800"
    ],
    "category": "Điện tử",
    "brand": "AudioHiFi",
    "badge": "Best Seller",
    "stock": 45,
    "sold": 890,
    "rating": 4.94,
    "reviewCount": 260,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_10",
    "shopName": "AudioHiFi Âm Thanh Đẳng Cấp",
    "shopRating": 4.93,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Đen Midnight",
        "Xanh Rêu Camo",
        "Đỏ Rực Rỡ"
      ],
      "sizes": [
        "Pin 5200mAh nghe nhạc 15 giờ"
      ]
    },
    "specifications": [
      {
        "label": "Bluetooth",
        "value": "V5.3 kết nối 2 loa TWS tạo hiệu ứng Stereo 80W"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_99",
    "id": "prod_99",
    "name": "Tai Nghe Kiểm Âm Studio Chuyên Nghiệp Chụp Tai Khép Kín Dải Tần Rộng 5Hz-30kHz",
    "slug": "tai-nghe-kiem-am-studio-chuyen-nghiep",
    "description": "Driver 45mm nam châm đất hiếm Neodymium tái hiện âm thanh trung thực chuẩn xác từng chi tiết, đệm tai da protein cách âm thụ động tuyệt hảo.",
    "price": 1950000,
    "originalPrice": 2800000,
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
    ],
    "category": "Điện tử",
    "brand": "AudioHiFi",
    "badge": "Amazon's Choice",
    "stock": 30,
    "sold": 520,
    "rating": 4.96,
    "reviewCount": 175,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_10",
    "shopName": "AudioHiFi Âm Thanh Đẳng Cấp",
    "shopRating": 4.93,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Đen Nhám Chuyên Nghiệp"
      ],
      "sizes": [
        "Tặng kèm 2 dây cáp 1.2m và 3m + Jack 6.35mm"
      ]
    },
    "specifications": [
      {
        "label": "Trở kháng",
        "value": "38 Ohms dễ kéo trên cả điện thoại và soundcard"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_100",
    "id": "prod_100",
    "name": "Soundbar Tivi Kèm Loa Subwoofer Rời 120W Âm Thanh Vòm 3D Dolby Audio Rạp Phim",
    "slug": "soundbar-tivi-kem-subwoofer-120w",
    "description": "Hệ thống âm thanh 2.1 kênh công suất cực đại 120W, loa siêu trầm bass gầm sống động khi xem phim bom tấn, hỗ trợ cổng HDMI eARC, Optical và Bluetooth.",
    "price": 2490000,
    "originalPrice": 3500000,
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800",
    "images": [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800"
    ],
    "category": "Điện tử",
    "brand": "AudioHiFi",
    "badge": "Hot Deal",
    "stock": 20,
    "sold": 310,
    "rating": 4.92,
    "reviewCount": 88,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_10",
    "shopName": "AudioHiFi Âm Thanh Đẳng Cấp",
    "shopRating": 4.93,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Đen Kim Loại Sang Trọng"
      ],
      "sizes": [
        "Thanh Soundbar 80cm + Loa Sub 6.5 Inch"
      ]
    },
    "specifications": [
      {
        "label": "Âm thanh",
        "value": "Dolby Audio, DTS Virtual:X tích hợp EQ Movie/Music/News"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_101",
    "id": "prod_101",
    "name": "Bộ DAC Giải Mã Âm Thanh Hi-Res 24bit/192kHz Cổng Quang Optical Sang RCA Amply",
    "slug": "bo-dac-giai-ma-am-thanh-hi-res",
    "description": "Chip giải mã Cirrus Logic CS8416 cao cấp loại bỏ tạp âm nhiễu nền, nâng cấp âm thanh từ Smart TV ra amply dàn loa nghe nhạc vàng bolero ấm áp chi tiết.",
    "price": 450000,
    "originalPrice": 650000,
    "image": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    "images": [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
    ],
    "category": "Điện tử",
    "brand": "AudioHiFi",
    "badge": "Best Seller",
    "stock": 50,
    "sold": 790,
    "rating": 4.9,
    "reviewCount": 195,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_10",
    "shopName": "AudioHiFi Âm Thanh Đẳng Cấp",
    "shopRating": 4.93,
    "shopResponseRate": 98,
    "variants": {
      "colors": [
        "Vỏ Hợp Kim Nhôm Đen Chống Nhiễu"
      ],
      "sizes": [
        "Kèm dây quang Optical bọc vàng và củ nguồn 5V"
      ]
    },
    "specifications": [
      {
        "label": "Tỷ lệ lấy mẫu",
        "value": "Hỗ trợ 24-bit/192kHz chuẩn Hi-Res Audio"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_102",
    "id": "prod_102",
    "name": "Thức Ăn Hạt Hữu Cơ Cho Mèo Trưởng Thành Thịt Cá Hồi & Rau Củ Tươi Túi 1.5kg",
    "slug": "thuc-an-hat-huu-co-cho-meo",
    "description": "Nguyên liệu thịt cá hồi tươi giàu đạm và taurine sáng mắt mượt lông, bổ sung men vi sinh Probiotic hỗ trợ tiêu hóa ngăn ngừa búi lông đường ruột.",
    "price": 260000,
    "originalPrice": 380000,
    "image": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800",
    "images": [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800"
    ],
    "category": "Thú cưng",
    "brand": "PetParadise",
    "badge": "Best Seller",
    "stock": 100,
    "sold": 2800,
    "rating": 4.95,
    "reviewCount": 680,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_11",
    "shopName": "PetParadise Vương Quốc Thú Cưng",
    "shopRating": 4.92,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Vị Cá Hồi & Khoai Lang",
        "Vị Gà Nướng & Cà Rốt"
      ],
      "sizes": [
        "Túi Zip 1.5kg",
        "Túi Tiết Kiệm 5kg"
      ]
    },
    "specifications": [
      {
        "label": "Hàm lượng đạm",
        "value": "Trên 34% protein tự nhiên không độn ngũ cốc"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_103",
    "id": "prod_103",
    "name": "Đệm Giường Nệm Êm Ái Cho Chó Mèo Vải Nhung Mềm Tháo Giặt Tiện Lợi Đủ Size",
    "slug": "dem-giuong-nem-em-ai-cho-cho-meo",
    "description": "Lớp nhung san hô êm ái giữ ấm mùa lạnh, đệm lót bông gòn cao cấp nâng đỡ cột sống thú cưng, đáy chống trượt chống thấm nước ẩm ướt sàn nhà.",
    "price": 195000,
    "originalPrice": 300000,
    "image": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
    "images": [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800"
    ],
    "category": "Thú cưng",
    "brand": "PetParadise",
    "badge": "Hot Deal",
    "stock": 75,
    "sold": 1420,
    "rating": 4.91,
    "reviewCount": 320,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_11",
    "shopName": "PetParadise Vương Quốc Thú Cưng",
    "shopRating": 4.92,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Xám Khói Sang Trọng",
        "Nâu Cà Phê Ấm Áp",
        "Hồng Phấn Ngọt Ngào"
      ],
      "sizes": [
        "Size M (Dưới 6kg)",
        "Size L (Dưới 15kg)",
        "Size XL (Dưới 30kg)"
      ]
    },
    "specifications": [
      {
        "label": "Vệ sinh",
        "value": "Có khóa kéo tháo rời vỏ giặt máy tiện lợi"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_104",
    "id": "prod_104",
    "name": "Trụ Cào Móng Cho Mèo Kèm Võng Nằm Nhà Gỗ Cây Cào Móng Cao Cấp 3 Tầng",
    "slug": "tru-cao-mong-cho-meo-3-tang",
    "description": "Dây thừng gai đay tự nhiên bền chắc thỏa mãn sở thích cào móng giải tỏa stress của mèo, khung gỗ ép chắc chắn không rung lắc kèm bóng treo chơi đùa.",
    "price": 360000,
    "originalPrice": 520000,
    "image": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800",
    "images": [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800"
    ],
    "category": "Thú cưng",
    "brand": "PetParadise",
    "badge": "Amazon's Choice",
    "stock": 40,
    "sold": 670,
    "rating": 4.93,
    "reviewCount": 165,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_11",
    "shopName": "PetParadise Vương Quốc Thú Cưng",
    "shopRating": 4.92,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Gỗ Tự Nhiên Phối Nỉ Be"
      ],
      "sizes": [
        "Chiều cao 90cm 3 tầng vận động"
      ]
    },
    "specifications": [
      {
        "label": "Chất liệu",
        "value": "Gỗ Plywood thân thiện thú cưng + Dây đay tự nhiên"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_105",
    "id": "prod_105",
    "name": "Đồng Hồ Nam Cơ Khí Automatic Lộ Cơ Toàn Phần Mặt Kính Sapphire Thép 316L",
    "slug": "dong-ho-nam-co-khi-automatic-lo-co",
    "description": "Bộ máy cơ khí tự động trữ cót 42 giờ độ chính xác cao, mặt kính Sapphire nguyên khối chống trầy xước dao cào, khả năng kháng nước 50M đi bơi thoải mái.",
    "price": 2450000,
    "originalPrice": 3800000,
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"
    ],
    "category": "Thời trang",
    "brand": "LuxeTime",
    "badge": "Amazon's Choice",
    "stock": 25,
    "sold": 430,
    "rating": 4.97,
    "reviewCount": 125,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_12",
    "shopName": "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện",
    "shopRating": 4.95,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Mặt Đen Viền Vàng Hồng Rose Gold",
        "Mặt Bạc Viền Thép Trắng Bạc"
      ],
      "sizes": [
        "Đường kính mặt 41mm - Độ dày 12mm"
      ]
    },
    "specifications": [
      {
        "label": "Bộ máy",
        "value": "Japan Miyota 8N24 Automatic Skeleton"
      },
      {
        "label": "Dây đeo",
        "value": "Thép không gỉ 316L đúc đặc mạ PVD"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_106",
    "id": "prod_106",
    "name": "Đồng Hồ Nữ Thạch Anh Kính Khoáng Chống Nước Đính Đá Swarovski Dây Kim Loại",
    "slug": "dong-ho-nu-thach-anh-dinh-da-swarovski",
    "description": "Thiết kế tiểu thư thanh lịch với viền đính đá Swarovski lấp lánh sang trọng, mặt xà cừ thiên nhiên đổi màu theo góc sáng, dây lưới kim loại khóa bướm tinh tế.",
    "price": 980000,
    "originalPrice": 1550000,
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
    "images": [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800"
    ],
    "category": "Thời trang",
    "brand": "LuxeTime",
    "badge": "Best Seller",
    "stock": 40,
    "sold": 760,
    "rating": 4.94,
    "reviewCount": 210,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_12",
    "shopName": "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện",
    "shopRating": 4.95,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Vàng Hồng Nữ Tính",
        "Bạc Tinh Khôi"
      ],
      "sizes": [
        "Đường kính mặt 28mm nhỏ nhắn vừa tay nữ"
      ]
    },
    "specifications": [
      {
        "label": "Chống nước",
        "value": "3ATM rửa tay đi mưa an toàn"
      }
    ],
    "reviews": []
  },
  {
    "_id": "prod_107",
    "id": "prod_107",
    "name": "Hộp Xoay Đồng Hồ Cơ Tự Động 2 Xoay Động Cơ Êm Ái Không Từ Tính Vỏ Gỗ Sơn Mài",
    "slug": "hop-xoay-dong-ho-co-tu-dong",
    "description": "Vỏ gỗ phủ sơn mài bóng bẩy như đàn piano, động cơ Mabuchi Nhật Bản vận hành cực êm không phát ra tiếng động, 4 chế độ xoay bảo vệ bộ cót đồng hồ cơ luôn chạy chuẩn giờ.",
    "price": 850000,
    "originalPrice": 1290000,
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800"
    ],
    "category": "Đời sống",
    "brand": "LuxeTime",
    "badge": "Hot Deal",
    "stock": 25,
    "sold": 340,
    "rating": 4.92,
    "reviewCount": 95,
    "isMall": true,
    "isFastDelivery": true,
    "shopId": "shop_12",
    "shopName": "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện",
    "shopRating": 4.95,
    "shopResponseRate": 99,
    "variants": {
      "colors": [
        "Vân Gỗ Đen Piano Lót Da PU Đen",
        "Vân Gỗ Nâu Trầm Lót Da Trắng"
      ],
      "sizes": [
        "Bản 2 ổ xoay tự động"
      ]
    },
    "specifications": [
      {
        "label": "Nguồn điện",
        "value": "Sử dụng cắm điện Adapter hoặc pin AA dự phòng"
      }
    ],
    "reviews": []
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

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 12);
  const total = list.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedList = list.slice((page - 1) * limit, page * limit);

  return {
    products: paginatedList,
    pagination: {
      page,
      limit,
      total,
      totalPages,
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
