import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import ShippingLabelModal from '../components/ShippingLabelModal';
import PackingSlipModal from '../components/PackingSlipModal';
import { FALLBACK_PRODUCTS, restoreProductStock } from '../services/productService';
import { fetchSellerOrders, updateSellerOrderStatus, createSellerProduct } from '../services/api';
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

  const lowStockCount = useMemo(() => {
    return shopProducts.filter(p => p.stock < 10).length;
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
      list = list.filter(p => p.stock < 10);
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
  const handleBulkConfirmPendingOrders = () => {
    const pendingOrders = shopOrders.filter(o => o.status === 'pending');
    if (pendingOrders.length === 0) {
      toast.info('Không có đơn hàng nào ở trạng thái Chờ xác nhận');
      return;
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
  const handleCreateWithdraw = (e) => {
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
  const handleCreateFlashSaleSubmit = (e) => {
    e.preventDefault();
    if (!flashSaleForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề chiến dịch Flash Sale!');
      return;
    }
    const newFs = {
      id: `fs_${Date.now()}`,
      shopId: selectedShopId,
      title: flashSaleForm.title.trim(),
      timeSlot: flashSaleForm.timeSlot,
      status: 'active',
      discountPercent: Math.min(90, Math.max(5, Number(flashSaleForm.discountPercent) || 20)),
      itemsCount: Math.max(1, Number(flashSaleForm.itemsCount) || 3),
      soldCount: 0,
      totalQuota: Math.max(5, Number(flashSaleForm.totalQuota) || 50),
    };
    setFlashSales(prev => [newFs, ...prev]);
    setShowCreateFlashSaleModal(false);
    setFlashSaleForm({
      title: '',
      timeSlot: '12:00 - 15:00 Hôm Nay',
      discountPercent: '25',
      totalQuota: '50',
      itemsCount: '3'
    });
    toast.success(`Chiến dịch Flash Sale "${newFs.title}" đã kích hoạt thành công!`);
  };

  // Bật/tắt trạng thái Flash Sale
  const handleToggleFlashSaleStatus = (fsId) => {
    setFlashSales(prev => prev.map(fs => {
      if (fs.id === fsId) {
        const nextStatus = fs.status === 'active' ? 'ended' : 'active';
        toast.info(nextStatus === 'active' ? 'Đã kích hoạt chiến dịch Flash Sale' : 'Đã kết thúc chiến dịch Flash Sale');
        return { ...fs, status: nextStatus };
      }
      return fs;
    }));
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
          <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'overview' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'wallet' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'orders' ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          className={`shopee-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'products' ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'flashsale' ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'vouchers' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'reviews' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'chats' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: activeTab === 'settings' ? 'rgba(100, 116, 139, 0.18)' : 'rgba(100, 116, 139, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SettingsIcon size={14} color="#64748b" />
          </span>
          <span>Hồ Sơ & Kho Hàng</span>
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
              <span className="seller-stat-chip">
                <UserIcon size={13} color="#2563eb" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                Chủ sở hữu: <strong>{user?.fullName || 'Trần Thị Chủ Shop (Thời Trang)'}</strong>
              </span>
              <span className="seller-stat-chip">
                <StoreIcon size={13} color="#ea580c" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                Kho: {currentShop.address}
              </span>
              <span className="seller-stat-chip">
                <PhoneIcon size={13} color="#16a34a" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                Hotline: {currentShop.phone}
              </span>
              <span className="seller-stat-chip">
                <TagIcon size={13} color="#8b5cf6" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                Ngành hàng: <strong>{currentShop.category}</strong>
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
              <span style={{ width: '22px', height: '22px', borderRadius: '5px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <GlobeIcon size={13} color="#0284c7" />
              </span>
              <span>Xem Gian Hàng Thực Tế</span>
              <span style={{ fontSize: '10px', background: '#fff7ed', color: '#ea580c', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>MALL</span>
            </Link>

            {/* Chỉ hiển thị công cụ chuyển shop cho tài khoản Admin quản trị toàn hệ thống */}
            {user?.role === 'admin' ? (
              <div className="shopee-shop-switcher" style={{ background: 'var(--bg-muted, #f8fafc)', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-color, #ea580c)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheckIcon size={14} color="#16a34a" /> Giám Sát Sàn (Admin):
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
                <LockIcon size={16} color="#f59e0b" />
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
              <CheckIcon size={12} color="#16a34a" />
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
                  <AlertCircleIcon size={12} color="#dc2626" />
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
                  <AlertCircleIcon size={12} color="#ea580c" />
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
              <StarIcon size={16} color="#059669" />
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
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChartBarIcon size={16} color="#2563eb" /> Biểu Đồ Doanh Số Bán Hàng 7 Ngày Gần Nhất
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Tính toán theo doanh thu thực tế của {currentShop.name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="seller-stat-chip" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <StarIcon size={12} color="#f59e0b" fill="#f59e0b" /> Tăng trưởng +15.4% tuần này
                  </span>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="shopee-btn shopee-btn-secondary"
                    style={{ fontSize: '12.5px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  >
                    <DownloadIcon size={14} color="#2563eb" />
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
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <StarIcon size={16} color="#f59e0b" fill="#f59e0b" /> Top Mặt Hàng Bán Chạy Nhất Tại {currentShop.name}
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
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <CreditCardIcon size={14} color="#ffffff" /> Rút Tiền Về Ngân Hàng
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
                  <CheckIcon size={12} color="#16a34a" />
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
                <span className="seller-badge-pill" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckIcon size={12} color="#16a34a" />
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
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ReceiptIcon size={16} color="#0284c7" /> Lịch Sử Giao Dịch Rút Tiền Doanh Thu
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
                  onClick={() => setShowCreateFlashSaleModal(true)}
                  className="shopee-btn shopee-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: 700 }}
                >
                  <PlusIcon size={14} color="#2563eb" />
                  <span>Tạo Chiến Dịch Flash Sale Mới</span>
                </button>
              </div>
            </div>

            {/* Danh sách chiến dịch Flash Sale */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {shopFlashSales.map((fs) => {
                const soldPct = Math.round(((fs.soldCount || 0) / (fs.totalQuota || 1)) * 100);
                return (
                  <div key={fs.id} className="shopee-table-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span className="seller-badge-pill" style={{
                          background: fs.status === 'active' ? '#fef3c7' : '#f1f5f9',
                          color: fs.status === 'active' ? '#b45309' : '#64748b',
                          border: `1px solid ${fs.status === 'active' ? '#fde68a' : '#cbd5e1'}`,
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
                          ) : fs.status === 'upcoming' ? (
                            <>
                              <ClockIcon size={12} color="#64748b" />
                              <span>SẮP DIỄN RA</span>
                            </>
                          ) : (
                            <span>ĐÃ KẾT THÚC</span>
                          )}
                        </span>
                        <h4 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800 }}>{fs.title}</h4>
                      </div>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>
                        -{fs.discountPercent}%
                      </span>
                    </div>

                    <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Khung giờ:</span>
                        <strong>{fs.timeSlot}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Số mặt hàng tham gia:</span>
                        <strong>{fs.itemsCount} sản phẩm</strong>
                      </div>
                    </div>

                    {/* Thanh tiến độ bán */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                        <span>Đã bán: {fs.soldCount} / {fs.totalQuota} suất</span>
                        <span style={{ color: '#ea580c' }}>{soldPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-medium, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, soldPct)}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #dc2626)', borderRadius: '4px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleFlashSaleStatus(fs.id)}
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
                            <ChatIcon size={13} color="#2563eb" /> Trả Lời Đánh Giá Này
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
                  <AlertCircleIcon size={24} className="text-amber-600" />
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
                  <ChevronRightIcon size={14} color="#ffffff" />
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
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={handleOpenAddModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <PlusIcon size={14} color="#ffffff" />
                  <span>Đăng Bán Sản Phẩm Mới</span>
                </button>
              </div>

              {/* Status Tabs: Tất cả | Đang bán | Đã ẩn | Sắp hết hàng */}
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircleIcon size={12} color="#dc2626" /> Sắp hết hàng ({lowStockCount})
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
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            Mã: {prod._id}
                          </small>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '12px',
                                color: prod.stock === 0 ? '#dc2626' : prod.stock < 10 ? '#ea580c' : '#16a34a'
                              }}
                            >
                              {prod.stock === 0 ? (
                                'Hết hàng (0)'
                              ) : prod.stock < 10 ? (
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
                              <PencilIcon size={11} color="#2563eb" />
                            </button>
                          </div>
                        </td>
                        <td>
                          <strong>{prod.sold || 0}</strong>
                        </td>
                        <td>
                          <span className={`shopee-status-badge ${prod.isActive ? 'status-active' : 'status-hidden'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {prod.isActive ? (
                              <>
                                <CheckIcon size={11} />
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
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(255,255,255,0.2)' }}>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: '#dbeafe' }}>
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
                          <small style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <PhoneIcon size={11} color="#2563eb" /> {ord.phone}
                          </small>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ord.productName}
                          </div>
                          <small style={{ color: '#4f46e5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => setSelectedOrderDetails(ord)}>
                            <span>Xem chi tiết kiện hàng</span>
                            <ChevronRightIcon size={12} />
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
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)' }}>
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
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: '#bbf7d0' }}>
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: '#e0f2fe' }}>
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: '#f1f5f9' }}>
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
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', background: '#dbeafe' }}>
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
                                <CheckIcon size={11} />
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
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ClockIcon size={10} color="#d97706" />
                                </span>
                                <span>Tạm Dừng</span>
                              </>
                            ) : (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div style={{ padding: '14px', borderBottom: '1px solid var(--border-medium)', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ChatIcon size={16} color="#2563eb" /> Tin Nhắn Khách Hàng ({shopChats.length})
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
                              style={{ background: 'var(--bg-card)', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <BoltIcon size={11} color="#eab308" /> {fastText}
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
              <SettingsIcon size={18} color="#64748b" />
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
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={14} color="#ef4444" />
                  </span>
                </button>
              </div>

              {/* Thông tin người nhận */}
              <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-medium)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPinIcon size={14} color="#ea580c" /> THÔNG TIN GIAO HÀNG & NGƯỜI NHẬN
                </div>
                <div style={{ fontSize: '13px' }}>
                  <strong>{selectedOrderDetails.customerName}</strong> ({selectedOrderDetails.phone})
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedOrderDetails.address}
                </div>
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TruckIcon size={13} color="#059669" /> Đơn vị vận chuyển: <strong>SPX Express</strong> (Mã vận đơn: {selectedOrderDetails.trackingCode})
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
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(71, 85, 105, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <h3>{editingProduct ? 'Chỉnh Sửa Mặt Hàng' : 'Đăng Bán Mặt Hàng Mới Cho Shop'}</h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowProductModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ sản phẩm"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <SparklesIcon size={14} color="#16a34a" /> AI Gợi ý phân loại:
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
                <h3>Tạo Mã Giảm Giá Cho {currentShop.name}</h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowVoucherModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ tạo voucher"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Rút Doanh Thu Về Tài Khoản</h3>
                  <small style={{ color: 'var(--text-muted)' }}>Cửa hàng: {currentShop.name}</small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowWithdrawModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ rút tiền"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div className="shopee-modal-content anim-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div className="shopee-modal-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BoltIcon size={16} color="#ea580c" />
                    <span>Tạo Flash Sale Mới Cho Shop</span>
                  </h3>
                  <small style={{ color: 'var(--text-muted)' }}>Cửa hàng: {currentShop.name}</small>
                </div>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowCreateFlashSaleModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Đóng cửa sổ tạo Flash Sale"
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Khung Giờ Flash Sale</label>
                    <select
                      className="shopee-form-select"
                      value={flashSaleForm.timeSlot}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, timeSlot: e.target.value })}
                    >
                      <option value="09:00 - 12:00 Sáng">09:00 - 12:00 Sáng</option>
                      <option value="12:00 - 15:00 Hôm Nay">12:00 - 15:00 Buổi Trưa</option>
                      <option value="18:00 - 21:00 Tối Nay">18:00 - 21:00 Khung Giờ Vàng</option>
                      <option value="21:00 - 23:59 Đêm">21:00 - 23:59 Săn Deal Nửa Đêm</option>
                    </select>
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Mức Giảm (%) *</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="90"
                      className="shopee-form-input"
                      value={flashSaleForm.discountPercent}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discountPercent: e.target.value })}
                    />
                  </div>
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Số Mặt Hàng Đăng Ký</label>
                    <input
                      type="number"
                      min="1"
                      className="shopee-form-input"
                      value={flashSaleForm.itemsCount}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, itemsCount: e.target.value })}
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label">Tổng Suất Bán Khuyến Mãi</label>
                    <input
                      type="number"
                      min="5"
                      className="shopee-form-input"
                      value={flashSaleForm.totalQuota}
                      onChange={(e) => setFlashSaleForm({ ...flashSaleForm, totalQuota: e.target.value })}
                    />
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
      </main>
    </div>
  );
}
