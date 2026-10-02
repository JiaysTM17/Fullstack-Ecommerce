import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCoin } from '../context/CoinContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import DeliveryLiveMapModal from '../components/DeliveryLiveMapModal';
import ProductReviewModal from '../components/ProductReviewModal';
import OrderDetailModal from '../components/OrderDetailModal';
import ShopChatModal from '../components/ShopChatModal';
import { cancelOrder } from '../services/orderService';
import { restoreProductStock } from '../services/productService';
import { pushBuyerNotification } from '../utils/notificationHelper';
import {
  PackageIcon,
  StoreIcon,
  ChatIcon,
  CopyIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  PrinterIcon,
  ReceiptIcon,
  EyeIcon,
  RefreshIcon,
  ClockIcon,
  CheckIcon,
  ReturnIcon,
  StarIcon,
  ShoppingBagIcon,
  ChevronRightIcon,
  CloseIcon,
  PhoneIcon,
  CoinIcon
} from '../components/OrdersIcons';
import '../styles/dashboard.css';

const INITIAL_CUSTOMER_ORDERS = [
  {
    orderId: "ORD918231",
    trackingCode: "SPX-VN-84729104",
    createdAt: "2026-09-24 14:20",
    shopName: "Thời Trang GenZ Official",
    items: [
      {
        name: "Áo sơ mi nữ công sở lụa satin cao cấp chống nhăn thanh lịch",
        price: 259000,
        quantity: 2,
        variant: "Xanh dương",
        size: "Freesize",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
      },
    ],
    total: 543000,
    subtotal: 518000,
    shippingFee: 25000,
    voucherDiscount: 0,
    coinDiscount: 0,
    status: "shipping",
    statusText: "Đang vận chuyển",
    stepIndex: 3, // 1: Placed, 2: Confirmed, 3: In Transit, 4: Delivered
    paymentMethod: "COD",
    timeline: [
      { time: "24/09 14:20", text: "Đơn hàng đã được đặt thành công" },
      { time: "24/09 15:30", text: "Shop Thời Trang GenZ đã xác nhận và đóng gói" },
      { time: "24/09 18:00", text: "Đơn hàng đã bàn giao cho SPX Express (Mã: SPX-VN-84729104)" },
      { time: "25/09 08:30", text: "Đang trên đường giao đến bạn (Dự kiến trước 18h)" },
    ],
  },
  {
    orderId: "ORD827103",
    trackingCode: "SPX-VN-91820412",
    createdAt: "2026-09-20 09:15",
    shopName: "TechWorld Store",
    items: [
      {
        name: "Tai nghe Bluetooth True Wireless chống ồn chủ động Hybrid ANC SoundPeak Pro",
        price: 650000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200",
      },
    ],
    total: 675000,
    subtotal: 650000,
    shippingFee: 25000,
    voucherDiscount: 0,
    coinDiscount: 0,
    status: "completed",
    statusText: "Giao thành công",
    stepIndex: 4,
    paymentMethod: "Chuyển khoản VietQR",
    timeline: [
      { time: "20/09 09:15", text: "Đơn hàng đã được đặt thành công" },
      { time: "20/09 10:00", text: "TechWorld Store đã chuẩn bị xong kiện hàng" },
      { time: "20/09 14:00", text: "Kiện hàng đã xuất kho trung chuyển Tân Bình" },
      { time: "21/09 11:30", text: "Đã giao thành công tới người nhận - Đã ký nhận" },
    ],
  },
];

