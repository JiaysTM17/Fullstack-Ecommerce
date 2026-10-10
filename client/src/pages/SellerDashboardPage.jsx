import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import ShippingLabelModal from '../components/ShippingLabelModal';
import PackingSlipModal from '../components/PackingSlipModal';
import { FALLBACK_PRODUCTS, restoreProductStock } from '../services/productService';
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
  createSellerProduct,
  fetchSellerFunnelAnalytics,
  fetchSellerMarketIntelligence,
  fetchSellerStaff,
  createSellerStaff,
  updateSellerStaff,
  fetchSellerAdsAPI,
  createSellerAdsAPI,
  toggleSellerAdsAPI,
  simulateSellerAdsAPI,
  batchUpdateInventoryAPI,
  fetchSellerFlashSalesAPI,
  createSellerFlashSaleAPI,
  updateSellerFlashSaleStatusAPI,
  deleteSellerFlashSaleAPI,
  requestSellerWithdrawalAPI,
  fetchSellerReturnsAPI,
  respondSellerReturnAPI,
  fetchSellerProfitAndLossAPI,
  fetchSellerShippingPolicyAPI,
  updateSellerShippingPolicyAPI,
  fetchSellerOperationalSLA_API,
  fetchSellerAutoReplyAPI,
  updateSellerAutoReplyAPI,
  simulateSellerAutoReplyAPI,
  fetchSellerShippingManifestAPI,
  batchDispatchSellerOrdersAPI,
  fetchSellerCodReconciliationAPI,
  reconcileSellerCodOrdersAPI,
  fetchSellerPriceRadarAPI,
} from '../services/api';
import '../styles/dashboard.css';
import {
  ChartBarIcon,
  CreditCardIcon,
  ReceiptIcon,
  PackageIcon,
  BoltIcon,
  TicketIcon,
  StarIcon,
  ChatIcon,
  SettingsIcon,
  UserIcon,
  StoreIcon,
  PhoneIcon,
  TagIcon,
  GlobeIcon,
  ShieldCheckIcon,
  LockIcon,
  DownloadIcon,
  SearchIcon,
  TruckIcon,
  PrinterIcon,
  EyeIcon,
  MapPinIcon,
  PencilIcon,
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  PlusIcon,
  SparklesIcon,
  ChevronRightIcon,
  TrashIcon,
  RotateCcwIcon,
} from '../components/OrdersIcons';