const ORDERS_STORAGE_KEY = 'mini_shopee_customer_orders';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { earnCoins, grantOrderSpin } = useCoin();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isTrackingView, setIsTrackingView] = useState(() => searchParams.get('view') === 'tracking');
  const [trackingSearchCode, setTrackingSearchCode] = useState(() => searchParams.get('code') || '');
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const isTrack = searchParams.get('view') === 'tracking';
    setIsTrackingView(isTrack);
    const code = searchParams.get('code');
    if (code) setTrackingSearchCode(code);
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all' | '30days' | '3months' | 'year2026'

  // Ref tracking for sliding animated tab indicator
  const tabRefs = useRef({});
  const tabNavRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Update sliding indicator position & width to center precisely under active tab text
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      const navEl = tabNavRef.current;
      if (activeEl && navEl) {
        const textSpan = activeEl.querySelector('.shopee-order-tab-text') || activeEl;
        const navRect = navEl.getBoundingClientRect();
        const textRect = textSpan.getBoundingClientRect();

        const targetWidth = Math.max(36, Math.round(textRect.width + 10));
        // Distance from left edge of nav container to center of text span, accounting for scrollLeft
        const textCenterInNav = (textRect.left - navRect.left) + navEl.scrollLeft + textRect.width / 2;
        const targetLeft = Math.round(textCenterInNav - targetWidth / 2);

        setIndicatorStyle({
          left: targetLeft,
          width: targetWidth,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const rafId = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 60);
    const timer2 = setTimeout(updateIndicator, 200);
    window.addEventListener('resize', updateIndicator);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateIndicator);
    }
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map(o => o.orderId));
        const merged = [...parsed, ...INITIAL_CUSTOMER_ORDERS.filter(o => !existingIds.has(o.orderId))];
        return merged;
      }
    } catch {
      // fallback
    }
    return INITIAL_CUSTOMER_ORDERS;
  });

  const [selectedDetailOrder, setSelectedDetailOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [returnToDetailOrder, setReturnToDetailOrder] = useState(null);
  const [selectedChatShop, setSelectedChatShop] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [selectedLiveMapOrder, setSelectedLiveMapOrder] = useState(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Tôi muốn thay đổi địa chỉ nhận hàng');
  const [cancelNote, setCancelNote] = useState('');

  // Seamless transition from OrderDetailModal to child modal (prevents modal overlap)
  const handleOpenFromDetail = (setterFn, order) => {
    setReturnToDetailOrder(order || selectedDetailOrder);
    setIsDetailModalOpen(false);
    setterFn(order);
  };

  // Restores OrderDetailModal cleanly when child modal is closed
  const handleCloseChildModal = (resetFn) => {
    resetFn();
    if (returnToDetailOrder) {
      const refreshed = orders.find(
        (o) => (o.orderId || o._id || o.id) === (returnToDetailOrder.orderId || returnToDetailOrder._id || returnToDetailOrder.id)
      ) || returnToDetailOrder;
      setSelectedDetailOrder(refreshed);
      setIsDetailModalOpen(true);
      setReturnToDetailOrder(null);
    }
  };

  const CANCEL_REASONS = [
    'Tôi muốn thay đổi địa chỉ nhận hàng',
    'Tôi muốn đổi sản phẩm / kích thước / màu sắc',
    'Tôi tìm thấy nơi khác bán giá tốt hơn',
    'Thay đổi phương thức thanh toán',
    'Thời gian giao hàng dự kiến quá lâu',
    'Lý do cá nhân khác',
  ];

  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
    } catch {
      // ignore
    }
  };

  // Lắng nghe sự kiện storage để đồng bộ thời gian thực khi Người bán cập nhật trạng thái đơn
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const handleReturnSubmit = ({ orderId, reason, refundMethod, note, refundAmount }) => {
    const updated = orders.map((o) => {
      if (o.orderId !== orderId) return o;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextTimeline = [
        ...(o.timeline || []),
        { time: `Hôm nay ${nowStr}`, text: `Đã gửi yêu cầu Trả hàng / Hoàn tiền: ${reason}. Nhận hoàn qua: ${refundMethod}` },
      ];
      return {
        ...o,
        status: 'returning',
        statusText: 'Đang xử lý đổi trả',
        returnDetails: { reason, refundMethod, note, refundAmount },
        timeline: nextTimeline,
      };
    });

    saveOrders(updated);
    if (selectedDetailOrder && (selectedDetailOrder.orderId === orderId || selectedDetailOrder._id === orderId)) {
      setSelectedDetailOrder((prev) => ({
        ...prev,
        status: 'returning',
        statusText: 'Đang xử lý đổi trả',
        returnDetails: { reason, refundMethod, note, refundAmount },
      }));
    }
    setSelectedReturnOrder(null);
    showToast('Đã gửi yêu cầu trả hàng / hoàn tiền thành công! Shop sẽ phản hồi trong 24h.', 'success');
  };

  const handleSimulateNextStep = (orderId) => {
    const updated = orders.map((o) => {
      if (o.orderId !== orderId) return o;

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let nextStep = (o.stepIndex || 1) + 1;
      let nextStatus = o.status;
      let nextStatusText = o.statusText;
      let newEventText = '';

      if (nextStep === 2) {
        nextStatus = 'shipping';
        nextStatusText = 'Shop đã đóng gói & Bàn giao SPX';
        newEventText = 'Shop đã hoàn tất đóng gói và bàn giao kiện hàng cho SPX Express';
      } else if (nextStep === 3) {
        nextStatus = 'shipping';
        nextStatusText = 'Đang vận chuyển giao đến bạn';
        newEventText = 'Bưu tá SPX Express đang di chuyển giao hàng đến địa chỉ của bạn';
      } else if (nextStep >= 4) {
        nextStep = 4;
        nextStatus = 'completed';
        nextStatusText = 'Giao hàng thành công';
        newEventText = 'Đã giao hàng thành công tới tay người nhận. Ký nhận an toàn.';
      }

      const nextTimeline = [
        ...(o.timeline || []),
        { time: `Hôm nay ${nowStr}`, text: newEventText }
      ];

      return {
        ...o,
        stepIndex: nextStep,
        status: nextStatus,
        statusText: nextStatusText,
        timeline: nextTimeline,
      };
    });

    saveOrders(updated);
    const updatedOrder = updated.find(o => o.orderId === orderId);
    if (selectedOrderDetails?.orderId === orderId) {
      setSelectedOrderDetails(updatedOrder);
    }
    showToast(`Đã mô phỏng bước tiếp theo: ${updatedOrder.statusText}!`, 'success');
  };

  const [searchTerm, setSearchTerm] = useState('');

  // Date parsing utility supporting multiple string formats
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    const str = String(dateStr).trim();

    // 1. Direct standard Date parsing if ISO or standard format
    const directDate = new Date(str);
    if (!isNaN(directDate.getTime()) && str.includes('-')) {
      return directDate;
    }

    // 2. DD/MM/YYYY or DD-MM-YYYY HH:mm
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (dmy) {
      return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), Number(dmy[4] || 0), Number(dmy[5] || 0));
    }

    // 3. YYYY/MM/DD or YYYY-MM-DD HH:mm
    const ymd = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{2}):(\d{2}))?/);
    if (ymd) {
      return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), Number(ymd[4] || 0), Number(ymd[5] || 0));
    }

    return isNaN(directDate.getTime()) ? new Date() : directDate;
  };

  const formatOrderDate = (dateVal) => {
    if (!dateVal) return '';
    const s = String(dateVal).trim();
    const squished = s.match(/^(\d{1,2}:\d{2})\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (squished) {
      return `${squished[1]} · ${squished[2]}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime()) && s.includes('-')) {
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${time} · ${date}`;
    }
    return s.replace(/,\s*/, ' · ').replace(/\s+/, ' · ');
  };

  const matchesDateRange = (ordDate) => {
    if (dateRange === 'all') return true;
    const d = parseOrderDate(ordDate);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

    if (dateRange === '30days') {
      return diffDays >= -1 && diffDays <= 30;
    }
    if (dateRange === '3months') {
      return diffDays >= -1 && diffDays <= 90;
    }
    if (dateRange === 'year2026') {
      return d.getFullYear() === 2026 || String(ordDate).includes('2026');
    }
    return true;
  };

  const getTabCount = (tabId) => {
    if (tabId === 'all') return orders.length;
    if (tabId === 'pending') return orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    return orders.filter((o) => o.status === tabId).length;
  };

  const filteredOrders = orders.filter((ord) => {
    // 1. Status Tab filter
    if (activeTab === 'pending') {
      if (ord.status !== 'pending' && ord.status !== 'confirmed') return false;
    } else if (activeTab !== 'all' && ord.status !== activeTab) {
      return false;
    }

    // 2. Date Range filter
    const ordDate = ord.createdAt || ord.orderDate;
    if (!matchesDateRange(ordDate)) {
      return false;
    }

    // 3. Keyword Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchId = (ord.orderId || '').toLowerCase().includes(term);
      const matchTracking = (ord.trackingCode || '').toLowerCase().includes(term);
      const matchItems = (ord.items || []).some((item) =>
        (item.name || '').toLowerCase().includes(term)
      );
      const matchShop = (ord.shopName || '').toLowerCase().includes(term);
      return matchId || matchTracking || matchItems || matchShop;
    }

    return true;
  });

  // 1-Click Clipboard Copy with Toast Feedback
  const handleCopy = (text, label) => {
    if (!text) return;
    const fallbackCopy = () => {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        showToast(`Đã sao chép ${label}: ${text}`, 'success');
      } catch {
        showToast(`Đã sao chép: ${text}`, 'info');
      }
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(`Đã sao chép ${label}: ${text}`, 'success'))
        .catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  // Export Order History to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      showToast('Không có đơn hàng nào để xuất báo cáo!', 'warning');
      return;
    }

    const headers = [
      'Mã đơn hàng',
      'Ngày đặt',
      'Người nhận',
      'Số điện thoại',
      'Địa chỉ',
      'Sản phẩm',
      'Tổng thanh toán',
      'Phương thức thanh toán',
      'Trạng thái',
      'Mã vận đơn SPX',
    ];

    const escapeCSV = (val) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredOrders.map((ord) => {
      const itemsSummary = (ord.items || [])
        .map((it) => `${it.name} (x${it.quantity || 1})`)
        .join('; ');
      const recipient = ord.customerName || ord.customer?.fullName || user?.name || 'Khách Hàng';
      const phone = ord.phone || ord.customer?.phone || '0901234567';
      const address = ord.shippingAddress || ord.address || ord.customer?.address || 'Việt Nam';
      const total = ord.total || 0;
      const tracking = ord.trackingCode || (ord.orderId ? `SPX-VN-${ord.orderId}` : '');

      return [
        escapeCSV(ord.orderId),
        escapeCSV(ord.createdAt || ''),
        escapeCSV(recipient),
        escapeCSV(phone),
        escapeCSV(address),
        escapeCSV(itemsSummary),
        escapeCSV(total),
        escapeCSV(ord.paymentMethod || 'COD'),
        escapeCSV(ord.statusText || ord.status),
        escapeCSV(tracking),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Lich-Su-Don-Hang-Shopee.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo lịch sử đơn hàng (CSV) thành công!', 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleConfirmCancelOrder = async () => {
    if (!selectedCancelOrder) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = orders.map((o) => {
      if (o.orderId !== selectedCancelOrder.orderId) return o;
      const nextTimeline = [
        ...(o.timeline || []),
        { time: `Hôm nay ${nowStr}`, text: `Đã hủy đơn hàng: ${cancelReason}. ${cancelNote ? `Ghi chú: ${cancelNote}` : ''}` }
      ];
      return {
        ...o,
        status: 'cancelled',
        statusText: t('status_cancelled_by_you', 'Đã hủy bởi bạn'),
        cancelReason,
        cancelNote,
        stepIndex: 0,
        timeline: nextTimeline,
      };
    });
    saveOrders(updated);

    // Đồng bộ vào mini_shopee_orders nếu có trong localStorage
    try {
      const rawAll = localStorage.getItem('mini_shopee_orders');
      if (rawAll) {
        const allOrders = JSON.parse(rawAll);
        const updatedAll = allOrders.map((o) => {
          if (o.orderId === selectedCancelOrder.orderId || o._id === selectedCancelOrder.orderId) {
            return {
              ...o,
              status: 'cancelled',
              statusText: 'Đã hủy bởi người mua',
              cancelReason,
              cancelNote,
              stepIndex: 0,
            };
          }
          return o;
        });
        localStorage.setItem('mini_shopee_orders', JSON.stringify(updatedAll));
      }
    } catch (err) {
      console.warn('Error syncing mini_shopee_orders on cancel:', err);
    }

    // 1. Hoàn trả tồn kho cho các sản phẩm trong đơn đã hủy
    if (selectedCancelOrder.items && selectedCancelOrder.items.length > 0) {
      try {
        restoreProductStock(selectedCancelOrder.items);
      } catch (err) {
        console.warn('Error restoring product stock on cancel:', err);
      }
    }

    // 2. Đồng bộ trạng thái đơn hủy sang Kênh Quản Lý Người Bán
    try {
      const rawSeller = localStorage.getItem('mini_shopee_seller_orders');
      if (rawSeller) {
        const sellerOrders = JSON.parse(rawSeller);
        const updatedSeller = sellerOrders.map((so) => {
          if (so.orderId === selectedCancelOrder.orderId || so._id === selectedCancelOrder.orderId) {
            return {
              ...so,
              status: 'cancelled',
              statusText: 'Đã hủy bởi người mua',
              cancelReason,
              cancelNote,
              stepIndex: 0,
            };
          }
          return so;
        });
        localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(updatedSeller));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('Error syncing seller orders on cancel:', err);
    }

    // 3. Hoàn trả xu đã sử dụng khi hủy đơn (nếu có)
    const coinRefundAmount = Number(
      selectedCancelOrder.coinUsed ||
      selectedCancelOrder.coinsUsed ||
      selectedCancelOrder.coinsDeducted ||
      selectedCancelOrder.coinDiscount ||
      0
    );
    if (coinRefundAmount > 0 && earnCoins) {
      earnCoins(coinRefundAmount, `Hoàn xu do hủy đơn hàng #${selectedCancelOrder.orderId}`, selectedCancelOrder.orderId, 'refund');
    }

    // 4. Gọi backend API hủy đơn trong try/catch
    try {
      await cancelOrder(selectedCancelOrder.orderId || selectedCancelOrder._id);
    } catch (apiErr) {
      console.warn("Backend order cancellation notice:", apiErr?.message);
    }

    pushBuyerNotification({
      type: 'order',
      title: `Đã hủy đơn hàng #${selectedCancelOrder.orderId}`,
      message: `Đơn hàng đã được hủy thành công. Tồn kho và ${coinRefundAmount > 0 ? `${coinRefundAmount} xu` : 'dữ liệu'} đã được hoàn trả.`,
      link: '/orders',
    });

    setSelectedCancelOrder(null);
    setCancelNote('');
    showToast(t('order_cancelled_toast', 'Đã hủy đơn hàng thành công, hoàn trả số lượng kho và số dư xu!'), 'info');
  };

  const handleReviewSubmit = (reviewData) => {
    const updated = orders.map((o) => {
      if (o.orderId === reviewData.orderId || o._id === reviewData.orderId) {
        return {
          ...o,
          reviewed: true,
          reviewData,
        };
      }
      return o;
    });
    saveOrders(updated);
    if (selectedDetailOrder && (selectedDetailOrder.orderId === reviewData.orderId || selectedDetailOrder._id === reviewData.orderId)) {
      setSelectedDetailOrder((prev) => ({
        ...prev,
        reviewed: true,
        reviewData,
      }));
    }

    // Lưu đánh giá vào bộ nhớ sản phẩm để hiển thị ngay trên PDP
    try {
      const pKey = `mini_shopee_product_reviews_${reviewData.productId}`;
      const rawPrev = localStorage.getItem(pKey);
      const prevReviews = rawPrev ? JSON.parse(rawPrev) : [];
      const newRev = {
        id: `rev_${Date.now()}`,
        userName: user?.name || 'Khách hàng',
        rating: reviewData.rating,
        date: new Date().toLocaleDateString('vi-VN'),
        title: reviewData.tags?.[0] || 'Đánh giá sản phẩm',
        content: reviewData.comment,
        verifiedPurchase: true,
        tags: reviewData.tags,
      };
      localStorage.setItem(pKey, JSON.stringify([newRev, ...prevReviews]));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // Thưởng 200 Xu cho khách hàng
    if (earnCoins) {
      earnCoins(200, `Thưởng đánh giá sản phẩm đơn hàng #${reviewData.orderId}`, reviewData.orderId, 'review');
    }

    pushBuyerNotification({
      type: 'voucher',
      title: `Nhận +200 Xu thưởng`,
      message: `Bạn nhận được 200 Xu thưởng nhờ đánh giá sản phẩm cho đơn #${reviewData.orderId}!`,
      link: '/profile',
    });

    setSelectedReviewOrder(null);
    showToast('Cảm ơn bạn! Đã gửi đánh giá thành công và nhận thưởng +200 Xu!', 'success');
  };

  const handleBuyAgain = (item) => {
    setIsDetailModalOpen(false);
    setSelectedDetailOrder(null);
    setReturnToDetailOrder(null);

    addToCart(item, 1);
    showToast(t('buy_again_toast', `Đã thêm "${item.name || 'sản phẩm'}" vào giỏ hàng thành công! Đang chuyển đến giỏ hàng...`), 'success');
    navigate('/cart');
  };

  const handleReorderWholeOrder = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      showToast('Đơn hàng không có sản phẩm để mua lại', 'warning');
      return;
    }
    setIsDetailModalOpen(false);
    setSelectedDetailOrder(null);
    setReturnToDetailOrder(null);

    order.items.forEach((item) => {
      addToCart(item, item.quantity || 1);
    });
    showToast(`Đã thêm ${order.items.length} sản phẩm vào giỏ hàng thành công! Đang chuyển đến giỏ hàng...`, 'success');
    navigate('/cart');
  };

  const handleConfirmDelivered = (orderId) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = orders.map((o) => {
      if (o.orderId !== orderId) return o;
      const nextTimeline = [
        ...(o.timeline || []),
        { time: `Hôm nay ${nowStr}`, text: 'Người mua đã xác nhận nhận hàng thành công' }
      ];
      return {
        ...o,
        status: 'completed',
        statusText: 'Giao thành công',
        stepIndex: 4,
        timeline: nextTimeline,
      };
    });
    saveOrders(updated);

    // Sync to mini_shopee_orders if exists
    try {
      const rawAll = localStorage.getItem('mini_shopee_orders');
      if (rawAll) {
        const allOrders = JSON.parse(rawAll);
        const updatedAll = allOrders.map((o) => {
          if (o.orderId === orderId || o._id === orderId) {
            return { ...o, status: 'completed', statusText: 'Giao thành công', stepIndex: 4 };
          }
          return o;
        });
        localStorage.setItem('mini_shopee_orders', JSON.stringify(updatedAll));
      }
    } catch {}

    // Sync to mini_shopee_seller_orders
    try {
      const rawSeller = localStorage.getItem('mini_shopee_seller_orders');
      if (rawSeller) {
        const sellerOrders = JSON.parse(rawSeller);
        const updatedSeller = sellerOrders.map((so) => {
          if (so.orderId === orderId || so._id === orderId) {
            return {
              ...so,
              status: 'completed',
              statusText: 'Giao thành công',
              stepIndex: 4,
            };
          }
          return so;
        });
        localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(updatedSeller));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('Error syncing seller orders on delivered:', err);
    }

    // Award spin if available
    if (grantOrderSpin) {
      try {
        grantOrderSpin(orderId);
      } catch {}
    }

    showToast('Bạn đã xác nhận nhận hàng! Hãy để lại đánh giá để nhận ngay +200 Xu.', 'success');
    const target = updated.find((o) => o.orderId === orderId);
    if (target) {
      setSelectedReviewOrder(target);
    }
  };

  useEffect(() => {
    if (
      selectedInvoiceOrder ||
      selectedReturnOrder ||
      selectedLiveMapOrder ||
      selectedReviewOrder ||
      selectedCancelOrder ||
      selectedChatShop ||
      (isDetailModalOpen && selectedDetailOrder)
    ) {
      window.scrollTo({ top: 80, behavior: 'smooth' });
    }
  }, [
    selectedInvoiceOrder,
    selectedReturnOrder,
    selectedLiveMapOrder,
    selectedReviewOrder,
    selectedCancelOrder,
    selectedChatShop,
    isDetailModalOpen,
    selectedDetailOrder,
  ]);

  const renderInlineCancelOrder = () => (
    <div
      className="cancel-order-inline-container"
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        animation: 'fadeIn 0.25s ease-out',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="shopee-order-btn-outline"
            onClick={() => handleCloseChildModal(() => setSelectedCancelOrder(null))}
            style={{
              borderRadius: '6px',
              padding: '0 10px',
              fontWeight: 600,
              fontSize: '11.5px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '6px',
            }}
          >
            ← Quay lại
          </button>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloseIcon size={16} />
            <span>Hủy Đơn Hàng: #{selectedCancelOrder.orderId}</span>
          </h3>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
        Vui lòng chọn lý do bạn muốn hủy đơn hàng. Số tiền đã thanh toán (nếu có) và điểm Xu sẽ được tự động hoàn trả đầy đủ vào tài khoản của bạn:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {CANCEL_REASONS.map((r, idx) => (
          <label
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: cancelReason === r ? '#eff6ff' : '#f8fafc',
              border: `1.5px solid ${cancelReason === r ? '#2563eb' : '#e2e8f0'}`,
              color: cancelReason === r ? '#2563eb' : '#0f172a',
              fontWeight: cancelReason === r ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              name="cancel_reason"
              checked={cancelReason === r}
              onChange={() => setCancelReason(r)}
              style={{ accentColor: '#2563eb' }}
            />
            <span>{r}</span>
          </label>
        ))}
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
          Ghi chú thêm (không bắt buộc):
        </label>
        <textarea
          value={cancelNote}
          onChange={(e) => setCancelNote(e.target.value)}
          placeholder="Nhập chi tiết lý do bạn muốn hủy đơn để người bán rút kinh nghiệm..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '12.5px',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          type="button"
          className="shopee-order-btn-outline"
          onClick={() => handleCloseChildModal(() => setSelectedCancelOrder(null))}
          style={{ padding: '7px 18px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 600 }}
        >
          Giữ Lại Đơn
        </button>
        <button
          type="button"
          className="shopee-order-btn-danger-outline"
          style={{
            background: '#dc2626',
            color: '#ffffff',
            border: '1px solid #dc2626',
            padding: '7px 20px',
            fontSize: '12.5px',
            fontWeight: 700,
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => {
            handleConfirmCancelOrder();
            handleCloseChildModal(() => setSelectedCancelOrder(null));
          }}
        >
          Xác Nhận Hủy Đơn
        </button>
      </div>
    </div>
  );

  return (
    <main className="shopee-container" style={{ padding: '24px 16px', maxWidth: '1240px' }}>
      <div className="account-portal-layout">
        {/* Sticky Left Navigation & Filters Sidebar */}
        <AccountSidebar
          activeSection={isTrackingView ? 'tracking' : 'orders'}
          isTrackingView={isTrackingView}
          onSelectTrackingView={(showTracking) => {
            setSelectedDetailOrder(null);
            setIsDetailModalOpen(false);
            setSelectedInvoiceOrder(null);
            setSelectedReturnOrder(null);
            setSelectedLiveMapOrder(null);
            setSelectedCancelOrder(null);
            setSelectedReviewOrder(null);
            setSelectedChatShop(null);
            setIsTrackingView(showTracking);
            if (showTracking) {
              setSearchParams({ view: 'tracking' });
            } else {
              const next = new URLSearchParams(searchParams);
              next.delete('view');
              setSearchParams(next);
            }
          }}
          orderCounts={{
            all: orders.length,
            pending: getTabCount('pending'),
            shipping: getTabCount('shipping'),
            completed: getTabCount('completed'),
            returning: getTabCount('returning'),
            cancelled: getTabCount('cancelled'),
          }}
          activeStatusTab={activeTab}
          onSelectStatusTab={(tabId) => {
            setSelectedDetailOrder(null);
            setIsDetailModalOpen(false);
            setSelectedInvoiceOrder(null);
            setSelectedReturnOrder(null);
            setSelectedLiveMapOrder(null);
            setSelectedCancelOrder(null);
            setSelectedReviewOrder(null);
            setSelectedChatShop(null);
            setIsTrackingView(false);
            setActiveTab(tabId);
            const next = new URLSearchParams(searchParams);
            next.delete('view');
            setSearchParams(next);
          }}
          dateRange={dateRange}
          onSelectDateRange={setDateRange}
          onExportCSV={handleExportCSV}
          onPrintReport={handlePrintReport}
        />

        {/* Right Main Content Area */}
        <div className="account-portal-main-content">
          <div 
            style={{ 
              background: (selectedInvoiceOrder || selectedReturnOrder || selectedLiveMapOrder || selectedReviewOrder || selectedChatShop || selectedCancelOrder || (isDetailModalOpen && selectedDetailOrder)) ? 'transparent' : 'var(--bg-card, #ffffff)', 
              borderRadius: 'var(--radius-lg, 12px)', 
              padding: (selectedInvoiceOrder || selectedReturnOrder || selectedLiveMapOrder || selectedReviewOrder || selectedChatShop || selectedCancelOrder || (isDetailModalOpen && selectedDetailOrder)) ? '0' : '20px 24px', 
              border: (selectedInvoiceOrder || selectedReturnOrder || selectedLiveMapOrder || selectedReviewOrder || selectedChatShop || selectedCancelOrder || (isDetailModalOpen && selectedDetailOrder)) ? 'none' : '1px solid var(--border-medium, #e2e8f0)',
              boxShadow: (selectedInvoiceOrder || selectedReturnOrder || selectedLiveMapOrder || selectedReviewOrder || selectedChatShop || selectedCancelOrder || (isDetailModalOpen && selectedDetailOrder)) ? 'none' : 'var(--shadow-sm)'
            }}
          >
            {selectedInvoiceOrder ? (
              <InvoiceReceiptModal
                order={selectedInvoiceOrder}
                inline={true}
                onClose={() => handleCloseChildModal(() => setSelectedInvoiceOrder(null))}
              />
            ) : selectedReturnOrder ? (
              <ReturnRequestModal
                order={selectedReturnOrder}
                inline={true}
                onClose={() => handleCloseChildModal(() => setSelectedReturnOrder(null))}
                onSubmit={(data) => {
                  handleReturnSubmit(data);
                  handleCloseChildModal(() => setSelectedReturnOrder(null));
                }}
              />
            ) : selectedLiveMapOrder ? (
              <DeliveryLiveMapModal
                order={selectedLiveMapOrder}
                inline={true}
                onClose={() => handleCloseChildModal(() => setSelectedLiveMapOrder(null))}
              />
            ) : selectedReviewOrder ? (
              <ProductReviewModal
                order={selectedReviewOrder}
                inline={true}
                onClose={() => handleCloseChildModal(() => setSelectedReviewOrder(null))}
                onSubmitReview={(data) => {
                  handleReviewSubmit(data);
                  handleCloseChildModal(() => setSelectedReviewOrder(null));
                }}
                onSubmit={(data) => {
                  handleReviewSubmit(data);
                  handleCloseChildModal(() => setSelectedReviewOrder(null));
                }}
              />
            ) : selectedChatShop ? (
              <ShopChatModal
                shop={selectedChatShop.shop}
                currentProduct={selectedChatShop.currentProduct}
                inline={true}
                onClose={() => handleCloseChildModal(() => setSelectedChatShop(null))}
              />
            ) : selectedCancelOrder ? (
              renderInlineCancelOrder()
            ) : isDetailModalOpen && selectedDetailOrder ? (
              <OrderDetailModal
                order={selectedDetailOrder}
                isOpen={isDetailModalOpen}
                inline={true}
                onClose={() => {
                  setIsDetailModalOpen(false);
                  setSelectedDetailOrder(null);
                  setReturnToDetailOrder(null);
                }}
                onOpenChat={(order) => {
                  handleOpenFromDetail(
                    (ord) =>
                      setSelectedChatShop({
                        shop: { name: ord?.shopName || 'Shop', id: ord?.shopId },
                        currentProduct: ord?.items?.[0],
                      }),
                    order
                  );
                }}
                onOpenTracking={(order) => handleOpenFromDetail(setSelectedLiveMapOrder, order)}
                onOpenLiveMap={(order) => handleOpenFromDetail(setSelectedLiveMapOrder, order)}
                onOpenInvoice={(order) => handleOpenFromDetail(setSelectedInvoiceOrder, order)}
                onBuyAgainItem={(item) => handleBuyAgain(item)}
                onReorderWhole={(order) => handleReorderWholeOrder(order)}
                onOpenCancelOrder={(order) => handleOpenFromDetail(setSelectedCancelOrder, order)}
                onOpenReturnModal={(order) => handleOpenFromDetail(setSelectedReturnOrder, order)}
                onOpenReviewModal={(order) => handleOpenFromDetail(setSelectedReviewOrder, order)}
                onSimulateStep={(orderId) => handleSimulateNextStep(orderId)}
              />
            ) : isTrackingView ? (
              <div className="spx-tracking-portal-view">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}>
                        <TruckIcon size={24} />
                      </span>
                      <span>Tra Cứu Vận Đơn SPX Express</span>
                    </h1>
                    <p style={{ margin: '3px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Kiểm tra tiến độ giao hàng bưu kiện, lịch trình trung chuyển và vị trí tài xế thời gian thực.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => {
                      setIsTrackingView(false);
                      const next = new URLSearchParams(searchParams);
                      next.delete('view');
                      setSearchParams(next);
                    }}
                    style={{ fontSize: '12.5px' }}
                  >
                    ← Quay lại Đơn Mua
                  </button>
                </div>

                {/* Tracking Search Input Form */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Nhập mã vận đơn hoặc chọn nhanh từ đơn hàng của bạn:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={trackingSearchCode}
                      onChange={(e) => setTrackingSearchCode(e.target.value)}
                      placeholder="Nhập mã vận đơn SPX (ví dụ: SPX-VN-84729104)..."
                      style={{
                        flex: 1,
                        minWidth: '240px',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary"
                      style={{ padding: '10px 20px', fontWeight: 700, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        const trimmed = trackingSearchCode.trim().toUpperCase();
                        if (!trimmed) {
                          showToast('Vui lòng nhập mã vận đơn để tra cứu!', 'warning');
                          return;
                        }
                        const found = orders.find(
                          (o) => (o.trackingCode && o.trackingCode.toUpperCase().includes(trimmed)) || (o.orderId && o.orderId.toUpperCase().includes(trimmed))
                        );
                        if (found) {
                          setSelectedTrackingOrder(found);
                          showToast(`Tìm thấy bưu kiện cho đơn hàng #${found.orderId}!`, 'success');
                        } else {
                          showToast('Không tìm thấy thông tin cho mã vận đơn này!', 'error');
                        }
                      }}
                    >
                      <TruckIcon size={14} /> Tra Cứu Vận Đơn
                    </button>
                  </div>

                  {/* Quick Select Pills from user's current shipping orders */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Đơn hàng khả dụng:</span>
                    {orders.filter(o => o.trackingCode).slice(0, 4).map((o) => (
                      <button
                        key={o.orderId}
                        type="button"
                        className="copy-pill"
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          background: (selectedTrackingOrder?.orderId === o.orderId || trackingSearchCode === o.trackingCode) ? '#eff6ff' : '#ffffff',
                          borderColor: (selectedTrackingOrder?.orderId === o.orderId || trackingSearchCode === o.trackingCode) ? '#2563eb' : '#cbd5e1',
                          color: (selectedTrackingOrder?.orderId === o.orderId || trackingSearchCode === o.trackingCode) ? '#2563eb' : '#334155',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={() => {
                          setTrackingSearchCode(o.trackingCode);
                          setSelectedTrackingOrder(o);
                        }}
                      >
                        <TruckIcon size={11} /> {o.trackingCode} (#{o.orderId})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Tracking Result Card */}
                {(() => {
                  const activeTrackingOrder = selectedTrackingOrder || orders.find(o => o.status === 'shipping') || orders[0];
                  if (!activeTrackingOrder) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Bạn chưa có bưu kiện nào để tra cứu.
                      </div>
                    );
                  }

                  return (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
                      {/* Tracking Card Header */}
                      <div style={{ background: '#f8fafc', padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                              Mã Vận Đơn: {activeTrackingOrder.trackingCode || 'SPX-VN-84729104'}
                            </span>
                            <span
                              className="copy-pill"
                              onClick={() => {
                                navigator.clipboard.writeText(activeTrackingOrder.trackingCode || 'SPX-VN-84729104');
                                showToast('Đã sao chép mã vận đơn!', 'success');
                              }}
                              style={{ cursor: 'pointer', fontSize: '11px' }}
                            >
                              <CopyIcon size={11} /> Sao chép
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Đơn hàng: #{activeTrackingOrder.orderId} · Đơn vị: SPX Express Tiết Kiệm
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: activeTrackingOrder.status === 'completed' ? '#dcfce7' : '#eff6ff',
                            color: activeTrackingOrder.status === 'completed' ? '#15803d' : '#1d4ed8',
                          }}>
                            {activeTrackingOrder.statusText || 'Đang vận chuyển'}
                          </span>
                          <button
                            type="button"
                            className="shopee-order-btn-primary"
                            onClick={() => setSelectedLiveMapOrder(activeTrackingOrder)}
                            style={{ fontSize: '11.5px', height: '28px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <MapPinIcon size={12} /> Xem Bản Đồ Shipper
                          </button>
                        </div>
                      </div>

                      {/* Stepper Progress Bar */}
                      <div style={{ padding: '20px 18px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                          {[
                            { step: 1, label: 'Đặt Hàng', sub: 'Thành công' },
                            { step: 2, label: 'Người Bán', sub: 'Đã đóng gói' },
                            { step: 3, label: 'SPX Express', sub: 'Đã nhận kiện' },
                            { step: 4, label: 'Đang Giao', sub: 'Shipper giao' },
                            { step: 5, label: 'Thành Công', sub: 'Đã ký nhận' },
                          ].map((s) => {
                            const stepIdx = activeTrackingOrder.stepIndex || (activeTrackingOrder.status === 'completed' ? 5 : 4);
                            const isPassed = s.step <= stepIdx;
                            const isCurrent = s.step === stepIdx;
                            return (
                              <div key={s.step} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: isPassed ? '#2563eb' : '#f1f5f9',
                                  color: isPassed ? '#ffffff' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  margin: '0 auto 6px',
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none',
                                }}>
                                  {isPassed ? <CheckIcon size={12} color="#ffffff" /> : s.step}
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: isPassed ? 700 : 500, color: isPassed ? '#0f172a' : '#64748b' }}>
                                  {s.label}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{s.sub}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Shipper & Delivery Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', padding: '16px 18px', background: '#fafafa' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Thông Tin Tài Xế Giao Hàng (SPX)
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TruckIcon size={20} />
                            </div>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Nguyễn Văn Tài</strong>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>SPX Đội Phát Tân Bình · Xe: 59-P1 982.34</div>
                              <div style={{ fontSize: '11.5px', color: '#2563eb', marginTop: '2px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <PhoneIcon size={12} /> Hotline: 1900 1221 (Phím 1)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Địa Chỉ Nhận Hàng
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                            {activeTrackingOrder.customerName || 'Khách Hàng'} · {activeTrackingOrder.phone || '0901234567'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.4 }}>
                            {activeTrackingOrder.shippingAddress?.address || (typeof activeTrackingOrder.shippingAddress === 'string' ? activeTrackingOrder.shippingAddress : 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh')}
                          </div>
                        </div>
                      </div>

                      {/* Timeline History Log */}
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                          Chi Tiết Hành Trình Vận Chuyển:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {(activeTrackingOrder.timeline || [
                            { time: 'Hôm nay 08:30', text: 'Đang trên đường giao đến bạn (Dự kiến trước 18h)' },
                            { time: 'Hôm qua 18:00', text: 'Đơn hàng đã xuất kho trung chuyển Tân Bình' },
                            { time: 'Hôm qua 14:00', text: 'Đơn hàng đã bàn giao cho SPX Express' },
                            { time: '2 ngày trước', text: 'Người bán đã chuẩn bị kiện hàng' },
                          ]).map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === 0 ? '#2563eb' : '#cbd5e1', marginTop: '5px', flexShrink: 0 }} />
                              <div style={{ minWidth: '110px', fontWeight: 600, color: idx === 0 ? '#2563eb' : '#64748b' }}>
                                {t.time}
                              </div>
                              <div style={{ color: idx === 0 ? '#0f172a' : '#475569', fontWeight: idx === 0 ? 600 : 400 }}>
                                {t.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}>
                        <PackageIcon size={24} />
                      </span>
                      <span>{t('my_orders', 'Đơn Hàng Của Tôi')}</span>
                    </h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {t('orders_subtitle', 'Theo dõi chi tiết tiến độ vận chuyển và lịch sử mua sắm.')}
                    </p>
                  </div>

                  <Link to="/" className="shopee-btn shopee-btn-secondary" style={{ fontSize: '13px' }}>
                    ← {t('continue_shopping', 'Tiếp tục mua sắm')}
                  </Link>
                </div>

        {/* Thông báo phân định vai trò Người Bán */}
        {user?.role === 'seller' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(14, 165, 233, 0.04) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                <StoreIcon size={22} />
              </span>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Bạn đang ở mục Đơn Mua Cá Nhân
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Để xem và xử lý các đơn hàng khách mua từ gian hàng {user?.shopName || 'của bạn'}, hãy truy cập Kênh Người Bán.
                </p>
              </div>
            </div>
            <Link
              to="/seller/dashboard"
              className="shopee-btn shopee-btn-primary"
              style={{ padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none' }}
            >
              Vào Kênh Quản Lý Shop →
            </Link>
          </div>
        )}

        {/* Thông báo phân định vai trò Quản Trị Viên */}
        {user?.role === 'admin' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center' }}>
                <ShieldCheckIcon size={22} />
              </span>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#dc2626' }}>
                  Tài Khoản Tổng Quản Trị Viên Sàn
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Để quản lý đơn hàng toàn sàn của toàn bộ 12 shop, vui lòng xem tại Bảng Điều Khiển Quản Trị.
                </p>
              </div>
            </div>
            <Link
              to="/admin/dashboard"
              className="shopee-btn"
              style={{ padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', background: '#dc2626', color: '#fff' }}
            >
              Bảng Quản Trị Toàn Sàn →
            </Link>
          </div>
        )}

        {/* Shopee Mall Unified Hub: Seamless Tabs + Search & Filters in 1 Card */}
        <div className="shopee-mall-orders-hub">
          {/* Top Bar: Nav Tabs with animated sliding Royal Blue indicator */}
          <div className="shopee-order-tabs-nav" ref={tabNavRef}>
            {[
              { id: 'all', label: t('all_orders', 'Tất cả đơn') },
              { id: 'pending', label: 'Chờ xác nhận' },
              { id: 'shipping', label: t('status_shipping', 'Đang vận chuyển') },
              { id: 'completed', label: t('status_completed', 'Hoàn thành') },
              { id: 'returning', label: t('status_returning', 'Đổi trả / Hoàn tiền') },
              { id: 'cancelled', label: t('status_cancelled', 'Đã hủy') },
            ].map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  type="button"
                  className={`shopee-order-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="shopee-order-tab-text">{tab.label}</span>
                  {count > 0 && <span className="shopee-order-tab-badge">{count}</span>}
                </button>
              );
            })}
            {/* Sliding Animated Indicator directly centered under the active tab's text */}
            <div
              className="shopee-order-sliding-indicator"
              style={{
                transform: `translateX(${indicatorStyle.left}px)`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.opacity,
              }}
            />
          </div>

          {/* Bottom Bar: Search Box & Date Range Filter Toolbar */}
          <div className="shopee-order-toolbar-inner">
            <div className="orders-search-row">
              <div className="orders-search-box">
                <span className="orders-search-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t('search_orders_placeholder', 'Tìm kiếm theo Tên Shop, ID đơn hàng hoặc Tên sản phẩm...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="orders-search-input"
                />
                {searchTerm && (
                  <button
                    type="button"
                    aria-label="Xóa tìm kiếm"
                    onClick={() => setSearchTerm('')}
                    className="orders-search-clear"
                    title="Xóa tìm kiếm"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CloseIcon size={12} />
                  </button>
                )}
              </div>

              <div className="orders-export-group">
                <button
                  type="button"
                  className="orders-toolbar-btn"
                  onClick={handleExportCSV}
                  title="Xuất danh sách đơn hàng sang file CSV (hỗ trợ Excel)"
                >
                  <ReceiptIcon size={14} />
                  <span>Xuất CSV</span>
                </button>
                <button
                  type="button"
                  className="orders-toolbar-btn"
                  onClick={handlePrintReport}
                  title="In hoặc lưu file PDF báo cáo lịch sử đơn hàng"
                >
                  <PrinterIcon size={14} />
                  <span>In báo cáo</span>
                </button>
              </div>
            </div>

            <div className="orders-filter-status-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                  Đang hiển thị <strong>{filteredOrders.length}</strong> đơn hàng
                </span>
                {(searchTerm || dateRange !== 'all') && (
                  <>
                    <span className="meta-pipe">|</span>
                    {searchTerm && (
                      <span className="orders-active-chip">
                        Từ khóa: &ldquo;{searchTerm}&rdquo;
                        <button type="button" onClick={() => setSearchTerm('')} title="Xóa từ khóa" style={{ display: 'inline-flex', alignItems: 'center' }}><CloseIcon size={10} /></button>
                      </span>
                    )}
                    {dateRange !== 'all' && (
                      <span className="orders-active-chip">
                        {dateRange === '30days' ? '30 ngày gần đây' : dateRange === '3months' ? '3 tháng qua' : 'Năm 2026'}
                        <button type="button" onClick={() => setDateRange('all')} title="Xóa bộ lọc thời gian" style={{ display: 'inline-flex', alignItems: 'center' }}><CloseIcon size={10} /></button>
                      </span>
                    )}
                    <button
                      type="button"
                      className="orders-reset-filters-btn"
                      onClick={() => {
                        setSearchTerm('');
                        setDateRange('all');
                      }}
                    >
                      Đặt lại bộ lọc
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#94a3b8' }}>
              <PackageIcon size={48} />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('no_orders_in_tab', 'Không có đơn hàng nào trong mục này.')}
            </p>
          </div>
        ) : (
          <div className="shopee-orders-list-wrapper">
            {filteredOrders.map((ord) => {
              const itemsSubtotal = ord.subtotal || (ord.items || []).reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0) || 0;
              const voucherDiscount = Number(ord.voucherDiscount) || 0;
              const coinDiscount = Number(ord.coinDiscount || ord.coinsUsed || ord.coinsDeducted || ord.coinUsed || 0);
              const shippingFee = ord.shippingFee !== undefined
                ? Number(ord.shippingFee)
                : Math.max(0, Number(ord.total) - itemsSubtotal + voucherDiscount + coinDiscount);
              const totalPayment = Number(ord.total) || Math.max(0, itemsSubtotal + shippingFee - voucherDiscount - coinDiscount);

              return (
                <div key={ord.orderId} className="shopee-order-card">
                  {/* Card Header: Mall Badge, Shop Name, Chat Button, Order ID chip, Status Badge */}
                  <div className="shopee-order-card-header">
                    <div className="shopee-order-shop-group">
                      <span className="shopee-mall-badge">Mall</span>
                      <span
                        className="shopee-order-shop-name"
                        onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                        title="Xem shop và trò chuyện"
                      >
                        <StoreIcon size={15} color="#2563eb" />
                        <span>{ord.shopName}</span>
                      </span>
                      <button
                        type="button"
                        className="shopee-order-chat-btn"
                        onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                        title="Chat ngay với người bán"
                      >
                        <ChatIcon size={12} color="#2563eb" /> {t('chat_now', 'Chat ngay')}
                      </button>
                      <span
                        className="shopee-order-id-chip"
                        onClick={() => handleCopy(ord.orderId, 'mã đơn hàng')}
                        title="Nhấn để sao chép mã đơn hàng"
                      >
                        #{ord.orderId} <CopyIcon size={11} />
                      </span>
                    </div>

                    <div className="shopee-order-header-status">
                      <span className="order-date-text">{formatOrderDate(ord.createdAt)}</span>
                      <span className="order-header-divider">·</span>
                      <span
                        className={`shopee-order-status-badge ${
                          ord.status === 'completed' || ord.status === 'delivered'
                            ? 'completed'
                            : ord.status === 'shipping' || ord.status === 'delivering'
                            ? 'shipping'
                            : ord.status === 'pending' || ord.status === 'confirmed'
                            ? 'pending'
                            : 'cancelled'
                        }`}
                      >
                        {ord.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Stepper Progress Wire ("Thanh 4 cục đường dẫn") with Animated Paper Plane */}
                  {ord.stepIndex > 0 && ord.status !== 'cancelled' && (
                    <div className="order-stepper-container">
                      <div className="order-stepper-track-wrap">
                        {/* Base Wire / Sợi dây nền */}
                        <div className="order-stepper-cable-base" />
                        {/* Active Progress Wire / Sợi dây truyền màu cyan-blue + Máy bay giấy */}
                        <div
                          className="order-stepper-cable-active"
                          style={{
                            width: `${((Math.min(ord.stepIndex || 1, 4) - 1) / 3) * 75}%`,
                          }}
                        >
                          <div className="order-stepper-plane" title="Đang vận chuyển">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21.5 2.5L2 10.5L9.5 14L13.5 21.5L21.5 2.5Z" fill="url(#planeGradientBlue)" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round"/>
                              <path d="M9.5 14L21.5 2.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round"/>
                              <defs>
                                <linearGradient id="planeGradientBlue" x1="2" y1="2.5" x2="21.5" y2="21.5" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#38bdf8" />
                                  <stop offset="1" stopColor="#2563eb" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        </div>

                        {[
                          { num: 1, label: t('step_order_placed', 'Đã Đặt Hàng') },
                          { num: 2, label: t('step_confirmed', 'Đã Xác Nhận') },
                          { num: 3, label: t('step_shipping', 'Đang Vận Chuyển') },
                          { num: 4, label: t('step_delivered', 'Đã Giao Hàng') },
                        ].map((step, idx) => {
                          const isCompleted = (ord.stepIndex || 1) >= step.num || ord.status === 'completed' || ord.status === 'delivered';
                          const isActive = (ord.stepIndex || 1) === step.num && ord.status !== 'completed' && ord.status !== 'delivered';
                          return (
                            <div
                              key={idx}
                              className={`order-stepper-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                            >
                              <div className="order-stepper-circle">
                                {isCompleted ? <CheckIcon size={11} color="#ffffff" /> : step.num}
                              </div>
                              <span className="order-stepper-label">
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items List - Matches Image 4 */}
                  <div className="shopee-order-items-list">
                    {(ord.items || []).map((item, idx) => {
                      const itemQty = Number(item.quantity) || 1;
                      const itemPrice = Number(item.price) || 0;
                      const lineTotal = itemPrice * itemQty;

                      return (
                        <div key={idx} className="shopee-order-item-card">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="shopee-order-item-img"
                          />
                          <div className="shopee-order-item-info">
                            <div className="shopee-order-item-title">{item.name}</div>
                            {(() => {
                              let variantText = item.variant || item.color;
                              let sizeText = item.size;
                              if (variantText && variantText.includes(',') && !sizeText) {
                                const parts = variantText.split(',').map((s) => s.trim());
                                variantText = parts[0];
                                sizeText = parts[1];
                              }
                              const finalVariant = variantText || (item.name?.toLowerCase().includes('giày') ? 'Đỏ Trắng' : item.name?.toLowerCase().includes('áo') ? 'Xanh dương' : 'Tiêu chuẩn');
                              const finalSize = sizeText || (item.name?.toLowerCase().includes('giày') ? 'Size 42' : item.name?.toLowerCase().includes('áo') ? 'Freesize' : 'Tiêu chuẩn');

                              return (
                                <div className="shopee-order-item-meta-line">
                                  <span>Phân loại: {finalVariant}</span>
                                  <span className="meta-pipe"> | </span>
                                  <span>Kích thước: {finalSize}</span>
                                  <span className="meta-pipe"> | </span>
                                  <span>Số lượng: x{itemQty}</span>
                                </div>
                              );
                            })()}
                            <div className="shopee-order-trust-tag">
                              <ShieldCheckIcon size={13} color="#059669" />
                              <span>100% Chính hãng</span>
                              <span className="trust-dot">·</span>
                              <ReturnIcon size={12} color="#059669" />
                              <span>Đổi trả trong 15 ngày</span>
                            </div>
                          </div>

                          <div className="shopee-order-item-pricing">
                            <span className="shopee-order-item-unit-red">
                              {formatCurrency(itemPrice)}
                            </span>
                            <span className="shopee-order-item-qty-sub">
                              x{itemQty}
                            </span>
                            <span className="shopee-order-item-line-total">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sleek Compact Logistics & Financial Summary Bar - Replaces Bulky Cards */}
                  <div className="shopee-order-compact-bar">
                    <div className="shopee-order-compact-left">
                      {/* Vận chuyển */}
                      <div className="shopee-order-compact-item">
                        <TruckIcon size={14} color="#2563eb" />
                        <span className="compact-item-label">{t('shipping_carrier', 'Vận chuyển')}:</span>
                        <strong className="compact-item-val">SPX Express</strong>
                        <span
                          className="compact-tracking-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(ord.trackingCode || `SPX-VN-${ord.orderId}`, 'mã vận đơn SPX');
                          }}
                          title="Nhấn để sao chép mã vận đơn SPX"
                        >
                          {ord.trackingCode || `SPX-VN-${ord.orderId}`}
                          <CopyIcon size={10} />
                        </span>
                      </div>

                      <span className="compact-bar-divider">|</span>

                      {/* Phương thức thanh toán */}
                      <div className="shopee-order-compact-item">
                        <CreditCardIcon size={14} color="#0284c7" />
                        <span className="compact-item-label">{t('payment_method', 'Thanh toán')}:</span>
                        <strong className="compact-item-val">{ord.paymentMethod || 'COD'}</strong>
                        <span className="compact-guarantee-note">· Bảo vệ an tâm 100%</span>
                      </div>
                    </div>

                    <div className="shopee-order-compact-right">
                      <div className="shopee-order-compact-total-group">
                        <span className="compact-total-label">{t('total_payment', 'Tổng thanh toán')}:</span>
                        <span className="compact-total-price">{formatCurrency(totalPayment)}</span>
                      </div>
                      {(voucherDiscount > 0 || coinDiscount > 0) ? (
                        <span className="compact-saving-pill">
                          Tiết kiệm {formatCurrency(voucherDiscount + coinDiscount)}
                        </span>
                      ) : (
                        <span className="compact-sub-hint">Đã bao gồm VAT & phí ship</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="shopee-order-card-actions-bar">
                    {/* Left: Cancellation, simulation, VAT invoice & return request */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {(ord.status === 'pending' || ord.status === 'confirmed') && (
                        <button
                          type="button"
                          className="shopee-order-cancel-link"
                          onClick={() => setSelectedCancelOrder(ord)}
                          title="Yêu cầu hủy đơn hàng này"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CloseIcon size={11} />
                          <span>{t('cancel_order', 'Yêu cầu hủy đơn')}</span>
                        </button>
                      )}
                      {ord.status !== 'cancelled' && (ord.stepIndex || 1) < 4 && (
                        <button
                          type="button"
                          className="shopee-btn"
                          style={{
                            fontSize: '11.5px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleSimulateNextStep(ord.orderId)}
                          title="Mô phỏng bưu tá giao hàng bước tiếp theo"
                        >
                          {t('order_track_simulate_step', 'Mô phỏng giao')}
                        </button>
                      )}
                      {/* Utility Action: In hóa đơn VAT */}
                      <button
                        type="button"
                        className="shopee-order-btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => setSelectedInvoiceOrder(ord)}
                        title="Xem và in hóa đơn giá trị gia tăng (VAT)"
                      >
                        <ReceiptIcon size={13} /> {t('print_invoice', 'In hóa đơn VAT')}
                      </button>
                      {/* Utility Action: Trả hàng / Hoàn tiền */}
                      {(ord.status === 'completed' || ord.status === 'delivered') && (
                        <button
                          type="button"
                          className="shopee-order-btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => setSelectedReturnOrder(ord)}
                        >
                          <ReturnIcon size={13} /> {t('return_refund', 'Trả hàng / Hoàn tiền')}
                        </button>
                      )}
                    </div>

                    {/* Right: Stage-Specific Action Buttons */}
                    <div className="shopee-order-actions-right">
                      {/* Giai đoạn 1: Chờ xác nhận (pending, confirmed) */}
                      {(ord.status === 'pending' || ord.status === 'confirmed') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            <ChatIcon size={13} /> {t('chat_with_shop', 'Chat với Shop')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <EyeIcon size={13} /> {t('view_details', 'Xem chi tiết')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 2: Đang giao (shipping, delivering) */}
                      {(ord.status === 'shipping' || ord.status === 'delivering') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setSelectedLiveMapOrder(ord)}
                          >
                            <TruckIcon size={13} /> {t('shipper_map', 'Bản đồ Shipper SPX')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <MapPinIcon size={13} /> {t('view_tracking_details', 'Lịch trình')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleConfirmDelivered(ord.orderId)}
                            title="Xác nhận bạn đã nhận được gói hàng an toàn"
                          >
                            <CheckIcon size={12} /> {t('confirm_delivered', 'Đã nhận hàng')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 3: Hoàn thành (completed, delivered) */}
                      {(ord.status === 'completed' || ord.status === 'delivered') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <EyeIcon size={13} /> {t('view_details', 'Xem chi tiết')}
                          </button>

                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            <RefreshIcon size={13} /> {t('buy_again_whole', 'Mua lại đơn này')}
                          </button>

                          {ord.reviewed ? (
                            <span
                              className="shopee-badge-success"
                              style={{
                                fontSize: '12px',
                                padding: '6px 13px',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                color: '#059669',
                                border: '1px solid #e2e8f0',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <CheckIcon size={12} /> {t('reviewed_badge', 'Đã đánh giá (+200 Xu)')}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="shopee-order-btn-review"
                              onClick={() => setSelectedReviewOrder(ord)}
                            >
                              <StarIcon size={13} color="#facc15" filled /> {t('review_order_btn', 'Đánh giá (+200 Xu)')}
                            </button>
                          )}
                        </>
                      )}

                      {/* Giai đoạn 4: Đã hủy (cancelled) */}
                      {ord.status === 'cancelled' && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            <RefreshIcon size={13} /> {t('buy_again_whole', 'Mua lại đơn này')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <EyeIcon size={13} /> {t('view_details', 'Xem chi tiết')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 5: Đổi trả (returned, returning) */}
                      {(ord.status === 'returned' || ord.status === 'returning') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <EyeIcon size={13} /> {t('view_details', 'Xem chi tiết')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            <ChatIcon size={13} /> {t('chat_with_shop', 'Chat với Shop')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          className="shopee-scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
        >
          ↑
        </button>
      )}
    </main>
  );
}