// 12 Gian hàng mẫu với đầy đủ thông tin chuẩn TMĐT
const INITIAL_SHOPS = [
  { id: "shop_01", name: "Thời Trang GenZ Official", category: "Thời trang", logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120", phone: "0912345678", address: "Kho Tân Bình, TP. Hồ Chí Minh", rating: 4.9, bio: "Chuyên thời trang nam nữ phong cách trẻ trung, năng động, chuẩn gu GenZ.", workingHours: "08:00 - 21:00 hàng ngày", status: "active" },
  { id: "shop_02", name: "TechWorld Store", category: "Điện tử", logo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120", phone: "0987654321", address: "Kho Cầu Giấy, Hà Nội", rating: 4.85, bio: "Đại lý phân phối thiết bị số, tai nghe, chuột công thái học và bàn phím cơ.", workingHours: "08:30 - 20:30", status: "active" },
  { id: "shop_03", name: "Beauty Cosmetics Official", category: "Sắc đẹp", logo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120", phone: "0909888999", address: "Kho Quận 1, TP. Hồ Chí Minh", rating: 4.95, bio: "Dược mỹ phẩm chăm sóc da chính hãng nhập khẩu Hàn Quốc & Nhật Bản.", workingHours: "09:00 - 21:00", status: "active" },
  { id: "shop_04", name: "HomePro Gia Dụng Thông Minh", category: "Gia dụng", logo: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=120", phone: "0936789123", address: "Kho Long Biên, Hà Nội", rating: 4.88, bio: "Gia dụng tiện ích cho tổ ấm hiện đại: Nồi chiên, robot hút bụi, máy lọc khí.", workingHours: "08:00 - 18:00", status: "active" },
  { id: "shop_05", name: "SportZone Thể Thao & Dã Ngoại", category: "Thể thao", logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120", phone: "0968123456", address: "Kho Nam Từ Liêm, Hà Nội", rating: 4.91, bio: "Trang thiết bị tập gym, yoga, lều trại dã ngoại và phụ kiện thể thao bền bỉ.", workingHours: "08:00 - 20:00", status: "active" },
  { id: "shop_06", name: "GreenFarm Nông Sản & Organic Sạch", category: "Đời sống", logo: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=120", phone: "0977888666", address: "Kho Đà Lạt & TP. Hồ Chí Minh", rating: 4.96, bio: "Hạt dinh dưỡng, trà thảo mộc, mật ong hoa rừng chuẩn hữu cơ 100%.", workingHours: "07:30 - 18:30", status: "active" },
  { id: "shop_07", name: "Tri Thức BookStore & Văn Phòng Phẩm", category: "Đời sống", logo: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=120", phone: "0918223344", address: "Kho Đống Đa, Hà Nội", rating: 4.94, bio: "Sách phát triển bản thân, kinh tế, tâm lý học và sổ tay da quà tặng cao cấp.", workingHours: "08:00 - 21:00", status: "active" },
  { id: "shop_08", name: "AutoPro Phụ Kiện Ô Tô Xe Máy", category: "Phụ kiện", logo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=120", phone: "0933555777", address: "Kho Hoàng Mai, Hà Nội", rating: 4.87, bio: "Bơm lốp thông minh, camera hành trình 4K, tẩu sạc và phụ kiện chăm sóc xe.", workingHours: "08:00 - 18:00", status: "active" },
  { id: "shop_09", name: "BabyCare Siêu Thị Mẹ & Bé Yêu", category: "Mẹ & Bé", logo: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=120", phone: "0908112233", address: "Kho Bình Thạnh, TP. Hồ Chí Minh", rating: 4.97, bio: "Bình sữa chống đầy hơi PPSU, tã dán hữu cơ, máy tiệt trùng UV an toàn cho bé.", workingHours: "08:30 - 21:00", status: "active" },
  { id: "shop_10", name: "AudioHiFi Âm Thanh Đẳng Cấp", category: "Điện tử", logo: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=120", phone: "0945667788", address: "Kho Quận 3, TP. Hồ Chí Minh", rating: 4.93, bio: "Loa Bluetooth chống nước IPX7, tai nghe kiểm âm và ampli giải mã Hi-Res.", workingHours: "09:00 - 20:00", status: "active" },
  { id: "shop_11", name: "PetParadise Vương Quốc Thú Cưng", category: "Thú cưng", logo: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=120", phone: "0922446688", address: "Kho Phú Nhuận, TP. Hồ Chí Minh", rating: 4.92, bio: "Thức ăn dinh dưỡng, đồ chơi kích thích phản xạ và chuồng đệm cho chó mèo.", workingHours: "08:30 - 20:30", status: "active" },
  { id: "shop_12", name: "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện", category: "Thời trang", logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120", phone: "0915999111", address: "Kho Ba Đình, Hà Nội", rating: 4.95, bio: "Đồng hồ cơ Automatic sapphire, đồng hồ nữ đính đá và hộp xoay đồng hồ tự động.", workingHours: "09:00 - 21:00", status: "active" },
];

const INITIAL_SELLER_ORDERS = [
  {
    orderId: "ORD918231",
    shopId: "shop_01",
    customerName: "Nguyễn Văn Khách",
    phone: "0901234567",
    address: "Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    productName: "Áo thun nam basic cotton 100% (x2)",
    items: [
      { name: "Áo thun nam basic cotton 100% thoáng mát", quantity: 2, price: 199000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120" }
    ],
    total: 428000,
    shippingFee: 30000,
    paymentMethod: "VietQR Ngân Hàng",
    trackingCode: "SPX-VN-88219011",
    status: "shipping",
    statusText: "Đang giao hàng",
    createdAt: "2026-09-27 14:20"
  },
  {
    orderId: "ORD716254",
    shopId: "shop_01",
    customerName: "Lê Minh Tuấn",
    phone: "0933445566",
    address: "Tòa Landmark 81, 720A Điện Biên Phủ, P.22, Q.Bình Thạnh, TP.HCM",
    productName: "Quần jean nam ống đứng co giãn 4 chiều (x1)",
    items: [
      { name: "Quần jean nam ống đứng co giãn 4 chiều", quantity: 1, price: 399000, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=120" }
    ],
    total: 429000,
    shippingFee: 30000,
    paymentMethod: "Thanh toán khi nhận hàng (COD)",
    trackingCode: "SPX-VN-77123902",
    status: "pending",
    statusText: "Chờ xác nhận",
    createdAt: "2026-09-28 08:30"
  },
  {
    orderId: "ORD827103",
    shopId: "shop_02",
    customerName: "Trần Anh Khoa",
    phone: "0944556677",
    address: "128 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội",
    productName: "Tai nghe Bluetooth True Wireless chống ồn ANC (x1)",
    items: [
      { name: "Tai nghe Bluetooth True Wireless chống ồn ANC", quantity: 1, price: 650000, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120" }
    ],
    total: 680000,
    shippingFee: 30000,
    paymentMethod: "Ví MoMo",
    trackingCode: "SPX-VN-99120441",
    status: "completed",
    statusText: "Đã hoàn thành",
    createdAt: "2026-09-26 09:15"
  },
  {
    orderId: "ORD339102",
    shopId: "shop_03",
    customerName: "Đỗ Mỹ Linh",
    phone: "0918776655",
    address: "240 Hai Bà Trưng, Phường Tân Định, Quận 1, TP. Hồ Chí Minh",
    productName: "Serum Vitamin C 15% Sáng Da PureGlow (x1)",
    items: [
      { name: "Serum Vitamin C 15% Sáng Da Mờ Thâm Nám PureGlow", quantity: 1, price: 380000, image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=120" }
    ],
    total: 380000,
    shippingFee: 0,
    paymentMethod: "VietQR Ngân Hàng",
    trackingCode: "SPX-VN-33918274",
    status: "shipping",
    statusText: "Đang giao hàng",
    createdAt: "2026-09-27 10:15"
  },
  {
    orderId: "ORD441920",
    shopId: "shop_04",
    customerName: "Hoàng Gia Bách",
    phone: "0982112233",
    address: "KĐT Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
    productName: "Nồi Chiên Không Dầu Điện Tử 6.5L HomePro (x1)",
    items: [
      { name: "Nồi Chiên Không Dầu Điện Tử 6.5L Cảm Ứng HomePro", quantity: 1, price: 1290000, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=120" }
    ],
    total: 1290000,
    shippingFee: 0,
    paymentMethod: "Thanh toán khi nhận hàng (COD)",
    trackingCode: "SPX-VN-44192019",
    status: "pending",
    statusText: "Chờ xác nhận",
    createdAt: "2026-09-28 11:45"
  }
];

const INITIAL_SHOP_VOUCHERS = [
  { id: 'sv_01', shopId: 'shop_01', code: 'GENZ20K', name: 'Giảm 20k đơn thời trang từ 150k', discount: 20000, isPercent: false, minOrder: 150000, used: 45, limit: 100, active: true },
  { id: 'sv_02', shopId: 'shop_01', code: 'GENZ10P', name: 'Giảm 10% tối đa 50k toàn shop', discount: 10, isPercent: true, minOrder: 200000, used: 80, limit: 200, active: true },
  { id: 'sv_03', shopId: 'shop_02', code: 'TECH50K', name: 'Giảm 50k thiết bị công nghệ & âm thanh', discount: 50000, isPercent: false, minOrder: 300000, used: 28, limit: 50, active: true },
  { id: 'sv_04', shopId: 'shop_02', code: 'TECHFSHIP', name: 'Freeship đơn hàng công nghệ từ 500k', discount: 30000, isPercent: false, minOrder: 500000, used: 92, limit: 150, active: true },
  { id: 'sv_05', shopId: 'shop_03', code: 'BEAUTY30K', name: 'Giảm 30k mỹ phẩm chăm sóc da chính hãng', discount: 30000, isPercent: false, minOrder: 150000, used: 64, limit: 120, active: true },
  { id: 'sv_06', shopId: 'shop_04', code: 'HOME80K', name: 'Giảm 80k gia dụng thông minh từ 500k', discount: 80000, isPercent: false, minOrder: 500000, used: 31, limit: 80, active: true },
];

// Khởi tạo tin nhắn mẫu thực tế giữa khách hàng và shop
const INITIAL_SHOP_CHATS = [
  {
    id: "chat_01",
    shopId: "shop_01",
    customerName: "Nguyễn Thu Hà",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
    lastMessage: "Shop ơi áo polo nam form suông hay ôm vậy ạ? Mình 1m72 68kg chọn size nào vừa?",
    unread: true,
    time: "10:15",
    messages: [
      { sender: "customer", text: "Shop ơi áo polo nam form suông hay ôm vậy ạ? Mình 1m72 68kg chọn size nào vừa?", time: "10:15" }
    ]
  },
  {
    id: "chat_02",
    shopId: "shop_01",
    customerName: "Trần Minh Quang",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    lastMessage: "Đơn #ORD716254 bưu tá SPX đã qua lấy hàng chưa shop, mình cần gấp trước thứ 6 ạ!",
    unread: false,
    time: "Hôm qua",
    messages: [
      { sender: "customer", text: "Đơn #ORD716254 bưu tá SPX đã qua lấy hàng chưa shop, mình cần gấp trước thứ 6 ạ!", time: "09:30" },
      { sender: "seller", text: "Dạ chào bạn, kiện hàng đã được shop đóng gói kỹ càng và bàn giao bưu cục SPX sáng nay rồi ạ, dự kiến giao đến bạn trong ngày mai nhé!", time: "09:42" }
    ]
  },
  {
    id: "chat_03",
    shopId: "shop_02",
    customerName: "Lê Hoàng Yến",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    lastMessage: "Shop có bàn phím cơ kết nối được cùng lúc iPad và Laptop không ạ?",
    unread: true,
    time: "11:20",
    messages: [
      { sender: "customer", text: "Shop có bàn phím cơ kết nối được cùng lúc iPad và Laptop không ạ?", time: "11:20" }
    ]
  }
];

// Đánh giá thực tế từ khách hàng cho từng Shop
const INITIAL_SHOP_REVIEWS = [
  {
    id: "rev_01",
    shopId: "shop_01",
    customerName: "Nguyễn Văn Khách",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
    productName: "Áo thun nam basic cotton 100% thoáng mát",
    rating: 5,
    date: "26/09/2026",
    comment: "Áo thun mặc form cực đẹp, chất cotton dày dặn và mát mẻ, shop đóng gói hộp rất sang trọng. 5 sao tuyệt đối!",
    reply: "Dạ Thời Trang GenZ Official xin cảm ơn bạn rất nhiều ạ! Chúc bạn luôn có trải nghiệm tuyệt vời khi mua sắm tại shop nhé!",
  },
  {
    id: "rev_02",
    shopId: "shop_01",
    customerName: "Lê Minh Tuấn",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    productName: "Quần jean nam ống đứng co giãn 4 chiều",
    rating: 5,
    date: "25/09/2026",
    comment: "Quần mặc vừa vặn, màu sắc như hình mẫu, đường may kỹ càng. Giao hàng SPX rất nhanh.",
    reply: null,
  },
  {
    id: "rev_03",
    shopId: "shop_01",
    customerName: "Đỗ Mỹ Linh",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    productName: "Áo polo nam công sở cao cấp",
    rating: 4,
    date: "22/09/2026",
    comment: "Chất vải ổn, áo đẹp, nhưng giao chậm hơn dự kiến 1 buổi do trời mưa. Shop chăm sóc khách nhiệt tình.",
    reply: "Dạ shop xin lỗi bạn vì thời tiết mưa gió ảnh hưởng tới tiến độ giao hàng của bên vận chuyển. Shop đã gửi tặng bạn 1 voucher giảm 20k cho đơn tiếp theo rồi ạ!",
  },
  {
    id: "rev_04",
    shopId: "shop_02",
    customerName: "Trần Anh Khoa",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    productName: "Tai nghe Bluetooth True Wireless chống ồn ANC",
    rating: 5,
    date: "27/09/2026",
    comment: "Chất âm bass sâu, chống ồn rất tốt khi ngồi quán cafe. Đóng gói cẩn thận 10 điểm.",
    reply: "TechWorld Store cảm ơn bạn Khoa nhiều nhé!",
  }
];

// Chiến dịch Flash Sale độc quyền của Shop
const INITIAL_FLASHSALES = [
  {
    id: "fs_01",
    shopId: "shop_01",
    title: "Flash Sale Giờ Vàng Buổi Trưa",
    timeSlot: "12:00 - 15:00 Hôm Nay",
    status: "active",
    discountPercent: 30,
    itemsCount: 3,
    soldCount: 42,
    totalQuota: 60,
  },
  {
    id: "fs_02",
    shopId: "shop_01",
    title: "Siêu Sale Khung Giờ Tối 20h",
    timeSlot: "20:00 - 23:59 Tối Nay",
    status: "upcoming",
    discountPercent: 40,
    itemsCount: 4,
    soldCount: 0,
    totalQuota: 80,
  }
];

// Lịch sử rút tiền về tài khoản ngân hàng của Shop
const INITIAL_WITHDRAWALS = [
  {
    id: "WD91823",
    shopId: "shop_01",
    date: "24/09/2026 15:30",
    amount: 5000000,
    bankName: "Vietcombank",
    accountNumber: "0071001234567",
    accountHolder: "TRAN THI CHU SHOP",
    status: "completed",
    statusText: "Thành công (Đã chuyển khoản)",
  },
  {
    id: "WD71625",
    shopId: "shop_01",
    date: "18/09/2026 10:15",
    amount: 3500000,
    bankName: "Vietcombank",
    accountNumber: "0071001234567",
    accountHolder: "TRAN THI CHU SHOP",
    status: "completed",
    statusText: "Thành công (Đã chuyển khoản)",
  }
];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();

  // 1. Quản lý danh sách các Shop với bộ nhớ LocalStorage
  const [shops, setShops] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_shops');
      return saved ? JSON.parse(saved) : INITIAL_SHOPS;
    } catch {
      return INITIAL_SHOPS;
    }
  });

  const [selectedShopId, setSelectedShopId] = useState(() => {
    return user?.shopId || "shop_01";
  });

  // Đảm bảo chủ shop luôn luôn được khóa chính xác vào gian hàng của chính mình
  useEffect(() => {
    if (user?.role === 'seller' && user?.shopId) {
      setSelectedShopId(user.shopId);
    }
  }, [user?.role, user?.shopId]);

  const currentShop = shops.find(s => s.id === selectedShopId) || shops[0];

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'vouchers' | 'chats' | 'settings'

  // 2. Danh sách sản phẩm của toàn bộ sàn, tự động phân nhóm theo shopId
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_products');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Map dữ liệu từ FALLBACK_PRODUCTS để đảm bảo toàn bộ 12 shop đều có sản phẩm thực tế
    return FALLBACK_PRODUCTS.map(p => ({
      _id: p.id || p._id,
      shopId: p.shopId || 'shop_01',
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice || Math.round(p.price * 1.3),
      stock: p.stock || 50,
      sold: p.sold || 15,
      category: p.category || 'Thời trang',
      image: p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      isActive: true,
    }));
  });

  // 3. Đơn hàng của shop (kết hợp các đơn hàng do khách vừa đặt trên hệ thống)
  const [orders, setOrders] = useState(() => {
    try {
      const savedSellerRaw = localStorage.getItem('mini_shopee_seller_orders');
      let sellerOrders = savedSellerRaw ? JSON.parse(savedSellerRaw) : [];
      if (!Array.isArray(sellerOrders)) sellerOrders = [];

      // Tự động kiểm tra và sáp nhập mọi đơn hàng mới nhất do khách đặt trên hệ thống
      const rawCustomer = localStorage.getItem('mini_shopee_customer_orders');
      if (rawCustomer) {
        const parsedCustomer = JSON.parse(rawCustomer);
        if (Array.isArray(parsedCustomer) && parsedCustomer.length > 0) {
          const existingIds = new Set(sellerOrders.map(o => o.orderId));
          const missingCustomerOrders = parsedCustomer.filter(co => co.orderId && !existingIds.has(co.orderId)).map(o => ({
            orderId: o.orderId,
            shopId: o.shopId || (o.items && o.items[0]?.shopId) || 'shop_01',
            customerName: o.customerName || 'Khách Hàng Mini Shopee',
            phone: o.phone || '0901234567',
            address: o.address || o.shippingAddress || 'TP. Hồ Chí Minh / Hà Nội',
            productName: o.productName || (o.items ? o.items.map(it => `${it.name} (x${it.quantity})`).join(', ') : 'Đơn hàng mới'),
            items: o.items || [],
            total: o.total || 0,
            shippingFee: o.shippingFee || 25000,
            paymentMethod: o.paymentMethod || 'VietQR Ngân Hàng',
            trackingCode: o.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
            status: o.status || 'pending',
            statusText: o.statusText || 'Chờ xác nhận',
            createdAt: o.createdAt || new Date().toLocaleString('vi-VN'),
            note: o.note || '',
          }));

          if (missingCustomerOrders.length > 0) {
            sellerOrders = [...missingCustomerOrders, ...sellerOrders];
          }
        }
      }

      if (sellerOrders.length > 0) return sellerOrders;
    } catch {}
    return INITIAL_SELLER_ORDERS;
  });

  // 4. Voucher của shop
  const [vouchers, setVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_vouchers');
      return saved ? JSON.parse(saved) : INITIAL_SHOP_VOUCHERS;
    } catch {
      return INITIAL_SHOP_VOUCHERS;
    }
  });

  // 5. Tin nhắn khách hàng
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_chats');
      return saved ? JSON.parse(saved) : INITIAL_SHOP_CHATS;
    } catch {
      return INITIAL_SHOP_CHATS;
    }
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');

  // BỔ SUNG: States cho BI Funnel, Market Benchmark & Phân quyền Nhân viên Shop
  const [sellerFunnel, setSellerFunnel] = useState(null);
  const [sellerMarket, setSellerMarket] = useState(null);
  const [sellerStaffList, setSellerStaffList] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subRole: 'inventory_staff',
    permissions: ['manage_products', 'manage_orders'],
  });

  // BỔ SUNG: States cho Shopee Ads ROI Suite & Batch Inventory Matrix
  const [adsData, setAdsData] = useState(null);
  const [showCreateAdsModal, setShowCreateAdsModal] = useState(false);
  const [adsForm, setAdsForm] = useState({
    campaignName: '',
    type: 'SEARCH_ADS',
    budgetDaily: 50000,
    budgetTotal: 1000000,
    keyword1: 'áo thun oversize',
    bidPrice1: 1500,
  });

  // BỔ SUNG: States cho Quản Lý Trả Hàng & Hoàn Tiền (Return & Refund Hub)
  const [returnsList, setReturnsList] = useState([]);
  const [returnsFilter, setReturnsFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnDecisionNote, setReturnDecisionNote] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // BỔ SUNG: States cho P&L Phân Tích Lợi Nhuận & Giá Vốn Từng SKU
  const [pnlData, setPnlData] = useState(null);
  const [pnlFilter, setPnlFilter] = useState('all'); // 'all' | 'high_margin' | 'healthy' | 'low_margin'

  // BỔ SUNG: States cho Cấu Hình Vận Chuyển Động & Trợ Giá SPX Logistics
  const [shippingPolicyData, setShippingPolicyData] = useState({
    baseFee: 22000,
    freeShipThreshold: 300000,
    spxSubsidized: true,
    expressAvailable: true,
    expressSurcharge: 15000,
  });
  const [isSavingShippingPolicy, setIsSavingShippingPolicy] = useState(false);

  // BỔ SUNG: States cho Vận Hành SLA & Điểm Phạt Sao Quả Tạ
  const [slaData, setSlaData] = useState(null);

  const loadSellerReturns = () => {
    fetchSellerReturnsAPI()
      .then(list => setReturnsList(Array.isArray(list) ? list : []))
      .catch(() => {});
  };

  const loadSellerProfitAndLoss = () => {
    fetchSellerProfitAndLossAPI()
      .then(res => setPnlData(res))
      .catch(() => {});
  };

  const loadSellerShippingPolicy = () => {
    fetchSellerShippingPolicyAPI()
      .then(res => {
        if (res?.shippingPolicy) {
          setShippingPolicyData(res.shippingPolicy);
        }
      })
      .catch(() => {});
  };

  const handleSaveShippingPolicy = async (e) => {
    e.preventDefault();
    setIsSavingShippingPolicy(true);
    try {
      const res = await updateSellerShippingPolicyAPI(shippingPolicyData);
      if (res?.shippingPolicy) {
        setShippingPolicyData(res.shippingPolicy);
      }
      toast.success('Đã lưu cấu hình biểu phí vận chuyển & trợ giá SPX thành công!');
    } catch (err) {
      toast.error(`Lưu thất bại: ${err.message || 'Lỗi hệ thống'}`);
    } finally {
      setIsSavingShippingPolicy(false);
    }
  };

  const loadSellerOperationalSLA = () => {
    fetchSellerOperationalSLA_API()
      .then(res => setSlaData(res))
      .catch(() => {});
  };

  // BỔ SUNG: States cho Trợ Lý Chat Tự Động Shop (Auto-Reply Assistant)
  const [autoReplyData, setAutoReplyData] = useState({
    enabled: true,
    welcomeMessage: 'Cảm ơn bạn đã ghé thăm gian hàng! Shop đang chuẩn bị đơn và sẽ phản hồi tin nhắn trong ít phút ạ.',
    offlineMessage: 'Hiện tại shop đang ngoài giờ làm việc (sau 22:00). Bạn vui lòng để lại lời nhắn, shop sẽ trả lời ngay khi mở cửa vào 8:00 sáng mai nhé!',
    quickTemplates: [
      {
        id: 'tpl_shipping',
        triggerKeyword: 'khi nào giao',
        responseMessage: 'Đơn hàng của bạn sẽ được bàn giao cho đơn vị vận chuyển SPX trong vòng 24 giờ kể từ khi xác nhận ạ!',
      },
      {
        id: 'tpl_size',
        triggerKeyword: 'tư vấn size',
        responseMessage: 'Dạ bạn cho shop xin thông tin chiều cao và cân nặng để shop tư vấn size chuẩn form nhất cho bạn nhé!',
      },
    ],
  });
  const [isSavingAutoReply, setIsSavingAutoReply] = useState(false);
  const [testSimMessage, setTestSimMessage] = useState('Shop ơi khi nào giao hàng ạ?');
  const [testSimOutsideHours, setTestSimOutsideHours] = useState(false);
  const [autoReplySimResult, setAutoReplySimResult] = useState(null);
  const [isSimulatingAutoReply, setIsSimulatingAutoReply] = useState(false);

  const loadSellerAutoReply = () => {
    fetchSellerAutoReplyAPI()
      .then(res => {
        if (res?.autoReply) {
          setAutoReplyData(res.autoReply);
        }
      })
      .catch(() => {});
  };

  const handleSimulateAutoReply = async () => {
    setIsSimulatingAutoReply(true);
    try {
      const res = await simulateSellerAutoReplyAPI({
        message: testSimMessage,
        isOutsideWorkingHours: testSimOutsideHours,
      });
      setAutoReplySimResult(res?.data || res || null);
      toast.success('Đã chạy mô phỏng tin nhắn phản hồi thành công!');
    } catch (err) {
      toast.error(err.message || 'Lỗi mô phỏng tin nhắn');
    } finally {
      setIsSimulatingAutoReply(false);
    }
  };

  const handleSaveAutoReply = async (e) => {
    e.preventDefault();
    setIsSavingAutoReply(true);
    try {
      const res = await updateSellerAutoReplyAPI(autoReplyData);
      if (res?.autoReply) {
        setAutoReplyData(res.autoReply);
      }
      toast.success('Đã lưu cấu hình Trợ lý Chat & Tin nhắn tự động thành công!');
    } catch (err) {
      toast.error(`Lưu cấu hình thất bại: ${err.message || 'Lỗi hệ thống'}`);
    } finally {
      setIsSavingAutoReply(false);
    }
  };

  // Tự động nạp dữ liệu khi chuyển tab Funnel / Market / Staff / Ads / Returns / PnL / Shipping / SLA
  useEffect(() => {
    if (activeTab === 'funnel') {
      fetchSellerFunnelAnalytics().then(res => setSellerFunnel(res));
    } else if (activeTab === 'market') {
      fetchSellerMarketIntelligence().then(res => setSellerMarket(res));
    } else if (activeTab === 'staff') {
      fetchSellerStaff().then(res => setSellerStaffList(res || []));
    } else if (activeTab === 'ads') {
      fetchSellerAdsAPI().then(res => setAdsData(res));
    } else if (activeTab === 'returns') {
      loadSellerReturns();
    } else if (activeTab === 'pnl') {
      loadSellerProfitAndLoss();
    } else if (activeTab === 'shipping_policy') {
      loadSellerShippingPolicy();
    } else if (activeTab === 'sla_metrics') {
      loadSellerOperationalSLA();
    } else if (activeTab === 'auto_reply') {
      loadSellerAutoReply();
    } else if (activeTab === 'flashsale') {
      fetchSellerFlashSalesAPI().then(res => {
        const list = res?.flashSales || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setFlashSales(list);
        }
      }).catch(() => {});
    } else if (activeTab === 'price_radar') {
      loadSellerPriceRadar();
    }
  }, [activeTab, selectedShopId]);

  // BỔ SUNG: States cho Smart Price Comparison & Competitor Monitoring Radar (Feature 91)
  const [priceRadarData, setPriceRadarData] = useState(null);
  const [priceRadarFilter, setPriceRadarFilter] = useState('all'); // 'all' | 'winning' | 'overpriced' | 'competitive'
  const [isLoadingPriceRadar, setIsLoadingPriceRadar] = useState(false);

  const loadSellerPriceRadar = async () => {
    setIsLoadingPriceRadar(true);
    try {
      const res = await fetchSellerPriceRadarAPI();
      if (res) {
        setPriceRadarData(res);
      }
    } catch (err) {
      // Fallback local radar
    } finally {
      setIsLoadingPriceRadar(false);
    }
  };

  // Phiếu xuất kho / đóng gói hàng & Tab lọc đơn hàng
  const [packingSlipOrder, setPackingSlipOrder] = useState(null);
  const [orderTabFilter, setOrderTabFilter] = useState('all'); // 'all' | 'pending' | 'shipping' | 'completed' | 'cancelled'
  const isSelfDispatchingRef = useRef(false);

  // Đồng bộ thời gian thực 2 chiều giữa Khách hàng và Kênh Người Bán
  useEffect(() => {
    const handleSync = (e) => {
      // Bỏ qua nếu sự kiện vừa được dispatch bởi chính thao tác của component hiện tại
      if (isSelfDispatchingRef.current) return;

      try {
        const rawProducts = localStorage.getItem('mini_shopee_seller_products');
        if (rawProducts) {
          setProducts(JSON.parse(rawProducts));
        }

        const rawSellerOrders = localStorage.getItem('mini_shopee_seller_orders');
        if (rawSellerOrders) {
          setOrders(JSON.parse(rawSellerOrders));
        }

        if (e && e.type === 'mini_shopee_order_placed' && e.detail) {
          const incomingOrders = Array.isArray(e.detail) ? e.detail : [e.detail];
          const forThisShop = incomingOrders.find(o => o.shopId === selectedShopId);
          if (forThisShop) {
            toast.success(`Khách hàng ${forThisShop.customerName} vừa đặt đơn mới #${forThisShop.orderId}! Vui lòng xác nhận và đóng gói.`);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('mini_shopee_inventory_updated', handleSync);
    window.addEventListener('mini_shopee_order_placed', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mini_shopee_inventory_updated', handleSync);
      window.removeEventListener('mini_shopee_order_placed', handleSync);
    };
  }, [selectedShopId, toast]);

  // Tải đơn hàng từ máy chủ backend (đồng bộ dữ liệu thực tế)
  useEffect(() => {
    let cancelled = false;
    async function loadBackendOrders() {
      try {
        const res = await fetchSellerOrders();
        const serverOrders = res?.orders || res?.data?.orders || (Array.isArray(res) ? res : []);
        if (Array.isArray(serverOrders) && serverOrders.length > 0 && !cancelled) {
          setOrders(prev => {
            const existingIds = new Set(prev.map(o => o.orderId || o._id || o.id));
            const formatted = serverOrders.map(so => ({
              orderId: so.orderId || so._id || `ORD${Math.floor(100000 + Math.random() * 900000)}`,
              _id: so._id,
              id: so._id || so.orderId,
              shopId: so.shopId || selectedShopId,
              customerName: so.customerName || so.customer?.fullName || 'Khách Hàng',
              phone: so.phone || so.customer?.phone || '',
              address: so.address || so.customer?.address || '',
              productName: Array.isArray(so.items) ? so.items.map(it => `${it.name} (x${it.quantity})`).join(', ') : 'Sản phẩm',
              items: so.items || [],
              total: so.total || 0,
              shippingFee: so.shippingFee || 25000,
              paymentMethod: so.paymentMethod || 'COD',
              status: so.status || 'pending',
              statusText: so.statusText || (so.status === 'shipping' ? 'Đang giao hàng' : so.status === 'completed' ? 'Đã hoàn thành' : 'Chờ xác nhận'),
              createdAt: so.createdAt ? new Date(so.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
            }));
            const newFromBackend = formatted.filter(fo => !existingIds.has(fo.orderId) && !existingIds.has(fo._id));
            if (newFromBackend.length > 0) {
              const merged = [...newFromBackend, ...prev];
              try {
                localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(merged));
              } catch {}
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        // Backend offline or guest mode, ignore
      }
    }
    loadBackendOrders();
    return () => { cancelled = true; };
  }, [selectedShopId]);

  // Lưu trữ dữ liệu khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_vouchers', JSON.stringify(vouchers));
    } catch {}
  }, [vouchers]);

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(shops));
    } catch {}
  }, [shops]);

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_chats', JSON.stringify(chats));
    } catch {}
  }, [chats]);

  // Bộ lọc sản phẩm
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden' | 'low_stock'
  const [productSort, setProductSort] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'sold_desc' | 'stock_asc'

  // Bộ lọc đơn hàng
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'pending' | 'shipping' | 'completed' | 'cancelled'

  // Modal xem chi tiết đơn hàng
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Modal chỉnh sửa nhanh tồn kho (Quick Stock Edit)
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [quickStockValue, setQuickStockValue] = useState(0);

  // Modal thêm/sửa sản phẩm
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    stock: '50',
    category: 'Thời trang',
    image: '',
    description: ''
  });

  // Modal tạo voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    name: '',
    discount: '20000',
    isPercent: false,
    minOrder: '150000',
    limit: '100'
  });

  // Form cài đặt hồ sơ shop
  const [settingsForm, setSettingsForm] = useState({
    name: currentShop.name,
    phone: currentShop.phone,
    address: currentShop.address,
    bio: currentShop.bio || '',
    workingHours: currentShop.workingHours || '08:00 - 20:00 hàng ngày',
    logo: currentShop.logo
  });

  useEffect(() => {
    setSettingsForm({
      name: currentShop.name,
      phone: currentShop.phone,
      address: currentShop.address,
      bio: currentShop.bio || '',
      workingHours: currentShop.workingHours || '08:00 - 20:00 hàng ngày',
      logo: currentShop.logo
    });
  }, [currentShop]);

  const [printingOrder, setPrintingOrder] = useState(null);

  // 6. Ví Doanh Thu & Lệnh Rút Tiền
  const [withdrawals, setWithdrawals] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_withdrawals');
      return saved ? JSON.parse(saved) : INITIAL_WITHDRAWALS;
    } catch {
      return INITIAL_WITHDRAWALS;
    }
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('Vietcombank');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState('0071001234567');
  const [withdrawAccountName, setWithdrawAccountName] = useState('TRAN THI CHU SHOP');

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_withdrawals', JSON.stringify(withdrawals));
    } catch {}
  }, [withdrawals]);

  // 7. Đánh giá khách hàng & Phản hồi
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_reviews');
      return saved ? JSON.parse(saved) : INITIAL_SHOP_REVIEWS;
    } catch {
      return INITIAL_SHOP_REVIEWS;
    }
  });
  const [reviewFilterRating, setReviewFilterRating] = useState('all');
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyInputText, setReplyInputText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_reviews', JSON.stringify(reviews));
    } catch {}
  }, [reviews]);

  // 8. Chiến dịch Flash Sale của Shop
  const [flashSales, setFlashSales] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_flashsales');
      return saved ? JSON.parse(saved) : INITIAL_FLASHSALES;
    } catch {
      return INITIAL_FLASHSALES;
    }
  });
  const [showCreateFlashSaleModal, setShowCreateFlashSaleModal] = useState(false);
  const [flashSaleForm, setFlashSaleForm] = useState({
    title: '',
    timeSlot: '12:00 - 15:00 Hôm Nay',
    discountPercent: '25',
    totalQuota: '50',
    itemsCount: '3'
  });

  useEffect(() => {
    try {
      localStorage.setItem('mini_shopee_seller_flashsales', JSON.stringify(flashSales));
    } catch {}
  }, [flashSales]);

  // Dữ liệu lọc cho riêng Shop hiện tại
  const shopProducts = useMemo(() => {
    return products.filter(p => p.shopId === selectedShopId);
  }, [products, selectedShopId]);

  const shopOrders = useMemo(() => {
    return orders.filter(o => o.shopId === selectedShopId);
  }, [orders, selectedShopId]);

  const shopVouchers = useMemo(() => {
    return vouchers.filter(v => v.shopId === selectedShopId);
  }, [vouchers, selectedShopId]);

  const shopChats = useMemo(() => {
    return chats.filter(c => c.shopId === selectedShopId);
  }, [chats, selectedShopId]);

  const shopWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.shopId === selectedShopId);
  }, [withdrawals, selectedShopId]);

  const shopReviews = useMemo(() => {
    return reviews.filter(r => r.shopId === selectedShopId);
  }, [reviews, selectedShopId]);

  const shopFlashSales = useMemo(() => {
    return flashSales.filter(f => f.shopId === selectedShopId);
  }, [flashSales, selectedShopId]);

  // Tính số tiền đã rút thành công
  const totalWithdrawn = useMemo(() => {
    return shopWithdrawals
      .filter(w => w.status !== 'failed')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  }, [shopWithdrawals]);

  // Số dư ví khả dụng (kết hợp doanh thu đã chốt + số dư khả dụng gốc trừ đi rút tiền)
  const shopWalletBalance = useMemo(() => {
    const completedRev = shopOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return Math.max(0, 12500000 + completedRev - totalWithdrawn);
  }, [shopOrders, totalWithdrawn]);

  // Tiền chờ quyết toán (đơn đang giao SPX hoặc đang chờ xác nhận)
  const shopPendingBalance = useMemo(() => {
    return shopOrders
      .filter(o => o.status === 'shipping' || o.status === 'pending')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [shopOrders]);

  // Tính toán số liệu thống kê chuẩn xác cho Shop
  const totalRevenue = useMemo(() => {
    return shopOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [shopOrders]);

  const pendingOrdersCount = useMemo(() => {
    return shopOrders.filter(o => o.status === 'pending').length;
  }, [shopOrders]);

  const totalSoldItems = useMemo(() => {
    return shopProducts.reduce((sum, p) => sum + (p.sold || 0), 0);
  }, [shopProducts]);

  const isLowStockProduct = (p) => (Number(p.stock) || 0) <= (typeof p.safetyThreshold === 'number' ? p.safetyThreshold : 10);
  const isNearExpiryProduct = (p) => {
    if (p.clearanceStatus === 'near_expiry') return true;
    if (!p.expiryDate) return false;
    const days = Math.ceil((new Date(p.expiryDate) - new Date()) / 86400000);
    return days > 0 && days <= 60;
  };
  const isClearanceProduct = (p) => p.clearanceStatus === 'clearance';

  const lowStockCount = useMemo(() => {
    return shopProducts.filter(isLowStockProduct).length;
  }, [shopProducts]);

  const nearExpiryCount = useMemo(() => {
    return shopProducts.filter(isNearExpiryProduct).length;
  }, [shopProducts]);

  const clearanceCount = useMemo(() => {
    return shopProducts.filter(isClearanceProduct).length;
  }, [shopProducts]);

  // Lọc sản phẩm theo từ khóa, ngành hàng, trạng thái, sắp xếp
  const filteredProducts = useMemo(() => {
    let list = [...shopProducts];

    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }

    if (productCategoryFilter !== 'all') {
      list = list.filter(p => p.category === productCategoryFilter);
    }

    if (productStatusFilter === 'active') {
      list = list.filter(p => p.isActive && p.stock > 0);
    } else if (productStatusFilter === 'hidden') {
      list = list.filter(p => !p.isActive);
    } else if (productStatusFilter === 'low_stock') {
      list = list.filter(isLowStockProduct);
    } else if (productStatusFilter === 'near_expiry') {
      list = list.filter(isNearExpiryProduct);
    } else if (productStatusFilter === 'clearance') {
      list = list.filter(isClearanceProduct);
    }

    if (productSort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (productSort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (productSort === 'sold_desc') {
      list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else if (productSort === 'stock_asc') {
      list.sort((a, b) => a.stock - b.stock);
    }

    return list;
  }, [shopProducts, productSearch, productCategoryFilter, productStatusFilter, productSort]);

  // =========================================================================
  // STATES & HANDLERS: MA TRẬN NHẬP KHO HÀNG LOẠT (BATCH INVENTORY MATRIX)
  // =========================================================================
  const [showBatchInventoryModal, setShowBatchInventoryModal] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState(new Set());
  const [batchItems, setBatchItems] = useState({});
  const [batchModalFilter, setBatchModalFilter] = useState('all'); // 'all' | 'low_stock' | 'near_expiry'
  const [bulkAddStockInput, setBulkAddStockInput] = useState('');
  const [bulkSafetyThresholdInput, setBulkSafetyThresholdInput] = useState('');
  const [bulkClearanceStatusInput, setBulkClearanceStatusInput] = useState('normal');
  const [bulkClearanceDiscountInput, setBulkClearanceDiscountInput] = useState('20');
  const [isSavingBatchInventory, setIsSavingBatchInventory] = useState(false);

  const handleOpenBatchInventoryModal = () => {
    const initialMap = {};
    const initialSelected = new Set();
    shopProducts.forEach(p => {
      const pid = p._id || p.id;
      initialSelected.add(pid);
      initialMap[pid] = {
        productId: pid,
        name: p.name,
        image: p.image,
        category: p.category,
        currentStock: Number(p.stock) || 0,
        addStock: 0,
        newStock: Number(p.stock) || 0,
        safetyThreshold: typeof p.safetyThreshold === 'number' ? p.safetyThreshold : 10,
        expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : '',
        clearanceStatus: p.clearanceStatus || 'normal',
        clearanceDiscount: p.clearanceDiscount || 0,
        batchCode: p.batchCode || '',
      };
    });
    setBatchItems(initialMap);
    setBatchSelectedIds(initialSelected);
    setBulkAddStockInput('');
    setBulkSafetyThresholdInput('');
    setBatchModalFilter('all');
    setShowBatchInventoryModal(true);
  };

  const handleToggleBatchSelectAll = () => {
    if (batchSelectedIds.size === shopProducts.length) {
      setBatchSelectedIds(new Set());
    } else {
      setBatchSelectedIds(new Set(shopProducts.map(p => p._id || p.id)));
    }
  };

  const handleToggleBatchSelectOne = (id) => {
    setBatchSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchItemChange = (id, field, value) => {
    setBatchItems(prev => {
      const it = prev[id] || {};
      const updated = { ...it, [field]: value };
      if (field === 'addStock') {
        const add = Number(value) || 0;
        updated.newStock = Math.max(0, (it.currentStock || 0) + add);
      }
      return { ...prev, [id]: updated };
    });
  };

  const applyBulkAddStock = () => {
    const addVal = Number(bulkAddStockInput);
    if (isNaN(addVal) || addVal <= 0) {
      toast.error('Vui lòng nhập số lượng nhập thêm hợp lệ (> 0)!');
      return;
    }
    setBatchItems(prev => {
      const copy = { ...prev };
      batchSelectedIds.forEach(id => {
        if (copy[id]) {
          copy[id] = {
            ...copy[id],
            addStock: addVal,
            newStock: Math.max(0, (copy[id].currentStock || 0) + addVal),
          };
        }
      });
      return copy;
    });
    toast.success(`Đã áp dụng nhập thêm +${addVal} cái cho ${batchSelectedIds.size} mặt hàng!`);
  };

  const applyBulkSafetyThreshold = () => {
    const threshVal = Number(bulkSafetyThresholdInput);
    if (isNaN(threshVal) || threshVal < 0) {
      toast.error('Vui lòng nhập ngưỡng tồn an toàn hợp lệ (≥ 0)!');
      return;
    }
    setBatchItems(prev => {
      const copy = { ...prev };
      batchSelectedIds.forEach(id => {
        if (copy[id]) {
          copy[id] = {
            ...copy[id],
            safetyThreshold: threshVal,
          };
        }
      });
      return copy;
    });
    toast.success(`Đã đặt ngưỡng an toàn ${threshVal} cái cho ${batchSelectedIds.size} mặt hàng!`);
  };

  const applyBulkClearance = () => {
    const discountVal = Number(bulkClearanceDiscountInput) || 0;
    setBatchItems(prev => {
      const copy = { ...prev };
      batchSelectedIds.forEach(id => {
        if (copy[id]) {
          copy[id] = {
            ...copy[id],
            clearanceStatus: bulkClearanceStatusInput,
            clearanceDiscount: discountVal,
          };
        }
      });
      return copy;
    });
    toast.success(`Đã cập nhật phân loại kho cho ${batchSelectedIds.size} mặt hàng!`);
  };

  const handleSaveBatchInventory = async () => {
    if (batchSelectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 mặt hàng để cập nhật!');
      return;
    }

    const updates = Array.from(batchSelectedIds).map(id => {
      const it = batchItems[id] || {};
      return {
        productId: id,
        addStock: Number(it.addStock) || 0,
        safetyThreshold: Number(it.safetyThreshold) || 10,
        expiryDate: it.expiryDate || null,
        clearanceStatus: it.clearanceStatus || 'normal',
        clearanceDiscount: Number(it.clearanceDiscount) || 0,
        batchCode: it.batchCode || '',
      };
    });

    setIsSavingBatchInventory(true);
    try {
      const res = await batchUpdateInventoryAPI(updates);
      setProducts(prev => {
        const next = prev.map(p => {
          const u = updates.find(item => item.productId === (p._id || p.id));
          if (!u) return p;
          const newStock = Math.max(0, (Number(p.stock) || 0) + u.addStock);
          return {
            ...p,
            stock: newStock,
            safetyThreshold: u.safetyThreshold,
            expiryDate: u.expiryDate,
            clearanceStatus: u.clearanceStatus,
            clearanceDiscount: u.clearanceDiscount,
            batchCode: u.batchCode,
          };
        });
        try {
          localStorage.setItem('mini_shopee_seller_products', JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.success(res?.data?.message || res?.message || `Đã cập nhật tồn kho hàng loạt cho ${updates.length} sản phẩm thành công!`);
      setShowBatchInventoryModal(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật tồn kho hàng loạt');
    } finally {
      setIsSavingBatchInventory(false);
    }
  };

  // =========================================================================
  // STATES & HANDLERS: SHOPEE ADS SIMULATOR
  // =========================================================================
  const [simProductId, setSimProductId] = useState('');
  const [simKeywordsInput, setSimKeywordsInput] = useState('áo thun nam, áo thun oversize cotton, thời trang genz');
  const [simMatchType, setSimMatchType] = useState('exact');
  const [simBidPrice, setSimBidPrice] = useState(1500);
  const [simBudgetDaily, setSimBudgetDaily] = useState(100000);
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!simProductId && shopProducts.length > 0) {
      setSimProductId(shopProducts[0]._id || shopProducts[0].id);
    }
  }, [shopProducts, simProductId]);

  const handleRunAdsSimulator = async () => {
    const rawKws = simKeywordsInput
      .split(/[,;\n]+/)
      .map(k => k.trim())
      .filter(Boolean);

    if (rawKws.length === 0) {
      toast.error('Vui lòng nhập ít nhất một từ khóa mục tiêu!');
      return;
    }

    const selectedProduct = shopProducts.find(p => (p._id || p.id) === simProductId);
    const productPrice = selectedProduct?.price || 250000;

    const keywordsPayload = rawKws.map(k => ({
      keyword: k,
      bidPrice: Number(simBidPrice) || 1000,
      matchType: simMatchType,
    }));

    setIsSimulating(true);
    try {
      const res = await simulateSellerAdsAPI({
        keywords: keywordsPayload,
        budgetDaily: Number(simBudgetDaily) || 100000,
        productPrice,
        category: selectedProduct?.category || 'Thời trang',
      });
      const data = res?.data || res;
      setSimResult(data);
      toast.success('Dự phóng mô phỏng Shopee Ads thành công!');
    } catch (err) {
      const avgCpc = Math.max(500, Math.round(Number(simBidPrice) * 0.88));
      const ctr = simMatchType === 'broad' ? 3.8 : 5.6;
      const budget = Number(simBudgetDaily) || 100000;
      const clicks = Math.min(rawKws.length * 280, Math.floor(budget / avgCpc));
      const spend = clicks * avgCpc;
      const orders = Math.max(1, Math.round(clicks * 0.042));
      const adGmv = orders * productPrice;
      const roas = spend > 0 ? Number((adGmv / spend).toFixed(2)) : 0;
      const roi = spend > 0 ? Number((((adGmv - spend) / spend) * 100).toFixed(1)) : 0;
      const impressions = Math.round(clicks / (ctr / 100));

      setSimResult({
        projectedDaily: {
          impressions,
          clicks,
          ctr,
          cpc: avgCpc,
          spend,
          orders,
          adGmv,
          roas,
          roi,
        },
        projectedMonthly: {
          impressions: impressions * 30,
          clicks: clicks * 30,
          spend: spend * 30,
          orders: orders * 30,
          adGmv: adGmv * 30,
          roas,
          roi,
        },
        keywordBreakdown: rawKws.map(kw => ({
          keyword: kw,
          matchType: simMatchType,
          bidPrice: Number(simBidPrice),
          cpc: avgCpc,
          ctr,
          projectedImpressions: Math.round(impressions / rawKws.length),
          projectedClicks: Math.round(clicks / rawKws.length),
          projectedOrders: Math.max(1, Math.round(orders / rawKws.length)),
          adGmv: Math.round(adGmv / rawKws.length),
        })),
      });
      toast.info('Đã dự phóng kết quả Shopee Ads thành công!');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplySimToCampaign = () => {
    if (!simResult) return;
    const selectedProduct = shopProducts.find(p => (p._id || p.id) === simProductId);
    const rawKws = simKeywordsInput.split(/[,;\n]+/).map(k => k.trim()).filter(Boolean);
    const firstKw = rawKws[0] || 'áo thun hot';
    setAdsForm({
      campaignName: `Quảng Cáo Tìm Kiếm - ${selectedProduct?.name?.slice(0, 30) || 'Sản Phẩm Hot'} (Simulator)`,
      type: 'SEARCH_ADS',
      budgetDaily: Number(simBudgetDaily) || 100000,
      budgetTotal: (Number(simBudgetDaily) || 100000) * 30,
      keyword1: firstKw,
      bidPrice1: Number(simBidPrice) || 1500,
      targetKeywords: rawKws.map(k => ({ keyword: k, bidPrice: Number(simBidPrice), matchType: simMatchType })),
      impressions: simResult.projectedDaily?.impressions,
      clicks: simResult.projectedDaily?.clicks,
      ctr: simResult.projectedDaily?.ctr,
      cpc: simResult.projectedDaily?.cpc,
      conversions: simResult.projectedDaily?.orders,
      conversionRevenue: simResult.projectedDaily?.adGmv,
      roas: simResult.projectedDaily?.roas,
    });
    setShowCreateAdsModal(true);
  };

  // =========================================================================
  // STATES & HANDLERS: FLASH SALE SLOTS VỚI PRODUCT PICKER & VALIDATION
  // =========================================================================
  const [flashSaleSelectedItems, setFlashSaleSelectedItems] = useState([]);

  const handleOpenCreateFlashSaleModal = () => {
    const defaultSelected = shopProducts.slice(0, 3).map(p => {
      const origPrice = p.price || 100000;
      return {
        productId: p._id || p.id,
        name: p.name,
        image: p.image,
        stock: p.stock || 50,
        originalPrice: origPrice,
        flashPrice: Math.round(origPrice * 0.7),
        discountPercent: 30,
        stockLimit: Math.min(20, p.stock || 20),
      };
    });
    setFlashSaleSelectedItems(defaultSelected);
    setFlashSaleForm({
      title: 'Flash Sale Giờ Vàng Của Shop',
      timeSlot: '12:00 - 15:00 Hôm Nay',
      discountPercent: '30',
      totalQuota: '60',
      itemsCount: defaultSelected.length,
    });
    setShowCreateFlashSaleModal(true);
  };

  const handleToggleSelectProductForFlashSale = (prod) => {
    const id = prod._id || prod.id;
    setFlashSaleSelectedItems(prev => {
      const exists = prev.find(it => it.productId === id);
      if (exists) {
        return prev.filter(it => it.productId !== id);
      } else {
        const origPrice = prod.price || 100000;
        return [
          ...prev,
          {
            productId: id,
            name: prod.name,
            image: prod.image,
            stock: prod.stock || 50,
            originalPrice: origPrice,
            flashPrice: Math.round(origPrice * 0.7),
            discountPercent: 30,
            stockLimit: Math.min(20, prod.stock || 20),
          }
        ];
      }
    });
  };

  const handleUpdateFlashSaleItem = (prodId, field, value) => {
    setFlashSaleSelectedItems(prev => prev.map(it => {
      if (it.productId !== prodId) return it;
      const updated = { ...it, [field]: value };
      if (field === 'flashPrice') {
        const fp = Number(value) || 0;
        const op = Number(it.originalPrice) || 1;
        updated.discountPercent = fp < op ? Math.round(((op - fp) / op) * 100) : 0;
      }
      return updated;
    }));
  };

  const handleDeleteFlashSale = async (fsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiên Flash Sale này?')) return;
    try {
      await deleteSellerFlashSaleAPI(fsId);
      setFlashSales(prev => prev.filter(f => (f.id || f._id) !== fsId));
      toast.success('Đã xóa phiên Flash Sale thành công!');
    } catch {
      setFlashSales(prev => prev.filter(f => (f.id || f._id) !== fsId));
      toast.success('Đã xóa phiên Flash Sale thành công!');
    }
  };

  // =========================================================================
  // STATES & HANDLERS: COD RECONCILIATION & REMITTANCE (Feature 89)
  // =========================================================================
  const [codReconciliationData, setCodReconciliationData] = useState(null);
  const [loadingCod, setLoadingCod] = useState(false);
  const [selectedCodOrderIds, setSelectedCodOrderIds] = useState([]);
  const [isReconcilingCod, setIsReconcilingCod] = useState(false);

  useEffect(() => {
    if (activeTab === 'cod_reconciliation') {
      let active = true;
      (async () => {
        try {
          setLoadingCod(true);
          const data = await fetchSellerCodReconciliationAPI();
          if (active && data) {
            setCodReconciliationData(data);
          }
        } catch (err) {
          console.warn('Failed to fetch COD reconciliation data:', err?.message);
        } finally {
          if (active) setLoadingCod(false);
        }
      })();
      return () => { active = false; };
    }
  }, [activeTab, selectedShopId]);

  const handleToggleSelectCodOrder = (id) => {
    setSelectedCodOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCollectedCodOrders = () => {
    const collectedOrders = (codReconciliationData?.orders || []).filter(
      (o) => o.codSettlementStatus === 'collected_by_courier'
    );
    if (selectedCodOrderIds.length === collectedOrders.length) {
      setSelectedCodOrderIds([]);
    } else {
      setSelectedCodOrderIds(collectedOrders.map((o) => o.id || o.orderId));
    }
  };

  const handleReconcileSelectedCod = async () => {
    if (selectedCodOrderIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đơn COD đã thu tiền để quyết toán!');
      return;
    }

    try {
      setIsReconcilingCod(true);
      await reconcileSellerCodOrdersAPI(selectedCodOrderIds);
      toast.success(`Đã đối soát thành công ${selectedCodOrderIds.length} đơn hàng COD về ví doanh thu Shop!`);
      setSelectedCodOrderIds([]);
      const updated = await fetchSellerCodReconciliationAPI();
      if (updated) setCodReconciliationData(updated);
    } catch (err) {
      toast.error(err.message || 'Lỗi đối soát COD, vui lòng thử lại');
    } finally {
      setIsReconcilingCod(false);
    }
  };

  // Lọc đơn hàng theo trạng thái và tìm kiếm
  const filteredOrders = useMemo(() => {
    let list = [...shopOrders];

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      list = list.filter(o => 
        (o.orderId || '').toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q)
      );
    }

    if (orderStatusFilter !== 'all') {
      list = list.filter(o => o.status === orderStatusFilter);
    }

    return list;
  }, [shopOrders, orderSearch, orderStatusFilter]);

  // Xử lý mở Modal thêm sản phẩm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      originalPrice: '',
      stock: '50',
      category: currentShop.category || 'Thời trang',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      description: ''
    });
    setShowProductModal(true);
  };

  // Xử lý sửa sản phẩm
  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      originalPrice: prod.originalPrice || Math.round(prod.price * 1.3),
      stock: prod.stock,
      category: prod.category,
      image: prod.image,
      description: prod.description || ''
    });
    setShowProductModal(true);
  };

  // Hàm AI tự động nhận diện phân loại danh mục dựa trên tên sản phẩm
  const autoDetectCategory = (productName = '', fallbackCategory = 'Thời trang') => {
    if (!productName || typeof productName !== 'string') return fallbackCategory;
    const lower = productName.toLowerCase();
    
    if (/(áo|quần|váy|đầm|giày|dép|thun|jean|kaki|sơ mi|polo|hoodie|thời trang|suit|vest|áo khoác|tất|vớ|nón|mũ|thắt lưng|ví da)/i.test(lower)) {
      return 'Thời trang';
    }
    if (/(tai nghe|chuột|bàn phím|loa|điện thoại|laptop|cáp|sạc|bluetooth|công nghệ|màn hình|pin dự phòng|soundbar|webcam|ipad|máy tính)/i.test(lower)) {
      return 'Điện tử';
    }
    if (/(serum|kem|son|phấn|mỹ phẩm|nước hoa|sữa rửa mặt|tẩy trang|chống nắng|dưỡng ẩm|toner|retinol|bha|aha|mặt nạ)/i.test(lower)) {
      return 'Sắc đẹp';
    }
    if (/(nồi|chảo|robot|máy hút bụi|lọc nước|lọc không khí|bếp|bình giữ nhiệt|gia dụng|quạt|máy sấy|lò vi sóng|bình đun)/i.test(lower)) {
      return 'Gia dụng';
    }
    if (/(tập|gym|yoga|bóng|cầu lông|chạy bộ|dã ngoại|lều|thể thao|xe đạp|tạ|băng cổ chân|bình nước thể thao)/i.test(lower)) {
      return 'Thể thao';
    }
    if (/(tã|bỉm|bình sữa|ti giả|mẹ và bé|sơ sinh|xe đẩy|nôi|núm ti|ghế ăn dặm)/i.test(lower)) {
      return 'Mẹ & Bé';
    }
    if (/(sách|bút|vở|nông sản|hạt|trà|cà phê|organic|đời sống|mật ong|yến mạch)/i.test(lower)) {
      return 'Đời sống';
    }
    
    return fallbackCategory || 'Thời trang';
  };

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      toast.error('Vui lòng nhập đầy đủ tên và giá bán!');
      return;
    }

    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    if (isNaN(price) || price < 1000) {
      toast.error('Giá bán tối thiểu từ 1.000₫!');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error('Số lượng tồn kho không được âm!');
      return;
    }

    if (editingProduct) {
      const updatedList = products.map(p => {
        if (p._id === editingProduct._id) {
          return {
            ...p,
            name: productForm.name.trim(),
            price: Number(productForm.price),
            originalPrice: Number(productForm.originalPrice) || Number(productForm.price),
            stock: Number(productForm.stock),
            category: productForm.category,
            image: productForm.image || p.image,
            description: productForm.description
          };
        }
        return p;
      });
      setProducts(updatedList);
      try {
        localStorage.setItem('mini_shopee_seller_products', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('mini_shopee_inventory_updated', { detail: updatedList }));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      toast.success(`Đã cập nhật sản phẩm "${productForm.name}" thành công!`);
    } else {
      const detectedCat = autoDetectCategory(productForm.name, productForm.category || currentShop.category);
      const newProd = {
        _id: 'prod_' + Date.now(),
        id: 'prod_' + Date.now(),
        shopId: selectedShopId,
        shopName: currentShop.name,
        brand: currentShop.name,
        name: productForm.name.trim(),
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice) || Math.round(Number(productForm.price) * 1.3),
        stock: Number(productForm.stock) || 50,
        sold: 0,
        rating: 5.0,
        reviewCount: 0,
        category: detectedCat,
        image: productForm.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        images: [productForm.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
        description: productForm.description || `Sản phẩm chính hãng chất lượng cao từ gian hàng ${currentShop.name}.`,
        isActive: true
      };
      const updatedList = [newProd, ...products];
      setProducts(updatedList);
      try {
        localStorage.setItem('mini_shopee_seller_products', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('mini_shopee_inventory_updated', { detail: updatedList }));
        window.dispatchEvent(new Event('storage'));
      } catch {}

      // Đồng bộ đăng bán sản phẩm lên backend API
      try {
        createSellerProduct({
          name: newProd.name,
          price: newProd.price,
          originalPrice: newProd.originalPrice,
          stock: newProd.stock,
          category: newProd.category,
          image: newProd.image,
          images: newProd.images,
          description: newProd.description,
        }).catch(err => console.warn("Backend sync seller product:", err.message));
      } catch {}

      toast.success(`Đã đăng bán sản phẩm mới "${newProd.name}" lên toàn sàn (Phân loại: ${detectedCat})!`);
    }
    setShowProductModal(false);
  };

  // Cập nhật nhanh số lượng kho
  const handleSaveQuickStock = () => {
    if (!quickStockProduct) return;
    const newStock = Math.max(0, Number(quickStockValue) || 0);
    const updatedList = products.map(p => {
      if (p._id === quickStockProduct._id) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updatedList);
    try {
      localStorage.setItem('mini_shopee_seller_products', JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('mini_shopee_inventory_updated', { detail: updatedList }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    toast.success(`Đã cập nhật tồn kho cho "${quickStockProduct.name}": ${newStock} cái`);
    setQuickStockProduct(null);
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (prodId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi Shop?")) {
      const updatedList = products.filter(p => p._id !== prodId);
      setProducts(updatedList);
      try {
        localStorage.setItem('mini_shopee_seller_products', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('mini_shopee_inventory_updated', { detail: updatedList }));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      toast.info("Đã xóa sản phẩm khỏi gian hàng.");
    }
  };

  // Bật/tắt trạng thái ẩn hiện sản phẩm
  const handleToggleActive = (prodId) => {
    const updatedList = products.map(p => {
      if (p._id === prodId) {
        const nextState = !p.isActive;
        toast.info(nextState ? 'Đã hiển thị sản phẩm trên sàn' : 'Đã tạm ẩn sản phẩm');
        return { ...p, isActive: nextState };
      }
      return p;
    });
    setProducts(updatedList);
    try {
      localStorage.setItem('mini_shopee_seller_products', JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('mini_shopee_inventory_updated', { detail: updatedList }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  // Cập nhật trạng thái đơn hàng (Quy trình chuẩn: Chờ xác nhận -> Đang giao -> Đã hoàn thành -> Đã hủy)
  const handleUpdateOrderStatus = async (orderId, nextStatus, nextText) => {
    isSelfDispatchingRef.current = true;
    let affectedOrder = null;
    let updatedOrders = [];

    setOrders(prev => {
      updatedOrders = prev.map(o => {
        const matches = o.orderId === orderId || o._id === orderId || o.id === orderId;
        if (matches) {
          affectedOrder = o;
          // Nếu hủy đơn hàng, hoàn trả lại tồn kho sản phẩm cho Shop
          if (nextStatus === 'cancelled' && o.status !== 'cancelled' && Array.isArray(o.items) && o.items.length > 0) {
            restoreProductStock(o.items);
          }
          return { ...o, status: nextStatus, statusText: nextText };
        }
        return o;
      });
      try {
        localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(updatedOrders));
      } catch {}
      return updatedOrders;
    });

    // Đồng bộ sang máy chủ backend API
    try {
      await updateSellerOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.warn("Backend order status update fallback:", err.message);
    }

    // Đồng bộ tức thì sang danh sách đơn hàng của người mua (Customer Order History)
    try {
      const rawCustomer = localStorage.getItem('mini_shopee_customer_orders');
      if (rawCustomer) {
        const parsed = JSON.parse(rawCustomer);
        const updatedCustomer = parsed.map(co => {
          const matches = co.orderId === orderId || co._id === orderId || co.id === orderId;
          if (matches) {
            let nextStep = co.stepIndex || 1;
            if (nextStatus === 'shipping') nextStep = 3;
            else if (nextStatus === 'completed') nextStep = 4;
            else if (nextStatus === 'cancelled') nextStep = 0;

            const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              ...co,
              status: nextStatus,
              statusText: nextText,
              stepIndex: nextStep,
              timeline: [
                ...(co.timeline || []),
                { time: `Hôm nay ${nowStr}`, text: `Cửa hàng ${currentShop.name} đã cập nhật: ${nextText}` }
              ]
            };
          }
          return co;
        });
        localStorage.setItem('mini_shopee_customer_orders', JSON.stringify(updatedCustomer));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error("Lỗi đồng bộ trạng thái đơn hàng:", err);
    } finally {
      setTimeout(() => {
        isSelfDispatchingRef.current = false;
      }, 300);
    }

    toast.success(`Đơn #${orderId}: ${nextText}`);
    if (selectedOrderDetails && (selectedOrderDetails.orderId === orderId || selectedOrderDetails._id === orderId || selectedOrderDetails.id === orderId)) {
      setSelectedOrderDetails(prev => ({ ...prev, status: nextStatus, statusText: nextText }));
    }
  };

  // Xác nhận hàng loạt toàn bộ đơn hàng Chờ xác nhận
  const handleBulkConfirmPendingOrders = async () => {
    const pendingOrders = shopOrders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) {
      toast.info('Không có đơn hàng nào ở trạng thái Chờ xác nhận');
      return;
    }
    const orderIds = pendingOrders.map((o) => o.orderId || o._id || o.id);
    try {
      await batchDispatchSellerOrdersAPI(orderIds);
    } catch (e) {
      console.warn("Backend batch dispatch fallback:", e.message);
    }

    const updated = orders.map((o) => {
      if (o.shopId === selectedShopId && o.status === 'pending') {
        return {
          ...o,
          status: 'shipping',
          statusText: 'Đang giao hàng',
          trackingCode: o.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        };
      }
      return o;
    });
    setOrders(updated);
    try {
      localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    toast.success(`Đã chuẩn bị và bàn giao ${pendingOrders.length} đơn hàng cho SPX Express thành công!`);
  };

  // Xuất báo cáo danh sách đơn hàng ra file CSV
  const handleExportOrdersCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Không có đơn hàng để xuất dữ liệu');
      return;
    }
    const headers = ['Mã đơn hàng', 'Thời gian', 'Khách hàng', 'Số điện thoại', 'Địa chỉ', 'Mặt hàng', 'Tổng tiền (VND)', 'Phương thức TT', 'Trạng thái'];
    const rows = filteredOrders.map(o => [
      o.orderId || o.id || '',
      o.createdAt || '',
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.phone || '').replace(/"/g, '""')}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.productName || o.items?.[0]?.name || '').replace(/"/g, '""')}"`,
      o.total || 0,
      `"${(o.paymentMethod || 'COD').replace(/"/g, '""')}"`,
      `"${(o.statusText || o.status || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Don_Hang_${selectedShopId}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất báo cáo ${filteredOrders.length} đơn hàng ra file CSV thành công!`);
  };

  // Tạo voucher mới cho Shop
  const handleCreateShopVoucher = (e) => {
    e.preventDefault();
    const code = voucherForm.code.toUpperCase().trim();
    if (!code) {
      toast.error('Vui lòng nhập mã ưu đãi!');
      return;
    }

    const discountVal = Number(voucherForm.discount);
    if (isNaN(discountVal) || discountVal <= 0) {
      toast.error('Mức giảm giá phải lớn hơn 0!');
      return;
    }

    const newVoucher = {
      id: `sv_${Date.now()}`,
      shopId: selectedShopId,
      code,
      name: voucherForm.name || `Ưu đãi ${code}`,
      discount: discountVal,
      isPercent: voucherForm.isPercent,
      minOrder: Math.max(0, Number(voucherForm.minOrder) || 0),
      used: 0,
      limit: Math.max(1, Number(voucherForm.limit) || 100),
      active: true,
    };

    setVouchers(prev => [newVoucher, ...prev]);
    setShowVoucherModal(false);
    setVoucherForm({ code: '', name: '', discount: '20000', isPercent: false, minOrder: '150000', limit: '100' });
    toast.success(`Đã tạo mã ưu đãi "${newVoucher.code}" thành công!`);
  };

  // Lưu cài đặt thông tin Shop
  const handleSaveShopSettings = (e) => {
    e.preventDefault();
    setShops(prev => prev.map(s => {
      if (s.id === selectedShopId) {
        return {
          ...s,
          name: settingsForm.name,
          phone: settingsForm.phone,
          address: settingsForm.address,
          bio: settingsForm.bio,
          workingHours: settingsForm.workingHours,
          logo: settingsForm.logo
        };
      }
      return s;
    }));
    toast.success('Đã lưu thông tin hồ sơ cửa hàng thành công!');
  };

  // Gửi tin nhắn trả lời khách hàng
  const handleSendChatReply = (e) => {
    e.preventDefault();
    if (!chatReplyText.trim() || !activeChatId) return;

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        const newMsg = {
          sender: 'seller',
          text: chatReplyText.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...c,
          lastMessage: chatReplyText.trim(),
          unread: false,
          messages: [...(c.messages || []), newMsg]
        };
      }
      return c;
    }));

    setChatReplyText('');
    toast.success('Đã gửi phản hồi đến khách hàng!');
  };

  // Rút tiền từ ví doanh thu về tài khoản ngân hàng
  const handleCreateWithdraw = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 100000) {
      toast.error('Số tiền rút tối thiểu là 100.000₫!');
      return;
    }
    if (amt > shopWalletBalance) {
      toast.error('Số dư khả dụng trong ví không đủ để thực hiện rút tiền!');
      return;
    }
    if (!withdrawAccountNum.trim() || !withdrawAccountName.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng nhận tiền!');
      return;
    }

    try {
      await requestSellerWithdrawalAPI({
        amount: amt,
        bankName: withdrawBank,
        accountNumber: withdrawAccountNum.trim(),
        accountName: withdrawAccountName.toUpperCase().trim(),
      });
    } catch (err) {
      console.warn("requestSellerWithdrawalAPI fallback:", err.message);
    }

    const newWd = {
      id: `WD${Math.floor(10000 + Math.random() * 90000)}`,
      shopId: selectedShopId,
      date: new Date().toLocaleString('vi-VN'),
      amount: amt,
      bankName: withdrawBank,
      accountNumber: withdrawAccountNum.trim(),
      accountHolder: withdrawAccountName.toUpperCase().trim(),
      status: 'completed',
      statusText: 'Thành công (Đã chuyển khoản)',
    };

    setWithdrawals(prev => [newWd, ...prev]);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    toast.success(`Lệnh rút ${formatCurrency(amt)} về ${withdrawBank} đã được duyệt & chuyển khoản thành công!`);
  };

  // Trả lời phản hồi đánh giá của khách hàng
  const handleSendReviewReply = (reviewId) => {
    if (!replyInputText.trim()) return;
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return { ...r, reply: replyInputText.trim() };
      }
      return r;
    }));
    toast.success('Đã gửi câu trả lời đánh giá khách hàng thành công!');
    setReplyingReviewId(null);
    setReplyInputText('');
  };

  // Tạo chiến dịch Flash Sale mới cho Shop
  const handleCreateFlashSaleSubmit = async (e) => {
    e.preventDefault();
    if (!flashSaleForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề chiến dịch Flash Sale!');
      return;
    }
    if (flashSaleSelectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm tham gia Flash Sale!');
      return;
    }

    // Client-side validations
    for (const item of flashSaleSelectedItems) {
      if (Number(item.flashPrice) >= Number(item.originalPrice)) {
        toast.error(`Giá Flash Sale của "${item.name}" phải nhỏ hơn giá gốc (${formatCurrency(item.originalPrice)})!`);
        return;
      }
      if (Number(item.stockLimit) > Number(item.stock)) {
        toast.error(`Suất bán Flash Sale (${item.stockLimit}) vượt quá tồn kho (${item.stock}) của "${item.name}"!`);
        return;
      }
      if (Number(item.stockLimit) <= 0) {
        toast.error(`Suất bán của "${item.name}" phải lớn hơn 0!`);
        return;
      }
    }

    try {
      const payload = {
        slotTime: flashSaleForm.timeSlot,
        items: flashSaleSelectedItems.map(it => ({
          productId: it.productId,
          name: it.name,
          originalPrice: Number(it.originalPrice),
          flashPrice: Number(it.flashPrice),
          discountPercent: Number(it.discountPercent) || Math.round(((Number(it.originalPrice) - Number(it.flashPrice)) / Number(it.originalPrice)) * 100),
          stockLimit: Number(it.stockLimit),
        })),
      };
      const res = await createSellerFlashSaleAPI(payload);
      const createdFs = res?.data?.flashSale || res?.flashSale || {
        _id: `fs_${Date.now()}`,
        id: `fs_${Date.now()}`,
        shopId: selectedShopId,
        title: flashSaleForm.title.trim(),
        timeSlot: flashSaleForm.timeSlot,
        status: 'upcoming',
        discountPercent: flashSaleSelectedItems[0]?.discountPercent || 30,
        itemsCount: flashSaleSelectedItems.length,
        soldCount: 0,
        totalQuota: flashSaleSelectedItems.reduce((s, it) => s + (Number(it.stockLimit) || 0), 0),
        items: payload.items,
      };

      setFlashSales(prev => [createdFs, ...prev]);
      setShowCreateFlashSaleModal(false);
      toast.success(res?.message || `Chiến dịch Flash Sale "${createdFs.title || flashSaleForm.title}" đã kích hoạt thành công!`);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tạo Flash Sale');
    }
  };

  // Bật/tắt trạng thái Flash Sale
  const handleToggleFlashSaleStatus = async (fsId) => {
    const fs = flashSales.find(f => (f.id || f._id) === fsId);
    if (!fs) return;
    const nextStatus = fs.status === 'active' ? 'paused' : 'active';
    try {
      await updateSellerFlashSaleStatusAPI(fsId, nextStatus);
      setFlashSales(prev => prev.map(f => ((f.id || f._id) === fsId ? { ...f, status: nextStatus } : f)));
      toast.info(nextStatus === 'active' ? 'Đã kích hoạt chiến dịch Flash Sale' : 'Đã tạm dừng chiến dịch Flash Sale');
    } catch {
      setFlashSales(prev => prev.map(f => ((f.id || f._id) === fsId ? { ...f, status: nextStatus } : f)));
      toast.info(nextStatus === 'active' ? 'Đã kích hoạt chiến dịch Flash Sale' : 'Đã tạm dừng chiến dịch Flash Sale');
    }
  };

  // Xuất báo cáo doanh thu & đơn hàng ra file CSV chuẩn UTF-8
  const handleExportCSV = () => {
    const headers = ["Mã Đơn Hàng", "Ngày Tạo", "Khách Hàng", "Số Điện Thoại", "Địa Chỉ", "Sản Phẩm", "Tổng Tiền (VNĐ)", "Phương Thức", "Vận Đơn", "Trạng Thái"];
    const rows = shopOrders.map(o => [
      `"${o.orderId}"`,
      `"${o.createdAt || ''}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${(o.address || '').replace(/"/g, '""')}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.total || 0,
      `"${o.paymentMethod || ''}"`,
      `"${o.trackingCode || ''}"`,
      `"${o.statusText || o.status || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_${currentShop.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất báo cáo doanh thu & đơn hàng (CSV) thành công!");
  };

  return (
    <div className="shopee-dashboard-container">
      <style>{`
        .seller-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .seller-stat-chip {
          background: var(--bg-muted, #f1f5f9);
          border: 1px solid var(--border-medium, #cbd5e1);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11.5px;
          color: var(--text-secondary);
        }
        .seller-tab-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .seller-tab-btn.active {
          background: var(--primary-color, #ea580c);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
        }
        .seller-tab-btn:hover:not(.active) {
          background: var(--bg-hover, #f1f5f9);
          color: var(--text-primary);
        }
      `}</style>

      {/* Sidebar Kênh Quản Lý Người Bán */}
      <aside className="shopee-sidebar">
        <div className="shopee-sidebar-brand" style={{ paddingBottom: '16px' }}>
          <img
            src={currentShop.logo}
            alt={currentShop.name}
            className="shopee-sidebar-logo"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              border: '2px solid #ea580c',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)'
            }}
          />
          <div className="shopee-sidebar-info" style={{ minWidth: 0 }}>
            <h3 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14.5px', fontWeight: 800 }}>
              {currentShop.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span className="seller-badge-pill" style={{
                background: 'linear-gradient(135deg, #d0011b 0%, #ee4d2d 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 6px rgba(208, 1, 27, 0.25)',
                fontSize: '10px',
                fontWeight: 900,
                letterSpacing: '0.6px',
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                MALL
              </span>
              <span style={{ fontSize: '11.5px', color: '#f59e0b', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <StarIcon size={12} color="#f59e0b" />
                <span>{currentShop.rating}</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', padding: '6px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          TỔNG QUAN
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'overview' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)',
            border: activeTab === 'overview' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChartBarIcon size={14} color="#6366f1" />
          </span>
          <span>Báo Cáo & Phân Tích</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'wallet' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              border: activeTab === 'wallet' ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(37, 99, 235, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CreditCardIcon size={14} color="#2563eb" />
            </span>
            <span>Ví Doanh Thu & Rút Tiền</span>
          </div>
          <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>
            {formatCurrency(shopWalletBalance)}
          </span>
        </button>

        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', padding: '10px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          VẬN HÀNH & ĐƠN HÀNG
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'orders' ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.1)',
              border: activeTab === 'orders' ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(2, 132, 199, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ReceiptIcon size={14} color="#0284c7" />
            </span>
            <span>Đơn Hàng Của Shop</span>
          </div>
          {pendingOrdersCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', fontSize: '10.5px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'returns' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)',
              border: activeTab === 'returns' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <RotateCcwIcon size={14} color="#ef4444" />
            </span>
            <span>Trả Hàng & Hoàn Tiền</span>
          </div>
          {returnsList.filter(r => r.status === 'pending').length > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10.5px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
              {returnsList.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'products' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)',
              border: activeTab === 'products' ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(37, 99, 235, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <PackageIcon size={14} color="#2563eb" />
            </span>
            <span>Quản Lý Sản Phẩm</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({shopProducts.length})
          </span>
        </button>

        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', padding: '10px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          MARKETING & CHĂM SÓC
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'flashsale' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashsale')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'flashsale' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.1)',
              border: activeTab === 'flashsale' ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid rgba(234, 88, 12, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BoltIcon size={14} color="#ea580c" />
            </span>
            <span>Flash Sale Gian Hàng</span>
          </div>
          <span style={{ background: '#f97316', color: '#fff', fontSize: '9.5px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
            DEAL SỐC
          </span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'vouchers' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
            border: activeTab === 'vouchers' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TicketIcon size={14} color="#f59e0b" />
          </span>
          <span>Mã Giảm Giá (Vouchers)</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'reviews' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
              border: activeTab === 'reviews' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <StarIcon size={14} color="#f59e0b" />
            </span>
            <span>Đánh Giá Của Khách</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({shopReviews.length})
          </span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: activeTab === 'chats' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.1)',
              border: activeTab === 'chats' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(6, 182, 212, 0.18)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ChatIcon size={14} color="#06b6d4" />
            </span>
            <span>Tin Nhắn Khách Hàng</span>
          </div>
          <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
            Shopee Chat
          </span>
        </button>

        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', padding: '10px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          HỆ THỐNG
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'settings' ? 'rgba(100, 116, 139, 0.18)' : 'rgba(100, 116, 139, 0.1)',
            border: activeTab === 'settings' ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(100, 116, 139, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <SettingsIcon size={14} color="#64748b" />
          </span>
          <span>Hồ Sơ & Kho Hàng</span>
        </button>

        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted, #94a3b8)', padding: '10px 14px 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          TRÍ TUỆ & TĂNG TRƯỞNG
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'funnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('funnel')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'funnel' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)',
            border: activeTab === 'funnel' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChartBarIcon size={14} color="#6366f1" />
          </span>
          <span>Phễu Chuyển Đổi & Tồn Kho</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'market' ? 'active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'market' ? 'rgba(14, 165, 233, 0.18)' : 'rgba(14, 165, 233, 0.1)',
            border: activeTab === 'market' ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(14, 165, 233, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <GlobeIcon size={14} color="#0ea5e9" />
          </span>
          <span>Thị Trường & Chuẩn Ngành</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'staff' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
            border: activeTab === 'staff' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UserIcon size={14} color="#10b981" />
          </span>
          <span>Nhân Viên & Phân Quyền</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'ads' ? 'active' : ''}`}
          onClick={() => setActiveTab('ads')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'ads' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.1)',
            border: activeTab === 'ads' ? '1px solid rgba(234, 88, 12, 0.3)' : '1px solid rgba(234, 88, 12, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BoltIcon size={14} color="#ea580c" />
          </span>
          <span>Shopee Ads &amp; ROI</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'pnl' ? 'active' : ''}`}
          onClick={() => setActiveTab('pnl')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'pnl' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
            border: activeTab === 'pnl' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ReceiptIcon size={14} color="#10b981" />
          </span>
          <span>P&amp;L Lợi Nhuận Từng SKU</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'shipping_policy' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping_policy')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'shipping_policy' ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.1)',
            border: activeTab === 'shipping_policy' ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(2, 132, 199, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TruckIcon size={14} color="#0284c7" />
          </span>
          <span>Vận Chuyển Động &amp; SPX</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'sla_metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('sla_metrics')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'sla_metrics' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)',
            border: activeTab === 'sla_metrics' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheckIcon size={14} color="#ef4444" />
          </span>
          <span>Hiệu Suất SLA &amp; Sao Quả Tạ</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'auto_reply' ? 'active' : ''}`}
          onClick={() => setActiveTab('auto_reply')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'auto_reply' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.1)',
            border: activeTab === 'auto_reply' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(168, 85, 247, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChatIcon size={14} color="#a855f7" />
          </span>
          <span>Trợ Lý Chat &amp; Tự Động</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'cod_reconciliation' ? 'active' : ''}`}
          onClick={() => setActiveTab('cod_reconciliation')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'cod_reconciliation' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
            border: activeTab === 'cod_reconciliation' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CreditCardIcon size={14} color="#10b981" />
          </span>
          <span>Đối Soát Thu Hộ COD</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'price_radar' ? 'active' : ''}`}
          onClick={() => setActiveTab('price_radar')}
        >
          <span style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            background: activeTab === 'price_radar' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
            border: activeTab === 'price_radar' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.18)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BoltIcon size={14} color="#f59e0b" />
          </span>
          <span>Radar Giá &amp; Đối Thủ</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="shopee-dashboard-main">
        {/* Header Kênh Người Bán & Định Danh Gian Hàng */}
        <div className="shopee-dashboard-header" style={{
          background: 'var(--bg-card, #ffffff)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="shopee-dashboard-title" style={{ fontSize: '22px', fontWeight: 800 }}>
                {currentShop.name}
              </h1>
              <span className="seller-badge-pill" style={{
                background: 'linear-gradient(135deg, #d0011b 0%, #ee4d2d 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 2px 6px rgba(208, 1, 27, 0.25)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <CheckIcon size={12} color="#ffffff" />
                <span>SHOPEE MALL</span>
              </span>
              <span className="seller-badge-pill" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                <span>ĐANG HOẠT ĐỘNG</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span className="seller-stat-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={11} color="#2563eb" />
                </span>
                <span>Chủ sở hữu: <strong>{user?.fullName || 'Trần Thị Chủ Shop (Thời Trang)'}</strong></span>
              </span>
              <span className="seller-stat-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StoreIcon size={11} color="#ea580c" />
                </span>
                <span>Kho: {currentShop.address}</span>
              </span>
              <span className="seller-stat-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneIcon size={11} color="#16a34a" />
                </span>
                <span>Hotline: {currentShop.phone}</span>
              </span>
              <span className="seller-stat-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TagIcon size={11} color="#8b5cf6" />
                </span>
                <span>Ngành hàng: <strong>{currentShop.category}</strong></span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Nút Xem Gian Hàng Thực Tế Sang Trọng */}
            <Link
              to={`/shop/${currentShop.id || selectedShopId}`}
              className="shopee-btn"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                padding: '9px 18px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#ea580c',
                border: '1.5px solid #ea580c',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.12)',
                transition: 'all 0.2s ease',
              }}
              title="Xem giao diện công khai người mua nhìn thấy trên sàn Shopee Mall"
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(2, 132, 199, 0.14)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <GlobeIcon size={13} color="#0284c7" />
              </span>
              <span>Xem Gian Hàng Thực Tế</span>
              <span style={{ fontSize: '10px', background: '#fff7ed', color: '#ea580c', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>MALL</span>
            </Link>

            {/* Chỉ hiển thị công cụ chuyển shop cho tài khoản Admin quản trị toàn hệ thống */}
            {user?.role === 'admin' ? (
              <div className="shopee-shop-switcher" style={{ background: 'var(--bg-muted, #f8fafc)', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-color, #ea580c)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheckIcon size={12} color="#16a34a" />
                  </span>
                  <span>Giám Sát Sàn (Admin):</span>
                </span>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  style={{ fontWeight: 600, padding: '5px 10px', fontSize: '12.5px', borderRadius: '6px' }}
                  aria-label="Chọn Shop cần quản lý"
                >
                  {shops.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Shop #{idx + 1}: {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Thẻ định danh người bán độc lập */
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(208, 1, 27, 0.04) 100%)',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                fontSize: '12px',
              }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LockIcon size={14} color="#f59e0b" />
                </span>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kênh Độc Quyền</div>
                  <strong style={{ color: 'var(--text-primary)' }}>Gian Hàng #{currentShop.id.toUpperCase()}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Thẻ Chỉ Số KPI Trực Quan */}
        <div className="shopee-metrics-grid" style={{ marginBottom: '24px' }}>
          <div className="shopee-metric-card" style={{ borderLeft: '4px solid #ea580c' }}>
            <span className="shopee-metric-label">Tổng Doanh Thu Cửa Hàng</span>
            <span className="shopee-metric-value" style={{ color: '#ea580c' }}>{formatCurrency(totalRevenue)}</span>
            <span className="shopee-metric-hint" style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={10} color="#16a34a" />
              </span>
              <span>Đã trừ đơn hủy • Tăng trưởng +15.4%</span>
            </span>
          </div>

          <div className="shopee-metric-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <span className="shopee-metric-label">Đơn Hàng Cần Xử Lý</span>
            <span className="shopee-metric-value" style={{ color: pendingOrdersCount > 0 ? '#dc2626' : '#ea580c' }}>
              {pendingOrdersCount} đơn
            </span>
            <span className="shopee-metric-hint" style={{ color: pendingOrdersCount > 0 ? '#dc2626' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {pendingOrdersCount > 0 ? (
                <>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircleIcon size={10} color="#dc2626" />
                  </span>
                  <span>Cần xác nhận ngay để giao SPX</span>
                </>
              ) : (
                <span>Đã xác nhận toàn bộ</span>
              )}
            </span>
          </div>

          <div className="shopee-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <span className="shopee-metric-label">Mặt Hàng Đang Bán</span>
            <span className="shopee-metric-value">{shopProducts.filter(p => p.isActive).length} / {shopProducts.length}</span>
            <span className="shopee-metric-hint" style={{ color: lowStockCount > 0 ? '#ea580c' : '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {lowStockCount > 0 ? (
                <>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircleIcon size={10} color="#ea580c" />
                  </span>
                  <span>Có {lowStockCount} sản phẩm sắp hết hàng</span>
                </>
              ) : (
                <span>Tồn kho dồi dào</span>
              )}
            </span>
          </div>

          <div className="shopee-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
            <span className="shopee-metric-label">Chỉ Số Vận Hành Shop</span>
            <span className="shopee-metric-value" style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', border: '1px solid rgba(5, 150, 105, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StarIcon size={13} color="#059669" />
              </span>
              <span>{currentShop.rating} / 5.0</span>
            </span>
            <span className="shopee-metric-hint" style={{ color: '#64748b' }}>
              Đã bán thành công {totalSoldItems.toLocaleString('vi-VN')} món
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TỔNG QUAN & PHÂN TÍCH (OVERVIEW / ANALYTICS) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div>
            {/* Biểu đồ doanh thu 7 ngày động */}
            <div className="shopee-table-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChartBarIcon size={15} color="#2563eb" />
                    </span>
                    <span>Biểu Đồ Doanh Số Bán Hàng 7 Ngày Gần Nhất</span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Tính toán theo doanh thu thực tế của {currentShop.name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="seller-stat-chip" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StarIcon size={11} color="#f59e0b" fill="#f59e0b" />
                    </span>
                    <span>Tăng trưởng +15.4% tuần này</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="shopee-btn shopee-btn-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DownloadIcon size={12} color="#2563eb" />
                    </span>
                    <span>Xuất Báo Cáo (CSV)</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '190px', padding: '10px 0', borderBottom: '1px solid var(--border-medium)' }}>
                {[
                  { day: 'Thứ 2', val: Math.round(totalRevenue * 0.12), pct: '45%' },
                  { day: 'Thứ 3', val: Math.round(totalRevenue * 0.15), pct: '55%' },
                  { day: 'Thứ 4', val: Math.round(totalRevenue * 0.11), pct: '40%' },
                  { day: 'Thứ 5', val: Math.round(totalRevenue * 0.19), pct: '70%' },
                  { day: 'Thứ 6', val: Math.round(totalRevenue * 0.22), pct: '85%' },
                  { day: 'Thứ 7', val: Math.round(totalRevenue * 0.26), pct: '100%' },
                  { day: 'Chủ Nhật', val: Math.round(totalRevenue * 0.18), pct: '65%' },
                ].map((item) => (
                  <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '4px' }}>
                      {formatCurrency(item.val)}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '46px',
                        height: item.pct,
                        background: 'linear-gradient(180deg, #ea580c 0%, #f97316 60%, rgba(234, 88, 12, 0.3) 100%)',
                        borderRadius: '6px 6px 0 0',
                        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top sản phẩm bán chạy nhất của riêng shop này */}
            <div className="shopee-table-card">
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StarIcon size={15} color="#f59e0b" fill="#f59e0b" />
                </span>
                <span>Top Mặt Hàng Bán Chạy Nhất Tại {currentShop.name}</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {shopProducts
                  .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                  .slice(0, 4)
                  .map((prod, idx) => (
                    <div
                      key={prod._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--bg-muted, #f8fafc)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-medium, #e2e8f0)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '16px',
                            color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309',
                            width: '24px',
                            textAlign: 'center'
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <img src={prod.image} alt={prod.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>{prod.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Giá bán: <strong style={{ color: '#ea580c' }}>{formatCurrency(prod.price)}</strong> · Kho còn: {prod.stock} cái
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckIcon size={12} color="#16a34a" />
                          <span>Đã bán {prod.sold || 50} cái</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Doanh thu: {formatCurrency(prod.price * (prod.sold || 50))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: VÍ DOANH THU & RÚT TIỀN (WALLET / PAYOUTS) */}
        {/* ========================================================================= */}
        {activeTab === 'wallet' && (
          <div>
            {/* 3 Thẻ số dư ví */}
            <div className="shopee-metrics-grid" style={{ marginBottom: '20px' }}>
              <div className="shopee-metric-card" style={{ borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
                <span className="shopee-metric-label">Số Dư Ví Khả Dụng (Rút Ngay)</span>
                <span className="shopee-metric-value" style={{ color: '#059669', fontSize: '24px' }}>
                  {formatCurrency(shopWalletBalance)}
                </span>
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    className="shopee-btn shopee-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCardIcon size={12} color="#ffffff" />
                    </span>
                    <span>Rút Tiền Về Ngân Hàng</span>
                  </button>
                </div>
              </div>

              <div className="shopee-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <span className="shopee-metric-label">Tiền Chờ Quyết Toán (SPX Đang Giao)</span>
                <span className="shopee-metric-value" style={{ color: '#d97706', fontSize: '22px' }}>
                  {formatCurrency(shopPendingBalance)}
                </span>
                <span className="shopee-metric-hint" style={{ color: '#64748b' }}>
                  Sẽ cộng vào ví ngay khi khách xác nhận đã nhận hàng
                </span>
              </div>

              <div className="shopee-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <span className="shopee-metric-label">Tổng Tiền Đã Rút Về Tài Khoản</span>
                <span className="shopee-metric-value" style={{ color: '#2563eb', fontSize: '22px' }}>
                  {formatCurrency(totalWithdrawn)}
                </span>
                <span className="shopee-metric-hint" style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon size={10} color="#16a34a" />
                  </span>
                  <span>Đã chuyển khoản an toàn qua hệ thống ngân hàng</span>
                </span>
              </div>
            </div>

            {/* Thẻ Tài Khoản Ngân Hàng Liên Kết */}
            <div className="shopee-table-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#005b38', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                    VCB
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Tài Khoản Nhận Tiền Chính: Vietcombank</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Số tài khoản: <strong>0071001234567</strong> · Chủ TK: <strong>TRAN THI CHU SHOP</strong>
                    </p>
                  </div>
                </div>
                <span className="seller-badge-pill" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon size={10} color="#16a34a" />
                  </span>
                  <span>ĐÃ XÁC MINH DANH TÍNH</span>
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Tiền rút sẽ được chuyển tự động 24/7 qua cổng liên ngân hàng Napas 247 trong vòng 1-5 phút không mất phí dịch vụ.
              </p>
            </div>

            {/* Bảng Lịch Sử Giao Dịch & Rút Tiền */}
            <div className="shopee-table-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon size={14} color="#0284c7" />
                  </span>
                  <span>Lịch Sử Giao Dịch Rút Tiền Doanh Thu</span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tổng cộng: {shopWithdrawals.length} giao dịch
                </span>
              </div>

              {shopWithdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Chưa có giao dịch rút tiền nào. Hãy bấm "Rút Tiền Về Ngân Hàng" để rút doanh thu.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="shopee-table">
                    <thead>
                      <tr>
                        <th>MÃ LỆNH</th>
                        <th>THỜI GIAN</th>
                        <th>SỐ TIỀN RÚT</th>
                        <th>NGÂN HÀNG</th>
                        <th>SỐ TÀI KHOẢN / TÊN CHỦ TK</th>
                        <th>TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopWithdrawals.map((wd) => (
                        <tr key={wd.id}>
                          <td style={{ fontWeight: 800, color: '#ea580c' }}>#{wd.id}</td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{wd.date}</td>
                          <td style={{ fontWeight: 800, fontSize: '14px', color: '#059669' }}>
                            -{formatCurrency(wd.amount)}
                          </td>
                          <td style={{ fontWeight: 700 }}>{wd.bankName}</td>
                          <td style={{ fontSize: '12.5px' }}>
                            <div><strong>{wd.accountNumber}</strong></div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>{wd.accountHolder}</div>
                          </td>
                          <td>
                            <span className="seller-badge-pill" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckIcon size={11} color="#15803d" />
                              <span>{wd.statusText}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FLASH SALE GIAN HÀNG */}
        {/* ========================================================================= */}
        {activeTab === 'flashsale' && (
          <div>
            <div className="shopee-table-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BoltIcon size={18} color="#ea580c" />
                    <span>Chiến Dịch Flash Sale Độc Quyền Của Gian Hàng</span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Tạo khung giờ giảm giá chớp nhoáng thu hút hàng nghìn khách hàng săn deal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateFlashSaleModal}
                  className="shopee-btn shopee-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontWeight: 700 }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlusIcon size={12} color="#ffffff" />
                  </span>
                  <span>Tạo Chiến Dịch Flash Sale Mới</span>
                </button>
              </div>
            </div>

            {/* Danh sách chiến dịch Flash Sale */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {shopFlashSales.map((fs) => {
                const fsKey = fs._id || fs.id;
                const totalQuota = fs.totalQuota || (Array.isArray(fs.items) ? fs.items.reduce((s, it) => s + (Number(it.stockLimit) || 10), 0) : 50);
                const soldCount = fs.soldCount || 0;
                const soldPct = Math.round((soldCount / (totalQuota || 1)) * 100);
                const title = fs.title || `Flash Sale ${fs.slotTime || fs.timeSlot || ''}`;
                const timeSlot = fs.timeSlot || fs.slotTime || '12:00 - 15:00 Hôm Nay';
                const itemsCount = fs.itemsCount || (Array.isArray(fs.items) ? fs.items.length : 1);
                const discountPct = fs.discountPercent || (Array.isArray(fs.items) && fs.items[0]?.discountPercent) || 30;

                return (
                  <div key={fsKey} className="shopee-table-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span className="seller-badge-pill" style={{
                          background: fs.status === 'active' ? '#fef3c7' : fs.status === 'paused' ? '#fee2e2' : '#f1f5f9',
                          color: fs.status === 'active' ? '#b45309' : fs.status === 'paused' ? '#b91c1c' : '#64748b',
                          border: `1px solid ${fs.status === 'active' ? '#fde68a' : fs.status === 'paused' ? '#fecaca' : '#cbd5e1'}`,
                          marginBottom: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          {fs.status === 'active' ? (
                            <>
                              <BoltIcon size={12} color="#b45309" />
                              <span>ĐANG DIỄN RA</span>
                            </>
                          ) : fs.status === 'paused' ? (
                            <>
                              <AlertCircleIcon size={12} color="#b91c1c" />
                              <span>TẠM DỪNG</span>
                            </>
                          ) : fs.status === 'upcoming' ? (
                            <>
                              <ClockIcon size={12} color="#64748b" />
                              <span>SẮP DIỄN RA</span>
                            </>
                          ) : (
                            <span>ĐÃ KẾT THÚC</span>
                          )}
                        </span>
                        <h4 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800 }}>{title}</h4>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>
                        -{discountPct}%
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Khung giờ:</span>
                        <strong>{timeSlot}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Số mặt hàng tham gia:</span>
                        <strong>{itemsCount} sản phẩm</strong>
                      </div>
                    </div>

                    {/* Danh sách mặt hàng tham gia Flash Sale */}
                    {Array.isArray(fs.items) && fs.items.length > 0 && (
                      <div style={{ marginBottom: '14px', padding: '8px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>Mặt hàng áp dụng Flash Sale:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                          {fs.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                              <span style={{ fontWeight: 600, color: '#334155', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                • {it.name}
                              </span>
                              <span>
                                <strong style={{ color: '#ea580c' }}>{formatCurrency(it.flashPrice)}</strong>{' '}
                                <del style={{ fontSize: '10.5px', color: '#94a3b8' }}>{formatCurrency(it.originalPrice)}</del>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thanh tiến độ bán */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        <span>Đã bán: {soldCount} / {totalQuota} suất</span>
                        <span style={{ color: '#ea580c' }}>{soldPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-medium, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, soldPct)}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #dc2626)', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteFlashSale(fsKey)}
                        className="shopee-btn shopee-btn-sm"
                        style={{ padding: '6px 10px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Xóa phiên Flash Sale"
                      >
                        <TrashIcon size={12} color="#dc2626" />
                        <span>Xóa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFlashSaleStatus(fsKey)}
                        className={`shopee-btn ${fs.status === 'active' ? 'shopee-btn-secondary' : 'shopee-btn-primary'}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {fs.status === 'active' ? 'Tạm Dừng' : 'Kích Hoạt'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ĐÁNH GIÁ KHÁCH HÀNG & PHẢN HỒI */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div>
            {/* Header thống kê sao */}
            <div className="shopee-table-card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                    {currentShop.rating}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '4px 0' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon key={s} size={18} color="#f59e0b" />
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Trên 5.0 sao
                  </div>
                </div>

                <div style={{ flex: 1, borderLeft: '1px solid var(--border-medium)', paddingLeft: '24px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StarIcon size={16} color="#f59e0b" />
                    <span>Đánh Giá & Nhận Xét Từ Người Mua ({shopReviews.length} lượt đánh giá)</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', '5', '4', 'replied', 'unreplied'].map((flt) => (
                      <button
                        key={flt}
                        type="button"
                        onClick={() => setReviewFilterRating(flt)}
                        className={`seller-tab-btn ${reviewFilterRating === flt ? 'active' : ''}`}
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                      >
                        {flt === 'all' && 'Tất cả'}
                        {flt === '5' && '5 Sao (Rất tốt)'}
                        {flt === '4' && '4 Sao (Hài lòng)'}
                        {flt === 'replied' && 'Đã phản hồi'}
                        {flt === 'unreplied' && 'Chưa phản hồi'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {shopReviews
                .filter(r => {
                  if (reviewFilterRating === '5') return r.rating === 5;
                  if (reviewFilterRating === '4') return r.rating === 4;
                  if (reviewFilterRating === 'replied') return !!r.reply;
                  if (reviewFilterRating === 'unreplied') return !r.reply;
                  return true;
                })
                .map((rev) => (
                  <div key={rev.id} className="shopee-table-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={rev.avatar} alt={rev.customerName} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{rev.customerName}</div>
                          <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckIcon size={11} color="#16a34a" />
                            <span>Đã mua hàng từ {currentShop.name}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rev.date}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarIcon key={s} size={14} color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'} />
                      ))}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Sản phẩm: <strong>{rev.productName}</strong>
                    </div>

                    <p style={{ fontSize: '13.5px', margin: '0 0 12px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      "{rev.comment}"
                    </p>

                    {/* Phản hồi của shop */}
                    {rev.reply ? (
                      <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #ea580c', fontSize: '13px' }}>
                        <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '12px', marginBottom: '3px' }}>
                          Phản hồi của {currentShop.name}:
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>{rev.reply}</div>
                      </div>
                    ) : (
                      <div>
                        {replyingReviewId === rev.id ? (
                          <div style={{ marginTop: '8px' }}>
                            <textarea
                              className="shopee-form-input"
                              rows="2"
                              placeholder={`Nhập phản hồi lịch thiệp từ ${currentShop.name}...`}
                              value={replyInputText}
                              onChange={(e) => setReplyInputText(e.target.value)}
                              style={{ marginBottom: '8px', fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-secondary"
                                onClick={() => {
                                  setReplyingReviewId(null);
                                  setReplyInputText('');
                                }}
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-primary"
                                onClick={() => handleSendReviewReply(rev.id)}
                                style={{ padding: '4px 14px', fontSize: '12px' }}
                              >
                                Gửi Phản Hồi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingReviewId(rev.id);
                              setReplyInputText(`Dạ ${currentShop.name} xin cảm ơn bạn rất nhiều ạ!`);
                            }}
                            className="shopee-btn shopee-btn-secondary"
                            style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChatIcon size={11} color="#2563eb" />
                            </span>
                            <span>Trả Lời Đánh Giá Này</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUẢN LÝ SẢN PHẨM (PRODUCTS MANAGEMENT) */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="shopee-table-card">
            {/* Cảnh báo tồn kho thấp & Hết hàng */}
            {lowStockCount > 0 && (
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderLeft: '4px solid #ea580c',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircleIcon size={20} color="#d97706" />
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '14px' }}>
                      Cảnh Báo Tồn Kho: Có {lowStockCount} mặt hàng sắp hết hàng hoặc đã hết hàng (&lt; 10 cái)!
                    </div>
                    <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '2px' }}>
                      Khách hàng đang đặt mua liên tục. Vui lòng nhập thêm hàng hoặc chỉnh sửa số lượng kho để tránh gián đoạn kinh doanh.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-sm"
                  style={{ background: '#ea580c', color: '#fff', fontWeight: 700, border: 'none', padding: '6px 14px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setProductStatusFilter('low_stock')}
                >
                  <span>Xem {lowStockCount} mặt hàng cần nhập</span>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={12} color="#ffffff" />
                  </span>
                </button>
              </div>
            )}

            {/* Thanh công cụ tìm kiếm và lọc sản phẩm chuyên nghiệp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 800 }}>
                    Danh Sách Mặt Hàng Của Shop ({shopProducts.length})
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Quản lý tồn kho, giá bán và trạng thái hiển thị của các sản phẩm thuộc {currentShop.name}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-outline"
                    onClick={handleOpenBatchInventoryModal}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, borderColor: '#ea580c', color: '#ea580c' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PackageIcon size={12} color="#ea580c" />
                    </span>
                    <span>⚡ Nhập Kho Hàng Loạt & Ma Trận Tồn Kho</span>
                  </button>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    onClick={handleOpenAddModal}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlusIcon size={12} color="#ffffff" />
                    </span>
                    <span>Đăng Bán Sản Phẩm Mới</span>
                  </button>
                </div>
              </div>

              {/* Status Tabs: Tất cả | Đang bán | Đã ẩn | Sắp hết hàng | Cận Date | Xả Kho */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('all')}
                >
                  Tất cả ({shopProducts.length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('active')}
                >
                  Đang bán ({shopProducts.filter(p => p.isActive && p.stock > 0).length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'hidden' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('hidden')}
                >
                  Đã tạm ẩn ({shopProducts.filter(p => !p.isActive).length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'low_stock' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('low_stock')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircleIcon size={10} color="#dc2626" />
                    </span>
                    <span>Sắp hết hàng ({lowStockCount})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'near_expiry' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('near_expiry')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏳ Cận Date ({nearExpiryCount})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productStatusFilter === 'clearance' ? 'active' : ''}`}
                  onClick={() => setProductStatusFilter('clearance')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏷️ Xả Kho ({clearanceCount})</span>
                  </span>
                </button>
              </div>

              {/* Hàng bộ lọc: Tìm kiếm, Ngành hàng, Sắp xếp */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <input
                    type="text"
                    className="shopee-form-input"
                    placeholder="Tìm theo tên sản phẩm, từ khóa..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      aria-label="Xóa tìm kiếm sản phẩm"
                    >
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CloseIcon size={10} color="#ef4444" />
                      </span>
                    </button>
                  )}
                </div>

                <select
                  className="shopee-form-select"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="all">Tất cả ngành hàng</option>
                  <option value="Thời trang">Thời trang</option>
                  <option value="Điện tử">Điện tử</option>
                  <option value="Gia dụng">Gia dụng</option>
                  <option value="Sắc đẹp">Sắc đẹp</option>
                  <option value="Thể thao">Thể thao</option>
                  <option value="Đời sống">Đời sống</option>
                  <option value="Mẹ & Bé">Mẹ & Bé</option>
                </select>

                <select
                  className="shopee-form-select"
                  value={productSort}
                  onChange={(e) => setProductSort(e.target.value)}
                  style={{ width: 'auto', minWidth: '160px', padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="sold_desc">Bán chạy nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="stock_asc">Tồn kho thấp nhất</option>
                </select>
              </div>
            </div>

            {/* Bảng danh sách sản phẩm */}
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Ảnh</th>
                    <th>Tên mặt hàng & Phân loại</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Đã bán</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Không tìm thấy sản phẩm nào phù hợp với bộ lọc. Bấm <strong>"Đăng Bán Sản Phẩm Mới"</strong> hoặc xóa bộ lọc tìm kiếm!
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => (
                      <tr key={prod._id}>
                        <td>
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="shopee-table-thumb"
                            style={{ borderRadius: '6px', objectFit: 'cover' }}
                          />
                        </td>
                        <td>
                          <div className="shopee-table-item-name" style={{ fontWeight: 700 }} title={prod.name}>
                            {prod.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                              Mã: {prod._id}
                            </small>
                            {prod.batchCode && (
                              <span style={{ fontSize: '10.5px', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px' }}>
                                Lô: {prod.batchCode}
                              </span>
                            )}
                            {prod.clearanceStatus === 'near_expiry' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                                ⏳ Cận Date {prod.expiryDate ? `(${new Date(prod.expiryDate).toLocaleDateString('vi-VN')})` : ''}
                              </span>
                            )}
                            {prod.clearanceStatus === 'clearance' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, background: '#faf5ff', color: '#9333ea', border: '1px solid #f3e8ff' }}>
                                🏷️ Xả Kho {prod.clearanceDiscount > 0 ? `-${prod.clearanceDiscount}%` : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="seller-stat-chip">
                            {prod.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '13.5px' }}>
                            {formatCurrency(prod.price)}
                          </div>
                          {prod.originalPrice > prod.price && (
                            <div style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                              {formatCurrency(prod.originalPrice)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  color: prod.stock === 0 ? '#dc2626' : prod.stock <= (typeof prod.safetyThreshold === 'number' ? prod.safetyThreshold : 10) ? '#ea580c' : '#16a34a'
                                }}
                              >
                                {prod.stock === 0 ? (
                                  'Hết hàng (0)'
                                ) : prod.stock <= (typeof prod.safetyThreshold === 'number' ? prod.safetyThreshold : 10) ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <AlertCircleIcon size={12} color="#ea580c" />
                                    <span>Còn {prod.stock}</span>
                                  </span>
                                ) : (
                                  `${prod.stock} cái`
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickStockProduct(prod);
                                  setQuickStockValue(prod.stock);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  padding: '1px 5px',
                                  fontSize: '10px',
                                  cursor: 'pointer'
                                }}
                                title="Chỉnh sửa nhanh tồn kho"
                              >
                                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <PencilIcon size={10} color="#2563eb" />
                                </span>
                              </button>
                            </div>
                            <small style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              Ngưỡng an toàn: {typeof prod.safetyThreshold === 'number' ? prod.safetyThreshold : 10}
                            </small>
                          </div>
                        </td>
                        <td>
                          <strong>{prod.sold || 0}</strong>
                        </td>
                        <td>
                          <span className={`shopee-status-badge ${prod.isActive ? 'status-active' : 'status-hidden'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            {prod.isActive ? (
                              <>
                                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.18)', border: '1px solid rgba(22, 163, 74, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={9} color="#16a34a" />
                                </span>
                                <span>Đang bán</span>
                              </>
                            ) : (
                              'Đã ẩn'
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="shopee-table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => handleOpenEditModal(prod)}
                              title="Chỉnh sửa thông tin chi tiết"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => handleToggleActive(prod._id)}
                              title={prod.isActive ? "Tạm ẩn khỏi gian hàng" : "Hiển thị lên gian hàng"}
                            >
                              {prod.isActive ? 'Ẩn' : 'Hiện'}
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => handleDeleteProduct(prod._id)}
                              title="Xóa sản phẩm"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon size={11} color="#dc2626" />
                              </span>
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUẢN LÝ ĐƠN HÀNG (ORDERS MANAGEMENT) */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="shopee-table-card">
            {/* Header và Bộ lọc Đơn Hàng Shopee Chuẩn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 800 }}>
                    Quản Lý Đơn Hàng Tại {currentShop.name} ({shopOrders.length})
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Xử lý xác nhận đơn, in phiếu giao hàng SPX và theo dõi tiến độ vận chuyển
                  </p>
                </div>
              </div>

              {/* Status Tabs: Tất cả | Chờ xác nhận | Đang giao | Đã hoàn thành | Đã hủy */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`seller-tab-btn ${orderStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('all')}
                >
                  Tất cả ({shopOrders.length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${orderStatusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('pending')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClockIcon size={10} color="#d97706" />
                    </span>
                    <span>Chờ xác nhận ({shopOrders.filter(o => o.status === 'pending').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${orderStatusFilter === 'shipping' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('shipping')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TruckIcon size={10} color="#0284c7" />
                    </span>
                    <span>Đang giao hàng ({shopOrders.filter(o => o.status === 'shipping').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${orderStatusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('completed')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={10} color="#16a34a" />
                    </span>
                    <span>Đã hoàn thành ({shopOrders.filter(o => o.status === 'completed').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${orderStatusFilter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('cancelled')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Đã hủy ({shopOrders.filter(o => o.status === 'cancelled').length})</span>
                  </span>
                </button>
              </div>

              {/* Thanh công cụ tìm kiếm và thao tác đơn hàng */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px', maxWidth: '380px', position: 'relative' }}>
                  <input
                    type="text"
                    className="shopee-form-input"
                    placeholder="Tìm theo mã đơn #ORD, tên khách, số điện thoại..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                  {orderSearch && (
                    <button
                      type="button"
                      onClick={() => setOrderSearch('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      aria-label="Xóa tìm kiếm đơn hàng"
                    >
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CloseIcon size={10} color="#ef4444" />
                      </span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {shopOrders.some(o => o.status === 'pending') && (
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary shopee-btn-sm"
                      onClick={handleBulkConfirmPendingOrders}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      title="Bàn giao tất cả đơn Chờ xác nhận cho SPX Express"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}>
                        <TruckIcon size={13} color="#ffffff" />
                      </span>
                      <span>Xác nhận giao tất cả ({shopOrders.filter(o => o.status === 'pending').length} đơn)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                    onClick={handleExportOrdersCSV}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    title="Xuất danh sách đơn hàng lọc được ra file CSV"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: '#dbeafe', border: '1px solid #bfdbfe' }}>
                      <DownloadIcon size={13} color="#2563eb" />
                    </span>
                    <span>Xuất Excel/CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bảng Đơn Hàng */}
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Thời gian</th>
                    <th>Khách hàng</th>
                    <th>Mặt hàng đặt mua</th>
                    <th>Tổng tiền & TT</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Không có đơn hàng nào trong mục này.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => (
                      <tr key={ord.orderId}>
                        <td>
                          <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>
                            #{ord.orderId}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {ord.createdAt}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{ord.customerName}</div>
                          <small style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PhoneIcon size={9} color="#2563eb" />
                            </span>
                            <span>{ord.phone}</span>
                          </small>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ord.productName}
                          </div>
                          <small style={{ color: '#4f46e5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedOrderDetails(ord)}>
                            <span>Xem chi tiết kiện hàng</span>
                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChevronRightIcon size={9} color="#4f46e5" />
                            </span>
                          </small>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '13.5px' }}>
                            {formatCurrency(ord.total)}
                          </div>
                          <span className="seller-stat-chip" style={{ fontSize: '10.5px' }}>
                            {ord.paymentMethod || 'VietQR'}
                          </span>
                        </td>
                        <td>
                          <span className={`shopee-status-badge status-${ord.status}`}>
                            {ord.statusText}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {ord.status === 'pending' && (
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-primary shopee-btn-sm"
                                onClick={() => handleUpdateOrderStatus(ord.orderId, 'shipping', 'Đang giao hàng')}
                                title="Xác nhận đơn và chuẩn bị giao shipper"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)' }}>
                                  <BoltIcon size={12} color="#ffffff" />
                                </span>
                                <span>Xác nhận đơn</span>
                              </button>
                            )}

                            {ord.status === 'shipping' && (
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                                onClick={() => handleUpdateOrderStatus(ord.orderId, 'completed', 'Đã hoàn thành')}
                                style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.18)', border: '1px solid rgba(22, 163, 74, 0.28)' }}>
                                  <CheckIcon size={12} color="#15803d" />
                                </span>
                                <span>Giao thành công</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => setPrintingOrder(ord)}
                              title="In phiếu gửi hàng & Mã vạch SPX"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.14)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
                                <PrinterIcon size={12} color="#0284c7" />
                              </span>
                              <span>In Phiếu</span>
                            </button>

                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => setPackingSlipOrder(ord)}
                              title="In phiếu xuất kho & đóng gói hàng hóa"
                              style={{ background: '#f8fafc', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
                                <ReceiptIcon size={12} color="#0284c7" />
                              </span>
                              <span>Đóng gói</span>
                            </button>

                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => setSelectedOrderDetails(ord)}
                              title="Xem chi tiết đơn hàng"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.14)', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
                                <EyeIcon size={12} color="#2563eb" />
                              </span>
                              <span>Chi tiết</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3.5: QUẢN LÝ TRẢ HÀNG & HOÀN TIỀN (RETURN & REFUND HUB) */}
        {/* ========================================================================= */}
        {activeTab === 'returns' && (
          <div className="shopee-table-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RotateCcwIcon size={14} color="#ef4444" />
                    </span>
                    <span>Xử Lý Khiếu Nại Trả Hàng & Hoàn Tiền ({returnsList.length})</span>
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Xem xét lý do và bằng chứng khiếu nại của khách hàng, phê duyệt hoàn tiền và tự động hoàn trả kho hàng
                  </p>
                </div>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                  onClick={loadSellerReturns}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcwIcon size={12} color="currentColor" />
                  <span>Tải lại dữ liệu</span>
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`seller-tab-btn ${returnsFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReturnsFilter('all')}
                >
                  Tất cả ({returnsList.length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${returnsFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setReturnsFilter('pending')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={12} color="#d97706" />
                    <span>Chờ xử lý ({returnsList.filter(r => r.status === 'pending').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${returnsFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setReturnsFilter('approved')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckIcon size={12} color="#16a34a" />
                    <span>Đã chấp thuận ({returnsList.filter(r => r.status === 'approved').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${returnsFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setReturnsFilter('rejected')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CloseIcon size={12} color="#ef4444" />
                    <span>Đã từ chối ({returnsList.filter(r => r.status === 'rejected').length})</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Bảng danh sách khiếu nại trả hàng */}
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã Đơn / Khách Hàng</th>
                    <th>Sản Phẩm Trả Về</th>
                    <th>Số Tiền Yêu Cầu</th>
                    <th>Lý Do Khiếu Nại</th>
                    <th>Trạng Thái</th>
                    <th>Thời Gian Gửi</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {returnsList.filter(r => returnsFilter === 'all' || r.status === returnsFilter).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RotateCcwIcon size={20} color="#ef4444" />
                          </span>
                          <span style={{ fontWeight: 600 }}>Không có yêu cầu trả hàng nào ở trạng thái này.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    returnsList
                      .filter(r => returnsFilter === 'all' || r.status === returnsFilter)
                      .map((ret, idx) => (
                        <tr key={ret.orderId || idx}>
                          <td>
                            <strong style={{ color: '#0284c7', display: 'block' }}>#{ret.orderId?.slice(-8) || ret.orderId}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ret.customerName} ({ret.phone || 'SĐT ẩn'})</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {(ret.items || []).map((it, iIdx) => (
                                <span key={iIdx} style={{ fontSize: '12.5px', color: '#1e293b' }}>
                                  • {it.name || it.productName || 'Sản phẩm'} (x{it.quantity || 1})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: '#ef4444', fontSize: '13.5px' }}>
                              {formatCurrency(ret.refundAmount || ret.total || 0)}
                            </strong>
                          </td>
                          <td style={{ maxWidth: '240px' }}>
                            <span style={{ fontSize: '12.5px', color: '#334155' }}>{ret.reason}</span>
                            {Array.isArray(ret.evidence) && ret.evidence.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                {ret.evidence.map((imgUrl, imgIdx) => (
                                  <a key={imgIdx} href={imgUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                                    <img src={imgUrl} alt="Bằng chứng" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                                  </a>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            {ret.status === 'pending' && (
                              <span className="shopee-badge" style={{ background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.3)', fontWeight: 700 }}>
                                ⏳ Chờ shop duyệt
                              </span>
                            )}
                            {ret.status === 'approved' && (
                              <span className="shopee-badge" style={{ background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)', fontWeight: 700 }}>
                                ✓ Đã chấp thuận hoàn tiền
                              </span>
                            )}
                            {ret.status === 'rejected' && (
                              <span className="shopee-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 700 }}>
                                ✕ Đã từ chối
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {ret.requestedAt ? new Date(ret.requestedAt).toLocaleString('vi-VN') : 'Mới đây'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {ret.status === 'pending' ? (
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-primary shopee-btn-sm"
                                onClick={() => {
                                  setSelectedReturnOrder(ret);
                                  setReturnDecisionNote('');
                                }}
                                style={{ fontWeight: 700 }}
                              >
                                Phản Hồi
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                                onClick={() => {
                                  setSelectedReturnOrder(ret);
                                  setReturnDecisionNote(ret.responseNote || '');
                                }}
                              >
                                Xem Chi Tiết
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL PHẢN HỒI KHIẾU NẠI TRẢ HÀNG & HOÀN TIỀN */}
            {selectedReturnOrder && (
              <div className="shopee-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="shopee-modal-content" style={{ maxWidth: '580px', width: '90%', padding: '24px', borderRadius: '12px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCcwIcon size={18} color="#ef4444" />
                      <span>Xử Lý Yêu Cầu Trả Hàng #{selectedReturnOrder.orderId?.slice(-8) || selectedReturnOrder.orderId}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelectedReturnOrder(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <CloseIcon size={18} color="#64748b" />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#334155' }}>Khách hàng: {selectedReturnOrder.customerName} ({selectedReturnOrder.phone || 'SĐT không khả dụng'})</p>
                      <p style={{ margin: '0 0 6px', color: '#64748b' }}>Số tiền hoàn đề xuất: <strong style={{ color: '#ef4444' }}>{formatCurrency(selectedReturnOrder.refundAmount || selectedReturnOrder.total || 0)}</strong></p>
                      <p style={{ margin: 0, color: '#334155' }}>Lý do: <em>"{selectedReturnOrder.reason}"</em></p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                        Ghi chú / Phản hồi của Shop:
                      </label>
                      <textarea
                        rows="3"
                        className="shopee-input"
                        placeholder="Nhập ghi chú phản hồi gửi khách hàng (ví dụ: Đồng ý nhận lại hàng hoàn tiền, hoặc lý do từ chối)..."
                        value={returnDecisionNote}
                        onChange={(e) => setReturnDecisionNote(e.target.value)}
                        disabled={selectedReturnOrder.status !== 'pending' || isProcessingReturn}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    {selectedReturnOrder.status !== 'pending' && (
                      <div style={{ padding: '10px 14px', borderRadius: '8px', background: selectedReturnOrder.status === 'approved' ? '#f0fdf4' : '#fef2f2', border: selectedReturnOrder.status === 'approved' ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                        <span style={{ fontWeight: 700, color: selectedReturnOrder.status === 'approved' ? '#16a34a' : '#ef4444' }}>
                          Trạng thái hiện tại: {selectedReturnOrder.status === 'approved' ? 'Đã chấp thuận và tự động nhập lại kho' : 'Đã từ chối khiếu nại'}
                        </span>
                        {selectedReturnOrder.responseNote && (
                          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#475569' }}>Phản hồi đã gửi: {selectedReturnOrder.responseNote}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={() => setSelectedReturnOrder(null)}
                      disabled={isProcessingReturn}
                    >
                      Đóng
                    </button>
                    {selectedReturnOrder.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="shopee-btn"
                          style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }}
                          disabled={isProcessingReturn}
                          onClick={async () => {
                            setIsProcessingReturn(true);
                            try {
                              await respondSellerReturnAPI(selectedReturnOrder.orderId, 'rejected', returnDecisionNote);
                              toast.success('Đã từ chối khiếu nại trả hàng của khách.');
                              setSelectedReturnOrder(null);
                              loadSellerReturns();
                            } catch (err) {
                              toast.error(err.message || 'Lỗi xử lý phản hồi khiếu nại');
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                        >
                          ✕ Từ Chối Khiếu Nại
                        </button>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-primary"
                          style={{ fontWeight: 700 }}
                          disabled={isProcessingReturn}
                          onClick={async () => {
                            setIsProcessingReturn(true);
                            try {
                              await respondSellerReturnAPI(selectedReturnOrder.orderId, 'approved', returnDecisionNote);
                              toast.success('Đã chấp thuận hoàn tiền & hoàn kho sản phẩm thành công!');
                              setSelectedReturnOrder(null);
                              loadSellerReturns();
                            } catch (err) {
                              toast.error(err.message || 'Lỗi xử lý hoàn tiền');
                            } finally {
                              setIsProcessingReturn(false);
                            }
                          }}
                        >
                          ✓ Chấp Thuận Hoàn Tiền
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MARKETING & VOUCHER CỦA SHOP (SHOP VOUCHERS) */}
        {/* ========================================================================= */}
        {activeTab === 'vouchers' && (
          <div className="shopee-table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '17px', margin: 0, fontWeight: 800 }}>
                  Danh Sách Mã Giảm Giá Của Shop ({shopVouchers.length})
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Khách hàng lưu mã tại trang Shop hoặc tự động áp dụng tại giỏ hàng & thanh toán
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setShowVoucherModal(true)}
                style={{ fontWeight: 700 }}
              >
                + Tạo Mã Giảm Giá Mới
              </button>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã Voucher</th>
                    <th>Tên Ưu Đãi</th>
                    <th>Mức Giảm</th>
                    <th>Đơn Tối Thiểu</th>
                    <th>Lượt Dùng</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {shopVouchers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Shop chưa tạo mã giảm giá nào. Hãy bấm <strong>"+ Tạo Mã Giảm Giá Mới"</strong> để kích cầu doanh số!
                      </td>
                    </tr>
                  ) : (
                    shopVouchers.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <span style={{ fontWeight: 800, color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '4px', fontSize: '13px' }}>
                            {v.code}
                          </span>
                        </td>
                        <td><strong>{v.name}</strong></td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>
                            {v.isPercent ? `Giảm ${v.discount}%` : `-${formatCurrency(v.discount)}`}
                          </span>
                        </td>
                        <td>{formatCurrency(v.minOrder)}</td>
                        <td>{v.used} / {v.limit}</td>
                        <td>
                          <span className={`shopee-status-badge ${v.active ? 'status-delivered' : 'status-cancelled'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {v.active ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.18)', border: '1px solid rgba(22, 163, 74, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={10} color="#16a34a" />
                                </span>
                                <span>Đang áp dụng</span>
                              </>
                            ) : (
                              'Tạm dừng'
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                            onClick={() => {
                              setVouchers(prev => prev.map(item => item.id === v.id ? { ...item, active: !item.active } : item));
                              toast.info(v.active ? `Đã tạm dừng mã ${v.code}` : `Đã kích hoạt mã ${v.code}`);
                            }}
                            style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            {v.active ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ClockIcon size={10} color="#d97706" />
                                </span>
                                <span>Tạm Dừng</span>
                              </>
                            ) : (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={10} color="#16a34a" />
                                </span>
                                <span>Kích Hoạt</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-sm"
                            style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => {
                              setVouchers(prev => prev.filter(item => item.id !== v.id));
                              toast.success(`Đã xóa mã ${v.code}`);
                            }}
                          >
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TrashIcon size={10} color="#dc2626" />
                            </span>
                            <span>Xóa</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TIN NHẮN KHÁCH HÀNG (SHOPEE CHAT INBOX) */}
        {/* ========================================================================= */}
        {activeTab === 'chats' && (
          <div className="shopee-table-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '480px' }}>
              {/* Danh sách hội thoại khách hàng */}
              <div style={{ borderRight: '1px solid var(--border-medium)', background: 'var(--bg-muted, #f8fafc)' }}>
                <div style={{ padding: '14px', borderBottom: '1px solid var(--border-medium)', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ChatIcon size={14} color="#2563eb" />
                  </span>
                  <span>Tin Nhắn Khách Hàng ({shopChats.length})</span>
                </div>
                <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
                  {shopChats.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Chưa có tin nhắn nào từ người mua.
                    </div>
                  ) : (
                    shopChats.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setActiveChatId(c.id)}
                        style={{
                          padding: '12px 14px',
                          borderBottom: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          background: activeChatId === c.id ? 'var(--bg-card, #ffffff)' : 'transparent',
                          borderLeft: activeChatId === c.id ? '3px solid #ea580c' : '3px solid transparent',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={c.avatar} alt={c.customerName} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px' }}>{c.customerName}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.time}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {c.lastMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Khung chat chi tiết với khách hàng */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card, #ffffff)' }}>
                {activeChatId ? (
                  (() => {
                    const currentChat = shopChats.find(c => c.id === activeChatId);
                    return (
                      <>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={currentChat.avatar} alt={currentChat.customerName} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <strong style={{ fontSize: '14px' }}>{currentChat.customerName}</strong>
                            <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                              <span>Đang trực tuyến</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-page, #f8fafc)' }}>
                          {currentChat.messages?.map((m, idx) => (
                            <div
                              key={idx}
                              style={{
                                alignSelf: m.sender === 'seller' ? 'flex-end' : 'flex-start',
                                maxWidth: '75%',
                                padding: '9px 13px',
                                borderRadius: m.sender === 'seller' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                background: m.sender === 'seller' ? '#ea580c' : 'var(--bg-card, #ffffff)',
                                color: m.sender === 'seller' ? '#ffffff' : 'var(--text-primary)',
                                border: m.sender === 'seller' ? 'none' : '1px solid var(--border-medium)',
                                fontSize: '13px',
                                lineHeight: '1.45',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}
                            >
                              {m.text}
                              <div style={{ fontSize: '9.5px', marginTop: '3px', textAlign: 'right', opacity: 0.8 }}>
                                {m.time}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Gợi ý câu trả lời nhanh */}
                        <div style={{ padding: '6px 12px', background: 'var(--bg-muted)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                          {[
                            'Dạ shop còn sẵn hàng bạn nhé!',
                            'Dạ đơn hàng đã được giao bưu tá SPX ạ!',
                            'Dạ bạn có thể áp mã giảm giá của shop để được ưu đãi nha!'
                          ].map((fastText, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              onClick={() => setChatReplyText(fastText)}
                              style={{ background: 'var(--bg-card)', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BoltIcon size={10} color="#ca8a04" />
                              </span>
                              <span>{fastText}</span>
                            </button>
                          ))}
                        </div>

                        {/* Form gửi tin nhắn */}
                        <form onSubmit={handleSendChatReply} style={{ padding: '10px 14px', borderTop: '1px solid var(--border-medium)', display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="shopee-form-input"
                            placeholder="Nhập phản hồi cho người mua..."
                            value={chatReplyText}
                            onChange={(e) => setChatReplyText(e.target.value)}
                            style={{ flex: 1, padding: '8px 14px', borderRadius: '20px' }}
                          />
                          <button type="submit" className="shopee-btn shopee-btn-primary" style={{ borderRadius: '20px', padding: '0 16px' }}>
                            Gửi
                          </button>
                        </form>
                      </>
                    );
                  })()
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '14px', padding: '40px' }}>
                    Chọn một cuộc trò chuyện từ danh sách bên trái để phản hồi khách hàng
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CÀI ĐẶT HỒ SƠ & KHO HÀNG (SHOP SETTINGS) */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="shopee-table-card" style={{ maxWidth: '720px' }}>
            <h2 style={{ fontSize: '17px', margin: '0 0 16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SettingsIcon size={16} color="#475569" />
              </span>
              <span>Cài Đặt Thông Tin & Kho Hàng Cửa Hàng</span>
            </h2>

            <form onSubmit={handleSaveShopSettings}>
              <div className="shopee-form-group">
                <label className="shopee-form-label">Tên Gian Hàng *</label>
                <input
                  type="text"
                  required
                  className="shopee-form-input"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                />
              </div>

              <div className="shopee-form-row">
                <div className="shopee-form-group">
                  <label className="shopee-form-label">Hotline Liên Hệ CSKH *</label>
                  <input
                    type="text"
                    required
                    className="shopee-form-input"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Giờ Làm Việc Của Kho</label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    value={settingsForm.workingHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Địa Chỉ Kho Lấy Hàng (Shipper SPX Đến Lấy) *</label>
                <input
                  type="text"
                  required
                  className="shopee-form-input"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Mô Tả & Khẩu Hiệu Cửa Hàng</label>
                <textarea
                  className="shopee-form-input"
                  rows="3"
                  value={settingsForm.bio}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                  placeholder="Giới thiệu về thương hiệu, cam kết chất lượng..."
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Link Ảnh Logo Cửa Hàng (URL)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={settingsForm.logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                  <input
                    type="url"
                    className="shopee-form-input"
                    value={settingsForm.logo}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="submit" className="shopee-btn shopee-btn-primary" style={{ padding: '9px 24px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon size={13} color="#ffffff" />
                  </span>
                  <span>Lưu Thay Đổi Hồ Sơ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG (ORDER DETAILS MODAL) */}
        {/* ========================================================================= */}
        {selectedOrderDetails && (
          <div className="shopee-modal-overlay" onClick={() => setSelectedOrderDetails(null)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="shopee-modal-header">
                <div>
                  <h3 style={{ margin: 0 }}>Chi Tiết Đơn Hàng #{selectedOrderDetails.orderId}</h3>
                  <small style={{ color: 'var(--text-muted)' }}>Thời gian đặt: {selectedOrderDetails.createdAt}</small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setSelectedOrderDetails(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng chi tiết đơn hàng"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              {/* Thông tin người nhận */}
              <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPinIcon size={12} color="#ea580c" />
                  </span>
                  <span>THÔNG TIN GIAO HÀNG & NGƯỜI NHẬN</span>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <strong>{selectedOrderDetails.customerName}</strong> ({selectedOrderDetails.phone})
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedOrderDetails.address}
                </div>
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TruckIcon size={11} color="#059669" />
                  </span>
                  <span>Đơn vị vận chuyển: <strong>SPX Express</strong> (Mã vận đơn: {selectedOrderDetails.trackingCode})</span>
                </div>
              </div>

              {/* Danh sách mặt hàng */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  KIỆN HÀNG ({selectedOrderDetails.items?.length || 1} sản phẩm):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrderDetails.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-page)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {it.image && <img src={it.image} alt={it.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{it.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Số lượng: x{it.quantity}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '13px' }}>
                        {formatCurrency(it.price * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết thanh toán */}
              <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Phương thức: <strong>{selectedOrderDetails.paymentMethod}</strong></div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Trạng thái đơn: <strong style={{ color: '#ea580c' }}>{selectedOrderDetails.statusText}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tổng thanh toán:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>
                    {formatCurrency(selectedOrderDetails.total)}
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => {
                    setPrintingOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PrinterIcon size={12} color="#0284c7" />
                  </span>
                  <span>In Vận Đơn SPX</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => {
                    setPackingSlipOrder(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  style={{ background: '#f8fafc', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(71, 85, 105, 0.1)', border: '1px solid rgba(71, 85, 105, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon size={12} color="#475569" />
                  </span>
                  <span>Phiếu Đóng Gói</span>
                </button>
                {selectedOrderDetails.status === 'pending' && (
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.orderId, 'shipping', 'Đang giao hàng')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BoltIcon size={12} color="#ffffff" />
                    </span>
                    <span>Xác Nhận Đơn Ngay</span>
                  </button>
                )}
                {selectedOrderDetails.status === 'shipping' && (
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    style={{ background: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => handleUpdateOrderStatus(selectedOrderDetails.orderId, 'completed', 'Đã hoàn thành')}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={12} color="#ffffff" />
                    </span>
                    <span>Đã Giao Thành Công</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CHỈNH SỬA NHANH TỒN KHO (QUICK STOCK EDIT) */}
        {/* ========================================================================= */}
        {quickStockProduct && (
          <div className="shopee-modal-overlay" onClick={() => setQuickStockProduct(null)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="shopee-modal-header">
                <h3 style={{ margin: 0, fontSize: '16px' }}>Cập Nhật Số Lượng Kho</h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setQuickStockProduct(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ tồn kho"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                Sản phẩm: <strong>{quickStockProduct.name}</strong>
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Số lượng tồn kho mới</label>
                <input
                  type="number"
                  min="0"
                  className="shopee-form-input"
                  value={quickStockValue}
                  onChange={(e) => setQuickStockValue(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {[+10, +20, +50, +100].map(addVal => (
                  <button
                    key={addVal}
                    type="button"
                    onClick={() => setQuickStockValue(prev => Number(prev || 0) + addVal)}
                    style={{ flex: 1, padding: '4px', background: 'var(--bg-muted)', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    +{addVal}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setQuickStockProduct(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Hủy</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={handleSaveQuickStock}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={11} color="#ffffff" />
                  </span>
                  <span>Lưu Tồn Kho</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: THÊM / SỬA SẢN PHẨM */}
        {/* ========================================================================= */}
        {showProductModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowProductModal(false)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="shopee-modal-header">
                <h3 style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: editingProduct ? 'rgba(37, 99, 235, 0.12)' : 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editingProduct ? <PencilIcon size={14} color="#2563eb" /> : <PlusIcon size={14} color="#ea580c" />}
                  </span>
                  <span>{editingProduct ? 'Chỉnh Sửa Mặt Hàng' : 'Đăng Bán Mặt Hàng Mới Cho Shop'}</span>
                </h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowProductModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ sản phẩm"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="shopee-form-group">
                  <label className="shopee-form-label">Tên mặt hàng *</label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    placeholder="Ví dụ: Áo thun nam basic cotton..."
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Giá bán (VNĐ) *</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      className="shopee-form-input"
                      placeholder="199000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Giá gốc niêm yết (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      className="shopee-form-input"
                      placeholder="299000"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="shopee-form-input"
                      placeholder="50"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      required
                    />
                  </div>

                    <div className="shopee-form-group">
                    <label className="shopee-form-label">Danh mục ngành hàng</label>
                    <select
                      className="shopee-form-select"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="Thời trang">Thời trang</option>
                      <option value="Điện tử">Điện tử</option>
                      <option value="Gia dụng">Gia dụng</option>
                      <option value="Sắc đẹp">Sắc đẹp</option>
                      <option value="Thể thao">Thể thao</option>
                      <option value="Đời sống">Đời sống</option>
                      <option value="Mẹ & Bé">Mẹ & Bé</option>
                    </select>
                    {productForm.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SparklesIcon size={11} color="#16a34a" />
                          </span>
                          <span>AI Gợi ý phân loại:</span>
                        </span>
                        <span 
                          style={{ background: '#dcfce7', color: '#15803d', padding: '1px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #bbf7d0' }}
                          onClick={() => setProductForm(prev => ({ ...prev, category: autoDetectCategory(prev.name, currentShop.category) }))}
                          title="Nhấn để áp dụng phân loại này"
                        >
                          {autoDetectCategory(productForm.name, currentShop.category)} (Nhấn để chọn)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Mô tả sản phẩm</label>
                  <textarea
                    className="shopee-form-input"
                    rows="2"
                    placeholder="Mô tả công năng, chất liệu, hướng dẫn sử dụng..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Link ảnh sản phẩm (URL)</label>
                  <input
                    type="url"
                    className="shopee-form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="Xem trước"
                      style={{ width: '70px', height: '70px', objectFit: 'cover', marginTop: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowProductModal(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Hủy bỏ</span>
                  </button>
                  <button
                    type="submit"
                    className="shopee-btn shopee-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon size={11} color="#ffffff" />
                    </span>
                    <span>{editingProduct ? 'Cập Nhật Sản Phẩm' : 'Đăng Bán Ngay'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: TẠO VOUCHER SHOP */}
        {/* ========================================================================= */}
        {showVoucherModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowVoucherModal(false)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="shopee-modal-header">
                <h3 style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TicketIcon size={14} color="#f59e0b" />
                  </span>
                  <span>Tạo Mã Giảm Giá Cho {currentShop.name}</span>
                </h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowVoucherModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ tạo voucher"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              <form onSubmit={handleCreateShopVoucher}>
                <div className="shopee-form-group">
                  <label className="shopee-form-label">Mã Voucher (Ví dụ: SHOP20K, VIP10P) *</label>
                  <input
                    type="text"
                    required
                    className="shopee-form-input"
                    placeholder="SHOP20K"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Tên Chương Trình Ưu Đãi *</label>
                  <input
                    type="text"
                    required
                    className="shopee-form-input"
                    placeholder="Giảm 20.000₫ cho đơn hàng thời trang"
                    value={voucherForm.name}
                    onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })}
                  />
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Loại Giảm Giá</label>
                    <select
                      className="shopee-form-select"
                      value={voucherForm.isPercent ? 'percent' : 'amount'}
                      onChange={(e) => {
                        const isP = e.target.value === 'percent';
                        setVoucherForm({ 
                          ...voucherForm, 
                          isPercent: isP,
                          discount: isP ? '10' : '20000'
                        });
                      }}
                    >
                      <option value="amount">Số tiền cố định (VNĐ)</option>
                      <option value="percent">Phần trăm (%)</option>
                    </select>
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">
                      {voucherForm.isPercent ? 'Mức Giảm (%) [1% - 100%]' : 'Số Tiền Giảm (₫)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={voucherForm.isPercent ? 1 : 1000}
                      max={voucherForm.isPercent ? 100 : undefined}
                      className="shopee-form-input"
                      value={voucherForm.discount}
                      onChange={(e) => setVoucherForm({ ...voucherForm, discount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Đơn Hàng Tối Thiểu (VNĐ)</label>
                    <input
                      type="number"
                      className="shopee-form-input"
                      placeholder="150000"
                      value={voucherForm.minOrder}
                      onChange={(e) => setVoucherForm({ ...voucherForm, minOrder: e.target.value })}
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Giới Hạn Lượt Dùng</label>
                    <input
                      type="number"
                      className="shopee-form-input"
                      placeholder="100"
                      value={voucherForm.limit}
                      onChange={(e) => setVoucherForm({ ...voucherForm, limit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowVoucherModal(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Hủy bỏ</span>
                  </button>
                  <button
                    type="submit"
                    className="shopee-btn shopee-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon size={11} color="#ffffff" />
                    </span>
                    <span>Phát Hành Voucher</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: RÚT TIỀN VỀ TÀI KHOẢN NGÂN HÀNG (WITHDRAW MODAL) */}
        {/* ========================================================================= */}
        {showWithdrawModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowWithdrawModal(false)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="shopee-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCardIcon size={14} color="#16a34a" />
                    </span>
                    <span>Rút Doanh Thu Về Tài Khoản</span>
                  </h3>
                  <small style={{ color: 'var(--text-muted)' }}>Cửa hàng: {currentShop.name}</small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ rút tiền"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              <form onSubmit={handleCreateWithdraw}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Số Dư Khả Dụng Hiện Có:</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                    {formatCurrency(shopWalletBalance)}
                  </div>
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Số Tiền Muốn Rút (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="100000"
                    step="10000"
                    max={shopWalletBalance}
                    className="shopee-form-input"
                    placeholder="Ví dụ: 1000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {[1000000, 2000000, 5000000].map(quickAmt => (
                      <button
                        key={quickAmt}
                        type="button"
                        onClick={() => setWithdrawAmount(String(Math.min(quickAmt, shopWalletBalance)))}
                        style={{ padding: '3px 8px', fontSize: '11px', background: 'var(--bg-muted)', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {formatCurrency(quickAmt)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(shopWalletBalance))}
                      style={{ padding: '3px 8px', fontSize: '11px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Rút Hết
                    </button>
                  </div>
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Ngân Hàng Thụ Hưởng *</label>
                  <select
                    className="shopee-form-select"
                    value={withdrawBank}
                    onChange={(e) => setWithdrawBank(e.target.value)}
                  >
                    <option value="Vietcombank">Vietcombank (Ngoại Thương Việt Nam)</option>
                    <option value="Techcombank">Techcombank (Kỹ Thương Việt Nam)</option>
                    <option value="MBBank">MBBank (Quân Đội)</option>
                    <option value="BIDV">BIDV (Đầu Tư & Phát Triển)</option>
                    <option value="ACB">ACB (Á Châu)</option>
                    <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                  </select>
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Số Tài Khoản *</label>
                    <input
                      type="text"
                      required
                      className="shopee-form-input"
                      value={withdrawAccountNum}
                      onChange={(e) => setWithdrawAccountNum(e.target.value)}
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Tên Chủ Tài Khoản *</label>
                    <input
                      type="text"
                      required
                      className="shopee-form-input"
                      value={withdrawAccountName}
                      onChange={(e) => setWithdrawAccountName(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckIcon size={12} color="#16a34a" />
                  <span>Miễn phí giao dịch • Chuyển khoản tức thì qua Napas 247</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowWithdrawModal(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Hủy Bỏ</span>
                  </button>
                  <button
                    type="submit"
                    className="shopee-btn shopee-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon size={11} color="#ffffff" />
                    </span>
                    <span>Xác Nhận Rút Tiền</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: TẠO CHIẾN DỊCH FLASH SALE (FLASH SALE MODAL) */}
        {/* ========================================================================= */}
        {showCreateFlashSaleModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowCreateFlashSaleModal(false)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="shopee-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BoltIcon size={14} color="#ea580c" />
                    </span>
                    <span>Tạo Slot Flash Sale Mới Cho Shop</span>
                  </h3>
                  <small style={{ color: 'var(--text-muted)' }}>Cửa hàng: {currentShop.name} • Chọn sản phẩm &amp; cài đặt giá Flash Sale</small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowCreateFlashSaleModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ tạo Flash Sale"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              <form onSubmit={handleCreateFlashSaleSubmit}>
                <div className="shopee-form-group">
                  <label className="shopee-form-label">Tên Chương Trình Flash Sale *</label>
                  <input
                    type="text"
                    required
                    className="shopee-form-input"
                    placeholder="Ví dụ: Siêu Sale Giờ Vàng Buổi Tối"
                    value={flashSaleForm.title}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, title: e.target.value })}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Khung Giờ Flash Sale Chuẩn Shopee</label>
                  <select
                    className="shopee-form-select"
                    value={flashSaleForm.timeSlot}
                    onChange={(e) => setFlashSaleForm({ ...flashSaleForm, timeSlot: e.target.value })}
                  >
                    <option value="00:00 - 02:00 Nửa Đêm">00:00 - 02:00 Chớp Nhoáng Nửa Đêm</option>
                    <option value="09:00 - 12:00 Sáng">09:00 - 12:00 Sáng Đón Ngày Mới</option>
                    <option value="12:00 - 15:00 Buổi Trưa">12:00 - 15:00 Khung Giờ Cơm Trưa</option>
                    <option value="15:00 - 18:00 Buổi Chiều">15:00 - 18:00 Deal Tan Tầm Chiều</option>
                    <option value="18:00 - 21:00 Tối Nay">18:00 - 21:00 Giờ Vàng Tối Shopee</option>
                    <option value="21:00 - 23:59 Đêm">21:00 - 23:59 Săn Deal Nửa Đêm</option>
                  </select>
                </div>

                {/* BỘ CHỌN SẢN PHẨM & CÀI ĐẶT SUẤT BÁN */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="shopee-form-label" style={{ margin: 0, fontWeight: 800 }}>
                      Chọn Sản Phẩm Tham Gia Flash Sale ({flashSaleSelectedItems.length}/{shopProducts.length})
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Tick chọn &amp; nhập giá Flash Sale riêng (&lt; Giá gốc)
                    </span>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto', background: '#f8fafc', padding: '8px' }}>
                    {shopProducts.map((p) => {
                      const pid = p._id || p.id;
                      const selectedItem = flashSaleSelectedItems.find(it => it.productId === pid);
                      const isSelected = !!selectedItem;

                      const isInvalidPrice = isSelected && Number(selectedItem.flashPrice) >= Number(selectedItem.originalPrice);
                      const isInvalidQuota = isSelected && Number(selectedItem.stockLimit) > Number(p.stock || 0);

                      return (
                        <div
                          key={pid}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            background: isSelected ? '#ffffff' : '#f8fafc',
                            border: isSelected ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            marginBottom: '8px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, minWidth: 0, margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProductForFlashSale(p)}
                                style={{ width: '16px', height: '16px', accentColor: '#ea580c', cursor: 'pointer' }}
                              />
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Giá gốc: <strong>{formatCurrency(p.price)}</strong> • Kho khả dụng: <strong style={{ color: p.stock < 10 ? '#ea580c' : '#16a34a' }}>{p.stock}</strong> cái
                                </div>
                              </div>
                            </label>

                            {isSelected && (
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                                -{selectedItem.discountPercent}%
                              </span>
                            )}
                          </div>

                          {/* Inputs khi được chọn */}
                          {isSelected && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                  Giá Flash Sale (VNĐ) *
                                </label>
                                <input
                                  type="number"
                                  className="shopee-form-input"
                                  style={{ padding: '6px 10px', fontSize: '12.5px', borderColor: isInvalidPrice ? '#dc2626' : undefined }}
                                  value={selectedItem.flashPrice}
                                  onChange={(e) => handleUpdateFlashSaleItem(pid, 'flashPrice', e.target.value)}
                                  placeholder="Nhập giá Flash Sale..."
                                />
                                {isInvalidPrice && (
                                  <span style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                                    ⚠️ Phải &lt; {formatCurrency(selectedItem.originalPrice)}
                                  </span>
                                )}
                              </div>

                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                  Suất bán Flash Sale *
                                </label>
                                <input
                                  type="number"
                                  className="shopee-form-input"
                                  style={{ padding: '6px 10px', fontSize: '12.5px', borderColor: isInvalidQuota ? '#dc2626' : undefined }}
                                  value={selectedItem.stockLimit}
                                  onChange={(e) => handleUpdateFlashSaleItem(pid, 'stockLimit', e.target.value)}
                                  placeholder="Nhập suất bán..."
                                />
                                {isInvalidQuota && (
                                  <span style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                                    ⚠️ Vượt quá kho ({p.stock})
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowCreateFlashSaleModal(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Hủy Bỏ</span>
                  </button>
                  <button
                    type="submit"
                    className="shopee-btn shopee-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.22)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BoltIcon size={12} color="#ffffff" />
                    </span>
                    <span>Kích Hoạt Flash Sale</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PHỄU CHUYỂN ĐỔI & DỰ BÁO TỒN KHO (FUNNEL & INVENTORY) */}
        {/* ========================================================================= */}
        {activeTab === 'funnel' && (
          <div className="shopee-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Phễu Chuyển Đổi & Dự Báo Tồn Kho (Conversion Funnel & Stock Prediction)
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  Theo dõi từng bước của hành trình mua hàng, điểm rơi rớt và cảnh báo mặt hàng nguy cơ cháy kho.
                </p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5', fontWeight: 700, fontSize: '12px' }}>
                Tỷ lệ chuyển đổi: {sellerFunnel?.funnel?.conversionRate || '3.6%'}
              </span>
            </div>

            {/* Funnel Visual Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>1. Lượt xem sản phẩm (Product Views)</span>
                  <strong>{sellerFunnel?.funnel?.views?.toLocaleString() || '14,250'} lượt</strong>
                </div>
                <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#3b82f6', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    100%
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>2. Thêm vào giỏ hàng (Add to Cart)</span>
                  <strong>{sellerFunnel?.funnel?.cartAdds?.toLocaleString() || '3,990'} lượt</strong>
                </div>
                <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '28%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    28% (Rơi rớt {sellerFunnel?.funnel?.dropOffCartToCheckout || '72%'})
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>3. Khởi tạo thanh toán (Checkout Initiated)</span>
                  <strong>{sellerFunnel?.funnel?.checkouts?.toLocaleString() || '1,795'} lượt</strong>
                </div>
                <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '12.6%', height: '100%', background: '#f59e0b', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    12.6%
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>4. Đặt hàng & thanh toán thành công (Purchased)</span>
                  <strong>{sellerFunnel?.funnel?.purchases || shopOrders.length} đơn</strong>
                </div>
                <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '5.2%', minWidth: '40px', height: '100%', background: '#10b981', display: 'flex', alignItems: 'center', paddingLeft: '8px', color: '#fff', fontSize: '11px', fontWeight: 700 }}>
                    {sellerFunnel?.funnel?.conversionRate || '3.6%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Runway Alerts */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              Dự Báo Tồn Kho & Cảnh Báo Cạn Hàng (Days of Inventory Remaining)
            </h3>
            <div className="shopee-table-responsive">
              <table className="shopee-table">
                <thead>
                  <tr>
                    <th>Sản Phẩm</th>
                    <th>Tồn Kho Hiện Tại</th>
                    <th>Tốc Độ Bán (SP/ngày)</th>
                    <th>Thời Gian Còn Lại</th>
                    <th>Mức Độ Cảnh Báo</th>
                  </tr>
                </thead>
                <tbody>
                  {(sellerFunnel?.inventoryForecast || [
                    { name: "Áo thun nam basic cotton 100%", stock: 12, dailyVelocity: 3.2, daysOfInventory: 4, stockAlert: "CRITICAL" },
                    { name: "Quần jean nam ống đứng co giãn", stock: 24, dailyVelocity: 2.1, daysOfInventory: 11, stockAlert: "WARNING" },
                    { name: "Áo polo nam công sở cao cấp", stock: 18, dailyVelocity: 1.5, daysOfInventory: 12, stockAlert: "WARNING" },
                  ]).map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.stock} cái</td>
                      <td>{item.dailyVelocity} cái/ngày</td>
                      <td><strong>{item.daysOfInventory} ngày</strong></td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                          background: item.stockAlert === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                          color: item.stockAlert === 'CRITICAL' ? '#dc2626' : '#d97706',
                        }}>
                          {item.stockAlert === 'CRITICAL' ? 'CỰC KỲ KHẨN CẤP (<7 ngày)' : 'CẦN NHẬP THÊM (<15 ngày)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: THỊ TRƯỜNG & CHUẨN NGÀNH HÀNG (MARKET INTELLIGENCE) */}
        {/* ========================================================================= */}
        {activeTab === 'market' && (
          <div className="shopee-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Nghiên Cứu Thị Trường & Chuẩn Ngành Hàng (Market Intelligence)
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  So sánh trực tiếp chỉ số của gian hàng với mức trung bình của toàn ngành hàng {currentShop.category}.
                </p>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', fontWeight: 700, fontSize: '12px' }}>
                Điểm cạnh tranh: {sellerMarket?.benchmark?.priceCompetitivenessScore || 92}/100
              </span>
            </div>

            {/* Benchmark Compare Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tỷ lệ chuyển đổi của Shop</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
                  {sellerMarket?.benchmark?.shopConversionRate || '3.8%'}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Trung bình ngành: <strong>{sellerMarket?.benchmark?.industryAverageConversionRate || '2.5%'}</strong> (Vượt trội +52%)
                </span>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Thời gian chuẩn bị hàng</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                  {sellerMarket?.benchmark?.shopAvgPrepTime || '2.4 giờ'}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Trung bình ngành: <strong>{sellerMarket?.benchmark?.industryAvgPrepTime || '6.8 giờ'}</strong> (Nhanh gấp 2.8 lần)
                </span>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Tỷ lệ hoàn trả hàng</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
                  {sellerMarket?.benchmark?.shopReturnRate || '1.2%'}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Trung bình ngành: <strong>{sellerMarket?.benchmark?.industryAvgReturnRate || '3.5%'}</strong> (Chất lượng rất tốt)
                </span>
              </div>
            </div>

            {/* Hot Keywords Ranking */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              Top Từ Khóa Đang Thịnh Hành Nhất Ngành Hàng
            </h3>
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table className="shopee-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Từ Khóa Tìm Kiếm</th>
                    <th>Lượng Tìm Kiếm Hàng Tuần</th>
                    <th>Xu Hướng Biến Động</th>
                  </tr>
                </thead>
                <tbody>
                  {(sellerMarket?.hotKeywords || [
                    { keyword: "áo thun oversize cotton 100%", searchVolume: "128,400", change: "+42%", trend: "up" },
                    { keyword: "quần jean ống suông", searchVolume: "95,200", change: "+18%", trend: "up" },
                    { keyword: "tai nghe bluetooth anc", searchVolume: "84,000", change: "+25%", trend: "up" },
                    { keyword: "váy hoa nhí vintage", searchVolume: "63,100", change: "-5%", trend: "down" },
                  ]).map((kw, i) => (
                    <tr key={i}>
                      <td><span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i < 3 ? '#ea580c' : '#94a3b8', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{i + 1}</span></td>
                      <td><strong>{kw.keyword}</strong></td>
                      <td>{kw.searchVolume}</td>
                      <td>
                        <span style={{ color: kw.change.startsWith('+') ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                          {kw.change} {kw.change.startsWith('+') ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Smart Actionable Recommendations */}
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Gợi Ý Hành Động Thông Minh Tối Ưu Gian Hàng
            </h3>
            <ul style={{ paddingLeft: '20px', color: '#334155', fontSize: '13px', lineHeight: 1.6 }}>
              {(sellerMarket?.benchmark?.recommendations || [
                "Bổ sung từ khóa 'cotton 100%' vào tiêu đề sản phẩm để tận dụng đợt tăng 42% lượt tìm kiếm.",
                "Tốc độ chuẩn bị hàng của shop là 2.4 giờ, hãy kích hoạt bộ lọc 'Giao Hỏa Tốc' để thu hút thêm người mua.",
                "Tổ chức Flash Sale khung giờ 12:00 - 15:00 giúp tăng thêm 28% tỷ lệ chốt đơn."
              ]).map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: NHÂN VIÊN & PHÂN QUYỀN GIAN HÀNG (STAFF SUB-ACCOUNTS) */}
        {/* ========================================================================= */}
        {activeTab === 'staff' && (
          <div className="shopee-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Quản Lý Nhân Viên & Tài Khoản Phụ (Sub-accounts & Staff Roles)
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                  Phân tách quyền hạn rõ ràng giữa Quản lý kho vận đơn và Nhân viên CSKH tư vấn tin nhắn chat.
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setShowAddStaffModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <PlusIcon size={16} color="#ffffff" />
                <span>Thêm Nhân Viên Mới</span>
              </button>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-table">
                <thead>
                  <tr>
                    <th>Họ Tên & Email</th>
                    <th>Số Điện Thoại</th>
                    <th>Vai Trò Phụ</th>
                    <th>Phạm Vi Quyền Hạn</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(sellerStaffList.length > 0 ? sellerStaffList : [
                    {
                      _id: 'st_01',
                      fullName: 'Vũ Kho Vận',
                      email: 'kho.genz@shopee.vn',
                      phone: '0912001122',
                      subRole: 'inventory_staff',
                      permissions: ['manage_products', 'manage_orders'],
                      isActive: true,
                    },
                    {
                      _id: 'st_02',
                      fullName: 'Mai CSKH Tư Vấn',
                      email: 'cskh.genz@shopee.vn',
                      phone: '0912003344',
                      subRole: 'support_staff',
                      permissions: ['view_orders', 'chat_customer'],
                      isActive: true,
                    }
                  ]).map((st) => (
                    <tr key={st._id}>
                      <td>
                        <strong>{st.fullName}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{st.email}</div>
                      </td>
                      <td>{st.phone || '0912345678'}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                          background: st.subRole === 'inventory_staff' ? '#e0f2fe' : '#fef3c7',
                          color: st.subRole === 'inventory_staff' ? '#0369a1' : '#b45309',
                        }}>
                          {st.subRole === 'inventory_staff' ? 'Kho Vận & Đơn' : 'CSKH & Chat'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>
                        {(st.permissions || []).join(', ')}
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${st.isActive ? 'status-delivered' : 'status-pending'}`}>
                          {st.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-sm shopee-btn-secondary"
                          onClick={async () => {
                            await updateSellerStaff(st._id, { isActive: !st.isActive });
                            toast.success(`Đã cập nhật trạng thái nhân viên ${st.fullName}`);
                            fetchSellerStaff().then(setSellerStaffList);
                          }}
                        >
                          {st.isActive ? 'Khóa Quyền' : 'Mở Khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 12: SHOPEE ADS & ROI SUITE ==================== */}
        {activeTab === 'ads' && (
          <div className="shopee-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  Trung Tâm Quảng Cáo Shopee Ads &amp; Phân Tích ROI
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Đấu thầu từ khóa tìm kiếm (Search Ads) và đề xuất hiển thị (Discovery Ads), tối ưu tỷ suất lợi nhuận ROAS.
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setShowCreateAdsModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon size={14} color="#fff" />
                <span>Tạo Chiến Dịch Mới</span>
              </button>
            </div>

            {/* Metrics Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Chi Phí Đã Chi (Spent)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {formatCurrency(adsData?.metrics?.totalSpent || 420000)}
                </div>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '12px', color: '#047857' }}>Doanh Thu Từ Quảng Cáo</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {formatCurrency(adsData?.metrics?.totalRevenue || 16254000)}
                </div>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: '12px', color: '#c2410c' }}>Hiệu Quả Đầu Tư (ROAS)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                  {adsData?.metrics?.overallRoas || 38.7}x
                </div>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Tỷ Lệ Click (CTR Trung Bình)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  {adsData?.metrics?.overallCtr || 5.0}%
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* THẺ MÔ PHỎNG ĐẤU THẦU TỪ KHÓA SHOPEE ADS (KEYWORD BIDDING SIMULATOR) */}
            {/* ========================================================================= */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: '0 4px 16px rgba(234, 88, 12, 0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SparklesIcon size={18} color="#ea580c" />
                  </span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Công Cụ Mô Phỏng &amp; Đấu Thầu Từ Khóa Thông Minh (Shopee Ads Simulator)
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Dự phóng lượt hiển thị, click, ngân sách tiêu hao, doanh số và tỷ suất ROAS/ROI trước khi kích hoạt chiến dịch thực tế.
                    </p>
                  </div>
                </div>
                {simResult && (
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    onClick={handleApplySimToCampaign}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    <CheckIcon size={12} color="#ffffff" />
                    <span>Áp Dụng Vào Chiến Dịch Mới</span>
                  </button>
                )}
              </div>

              {/* Bảng nhập thông số mô phỏng */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Sản Phẩm Đẩy Quảng Cáo *
                  </label>
                  <select
                    className="shopee-form-select"
                    value={simProductId}
                    onChange={(e) => setSimProductId(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  >
                    {shopProducts.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name.slice(0, 40)}... ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Từ Khóa Mục Tiêu (cách nhau bởi dấu phẩy) *
                  </label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    value={simKeywordsInput}
                    onChange={(e) => setSimKeywordsInput(e.target.value)}
                    placeholder="VD: áo thun nam, áo unisex, thời trang genz"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Loại Đối Sánh
                  </label>
                  <select
                    className="shopee-form-select"
                    value={simMatchType}
                    onChange={(e) => setSimMatchType(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  >
                    <option value="exact">Chính xác (Exact Match - CTR cao)</option>
                    <option value="broad">Mở rộng (Broad Match - Tiếp cận rộng)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Giá Thầu Đề Xuất (VNĐ/Click) *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    className="shopee-form-input"
                    value={simBidPrice}
                    onChange={(e) => setSimBidPrice(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Ngân Sách Ngày (VNĐ/ngày) *
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    className="shopee-form-input"
                    value={simBudgetDaily}
                    onChange={(e) => setSimBudgetDaily(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    disabled={isSimulating}
                    onClick={handleRunAdsSimulator}
                    style={{ width: '100%', padding: '8px 14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <BoltIcon size={14} color="#ffffff" />
                    <span>{isSimulating ? 'Đang Tính Toán...' : '⚡ Chạy Mô Phỏng'}</span>
                  </button>
                </div>
              </div>

              {/* Kết quả dự phóng mô phỏng */}
              {simResult && (
                <div style={{ background: '#fdfcfb', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#c2410c' }}>
                      📊 Bảng Dự Phóng Hiệu Suất Chiến Dịch (Projection Breakdown)
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Chu kỳ: 1 Ngày vs 30 Ngày
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Lượt Hiển Thị Dự Phóng</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {(simResult.projectedDaily?.impressions || 0).toLocaleString()}
                      </div>
                      <small style={{ fontSize: '10px', color: '#94a3b8' }}>{(simResult.projectedMonthly?.impressions || 0).toLocaleString()} /tháng</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Lượt Click (CTR {simResult.projectedDaily?.ctr || 0}%)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                        {(simResult.projectedDaily?.clicks || 0).toLocaleString()} clicks
                      </div>
                      <small style={{ fontSize: '10px', color: '#94a3b8' }}>{(simResult.projectedMonthly?.clicks || 0).toLocaleString()} /tháng</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Giá CPC Ước Tính</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {formatCurrency(simResult.projectedDaily?.cpc || 0)}
                      </div>
                      <small style={{ fontSize: '10px', color: '#16a34a' }}>Tối ưu hơn giá thầu trần</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Chi Phí Dự Kiến (Spend)</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                        {formatCurrency(simResult.projectedDaily?.spend || 0)}
                      </div>
                      <small style={{ fontSize: '10px', color: '#94a3b8' }}>{formatCurrency(simResult.projectedMonthly?.spend || 0)} /tháng</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Doanh Số GMV Ước Tính</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                        {formatCurrency(simResult.projectedDaily?.adGmv || 0)}
                      </div>
                      <small style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>~{simResult.projectedDaily?.orders || 0} đơn /ngày</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <div style={{ fontSize: '11px', color: '#c2410c' }}>Hiệu Quả ROAS / ROI</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                        {simResult.projectedDaily?.roas || 0}x
                      </div>
                      <small style={{ fontSize: '10px', color: '#ea580c', fontWeight: 700 }}>ROI: +{simResult.projectedDaily?.roi || 0}%</small>
                    </div>
                  </div>

                  {/* Chi tiết từng từ khóa */}
                  {Array.isArray(simResult.keywordBreakdown) && simResult.keywordBreakdown.length > 0 && (
                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <table className="shopee-table" style={{ width: '100%', fontSize: '12px', margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th>Từ Khóa</th>
                            <th>Đối Sánh</th>
                            <th>Giá Thầu</th>
                            <th>CPC Dự Kiến</th>
                            <th>Hiển Thị</th>
                            <th>Clicks</th>
                            <th>Đơn Hàng</th>
                            <th>Doanh Thu GMV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simResult.keywordBreakdown.map((kb, idx) => (
                            <tr key={idx}>
                              <td><strong>{kb.keyword}</strong></td>
                              <td><span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: '#f1f5f9' }}>{kb.matchType}</span></td>
                              <td>{formatCurrency(kb.bidPrice)}</td>
                              <td style={{ color: '#0284c7' }}>{formatCurrency(kb.cpc)}</td>
                              <td>{(kb.projectedImpressions || 0).toLocaleString()}</td>
                              <td style={{ fontWeight: 700 }}>{(kb.projectedClicks || 0).toLocaleString()}</td>
                              <td style={{ color: '#059669', fontWeight: 700 }}>{kb.projectedOrders || 0}</td>
                              <td style={{ color: '#ea580c', fontWeight: 800 }}>{formatCurrency(kb.adGmv || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="shopee-table" style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Tên Chiến Dịch</th>
                    <th>Loại</th>
                    <th>Ngân Sách Ngày</th>
                    <th>Đã Chi</th>
                    <th>Lượt Hiển Thị / Click</th>
                    <th>Doanh Thu / ROAS</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(adsData?.campaigns || [
                    {
                      _id: 'ads_01',
                      campaignName: 'Quảng Cáo Tìm Kiếm - BST Áo Thun Thu Đông',
                      type: 'SEARCH_ADS',
                      status: 'active',
                      budgetDaily: 50000,
                      spent: 420000,
                      impressions: 28400,
                      clicks: 1420,
                      conversionRevenue: 16254000,
                      roas: 38.7,
                    }
                  ]).map((ad) => (
                    <tr key={ad._id}>
                      <td>
                        <strong>{ad.campaignName}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Mã: {ad._id}</div>
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                          {ad.type}
                        </span>
                      </td>
                      <td>{formatCurrency(ad.budgetDaily)}/ngày</td>
                      <td style={{ color: '#b91c1c' }}>{formatCurrency(ad.spent)}</td>
                      <td>
                        <div>{(ad.impressions || 0).toLocaleString()} hiển thị</div>
                        <div style={{ fontSize: '11px', color: '#0284c7' }}>{(ad.clicks || 0).toLocaleString()} clicks (CTR: {ad.ctr || 5}%)</div>
                      </td>
                      <td>
                        <div style={{ color: '#059669', fontWeight: 700 }}>{formatCurrency(ad.conversionRevenue)}</div>
                        <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 800 }}>ROAS: {ad.roas}x</div>
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${ad.status === 'active' ? 'status-delivered' : 'status-pending'}`}>
                          {ad.status === 'active' ? 'Đang chạy' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-sm shopee-btn-secondary"
                          onClick={async () => {
                            await toggleSellerAdsAPI(ad._id);
                            toast.success(`Đã chuyển đổi trạng thái chiến dịch!`);
                            fetchSellerAdsAPI().then(setAdsData);
                          }}
                        >
                          {ad.status === 'active' ? 'Tạm Dừng' : 'Kích Hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: P&L LỢI NHUẬN & PHÂN TÍCH BIÊN LỢI NHUẬN TỪNG SKU (PROFIT & LOSS) */}
        {/* ========================================================================= */}
        {activeTab === 'pnl' && (
          <div className="shopee-table-card">
            {/* Header & KPI Summary Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon size={15} color="#10b981" />
                  </span>
                  <span>Báo Cáo P&amp;L Doanh Thu, Giá Vốn &amp; Biên Lợi Nhuận Từng SKU</span>
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Đánh giá chi tiết biên lợi nhuận gộp (Gross Margin) từng mã sản phẩm giúp tối ưu chiến lược nhập hàng và định giá
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                onClick={loadSellerProfitAndLoss}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcwIcon size={12} color="currentColor" />
                <span>Cập nhật số liệu</span>
              </button>
            </div>

            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TỔNG DOANH THU THỰC</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                  {formatCurrency(pnlData?.summary?.totalRevenue || totalRevenue || 0)}
                </div>
                <div style={{ fontSize: '11.5px', color: '#0284c7', marginTop: '4px' }}>
                  Đã bán: <strong>{(pnlData?.summary?.totalUnitsSold || totalSoldItems || 0).toLocaleString()}</strong> sản phẩm
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TỔNG GIÁ VỐN HÀNG BÁN (COGS)</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#b91c1c', marginTop: '6px' }}>
                  {formatCurrency(pnlData?.summary?.totalCogs || Math.round((pnlData?.summary?.totalRevenue || totalRevenue || 0) * 0.6))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Chi phí sản xuất / nhập hàng
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>LỢI NHUẬN GỘP (GROSS PROFIT)</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
                  {formatCurrency(pnlData?.summary?.grossProfit || Math.round((pnlData?.summary?.totalRevenue || totalRevenue || 0) * 0.4))}
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '4px' }}>
                  Doanh thu trừ đi giá vốn
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>BIÊN LỢI NHUẬN TRUNG BÌNH</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '6px' }}>
                  {pnlData?.summary?.averageMargin ? `${pnlData.summary.averageMargin}%` : '40.0%'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '4px' }}>
                  Sức khỏe tài chính: <strong style={{ color: '#16a34a' }}>Rất tốt</strong>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`seller-tab-btn ${pnlFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPnlFilter('all')}
              >
                Tất cả SKU ({pnlData?.skuAnalytics?.length || shopProducts.length})
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${pnlFilter === 'high_margin' ? 'active' : ''}`}
                onClick={() => setPnlFilter('high_margin')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></span>
                  <span>Biên Lợi Nhuận Cao (&gt;40%)</span>
                </span>
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${pnlFilter === 'healthy' ? 'active' : ''}`}
                onClick={() => setPnlFilter('healthy')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
                  <span>Biên Ổn Định (15% - 40%)</span>
                </span>
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${pnlFilter === 'low_margin' ? 'active' : ''}`}
                onClick={() => setPnlFilter('low_margin')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span>Biên Thấp Cần Tối Ưu (&lt;15%)</span>
                </span>
              </button>
            </div>

            {/* Table of SKUs */}
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã SKU / Sản Phẩm</th>
                    <th>Ngành Hàng</th>
                    <th>Giá Bán Lẻ</th>
                    <th>Giá Vốn (COGS)</th>
                    <th>Đã Bán</th>
                    <th>Doanh Số</th>
                    <th>Lợi Nhuận Gộp</th>
                    <th>Biên Lợi Nhuận</th>
                    <th>Đánh Giá Sức Khỏe</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const list = (pnlData?.skuAnalytics && pnlData.skuAnalytics.length > 0)
                      ? pnlData.skuAnalytics
                      : shopProducts.map(p => {
                          const cost = Number(p.costPrice) || Math.round((Number(p.price) || 0) * 0.6);
                          const price = Number(p.price) || 0;
                          const sold = Number(p.sold) || 10;
                          const rev = sold * price;
                          const cogs = sold * cost;
                          const gp = rev - cogs;
                          const margin = rev > 0 ? Number(((gp / rev) * 100).toFixed(1)) : 40.0;
                          return {
                            productId: p._id || p.id,
                            sku: p.sku || `SKU-${(p._id || p.id || '').slice(-6).toUpperCase()}`,
                            name: p.name,
                            image: p.image,
                            category: p.category,
                            price,
                            costPrice: cost,
                            stock: p.stock || 50,
                            unitsSold: sold,
                            revenue: rev,
                            cogs,
                            grossProfit: gp,
                            grossMargin: margin,
                            status: margin < 15 ? 'low_margin' : margin > 40 ? 'high_margin' : 'healthy',
                          };
                        });

                    const filtered = list.filter(item => {
                      if (pnlFilter === 'all') return true;
                      return item.status === pnlFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                            Không có mã SKU nào nằm trong nhóm phân loại này.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((sku, idx) => (
                      <tr key={sku.productId || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {sku.image && (
                              <img src={sku.image} alt={sku.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                            )}
                            <div>
                              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{sku.name}</strong>
                              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{sku.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#475569' }}>{sku.category || 'Thời trang'}</span>
                        </td>
                        <td>
                          <strong>{formatCurrency(sku.price)}</strong>
                        </td>
                        <td style={{ color: '#b91c1c' }}>
                          {formatCurrency(sku.costPrice)}
                        </td>
                        <td>
                          <strong>{sku.unitsSold}</strong> cái
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(sku.revenue)}</span>
                        </td>
                        <td>
                          <strong style={{ color: '#16a34a' }}>{formatCurrency(sku.grossProfit)}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '48px', height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, Math.max(0, sku.grossMargin))}%`, height: '100%', background: sku.grossMargin < 15 ? '#ef4444' : sku.grossMargin > 40 ? '#16a34a' : '#2563eb' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '12.5px', color: sku.grossMargin < 15 ? '#ef4444' : sku.grossMargin > 40 ? '#16a34a' : '#2563eb' }}>
                              {sku.grossMargin}%
                            </span>
                          </div>
                        </td>
                        <td>
                          {sku.status === 'high_margin' && (
                            <span className="shopee-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                              ⭐ Siêu Lợi Nhuận
                            </span>
                          )}
                          {sku.status === 'healthy' && (
                            <span className="shopee-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                              ✓ Biên Lành Mạnh
                            </span>
                          )}
                          {sku.status === 'low_margin' && (
                            <span className="shopee-badge" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700 }}>
                              ⚠ Biên Cận Đáy
                            </span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 12: QUẢN LÝ VẬN CHUYỂN ĐỘNG & MA TRẬN TRỢ GIÁ SPX LOGISTICS
        ========================================================================= */}
        {activeTab === 'shipping_policy' && (
          <div className="shopee-card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TruckIcon size={20} color="#0284c7" />
                  Cấu Hình Biểu Phí Vận Chuyển Động &amp; Trợ Giá SPX Logistics
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Thiết lập hạn mức freeship riêng cho shop, phụ phí giao hỏa tốc 2H và tối ưu cước vận chuyển SPX Express
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-outline"
                onClick={loadSellerShippingPolicy}
                style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
              >
                Làm Mới Cấu Hình
              </button>
            </div>

            {/* 3 Thẻ Trạng Thái Logistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>ĐỐI TÁC VẬN CHUYỂN CHÍNH</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#14532d', margin: '4px 0' }}>SPX Express Vietnam</div>
                <span style={{ fontSize: '12px', color: '#15803d' }}>Thời gian lấy hàng: 2-4 giờ sau khi chốt đơn</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>TRỢ GIÁ BỞI SÀN SHOPEE</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', margin: '4px 0' }}>
                  {shippingPolicyData.spxSubsidized ? '50% Chi Phí' : 'Không Áp Dụng'}
                </div>
                <span style={{ fontSize: '12px', color: '#1d4ed8' }}>Giúp giảm rào cản phí ship cho khách mua</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c' }}>NGƯỠNG MIỄN PHÍ VẬN CHUYỂN</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#9a3412', margin: '4px 0' }}>
                  {formatCurrency(shippingPolicyData.freeShipThreshold)}
                </div>
                <span style={{ fontSize: '12px', color: '#c2410c' }}>Đơn hàng đạt giá trị này tự động freeship</span>
              </div>
            </div>

            <form onSubmit={handleSaveShippingPolicy} style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Cước Vận Chuyển Tiêu Chuẩn Cơ Bản (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    className="shopee-input"
                    value={shippingPolicyData.baseFee}
                    onChange={(e) => setShippingPolicyData({ ...shippingPolicyData, baseFee: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Áp dụng cho các đơn hàng chưa thỏa điều kiện Freeship của shop
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Hạn Mức Đơn Hàng Để Được Miễn Phí Vận Chuyển (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    className="shopee-input"
                    value={shippingPolicyData.freeShipThreshold}
                    onChange={(e) => setShippingPolicyData({ ...shippingPolicyData, freeShipThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Khách hàng mua đạt hoặc vượt hạn mức này sẽ được miễn cước tiêu chuẩn
                  </span>
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Tham Gia Chương Trình Trợ Giá Vận Chuyển SPX (50%)</strong>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Sàn đồng tài trợ 50% cước phí, đẩy mạnh tỷ lệ hoàn tất đơn hàng</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(shippingPolicyData.spxSubsidized)}
                    onChange={(e) => setShippingPolicyData({ ...shippingPolicyData, spxSubsidized: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                  />
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: shippingPolicyData.expressAvailable ? '12px' : 0 }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Bật Dịch Vụ Giao Hàng Hỏa Tốc (SPX Instant 2H)</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Phục vụ khách hàng cần nhận hàng ngay trong vòng 2 giờ nội thành</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(shippingPolicyData.expressAvailable)}
                      onChange={(e) => setShippingPolicyData({ ...shippingPolicyData, expressAvailable: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ea580c' }}
                    />
                  </div>

                  {shippingPolicyData.expressAvailable && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Phụ Phí Hỏa Tốc Cộng Thêm (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        className="shopee-input"
                        value={shippingPolicyData.expressSurcharge}
                        onChange={(e) => setShippingPolicyData({ ...shippingPolicyData, expressSurcharge: Number(e.target.value) })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={isSavingShippingPolicy}
                    className="shopee-btn"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: isSavingShippingPolicy ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <TruckIcon size={16} color="#ffffff" />
                    <span>{isSavingShippingPolicy ? 'Đang Lưu...' : 'Lưu Thay Đổi Cấu Hình'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 13: HIỆU SUẤT VẬN HÀNH SLA & HỆ THỐNG SAO QUẢ TẠ SHOPEE
        ========================================================================= */}
        {activeTab === 'sla_metrics' && (
          <div className="shopee-card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheckIcon size={20} color="#ef4444" />
                  Chỉ Số Vận Hành SLA &amp; Hệ Thống Điểm Phạt Sao Quả Tạ
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Giám sát tỷ lệ giao hàng đúng hạn, tỷ lệ hủy đơn chủ quan và bảo vệ thứ hạng hiển thị gian hàng
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-outline"
                onClick={loadSellerOperationalSLA}
                style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
              >
                Cập Nhật Chỉ Số
              </button>
            </div>

            {/* Banner Cảnh Báo Cấp Độ Phạt */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              marginBottom: '24px',
              background: (slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '#f0fdf4' : '#fef2f2',
              border: (slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: (slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '#16a34a' : '#ef4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '16px'
                }}>
                  {(slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '✓' : '!'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: (slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '#166534' : '#991b1b' }}>
                    {(slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0
                      ? 'Gian hàng đang duy trì chuẩn vận hành xuất sắc (0 Điểm Phạt)'
                      : `Cảnh báo Sao Quả Tạ: ${slaData?.operationalMetrics?.sellerPenaltyPoints} Điểm (${slaData?.operationalMetrics?.penaltyTier})`}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: (slaData?.operationalMetrics?.sellerPenaltyPoints || 0) === 0 ? '#15803d' : '#b91c1c' }}>
                    {slaData?.operationalMetrics?.tierDescription || 'Tài khoản sạch, đầy đủ quyền lợi đề xuất sản phẩm và tham gia Mega Sale sàn.'}
                  </p>
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                Đã phân tích: <strong style={{ color: '#0f172a' }}>{slaData?.totalOrdersAnalyzed || orders.length}</strong> đơn hàng
              </div>
            </div>

            {/* 4 Thẻ KPI Chỉ Số Vận Hành */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TỶ LỆ GIAO ĐÚNG HẠN SLA</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: (slaData?.operationalMetrics?.onTimeShipmentRate ?? 98.5) >= 98 ? '#16a34a' : '#ea580c', margin: '4px 0' }}>
                  {slaData?.operationalMetrics?.onTimeShipmentRate ?? 98.5}%
                </div>
                <span style={{ fontSize: '11.5px', color: '#16a34a' }}>Chuẩn Shopee: &gt;= 98.0%</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TỶ LỆ GIAO TRỄ HẠN</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: (slaData?.operationalMetrics?.lateShipmentRate ?? 1.5) <= 2 ? '#16a34a' : '#ef4444', margin: '4px 0' }}>
                  {slaData?.operationalMetrics?.lateShipmentRate ?? 1.5}%
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Giới hạn an toàn: &lt;= 2.0%</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TỶ LỆ HỦY ĐƠN TỰ Ý</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: (slaData?.operationalMetrics?.cancellationRate ?? 0.8) <= 1 ? '#16a34a' : '#ef4444', margin: '4px 0' }}>
                  {slaData?.operationalMetrics?.cancellationRate ?? 0.8}%
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Ngưỡng cảnh báo: &gt; 1.0% (+3 điểm)</span>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>TỶ LỆ TRẢ HÀNG / HOÀN TIỀN</span>
                <div style={{ fontSize: '22px', fontWeight: 800, color: (slaData?.operationalMetrics?.returnRate ?? 1.2) <= 3 ? '#16a34a' : '#ea580c', margin: '4px 0' }}>
                  {slaData?.operationalMetrics?.returnRate ?? 1.2}%
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Mức khuyến nghị: &lt; 3.0%</span>
              </div>
            </div>

            {/* Bảng Quy Chuẩn Điểm Phạt Sao Quả Tạ */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                Khung Chế Tài &amp; Thang Điểm Phạt Shopee
              </div>
              <table className="shopee-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Cấp Độ (Tier)</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Ngưỡng Điểm Phạt</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Biện Pháp Chế Tài</th>
                    <th style={{ padding: '10px 14px', color: '#475569' }}>Thời Gian Hiệu Lực</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="shopee-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700 }}>TIER_0 (Chuẩn)</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>0 Điểm</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a' }}>Hưởng đầy đủ quyền lợi tài khoản Shopee Mall / Shop Yêu Thích</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>Vĩnh viễn</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="shopee-badge" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', fontWeight: 700 }}>TIER_1 (Cảnh Báo)</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>1 - 2 Điểm</td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>Gửi cảnh báo và nhắc nhở thời gian bàn giao bưu kiện cho SPX</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>28 ngày</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="shopee-badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', fontWeight: 700 }}>TIER_2 (Giảm Hiển Thị)</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>3 - 5 Điểm</td>
                    <td style={{ padding: '10px 14px', color: '#c2410c' }}>Giảm 30% tần suất xuất hiện sản phẩm trên thanh tìm kiếm và gợi ý hôm nay</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>28 ngày</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="shopee-badge" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700 }}>TIER_3 (Đình Chỉ Chiến Dịch)</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>&gt;= 6 Điểm</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626' }}>Cấm tham gia các chiến dịch Mega Sale và tạm khóa tính năng Flash Sale Shop</td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>28 ngày</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 13: TRỢ LÝ TIN NHẮN TỰ ĐỘNG & BỘ LỌC TỪ KHÓA (AUTO-REPLY ASSISTANT)
        ========================================================================= */}
        {activeTab === 'auto_reply' && (
          <div className="shopee-card" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChatIcon size={20} color="#a855f7" />
                  Trợ Lý Tin Nhắn Tự Động &amp; Phản Hồi Tức Thì (Auto-Reply Assistant)
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Tự động trả lời tin nhắn của người mua theo từ khóa, tin nhắn chào mừng và tin nhắn ngoài giờ làm việc
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: autoReplyData.enabled ? '#16a34a' : '#64748b' }}>
                  {autoReplyData.enabled ? 'Đang Kích Hoạt' : 'Đang Tạm Tắt'}
                </span>
                <input
                  type="checkbox"
                  checked={autoReplyData.enabled}
                  onChange={(e) => setAutoReplyData({ ...autoReplyData, enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </div>
            </div>

            <form onSubmit={handleSaveAutoReply}>
              {/* Tin Nhắn Mở Đầu Chào Mừng */}
              <div style={{ marginBottom: '20px', background: '#faf5ff', padding: '16px', borderRadius: '12px', border: '1px solid #f3e8ff' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#6b21a8', marginBottom: '6px' }}>
                  👋 Tin Nhắn Chào Mừng Tự Động (Khi khách bắt đầu chat)
                </label>
                <textarea
                  className="shopee-input"
                  rows={3}
                  value={autoReplyData.welcomeMessage}
                  onChange={(e) => setAutoReplyData({ ...autoReplyData, welcomeMessage: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d8b4fe', fontSize: '13px' }}
                />
              </div>

              {/* Tin Nhắn Ngoài Giờ Làm Việc */}
              <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  🌙 Tin Nhắn Ngoài Giờ Làm Việc (Sau 22:00 đêm)
                </label>
                <textarea
                  className="shopee-input"
                  rows={3}
                  value={autoReplyData.offlineMessage}
                  onChange={(e) => setAutoReplyData({ ...autoReplyData, offlineMessage: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Mẫu Phản Hồi Nhanh Theo Từ Khóa */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    ⚡ Phản Hồi Tức Thì Theo Từ Khóa (Keyword Trigger Templates)
                  </h3>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-outline"
                    onClick={() => {
                      const newTpl = {
                        id: `tpl_${Date.now()}`,
                        triggerKeyword: '',
                        responseMessage: '',
                      };
                      setAutoReplyData({
                        ...autoReplyData,
                        quickTemplates: [...(autoReplyData.quickTemplates || []), newTpl],
                      });
                    }}
                    style={{ padding: '4px 12px', fontSize: '12px', fontWeight: 700 }}
                  >
                    + Thêm Kịch Bản Từ Khóa
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(autoReplyData.quickTemplates || []).map((tpl, idx) => (
                    <div
                      key={tpl.id || idx}
                      style={{
                        padding: '14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr auto',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                          Từ Khóa Khách Hỏi
                        </label>
                        <input
                          type="text"
                          className="shopee-input"
                          placeholder="VD: khi nào giao"
                          value={tpl.triggerKeyword}
                          onChange={(e) => {
                            const updated = [...autoReplyData.quickTemplates];
                            updated[idx].triggerKeyword = e.target.value;
                            setAutoReplyData({ ...autoReplyData, quickTemplates: updated });
                          }}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                          Nội Dung Shop Phản Hồi Tự Động
                        </label>
                        <input
                          type="text"
                          className="shopee-input"
                          placeholder="VD: Shop gửi SPX trong 24h ạ!"
                          value={tpl.responseMessage}
                          onChange={(e) => {
                            const updated = [...autoReplyData.quickTemplates];
                            updated[idx].responseMessage = e.target.value;
                            setAutoReplyData({ ...autoReplyData, quickTemplates: updated });
                          }}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = autoReplyData.quickTemplates.filter((_, i) => i !== idx);
                          setAutoReplyData({ ...autoReplyData, quickTemplates: updated });
                        }}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '11px',
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nút Lưu Cấu Hình */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px' }}>
                <button
                  type="submit"
                  disabled={isSavingAutoReply}
                  className="shopee-btn"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: isSavingAutoReply ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {isSavingAutoReply ? 'Đang Lưu...' : '💾 Lưu Cấu Hình Trợ Lý Chat'}
                </button>
              </div>
            </form>

            {/* Khung Kiểm Thử Mô Phỏng Tương Tác Trực Tiếp */}
            <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChatIcon size={13} color="#a855f7" />
                </span>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  Mô Phỏng Trải Nghiệm Khách Hàng (Live Sandbox Simulator)
                </h4>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#64748b' }}>
                Nhập câu hỏi bất kỳ từ người mua để kiểm tra xem kịch bản từ khóa hoặc tin nhắn ngoài giờ có phản hồi chính xác hay không.
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="shopee-input"
                  placeholder="Nhập tin nhắn khách gửi (ví dụ: Shop ơi khi nào giao, tư vấn size...)"
                  value={testSimMessage}
                  onChange={(e) => setTestSimMessage(e.target.value)}
                  style={{ flex: 1, minWidth: '240px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={testSimOutsideHours}
                    onChange={(e) => setTestSimOutsideHours(e.target.checked)}
                  />
                  <span>Giả lập ngoài giờ (sau 22:00)</span>
                </label>
                <button
                  type="button"
                  disabled={isSimulatingAutoReply}
                  onClick={handleSimulateAutoReply}
                  className="shopee-btn"
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: isSimulatingAutoReply ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSimulatingAutoReply ? 'Đang Test...' : '⚡ Chạy Mô Phỏng'}
                </button>
              </div>

              {autoReplySimResult && (
                <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      background: autoReplySimResult.ruleType === 'KEYWORD_TRIGGER' ? '#f3e8ff' : (autoReplySimResult.ruleType === 'OFFLINE_HOURS' ? '#fee2e2' : '#e0f2fe'),
                      color: autoReplySimResult.ruleType === 'KEYWORD_TRIGGER' ? '#7e22ce' : (autoReplySimResult.ruleType === 'OFFLINE_HOURS' ? '#b91c1c' : '#0369a1'),
                    }}>
                      {autoReplySimResult.ruleType === 'KEYWORD_TRIGGER' ? `KHỚP TỪ KHÓA: "${autoReplySimResult.matchedKeyword}"` : (autoReplySimResult.ruleType === 'OFFLINE_HOURS' ? 'TIN NHẮN NGOÀI GIỜ' : 'TIN NHẮN CHÀO MỪNG')}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Trợ lý phản hồi trong 0.05s</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#0f172a', background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', borderLeft: '3px solid #a855f7' }}>
                    {autoReplySimResult.replyMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHÂN HỆ: ĐỐI SOÁT TIỀN THU HỘ COD & QUYẾT TOÁN VÍ DOANH THU (Feature 89) */}
        {/* ========================================================================= */}
        {activeTab === 'cod_reconciliation' && (
          <div className="shopee-tab-content">
            {/* Header Dashboard COD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCardIcon size={16} color="#10b981" />
                  </span>
                  <span>Đối Soát Tiền Thu Hộ COD &amp; Bàn Giao Quỹ SPX</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Kiểm toán dòng tiền thu hộ từ bưu tá SPX Express, trừ phí dịch vụ chuẩn 1.5% và quyết toán về ví khả dụng.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={handleSelectAllCollectedCodOrders}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <span>Chọn Tất Cả Đã Thu ({((codReconciliationData?.orders || []).filter(o => o.codSettlementStatus === 'collected_by_courier')).length})</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  disabled={selectedCodOrderIds.length === 0 || isReconcilingCod}
                  onClick={handleReconcileSelectedCod}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800 }}
                >
                  <CheckIcon size={14} color="#ffffff" />
                  <span>{isReconcilingCod ? 'Đang Quyết Toán...' : `Quyết Toán Ví (${selectedCodOrderIds.length} Đơn)`}</span>
                </button>
              </div>
            </div>

            {/* Metrics 4 Cards Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Tổng Đơn COD Phát Sinh</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  {codReconciliationData?.summary?.totalCodOrders || 0} đơn
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginBottom: '6px' }}>Chờ Bưu Tá Thu Tiền</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706' }}>
                  {formatCurrency(codReconciliationData?.summary?.pendingCollection || 0)}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600, marginBottom: '6px' }}>SPX Đã Thu (Chờ Rút Về)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7' }}>
                  {formatCurrency(codReconciliationData?.summary?.collectedByCourier || 0)}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>Đã Quyết Toán Về Ví</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
                  {formatCurrency(codReconciliationData?.summary?.reconciledTotal || 0)}
                </div>
              </div>
            </div>

            {/* Bảng Dữ Liệu Đối Soát Chi Tiết */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="shopee-table" style={{ width: '100%', margin: 0 }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            selectedCodOrderIds.length > 0 &&
                            selectedCodOrderIds.length ===
                              (codReconciliationData?.orders || []).filter(
                                (o) => o.codSettlementStatus === 'collected_by_courier'
                              ).length
                          }
                          onChange={handleSelectAllCollectedCodOrders}
                          style={{ accentColor: '#10b981', cursor: 'pointer' }}
                        />
                      </th>
                      <th>Mã Đơn / Vận Đơn</th>
                      <th>Khách Hàng</th>
                      <th style={{ textAlign: 'right' }}>Tiền Thu COD</th>
                      <th style={{ textAlign: 'right' }}>Phí COD (1.5%)</th>
                      <th style={{ textAlign: 'right' }}>Thực Nhận</th>
                      <th>Trạng Thái Đối Soát</th>
                      <th style={{ textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(codReconciliationData?.orders || []).length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Chưa có đơn hàng thanh toán COD nào phát sinh trong gian hàng.
                        </td>
                      </tr>
                    ) : (
                      (codReconciliationData?.orders || []).map((ord) => {
                        const canReconcile = ord.codSettlementStatus === 'collected_by_courier';
                        const isReconciled = ord.codSettlementStatus === 'remitted_to_seller';
                        const isSelected = selectedCodOrderIds.includes(ord.id || ord.orderId);

                        return (
                          <tr key={ord.id || ord.orderId} style={{ background: isSelected ? 'rgba(16, 185, 129, 0.05)' : undefined }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                disabled={!canReconcile}
                                checked={isSelected}
                                onChange={() => handleToggleSelectCodOrder(ord.id || ord.orderId)}
                                style={{ accentColor: '#10b981', cursor: canReconcile ? 'pointer' : 'not-allowed' }}
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{ord.orderId}</div>
                              <div style={{ fontSize: '11px', color: '#0284c7', fontFamily: 'monospace' }}>{ord.trackingCode}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.phone}</div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {formatCurrency(ord.total)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#ef4444', fontSize: '12px' }}>
                              -{formatCurrency(ord.codFee)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                              {formatCurrency(ord.netCodAmount)}
                            </td>
                            <td>
                              {isReconciled ? (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                                  ✓ Đã về ví Shop
                                </span>
                              ) : canReconcile ? (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                                  SPX đã thu tiền
                                </span>
                              ) : (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>
                                  Chờ giao hàng
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {canReconcile && (
                                <button
                                  type="button"
                                  className="shopee-btn shopee-btn-sm"
                                  onClick={async () => {
                                    await reconcileSellerCodOrdersAPI([ord.id || ord.orderId]);
                                    toast.success(`Đã đối soát đơn ${ord.orderId} về ví!`);
                                    const updated = await fetchSellerCodReconciliationAPI();
                                    if (updated) setCodReconciliationData(updated);
                                  }}
                                  style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}
                                >
                                  Quyết toán
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHÂN HỆ: RADAR SO SÁNH GIÁ THỊ TRƯỜNG & GIÁM SÁT ĐỐI THỦ (Feature 91)     */}
        {/* ========================================================================= */}
        {activeTab === 'price_radar' && (
          <div className="shopee-tab-content">
            {/* Header Dashboard Radar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BoltIcon size={16} color="#f59e0b" />
                  </span>
                  <span>Radar So Sánh Giá &amp; Tối Ưu Tỷ Lệ Thắng Buy Box</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Hệ thống tự động quét và phân tích mặt bằng giá SKU đối thủ cùng ngành hàng, đề xuất biên độ giá cạnh tranh để tối đa hóa doanh số.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={loadSellerPriceRadar}
                  disabled={isLoadingPriceRadar}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <span>{isLoadingPriceRadar ? 'Đang Quét Radar...' : '🔄 Làm Mới Radar Giá'}</span>
                </button>
              </div>
            </div>

            {/* Metrics 4 Cards Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Tổng SKU Giám Sát</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  {priceRadarData?.summary?.totalMonitoredSkus || shopProducts.length} sản phẩm
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginBottom: '6px' }}>Thắng Thế Giá (Buy Box Leader)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
                  {priceRadarData?.summary?.winningCount || 0} SKU
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, marginBottom: '6px' }}>Cần Hạ Giá Cạnh Tranh</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444' }}>
                  {priceRadarData?.summary?.overpricedCount || 0} SKU
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600, marginBottom: '6px' }}>Chỉ Số Cạnh Tranh Gian Hàng</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#6366f1' }}>
                  {priceRadarData?.summary?.competitiveScore || 85}/100
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`seller-tab-btn ${priceRadarFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPriceRadarFilter('all')}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Tất Cả Sản Phẩm
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${priceRadarFilter === 'winning' ? 'active' : ''}`}
                onClick={() => setPriceRadarFilter('winning')}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                🏆 Đang Thắng Buy Box
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${priceRadarFilter === 'overpriced' ? 'active' : ''}`}
                onClick={() => setPriceRadarFilter('overpriced')}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                ⚠️ Cần Hạ Giá Cạnh Tranh
              </button>
              <button
                type="button"
                className={`seller-tab-btn ${priceRadarFilter === 'competitive' ? 'active' : ''}`}
                onClick={() => setPriceRadarFilter('competitive')}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                ⚖️ Ngang Bằng Mặt Bằng
              </button>
            </div>

            {/* Bảng Dữ Liệu Radar Giá Chi Tiết */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="shopee-table" style={{ width: '100%', margin: 0, fontSize: '12.5px' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th>Sản phẩm của Shop</th>
                      <th>Ngành hàng</th>
                      <th style={{ textAlign: 'right' }}>Giá Shop</th>
                      <th style={{ textAlign: 'right' }}>Giá TB Thị Trường</th>
                      <th style={{ textAlign: 'right' }}>Biên Độ Chênh Lệch</th>
                      <th>Vị Thế Buy Box</th>
                      <th style={{ textAlign: 'right' }}>Giá Đề Xuất</th>
                      <th>Khuyến Nghị Chiến Lược</th>
                      <th style={{ textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(priceRadarData?.radarItems || [])
                      .filter((item) => {
                        if (priceRadarFilter === 'winning') return item.buyBoxStatus === 'winning';
                        if (priceRadarFilter === 'overpriced') return item.buyBoxStatus === 'overpriced';
                        if (priceRadarFilter === 'competitive') return item.buyBoxStatus === 'competitive';
                        return true;
                      })
                      .map((item) => {
                        const isWinning = item.buyBoxStatus === 'winning';
                        const isOverpriced = item.buyBoxStatus === 'overpriced';

                        return (
                          <tr key={item.productId} style={{ background: isOverpriced ? 'rgba(239, 68, 68, 0.03)' : (isWinning ? 'rgba(16, 185, 129, 0.03)' : undefined) }}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                Tồn kho: {item.stock} • Đã bán: {item.sold} • {item.competitorCount} đối thủ cùng phân khúc
                              </div>
                            </td>
                            <td>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {formatCurrency(item.myPrice)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>
                              {formatCurrency(item.avgMarketPrice)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              <span style={{ color: item.priceDiffPercent < 0 ? '#10b981' : (item.priceDiffPercent > 0 ? '#ef4444' : '#64748b') }}>
                                {item.priceDiffPercent > 0 ? `+${item.priceDiffPercent}%` : `${item.priceDiffPercent}%`}
                              </span>
                            </td>
                            <td>
                              {isWinning ? (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d' }}>
                                  🏆 Đang Thắng
                                </span>
                              ) : isOverpriced ? (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#fee2e2', color: '#b91c1c' }}>
                                  ⚠️ Giá Cao
                                </span>
                              ) : (
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#e0f2fe', color: '#0369a1' }}>
                                  ⚖️ Cạnh Tranh
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>
                              {formatCurrency(item.suggestedPrice)}
                            </td>
                            <td style={{ maxWidth: '260px', fontSize: '11.5px', color: '#334155' }}>
                              {item.recommendation}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isOverpriced && (
                                <button
                                  type="button"
                                  className="shopee-btn shopee-btn-sm shopee-btn-primary"
                                  onClick={() => {
                                    handleOpenQuickStock(shopProducts.find(p => (p._id || p.id) === item.productId));
                                    toast.info(`Áp dụng giá đề xuất ${formatCurrency(item.suggestedPrice)} cho ${item.name}`);
                                  }}
                                  style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}
                                >
                                  Cập Nhật Giá
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* Modal Tạo Chiến Dịch Shopee Ads */}
        {showCreateAdsModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Tạo Chiến Dịch Đấu Thầu Shopee Ads</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createSellerAdsAPI({
                  campaignName: adsForm.campaignName,
                  type: adsForm.type,
                  budgetDaily: Number(adsForm.budgetDaily),
                  budgetTotal: Number(adsForm.budgetTotal),
                  targetKeywords: [{ keyword: adsForm.keyword1, bidPrice: Number(adsForm.bidPrice1), matchType: 'exact' }]
                });
                toast.success('Đã thiết lập chiến dịch Shopee Ads thành công!');
                setShowCreateAdsModal(false);
                fetchSellerAdsAPI().then(setAdsData);
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Tên Chiến Dịch</label>
                  <input
                    type="text" required
                    className="shopee-input"
                    value={adsForm.campaignName}
                    onChange={(e) => setAdsForm({ ...adsForm, campaignName: e.target.value })}
                    placeholder="VD: Đấu thầu từ khóa Mùa Thu 2026"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Ngân Sách Ngày (VNĐ)</label>
                    <input
                      type="number" required
                      className="shopee-input"
                      value={adsForm.budgetDaily}
                      onChange={(e) => setAdsForm({ ...adsForm, budgetDaily: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Ngân Sách Tổng (VNĐ)</label>
                    <input
                      type="number" required
                      className="shopee-input"
                      value={adsForm.budgetTotal}
                      onChange={(e) => setAdsForm({ ...adsForm, budgetTotal: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Từ Khóa Mục Tiêu</label>
                    <input
                      type="text" required
                      className="shopee-input"
                      value={adsForm.keyword1}
                      onChange={(e) => setAdsForm({ ...adsForm, keyword1: e.target.value })}
                      placeholder="áo thun nam"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Giá Thầu (VNĐ/click)</label>
                    <input
                      type="number" required
                      className="shopee-input"
                      value={adsForm.bidPrice1}
                      onChange={(e) => setAdsForm({ ...adsForm, bidPrice1: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="shopee-btn shopee-btn-secondary" onClick={() => setShowCreateAdsModal(false)}>Hủy</button>
                  <button type="submit" className="shopee-btn shopee-btn-primary">Kích Hoạt Chiến Dịch</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Thêm Nhân Viên Gian Hàng */}
        {showAddStaffModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Tạo Tài Khoản Nhân Viên Phụ</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await createSellerStaff(staffForm);
                toast.success('Đã thêm nhân viên phụ thành công!');
                setShowAddStaffModal(false);
                fetchSellerStaff().then(setSellerStaffList);
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Họ Và Tên</label>
                  <input
                    type="text" required
                    className="shopee-input"
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Kho"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Email Đăng Nhập</label>
                  <input
                    type="email" required
                    className="shopee-input"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="nhanvien@shopee.vn"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Số Điện Thoại</label>
                  <input
                    type="text"
                    className="shopee-input"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="0912..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Vai Trò Nhân Viên</label>
                  <select
                    value={staffForm.subRole}
                    onChange={(e) => setStaffForm({
                      ...staffForm,
                      subRole: e.target.value,
                      permissions: e.target.value === 'inventory_staff' ? ['manage_products', 'manage_orders'] : ['view_orders', 'chat_customer']
                    })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="inventory_staff">Quản lý kho vận & Xác nhận đóng gói đơn</option>
                    <option value="support_staff">Chăm sóc khách hàng & Trực chat tư vấn</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="shopee-btn shopee-btn-secondary" onClick={() => setShowAddStaffModal(false)}>Hủy</button>
                  <button type="submit" className="shopee-btn shopee-btn-primary">Tạo Tài Khoản</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal In Vận Đơn Giao Hàng SPX */}
        {printingOrder && (
          <ShippingLabelModal
            order={printingOrder}
            shopName={currentShop.name}
            onClose={() => setPrintingOrder(null)}
          />
        )}

        {/* Modal In Phiếu Xuất Kho & Đóng Gói SPX */}
        {packingSlipOrder && (
          <PackingSlipModal
            order={packingSlipOrder}
            shop={currentShop}
            onClose={() => setPackingSlipOrder(null)}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL: MA TRẬN NHẬP KHO HÀNG LOẠT (BATCH INVENTORY MATRIX MODAL) */}
        {/* ========================================================================= */}
        {showBatchInventoryModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowBatchInventoryModal(false)} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards' }}>
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="shopee-modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PackageIcon size={16} color="#ea580c" />
                    </span>
                    <span>Ma Trận Nhập Kho Hàng Loạt &amp; Phân Loại Cận Date / Xả Kho</span>
                  </h3>
                  <small style={{ color: '#64748b', fontSize: '12.5px', marginTop: '3px', display: 'block' }}>
                    Gian hàng: <strong>{currentShop.name}</strong> • Đang chọn <strong>{batchSelectedIds.size}/{shopProducts.length}</strong> sản phẩm
                  </small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowBatchInventoryModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ ma trận tồn kho"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              {/* Thanh Công Cụ Thao Tác Hàng Loạt (Bulk Action Toolbar) */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  ⚡ Thao Tác Nhanh Cho Các Sản Phẩm Đã Chọn ({batchSelectedIds.size} mặt hàng)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {/* Nhập thêm cộng dồn */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      min="1"
                      className="shopee-form-input"
                      placeholder="+ Số lượng nhập..."
                      value={bulkAddStockInput}
                      onChange={(e) => setBulkAddStockInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={applyBulkAddStock}
                      style={{ fontSize: '11.5px', fontWeight: 700, padding: '6px 10px', whiteSpace: 'nowrap' }}
                    >
                      Cộng Dồn Kho
                    </button>
                  </div>

                  {/* Đặt ngưỡng tồn an toàn */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      min="0"
                      className="shopee-form-input"
                      placeholder="Ngưỡng an toàn..."
                      value={bulkSafetyThresholdInput}
                      onChange={(e) => setBulkSafetyThresholdInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={applyBulkSafetyThreshold}
                      style={{ fontSize: '11.5px', fontWeight: 700, padding: '6px 10px', whiteSpace: 'nowrap' }}
                    >
                      Đặt Ngưỡng
                    </button>
                  </div>

                  {/* Gán phân loại cận date / xả kho */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="shopee-form-select"
                      value={bulkClearanceStatusInput}
                      onChange={(e) => setBulkClearanceStatusInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 8px', fontSize: '12px' }}
                    >
                      <option value="normal">Bình thường</option>
                      <option value="near_expiry">Cận Date</option>
                      <option value="clearance">Xả Kho</option>
                    </select>
                    {bulkClearanceStatusInput === 'clearance' && (
                      <input
                        type="number"
                        min="5"
                        max="90"
                        className="shopee-form-input"
                        placeholder="% giảm"
                        value={bulkClearanceDiscountInput}
                        onChange={(e) => setBulkClearanceDiscountInput(e.target.value)}
                        style={{ width: '65px', padding: '6px 6px', fontSize: '12px' }}
                        title="Phần trăm giảm giá xả kho"
                      />
                    )}
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={applyBulkClearance}
                      style={{ fontSize: '11.5px', fontWeight: 700, padding: '6px 10px', whiteSpace: 'nowrap' }}
                    >
                      Gán Phân Loại
                    </button>
                  </div>
                </div>

                {/* Hàng bộ lọc sản phẩm trong Modal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`seller-tab-btn ${batchModalFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setBatchModalFilter('all')}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Tất cả ({shopProducts.length})
                    </button>
                    <button
                      type="button"
                      className={`seller-tab-btn ${batchModalFilter === 'low_stock' ? 'active' : ''}`}
                      onClick={() => setBatchModalFilter('low_stock')}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Sắp hết hàng ({lowStockCount})
                    </button>
                    <button
                      type="button"
                      className={`seller-tab-btn ${batchModalFilter === 'near_expiry' ? 'active' : ''}`}
                      onClick={() => setBatchModalFilter('near_expiry')}
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
                    >
                      Cận Date ({nearExpiryCount})
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBatchSelectAll}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, fontSize: '12px', cursor: 'pointer', padding: 0 }}
                  >
                    {batchSelectedIds.size === shopProducts.length ? 'Bỏ chọn toàn bộ' : 'Chọn tất cả mặt hàng'}
                  </button>
                </div>
              </div>

              {/* Bảng Danh Sách Mặt Hàng Trong Ma Trận */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '360px', overflowY: 'auto', marginBottom: '16px' }}>
                <table className="shopee-table" style={{ width: '100%', fontSize: '12.5px', margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>
                    <tr>
                      <th style={{ width: '36px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={batchSelectedIds.size === shopProducts.length && shopProducts.length > 0}
                          onChange={handleToggleBatchSelectAll}
                          style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                        />
                      </th>
                      <th>Sản phẩm</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Tồn Hiện Tại</th>
                      <th style={{ width: '100px' }}>Nhập Thêm (+)</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Tồn Mới</th>
                      <th style={{ width: '90px' }}>Ngưỡng Tồn</th>
                      <th style={{ width: '130px' }}>Hạn Sử Dụng</th>
                      <th style={{ width: '110px' }}>Mã Lô</th>
                      <th style={{ width: '130px' }}>Phân Loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopProducts
                      .filter(p => {
                        if (batchModalFilter === 'low_stock') return isLowStockProduct(p);
                        if (batchModalFilter === 'near_expiry') return isNearExpiryProduct(p);
                        return true;
                      })
                      .map(p => {
                        const pid = p._id || p.id;
                        const it = batchItems[pid] || {
                          currentStock: p.stock || 0,
                          addStock: 0,
                          newStock: p.stock || 0,
                          safetyThreshold: typeof p.safetyThreshold === 'number' ? p.safetyThreshold : 10,
                          expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : '',
                          clearanceStatus: p.clearanceStatus || 'normal',
                          clearanceDiscount: p.clearanceDiscount || 0,
                          batchCode: p.batchCode || '',
                        };
                        const isChecked = batchSelectedIds.has(pid);
                        const isLow = it.currentStock <= (typeof it.safetyThreshold === 'number' ? it.safetyThreshold : 10);

                        return (
                          <tr key={pid} style={{ background: isChecked ? '#ffffff' : '#f8fafc', opacity: isChecked ? 1 : 0.65 }}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleBatchSelectOne(pid)}
                                style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                                />
                                <div style={{ minWidth: 0, maxWidth: '180px' }}>
                                  <div style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.name}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                    {formatCurrency(p.price)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, color: isLow ? '#dc2626' : '#16a34a' }}>
                                {it.currentStock}
                              </span>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="shopee-form-input"
                                style={{ padding: '4px 6px', fontSize: '12px', width: '100%' }}
                                value={it.addStock || ''}
                                placeholder="0"
                                onChange={(e) => handleBatchItemChange(pid, 'addStock', e.target.value)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <strong style={{ color: '#ea580c' }}>
                                {it.newStock ?? ((it.currentStock || 0) + (Number(it.addStock) || 0))}
                              </strong>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="shopee-form-input"
                                style={{ padding: '4px 6px', fontSize: '12px', width: '100%' }}
                                value={it.safetyThreshold}
                                onChange={(e) => handleBatchItemChange(pid, 'safetyThreshold', Number(e.target.value))}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="shopee-form-input"
                                style={{ padding: '4px 6px', fontSize: '11px', width: '100%' }}
                                value={it.expiryDate || ''}
                                onChange={(e) => handleBatchItemChange(pid, 'expiryDate', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="shopee-form-input"
                                placeholder="Lô #..."
                                style={{ padding: '4px 6px', fontSize: '11px', width: '100%' }}
                                value={it.batchCode || ''}
                                onChange={(e) => handleBatchItemChange(pid, 'batchCode', e.target.value)}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <select
                                  className="shopee-form-select"
                                  style={{ padding: '3px 4px', fontSize: '11px' }}
                                  value={it.clearanceStatus || 'normal'}
                                  onChange={(e) => handleBatchItemChange(pid, 'clearanceStatus', e.target.value)}
                                >
                                  <option value="normal">Bình thường</option>
                                  <option value="near_expiry">Cận Date</option>
                                  <option value="clearance">Xả Kho</option>
                                </select>
                                {it.clearanceStatus === 'clearance' && (
                                  <input
                                    type="number"
                                    min="0"
                                    max="90"
                                    placeholder="-% giảm"
                                    className="shopee-form-input"
                                    style={{ padding: '2px 4px', fontSize: '10.5px' }}
                                    value={it.clearanceDiscount || ''}
                                    onChange={(e) => handleBatchItemChange(pid, 'clearanceDiscount', Number(e.target.value))}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Footer Modal: Tổng Kết & Nút Lưu */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12.5px', color: '#475569' }}>
                    Đã chọn: <strong style={{ color: '#0f172a' }}>{batchSelectedIds.size}</strong> mặt hàng
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#475569' }}>
                    Tổng nhập thêm: <strong style={{ color: '#ea580c' }}>
                      {Array.from(batchSelectedIds).reduce((sum, id) => sum + (Number(batchItems[id]?.addStock) || 0), 0)}
                    </strong> cái
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowBatchInventoryModal(false)}
                    disabled={isSavingBatchInventory}
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-primary"
                    disabled={isSavingBatchInventory || batchSelectedIds.size === 0}
                    onClick={handleSaveBatchInventory}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                  >
                    <CheckIcon size={12} color="#ffffff" />
                    <span>{isSavingBatchInventory ? 'Đang Lưu...' : '💾 Lưu & Cập Nhật Tồn Kho'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
