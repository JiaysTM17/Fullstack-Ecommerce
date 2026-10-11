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
import VietQRPaymentModal from '../components/VietQRPaymentModal';
import DeliveryCsatFeedbackModal from '../components/DeliveryCsatFeedbackModal';
import DeliveryRescheduleModal from '../components/DeliveryRescheduleModal';
import { cancelOrder } from '../services/orderService';
import { restoreProductStock } from '../services/productService';
import { createCustomerReturnRequestAPI, executeSmartOneClickReorderAPI } from '../services/api';
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
  CoinIcon,
  ArrowLeftIcon,
  ChevronUpIcon,
  QrCodeIcon,
  SearchIcon,
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
        const textSpan = activeEl.querySelector('.shopee-order-tab-text-group') || activeEl.querySelector('.shopee-order-tab-text') || activeEl;
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
  const [selectedVietQROrder, setSelectedVietQROrder] = useState(null);
  const [selectedCsatOrder, setSelectedCsatOrder] = useState(null);
  const [selectedRescheduleOrder, setSelectedRescheduleOrder] = useState(null);
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

  const handleReturnSubmit = async ({ orderId, reason, refundMethod, note, refundAmount, evidence = [] }) => {
    const updated = orders.map((o) => {
      if (o.orderId !== orderId && o._id !== orderId) return o;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextTimeline = [
        ...(o.timeline || []),
        { time: `Hôm nay ${nowStr}`, text: `Đã gửi yêu cầu Trả hàng / Hoàn tiền: ${reason}. Nhận hoàn qua: ${refundMethod}` },
      ];
      return {
        ...o,
        status: 'returning',
        statusText: 'Đang xử lý đổi trả',
        returnDetails: { reason, refundMethod, note, refundAmount, evidence },
        returnRequest: {
          reason,
          refundAmount: refundAmount || o.total,
          evidence,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
        timeline: nextTimeline,
      };
    });

    saveOrders(updated);
    if (selectedDetailOrder && (selectedDetailOrder.orderId === orderId || selectedDetailOrder._id === orderId)) {
      setSelectedDetailOrder((prev) => ({
        ...prev,
        status: 'returning',
        statusText: 'Đang xử lý đổi trả',
        returnDetails: { reason, refundMethod, note, refundAmount, evidence },
        returnRequest: {
          reason,
          refundAmount: refundAmount || prev.total,
          evidence,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        },
      }));
    }

    // Đồng bộ đơn hàng hoàn trả sang Kênh Người Bán (mini_shopee_seller_orders)
    try {
      const rawSeller = localStorage.getItem('mini_shopee_seller_orders');
      if (rawSeller) {
        const sellerOrders = JSON.parse(rawSeller);
        const updatedSeller = sellerOrders.map((so) => {
          if (so.orderId === orderId || so._id === orderId) {
            return {
              ...so,
              returnRequest: {
                reason,
                refundAmount: refundAmount || so.total,
                evidence,
                status: 'pending',
                requestedAt: new Date().toISOString(),
              },
            };
          }
          return so;
        });
        localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(updatedSeller));
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}

    // Gọi API backend lưu yêu cầu trả hàng
    try {
      await createCustomerReturnRequestAPI(orderId, {
        reason: `${reason}${note ? ` (${note})` : ''}`,
        evidence,
        refundAmount,
      });
    } catch (apiErr) {
      console.warn('Backend return request fallback:', apiErr.message);
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

  const handleSmartOneClickReorder = async (order) => {
    if (!order || !order.items || order.items.length === 0) {
      showToast('Đơn hàng không có sản phẩm để mua lại', 'warning');
      return;
    }
    try {
      const orderId = order._id || order.id || order.orderId;
      const res = await executeSmartOneClickReorderAPI(orderId);
      const discount = res?.reorderSavings || Math.round((order.subtotal || order.total || 0) * 0.1);
      
      // Update local storage order list if new order returned
      if (res?.newOrder) {
        saveOrders([res.newOrder, ...orders]);
      }
      
      showToast(`Mua lại 1-Click thành công! Bạn nhận voucher tri ân giảm ${discount.toLocaleString('vi-VN')}₫ (Mã REORDER10)`, 'success');
      navigate('/orders');
    } catch (err) {
      // Fallback: Thêm vào giỏ hàng thông thường
      handleReorderWholeOrder(order);
    }
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
              gap: '6px',
              marginRight: '6px',
            }}
          >
            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftIcon size={10} color="#64748b" />
            </span>
            <span>Quay lại</span>
          </button>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={13} color="#dc2626" />
            </span>
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
          style={{ padding: '7px 18px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftIcon size={11} color="#64748b" />
          </span>
          <span>Giữ Lại Đơn</span>
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onClick={() => {
            handleConfirmCancelOrder();
            handleCloseChildModal(() => setSelectedCancelOrder(null));
          }}
        >
          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={11} color="#ffffff" />
          </span>
          <span>Xác Nhận Hủy Đơn</span>
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
                onOpenVietQR={(order) => handleOpenFromDetail(setSelectedVietQROrder, order)}
              />
            ) : isTrackingView ? (
              <div className="spx-tracking-portal-view">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TruckIcon size={20} color="#2563eb" />
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
                    style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeftIcon size={11} color="#2563eb" />
                    </span>
                    <span>Quay lại Đơn Mua</span>
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
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TruckIcon size={12} color="#ffffff" />
                      </span>
                      <span>Tra Cứu Vận Đơn</span>
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
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TruckIcon size={9} color="#059669" />
                        </span>
                        <span>{o.trackingCode} (#{o.orderId})</span>
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
                              style={{ cursor: 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CopyIcon size={10} color="#2563eb" />
                              </span>
                              <span>Sao chép</span>
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
                            style={{ fontSize: '11.5px', height: '28px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPinIcon size={11} color="#ffffff" />
                            </span>
                            <span>Xem Bản Đồ Shipper</span>
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
                              <TruckIcon size={20} color="#2563eb" />
                            </div>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Nguyễn Văn Tài</strong>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>SPX Đội Phát Tân Bình · Xe: 59-P1 982.34</div>
                              <div style={{ fontSize: '11.5px', color: '#2563eb', marginTop: '2px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <PhoneIcon size={10} color="#2563eb" />
                                </span>
                                <span>Hotline: 1900 1221 (Phím 1)</span>
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
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PackageIcon size={20} color="#2563eb" />
                      </span>
                      <span>{t('my_orders', 'Đơn Hàng Của Tôi')}</span>
                    </h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {t('orders_subtitle', 'Theo dõi chi tiết tiến độ vận chuyển và lịch sử mua sắm.')}
                    </p>
                  </div>

                  <Link to="/" className="shopee-btn shopee-btn-secondary" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeftIcon size={12} color="#2563eb" />
                    </span>
                    <span>{t('continue_shopping', 'Tiếp tục mua sắm')}</span>
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
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StoreIcon size={20} color="#2563eb" />
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
              style={{ padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Vào Kênh Quản Lý Shop</span>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRightIcon size={11} color="#ffffff" />
              </span>
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
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheckIcon size={20} color="#dc2626" />
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
              style={{ padding: '6px 14px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', background: '#dc2626', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Bảng Quản Trị Toàn Sàn</span>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRightIcon size={11} color="#ffffff" />
              </span>
            </Link>
          </div>
        )}

        {/* Shopee Mall Unified Hub: Seamless Tabs + Search & Filters in 1 Card */}
        <div className="shopee-mall-orders-hub">
          {/* Top Bar: Nav Tabs with animated sliding Royal Blue indicator */}
          <div className="shopee-order-tabs-nav" ref={tabNavRef}>
            {[
              { id: 'all', label: t('all_orders', 'Tất cả đơn'), icon: <PackageIcon size={14} color="#2563eb" />, bg: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.28)' },
              { id: 'pending', label: 'Chờ xác nhận', icon: <ClockIcon size={14} color="#d97706" />, bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.28)' },
              { id: 'shipping', label: t('status_shipping', 'Đang vận chuyển'), icon: <TruckIcon size={14} color="#059669" />, bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.28)' },
              { id: 'completed', label: t('status_completed', 'Hoàn thành'), icon: <CheckIcon size={14} color="#16a34a" />, bg: 'rgba(22, 163, 74, 0.12)', border: 'rgba(22, 163, 74, 0.28)' },
              { id: 'returning', label: t('status_returning', 'Đổi trả / Hoàn tiền'), icon: <ReturnIcon size={14} color="#9333ea" />, bg: 'rgba(147, 51, 234, 0.12)', border: 'rgba(147, 51, 234, 0.28)' },
              { id: 'cancelled', label: t('status_cancelled', 'Đã hủy'), icon: <CloseIcon size={14} color="#ef4444" />, bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)' },
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
                  <span className="shopee-order-tab-text-group" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span className="shopee-order-tab-icon" style={{ width: '22px', height: '22px', borderRadius: '50%', background: isActive ? tab.bg : 'rgba(0, 0, 0, 0.04)', border: isActive ? `1px solid ${tab.border}` : '1px solid transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}>
                      {tab.icon}
                    </span>
                    <span className="shopee-order-tab-text">{tab.label}</span>
                  </span>
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
                <span className="orders-search-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SearchIcon size={15} color="#2563eb" />
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
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                  </button>
                )}
              </div>

              <div className="orders-export-group">
                <button
                  type="button"
                  className="orders-toolbar-btn"
                  onClick={handleExportCSV}
                  title="Xuất danh sách đơn hàng sang file CSV (hỗ trợ Excel)"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon size={12} color="#0284c7" />
                  </span>
                  <span>Xuất CSV</span>
                </button>
                <button
                  type="button"
                  className="orders-toolbar-btn"
                  onClick={handlePrintReport}
                  title="In hoặc lưu file PDF báo cáo lịch sử đơn hàng"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PrinterIcon size={12} color="#6366f1" />
                  </span>
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
                        <button type="button" onClick={() => setSearchTerm('')} title="Xóa từ khóa" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon size={9} color="#ef4444" />
                          </span>
                        </button>
                      </span>
                    )}
                    {dateRange !== 'all' && (
                      <span className="orders-active-chip">
                        {dateRange === '30days' ? '30 ngày gần đây' : dateRange === '3months' ? '3 tháng qua' : 'Năm 2026'}
                        <button type="button" onClick={() => setDateRange('all')} title="Xóa bộ lọc thời gian" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}>
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon size={9} color="#ef4444" />
                          </span>
                        </button>
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <span style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageIcon size={32} color="#94a3b8" />
              </span>
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
                      <span className="shopee-mall-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheckIcon size={9} color="#ffffff" />
                        </span>
                        <span>Mall</span>
                      </span>
                      <span
                        className="shopee-order-shop-name"
                        onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                        title="Xem shop và trò chuyện"
                      >
                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <StoreIcon size={13} color="#2563eb" />
                        </span>
                        <span>{ord.shopName}</span>
                      </span>
                      <button
                        type="button"
                        className="shopee-order-chat-btn"
                        onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                        title="Chat ngay với người bán"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChatIcon size={10} color="#2563eb" />
                        </span>
                        <span>{t('chat_now', 'Chat ngay')}</span>
                      </button>
                      <span
                        className="shopee-order-id-chip"
                        onClick={() => handleCopy(ord.orderId, 'mã đơn hàng')}
                        title="Nhấn để sao chép mã đơn hàng"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span>#{ord.orderId}</span>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CopyIcon size={10} color="#3b82f6" />
                        </span>
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
                        {(ord.status === 'completed' || ord.status === 'delivered') && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={10} color="#16a34a" />
                          </span>
                        )}
                        {(ord.status === 'shipping' || ord.status === 'delivering') && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(29, 78, 216, 0.15)', border: '1px solid rgba(29, 78, 216, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={10} color="#1d4ed8" />
                          </span>
                        )}
                        {(ord.status === 'pending' || ord.status === 'confirmed') && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(180, 83, 9, 0.15)', border: '1px solid rgba(180, 83, 9, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ClockIcon size={10} color="#b45309" />
                          </span>
                        )}
                        {ord.status === 'cancelled' && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon size={10} color="#dc2626" />
                          </span>
                        )}
                        {ord.status === 'returning' && (
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReturnIcon size={10} color="#9333ea" />
                          </span>
                        )}
                        <span>{ord.statusText}</span>
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
                              <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheckIcon size={10} color="#059669" />
                              </span>
                              <span>100% Chính hãng</span>
                              <span className="trust-dot">·</span>
                              <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ReturnIcon size={10} color="#059669" />
                              </span>
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
                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TruckIcon size={12} color="#2563eb" />
                        </span>
                        <span className="compact-item-label">{t('shipping_carrier', 'Vận chuyển')}:</span>
                        <strong className="compact-item-val">SPX Express</strong>
                        <span
                          className="compact-tracking-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(ord.trackingCode || `SPX-VN-${ord.orderId}`, 'mã vận đơn SPX');
                          }}
                          title="Nhấn để sao chép mã vận đơn SPX"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <span>{ord.trackingCode || `SPX-VN-${ord.orderId}`}</span>
                          <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CopyIcon size={9} color="#2563eb" />
                          </span>
                        </span>
                      </div>

                      <span className="compact-bar-divider">|</span>

                      {/* Phương thức thanh toán */}
                      <div className="shopee-order-compact-item">
                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCardIcon size={12} color="#0284c7" />
                        </span>
                        <span className="compact-item-label">{t('payment_method', 'Thanh toán')}:</span>
                        <strong className="compact-item-val">{ord.paymentMethod || 'COD'}</strong>
                        <span className="compact-guarantee-note">· Bảo vệ an tâm 100%</span>
                      </div>

                      {ord.giftWrap?.enabled && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={ord.giftWrap.greetingMessage ? `Thiệp: "${ord.giftWrap.greetingMessage}"` : "Đã kèm gói quà & thiệp"}>
                            <span style={{ fontSize: '13px' }}>🎁</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#e11d48', background: '#ffe4e6', padding: '2px 6px', borderRadius: '4px' }}>
                              Gói Quà &amp; Thiệp ({ord.giftWrap.theme === 'LUXURY_RED' ? 'Đỏ Rượu' : ord.giftWrap.theme === 'PASTEL_PINK' ? 'Hồng Pastel' : ord.giftWrap.theme === 'BIRTHDAY_CELEBRATION' ? 'Sinh Nhật' : 'Tối Giản'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.deliveryReschedule?.requestedDate && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Lưu ý: ${ord.deliveryReschedule.note || 'Không có'}`}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ClockIcon size={10} color="#2563eb" />
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>
                              Hẹn giao: {ord.deliveryReschedule.requestedDate} ({ord.deliveryReschedule.timeSlot === 'MORNING_8_12' ? '08-12h' : ord.deliveryReschedule.timeSlot === 'AFTERNOON_13_17' ? '13-17h' : ord.deliveryReschedule.timeSlot === 'EVENING_18_21' ? '18-21h' : 'Cả ngày'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.doorstepInspection?.enabled && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={ord.doorstepInspection.inspectionNote || "Dịch vụ đồng kiểm ngoại quan cùng bưu tá SPX"}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldCheckIcon size={10} color="#16a34a" />
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.doorstepInspection.status === 'inspected_passed' ? '#15803d' : ord.doorstepInspection.status === 'inspected_rejected' ? '#dc2626' : '#16a34a',
                              background: ord.doorstepInspection.status === 'inspected_rejected' ? '#fee2e2' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đồng Kiểm SPX: {ord.doorstepInspection.status === 'inspected_passed' ? 'Đã Kiểm Đạt' : ord.doorstepInspection.status === 'inspected_rejected' ? 'Từ Chối Nhận' : 'Có Yêu Cầu'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.deliveryAttempts?.totalAttempts > 0 && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Lần gần nhất: ${ord.deliveryAttempts.history?.[ord.deliveryAttempts.history.length - 1]?.reasonNote || 'Đang giao lại'}`}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TruckIcon size={10} color="#dc2626" />
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.deliveryAttempts.currentStatus === 'returned_to_hub' ? '#dc2626' : '#ea580c',
                              background: ord.deliveryAttempts.currentStatus === 'returned_to_hub' ? '#fee2e2' : '#ffedd5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Giao Lần {ord.deliveryAttempts.totalAttempts}/{ord.deliveryAttempts.maxAttempts || 3}: {ord.deliveryAttempts.currentStatus === 'returned_to_hub' ? 'Hoàn Về Kho' : 'Đang Hẹn Lại'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.unboxingVideoProof?.hasVideo && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={ord.unboxingVideoProof.verificationNote || "Video mở hộp đối soát"}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EyeIcon size={10} color="#7c3aed" />
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.unboxingVideoProof.verificationStatus === 'verified' ? '#15803d' : ord.unboxingVideoProof.verificationStatus === 'rejected' ? '#dc2626' : '#7c3aed',
                              background: ord.unboxingVideoProof.verificationStatus === 'verified' ? '#dcfce7' : ord.unboxingVideoProof.verificationStatus === 'rejected' ? '#fee2e2' : '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Video Mở Hộp: {ord.unboxingVideoProof.verificationStatus === 'verified' ? 'Đã Thẩm Định' : ord.unboxingVideoProof.verificationStatus === 'rejected' ? 'Từ Chối' : 'Đã Tải Lên'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.multiWarehouseRouting?.fulfillmentHubs?.length > 0 && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Xuất từ: ${ord.multiWarehouseRouting.primaryOriginHub || 'Đa kho SPX'}`}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PackageIcon size={10} color="#059669" />
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#059669',
                              background: '#d1fae5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đa Kho SPX ({ord.multiWarehouseRouting.fulfillmentHubs.length} Điểm | -{ord.multiWarehouseRouting.carbonSavedKg || 1.2}kg CO₂)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.dynamicAddressCorrection?.isModified && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Gốc: ${ord.dynamicAddressCorrection.originalAddress}`}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPinIcon size={10} color="#0284c7" />
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#0369a1',
                              background: '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đổi Địa Chỉ: {ord.dynamicAddressCorrection.correctedAddress.slice(0, 18)}...
                            </span>
                          </div>
                        </>
                      )}

                      {ord.ecoPackagingContribution?.isOptedIn && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Gói Xanh: ${ord.ecoPackagingContribution.boxType}. Đóng góp trồng rừng: ${Number(ord.ecoPackagingContribution.treePlantContribution || 0).toLocaleString('vi-VN')}₫`}>
                            <span style={{ fontSize: '13px' }}>🌱</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#15803d',
                              background: '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đóng Gói Xanh (+50 Xu)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.contactlessLockerDelivery?.isRequested && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Trạm tủ: ${ord.contactlessLockerDelivery.lockerStationName}. Mã mở ngăn: ${ord.contactlessLockerDelivery.compartmentPinCode}`}>
                            <span style={{ fontSize: '13px' }}>📦</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#7c3aed',
                              background: '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Tủ SPX: #{ord.contactlessLockerDelivery.compartmentId} (Mã: {ord.contactlessLockerDelivery.compartmentPinCode})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.carbonOffsetCert?.isIssued && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Chứng chỉ #${ord.carbonOffsetCert.certificateId} - Giảm ${ord.carbonOffsetCert.carbonOffsetKg}kg CO₂ (${ord.carbonOffsetCert.treeUnitsPlanted} Cây)`}>
                            <span style={{ fontSize: '13px' }}>🏅</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#047857',
                              background: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Cert CO₂: -{ord.carbonOffsetCert.carbonOffsetKg}kg ({ord.carbonOffsetCert.treeUnitsPlanted} Cây)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.doorstepReturnPickup?.isBooked && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Bưu tá thu hồi: ${ord.doorstepReturnPickup.courierName} (${ord.doorstepReturnPickup.courierPhone}). Ngày hẹn: ${ord.doorstepReturnPickup.appointmentDate}`}>
                            <span style={{ fontSize: '13px' }}>🛵</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#c026d3',
                              background: '#fae8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Thu Hồi Tận Nơi ({ord.doorstepReturnPickup.appointmentDate})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.fraudRiskScore?.riskScore > 0 && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Radar AI: ${ord.fraudRiskScore.riskScore}/100. Hành động: ${ord.fraudRiskScore.actionTaken}`}>
                            <span style={{ fontSize: '13px' }}>🛡️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.fraudRiskScore.riskLevel === 'critical' ? '#dc2626' : ord.fraudRiskScore.riskLevel === 'high' ? '#ea580c' : ord.fraudRiskScore.riskLevel === 'medium' ? '#d97706' : '#15803d',
                              background: ord.fraudRiskScore.riskLevel === 'critical' ? '#fee2e2' : ord.fraudRiskScore.riskLevel === 'high' ? '#ffedd5' : ord.fraudRiskScore.riskLevel === 'medium' ? '#fef3c7' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Radar Rủi Ro: {ord.fraudRiskScore.riskScore}/100 ({ord.fraudRiskScore.riskLevel === 'low' ? 'An Toàn' : ord.fraudRiskScore.riskLevel === 'medium' ? 'Cần Duyệt' : 'Rủi Ro Cao'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.automatedCodSettlement?.settlementId && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Đối soát COD: ${ord.automatedCodSettlement.settlementId} (${Number(ord.automatedCodSettlement.amountCollected).toLocaleString('vi-VN')}₫). Trạng thái: ${ord.automatedCodSettlement.courierHandoverStatus}`}>
                            <span style={{ fontSize: '13px' }}>💵</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.automatedCodSettlement.courierHandoverStatus === 'seller_remitted' ? '#059669' : '#0284c7',
                              background: ord.automatedCodSettlement.courierHandoverStatus === 'seller_remitted' ? '#d1fae5' : '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đối Soát COD: {ord.automatedCodSettlement.courierHandoverStatus === 'seller_remitted' ? 'Đã Quyết Toán' : 'Đã Xác Minh'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.lateDeliveryCompensation?.isEligible && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Cam kết đúng hẹn: Trễ ${ord.lateDeliveryCompensation.delayHours}h. Đã bồi thường ${Number(ord.lateDeliveryCompensation.compensationAmount).toLocaleString('vi-VN')}₫ (Mã: ${ord.lateDeliveryCompensation.compensationVoucherCode})`}>
                            <span style={{ fontSize: '13px' }}>⚡</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#ea580c',
                              background: '#ffedd5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đúng Hẹn: +{Number(ord.lateDeliveryCompensation.compensationAmount).toLocaleString('vi-VN')}₫ Voucher
                            </span>
                          </div>
                        </>
                      )}

                      {ord.aiDamageClaimEvaluation?.hasClaim && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`AI Vision Thẩm Định: Hư hại ${ord.aiDamageClaimEvaluation.damageSeverityPercent}%. Đã hoàn tiền ${Number(ord.aiDamageClaimEvaluation.instantPartialRefundOffered).toLocaleString('vi-VN')}₫. Trạng thái: ${ord.aiDamageClaimEvaluation.refundStatus}`}>
                            <span style={{ fontSize: '13px' }}>🔍</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.aiDamageClaimEvaluation.refundStatus === 'partial_refund_credited' ? '#0d9488' : '#e11d48',
                              background: ord.aiDamageClaimEvaluation.refundStatus === 'partial_refund_credited' ? '#ccfbf1' : '#ffe4e6',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              AI Vision: Hoàn {Number(ord.aiDamageClaimEvaluation.instantPartialRefundOffered).toLocaleString('vi-VN')}₫ ({ord.aiDamageClaimEvaluation.damageSeverityPercent}% Hư Hại)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.consolidatedPackagingSuite?.isConsolidated && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Gom Đơn Đa Shop: ${ord.consolidatedPackagingSuite.participatingShops?.length || 2} Shop gom 1 kiện tại ${ord.consolidatedPackagingSuite.consolidationHub}. Giảm ${ord.consolidatedPackagingSuite.packagingMaterialsSavedKg}kg bao bì, tiết kiệm ${Number(ord.consolidatedPackagingSuite.shippingFeeSaved).toLocaleString('vi-VN')}₫ cước.`}>
                            <span style={{ fontSize: '13px' }}>📦</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#4338ca',
                              background: '#e0e7ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Gom Đơn Đa Shop: 1 Kiện (-{ord.consolidatedPackagingSuite.packagingMaterialsSavedKg}kg Rác Bao Bì)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.priorityColdChainDispatch?.isColdChain && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`IoT Chuỗi Lạnh (#${ord.priorityColdChainDispatch.sensorSerial}): ${ord.priorityColdChainDispatch.currentTempCelsius}°C. Tiêu chuẩn: ${ord.priorityColdChainDispatch.minTempCelsius}°C ~ ${ord.priorityColdChainDispatch.maxTempCelsius}°C. Cảnh báo vi phạm: ${ord.priorityColdChainDispatch.tempBreachAlert ? 'BÁO ĐỘNG' : 'AN TOÀN'}`}>
                            <span style={{ fontSize: '13px' }}>❄️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.priorityColdChainDispatch.tempBreachAlert ? '#dc2626' : '#0284c7',
                              background: ord.priorityColdChainDispatch.tempBreachAlert ? '#fee2e2' : '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Chuỗi Lạnh IoT: {ord.priorityColdChainDispatch.currentTempCelsius}°C {ord.priorityColdChainDispatch.tempBreachAlert ? '(Vi Phạm!)' : '(Chuẩn 0-4°C)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.doorstepOldApplianceTradeIn?.isTradeInRequested && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Thu Cũ Đổi Mới: ${ord.doorstepOldApplianceTradeIn.deviceBrandModel} (${ord.doorstepOldApplianceTradeIn.cosmeticCondition}). Trợ giá: ${Number(ord.doorstepOldApplianceTradeIn.subsidyCreditAmount).toLocaleString('vi-VN')}₫. Mã tái chế: #${ord.doorstepOldApplianceTradeIn.recycleCertificateCode}`}>
                            <span style={{ fontSize: '13px' }}>🔄</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#059669',
                              background: '#d1fae5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Thu Cũ Trợ Giá: +{Number(ord.doorstepOldApplianceTradeIn.subsidyCreditAmount).toLocaleString('vi-VN')}₫ ({ord.doorstepOldApplianceTradeIn.deviceBrandModel})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.autonomousDroneDelivery?.isDroneEligible && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Drone SPX (#${ord.autonomousDroneDelivery.droneCallsign}): Độ cao ${ord.autonomousDroneDelivery.flightAltitudeMeters}m, tốc độ ${ord.autonomousDroneDelivery.flightSpeedKmh}km/h. Thả cáp: ${ord.autonomousDroneDelivery.tetherDropStatus}. Pin: ${ord.autonomousDroneDelivery.batteryLevelPercent}%`}>
                            <span style={{ fontSize: '13px' }}>🛸</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#0284c7',
                              background: '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Drone SPX: #{ord.autonomousDroneDelivery.droneCallsign} ({ord.autonomousDroneDelivery.tetherDropStatus === 'winch_cable_lowered' ? 'Hạ Cáp Thả Kiện' : 'Đang Bay'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.coldChainInsuranceCompensation?.hasInsurance && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Bảo Hiểm Chuỗi Lạnh (#${ord.coldChainInsuranceCompensation.policyId}): Mức đền bù: ${Number(ord.coldChainInsuranceCompensation.coverageAmount).toLocaleString('vi-VN')}₫. Đã chi trả: ${Number(ord.coldChainInsuranceCompensation.payoutAmount).toLocaleString('vi-VN')}₫. Trạng thái: ${ord.coldChainInsuranceCompensation.autoClaimStatus}`}>
                            <span style={{ fontSize: '13px' }}>🛡️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.coldChainInsuranceCompensation.autoClaimStatus === 'payout_settled' ? '#16a34a' : '#d97706',
                              background: ord.coldChainInsuranceCompensation.autoClaimStatus === 'payout_settled' ? '#dcfce7' : '#fef3c7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Bảo Hiểm Lạnh: {ord.coldChainInsuranceCompensation.autoClaimStatus === 'payout_settled' ? `Đã Đền Bù +${Number(ord.coldChainInsuranceCompensation.payoutAmount).toLocaleString('vi-VN')}₫` : 'Đang Bảo Hiểm'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.solarFleetGreenRouting?.isGreenFleet && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Đội Xe Xanh SPX Green Fleet (#${ord.solarFleetGreenRouting.fleetId} - ${ord.solarFleetGreenRouting.vehicleType}): Cắt giảm ${ord.solarFleetGreenRouting.co2AvoidedGrams}g CO₂, nạp ${ord.solarFleetGreenRouting.solarEnergyHarvestedWh}Wh điện mặt trời.`}>
                            <span style={{ fontSize: '13px' }}>☀️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#059669',
                              background: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Xe Điện Solar: -{ord.solarFleetGreenRouting.co2AvoidedGrams}g CO₂ (+{ord.solarFleetGreenRouting.solarEnergyHarvestedWh}Wh Năng Lượng)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.realTimeParcelRerouting?.isRerouted && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Đổi Lộ Trình Tức Thời: ${ord.realTimeParcelRerouting.reroutedAddress} (Khung giờ: ${ord.realTimeParcelRerouting.deliveryTimeWindow}). Bưu tá đã chấp thuận (+${ord.realTimeParcelRerouting.additionalDistanceKm}km).`}>
                            <span style={{ fontSize: '13px' }}>📍</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#2563eb',
                              background: '#eff6ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Đổi Điểm Giao Tức Thời ({ord.realTimeParcelRerouting.deliveryTimeWindow === 'afternoon_13_17' ? 'Chiều 13h-17h' : 'Sáng 8h-12h'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.fragileShockSensorTelemetry?.isFragileMonitored && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Cảm biến Chấn Động IoT (#${ord.fragileShockSensorTelemetry.shockSensorId}): Lực va đập ${ord.fragileShockSensorTelemetry.recordedGForce}G [Ngưỡng: ${ord.fragileShockSensorTelemetry.maxGForceLimit}G]. Trạng thái: ${ord.fragileShockSensorTelemetry.autoClaimInsuranceStatus}`}>
                            <span style={{ fontSize: '13px' }}>🏺</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.fragileShockSensorTelemetry.impactExceeded ? '#dc2626' : '#059669',
                              background: ord.fragileShockSensorTelemetry.impactExceeded ? '#fee2e2' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Cảm Biến Dễ Vỡ: {ord.fragileShockSensorTelemetry.recordedGForce}G {ord.fragileShockSensorTelemetry.impactExceeded ? `(Đã Đền Bù +${Number(ord.fragileShockSensorTelemetry.insuranceCompensationAmount).toLocaleString('vi-VN')}₫)` : '(An Toàn)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.multiCarrierCarbonLedger?.isLedgerRecorded && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Liên Minh Carbon (#${ord.multiCarrierCarbonLedger.carrierConsortiumBatchId} - ${ord.multiCarrierCarbonLedger.carrierCode}): Bù trừ ${ord.multiCarrierCarbonLedger.carbonCreditsOffset} tín chỉ Carbon (Gold Standard). Hash: ${ord.multiCarrierCarbonLedger.blockchainVerificationHash}`}>
                            <span style={{ fontSize: '13px' }}>🔗</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#0d9488',
                              background: '#ccfbf1',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Blockchain Carbon: -{ord.multiCarrierCarbonLedger.carbonCreditsOffset} Tín Chỉ ({ord.multiCarrierCarbonLedger.carrierCode})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.aiVideoReturnResaleGrading?.hasEvaluated && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`AI Resale Grader (#${ord.aiVideoReturnResaleGrading.videoAnalysisId}): Phân loại [${ord.aiVideoReturnResaleGrading.resaleGrade}]. Giá trị tái xuất kho: ${Number(ord.aiVideoReturnResaleGrading.estimatedResaleValueVnd).toLocaleString('vi-VN')}₫ (${ord.aiVideoReturnResaleGrading.secondaryMarketChannel})`}>
                            <span style={{ fontSize: '13px' }}>🏷️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#7c3aed',
                              background: '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              AI Phân Loại Trả: {ord.aiVideoReturnResaleGrading.resaleGrade === 'grade_a_pristine' ? 'Hàng Like New A' : 'Hàng Open Box B'} ({Number(ord.aiVideoReturnResaleGrading.estimatedResaleValueVnd).toLocaleString('vi-VN')}₫)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.acousticAntiTamperTelemetry?.isAcousticMonitored && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Acoustic Tamper IoT (#${ord.acousticAntiTamperTelemetry.sensorId}): Đỉnh âm ${ord.acousticAntiTamperTelemetry.decibelSpikePeak}dB [Mẫu: ${ord.acousticAntiTamperTelemetry.frequencySignature}]. Trạng thái niêm phong: ${ord.acousticAntiTamperTelemetry.sealIntegrityStatus}`}>
                            <span style={{ fontSize: '13px' }}>🎙️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.acousticAntiTamperTelemetry.tamperEventDetected ? '#dc2626' : '#059669',
                              background: ord.acousticAntiTamperTelemetry.tamperEventDetected ? '#fee2e2' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Âm Phổ Chống Tráo: {ord.acousticAntiTamperTelemetry.decibelSpikePeak}dB {ord.acousticAntiTamperTelemetry.tamperEventDetected ? '(Báo Động Rạch Băng Dính!)' : '(Niêm Phong Chuẩn)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.microHubPouchLockBoxHandoff?.isPouchLocked && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Tủ Bưu Cục Mini (#${ord.microHubPouchLockBoxHandoff.microHubId}): Ngăn tủ #${ord.microHubPouchLockBoxHandoff.compartmentSlotNumber} (Mã PIN: ${ord.microHubPouchLockBoxHandoff.lockerPasscodePin}). Túi niêm phong: ${ord.microHubPouchLockBoxHandoff.pouchBarcode}. Trạng thái: ${ord.microHubPouchLockBoxHandoff.carrierHandoffStatus}`}>
                            <span style={{ fontSize: '13px' }}>🗄️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#0891b2',
                              background: '#cffafe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Tủ Bưu Cục Mini: Ngăn #{ord.microHubPouchLockBoxHandoff.compartmentSlotNumber} ({ord.microHubPouchLockBoxHandoff.carrierHandoffStatus === 'courier_deposited' ? 'Đã Nhập Tủ' : ord.microHubPouchLockBoxHandoff.carrierHandoffStatus === 'courier_retrieved_out_for_delivery' ? 'Bưu Tá Đã Lấy' : 'Sẵn Sàng Phát'})
                            </span>
                          </div>
                        </>
                      )}

                      {ord.nfcGeofenceProofOfDelivery?.isNfcVerified && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Xác thực NFC PoD (#${ord.nfcGeofenceProofOfDelivery.proofSignatureToken}): Thẻ ${ord.nfcGeofenceProofOfDelivery.nfcCardUid}. Khoảng cách: ${ord.nfcGeofenceProofOfDelivery.handshakeDistanceMeters}m [Ngưỡng: ${ord.nfcGeofenceProofOfDelivery.geofenceThresholdMeters}m]. Trạng thái: ${ord.nfcGeofenceProofOfDelivery.geofenceStatus}`}>
                            <span style={{ fontSize: '13px' }}>📶</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#059669',
                              background: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Ký Nhận NFC: {ord.nfcGeofenceProofOfDelivery.handshakeDistanceMeters}m (Geofence Hợp Lệ)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.hazardousMaterialSafetyScan?.isSafetyScanned && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Quét An Toàn Hazmat (#${ord.hazardousMaterialSafetyScan.scannerStationId}): Cháy nổ ${ord.hazardousMaterialSafetyScan.flammabilityIndexScore}/100, Hơi hóa chất: ${ord.hazardousMaterialSafetyScan.chemicalVaporPpm}ppm, Pin: ${ord.hazardousMaterialSafetyScan.lithiumBatteryClass}. Trạng thái: ${ord.hazardousMaterialSafetyScan.safetyStatus}`}>
                            <span style={{ fontSize: '13px' }}>⚠️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.hazardousMaterialSafetyScan.safetyStatus === 'quarantined_hazardous' ? '#dc2626' : ord.hazardousMaterialSafetyScan.safetyStatus === 'prohibited_ground_transport_only' ? '#ea580c' : '#059669',
                              background: ord.hazardousMaterialSafetyScan.safetyStatus === 'quarantined_hazardous' ? '#fee2e2' : ord.hazardousMaterialSafetyScan.safetyStatus === 'prohibited_ground_transport_only' ? '#ffedd5' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Hazmat Hub: {ord.hazardousMaterialSafetyScan.safetyStatus === 'quarantined_hazardous' ? 'Cách Ly Hàng Nguy Hiểm' : ord.hazardousMaterialSafetyScan.safetyStatus === 'prohibited_ground_transport_only' ? 'Tuyến Đường Bộ (Pin UN3480)' : 'Chứng Nhận An Toàn'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.droneAirCorridorLandingBeacon?.isDroneCorridorActive && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Hạ Cánh Drone (#${ord.droneAirCorridorLandingBeacon.corridorFlightCode}): Gió ${ord.droneAirCorridorLandingBeacon.windSpeedKnots} knots. Trạng thái: ${ord.droneAirCorridorLandingBeacon.landingSafetyStatus}. Trạm hạ: ${ord.droneAirCorridorLandingBeacon.landingBeaconId}`}>
                            <span style={{ fontSize: '13px' }}>🚁</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'rerouted_to_ground_locker' ? '#dc2626' : ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'hovering_weather_hold' ? '#ea580c' : '#0284c7',
                              background: ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'rerouted_to_ground_locker' ? '#fee2e2' : ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'hovering_weather_hold' ? '#ffedd5' : '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Drone Hạ Cánh: {ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'rerouted_to_ground_locker' ? 'Hủy (Gió Ngược -> Tủ Đất)' : ord.droneAirCorridorLandingBeacon.landingSafetyStatus === 'hovering_weather_hold' ? 'Bay Treo Giữ Vị Trí' : 'Tiếp Đất An Toàn'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.smartLockInHomeDeliveryVault?.isInHomeDeliveryAuthorized && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Khóa Nhà Thông Minh (#${ord.smartLockInHomeDeliveryVault.smartLockId}): Bưu tá ${ord.smartLockInHomeDeliveryVault.authorizedCourierBadge}. Trạng thái: ${ord.smartLockInHomeDeliveryVault.inHomeDeliveryStatus}. Mã Hash video: ${ord.smartLockInHomeDeliveryVault.surveillanceRecordingHash || 'Đang giám sát'}`}>
                            <span style={{ fontSize: '13px' }}>🔐</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.smartLockInHomeDeliveryVault.doorRelockedSecurely ? '#059669' : '#0891b2',
                              background: ord.smartLockInHomeDeliveryVault.doorRelockedSecurely ? '#ecfdf5' : '#cffafe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Khóa Nhà: {ord.smartLockInHomeDeliveryVault.doorRelockedSecurely ? 'Đã Khóa Chốt An Toàn' : ord.smartLockInHomeDeliveryVault.inHomeDeliveryStatus === 'door_unlocked_package_placed' ? 'Đang Đặt Hàng Vào Sảnh' : 'Đã Cấp Mã 1 Lần'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.parcelMoistureTelemetry?.isMoistureMonitored && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Độ Ẩm Kiện Hàng (#${ord.parcelMoistureTelemetry.moistureSensorId}): ${ord.parcelMoistureTelemetry.relativeHumidityPercent}% RH. Hút ẩm: ${ord.parcelMoistureTelemetry.desiccantSaturationPercent}%. Trạng thái: ${ord.parcelMoistureTelemetry.humidityStatus}`}>
                            <span style={{ fontSize: '13px' }}>💧</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.parcelMoistureTelemetry.humidityStatus === 'critical_moisture_risk' ? '#dc2626' : ord.parcelMoistureTelemetry.humidityStatus === 'mild_humidity' ? '#ea580c' : '#059669',
                              background: ord.parcelMoistureTelemetry.humidityStatus === 'critical_moisture_risk' ? '#fee2e2' : ord.parcelMoistureTelemetry.humidityStatus === 'mild_humidity' ? '#ffedd5' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Độ Ẩm IoT: {ord.parcelMoistureTelemetry.relativeHumidityPercent}% RH {ord.parcelMoistureTelemetry.humidityStatus === 'critical_moisture_risk' ? '(Báo Động Ẩm Khẩn Cấp!)' : ord.parcelMoistureTelemetry.humidityStatus === 'mild_humidity' ? '(Hơi Ẩm)' : '(Khô Ráo Chuẩn)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.fiberOpticMeshSeal?.isFiberMeshArmed && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Lưới Sợi Quang (#${ord.fiberOpticMeshSeal.meshSealId}): ${ord.fiberOpticMeshSeal.lightTransmissionLumen}% quang thông. Trạng thái: ${ord.fiberOpticMeshSeal.lightContinuityStatus}. Ký quỹ: ${ord.fiberOpticMeshSeal.highValueInsuranceEscrowLocked ? 'ĐÃ KHÓA BẢO HIỂM' : 'An toàn'}`}>
                            <span style={{ fontSize: '13px' }}>💡</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.fiberOpticMeshSeal.tamperCutDetected ? '#dc2626' : ord.fiberOpticMeshSeal.lightTransmissionLumen < 80 ? '#ea580c' : '#7c3aed',
                              background: ord.fiberOpticMeshSeal.tamperCutDetected ? '#fee2e2' : ord.fiberOpticMeshSeal.lightTransmissionLumen < 80 ? '#ffedd5' : '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Sợi Quang: {ord.fiberOpticMeshSeal.lightTransmissionLumen}% {ord.fiberOpticMeshSeal.tamperCutDetected ? '(Đứt Lưới -> Khóa Ký Quỹ!)' : ord.fiberOpticMeshSeal.lightTransmissionLumen < 80 ? '(Suy Hao Áp Lực)' : '(Quang Thông Suốt)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.mobileVanRobotSwarmDispatch?.isSwarmDispatched && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Robot Swarm (#${ord.mobileVanRobotSwarmDispatch.assignedRobotId}): Xe mẹ ${ord.mobileVanRobotSwarmDispatch.motherVanId}. Pin: ${ord.mobileVanRobotSwarmDispatch.robotBatteryLevelPercent}%. Trạng thái: ${ord.mobileVanRobotSwarmDispatch.swarmMissionStatus}. Mã Dock: ${ord.mobileVanRobotSwarmDispatch.curbsideDockStationPin}`}>
                            <span style={{ fontSize: '13px' }}>🤖</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'customer_doorstep_delivered' ? '#059669' : ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'dispatched_sidewalk_transit' ? '#0284c7' : '#7c3aed',
                              background: ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'customer_doorstep_delivered' ? '#ecfdf5' : ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'dispatched_sidewalk_transit' ? '#e0f2fe' : '#f3e8ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Robot Swarm: {ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'customer_doorstep_delivered' ? 'Đã Giao Tận Cửa' : ord.mobileVanRobotSwarmDispatch.swarmMissionStatus === 'dispatched_sidewalk_transit' ? 'Đang Lăn Bánh Vỉa Hè' : 'Đã Thu Hồi Về Xe Tải'} (Pin {ord.mobileVanRobotSwarmDispatch.robotBatteryLevelPercent}%)
                            </span>
                          </div>
                        </>
                      )}

                      {ord.thermoChromicColorShiftBarcode?.isThermoChromicArmed && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Mực Nhiệt Quang Học (#${ord.thermoChromicColorShiftBarcode.barcodeBatchSerialNumber}): Nhiệt độ ${ord.thermoChromicColorShiftBarcode.ambientTemperatureCelsius}°C [Ngưỡng: ${ord.thermoChromicColorShiftBarcode.thermalExposureThresholdCelsius}°C]. Màu: ${ord.thermoChromicColorShiftBarcode.spectralColorShiftHex}. Can thiệp nhiệt: ${ord.thermoChromicColorShiftBarcode.heatTamperExceeded ? 'CÓ DẤU HIỆU BÓC TEM' : 'Nguyên Bản'}`}>
                            <span style={{ fontSize: '13px' }}>🌡️</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.thermoChromicColorShiftBarcode.heatTamperExceeded ? '#be185d' : '#059669',
                              background: ord.thermoChromicColorShiftBarcode.heatTamperExceeded ? '#fdf2f8' : '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${ord.thermoChromicColorShiftBarcode.spectralColorShiftHex}`
                            }}>
                              Mực Nhiệt: {ord.thermoChromicColorShiftBarcode.ambientTemperatureCelsius}°C {ord.thermoChromicColorShiftBarcode.heatTamperExceeded ? '(Đổi Màu Tía - Cảnh Báo Sấy Bóc!)' : '(Xanh Chuẩn)'}
                            </span>
                          </div>
                        </>
                      )}

                      {ord.undergroundPneumaticCapsuleDispatch?.isCapsuleDispatched && (
                        <>
                          <span className="compact-bar-divider">|</span>
                          <div className="shopee-order-compact-item" title={`Viên Nang Khí Nén Ngầm (#${ord.undergroundPneumaticCapsuleDispatch.capsulePodSerial}): Tuyến ${ord.undergroundPneumaticCapsuleDispatch.tubePipelineNetworkCode}. Vận tốc ${ord.undergroundPneumaticCapsuleDispatch.transitVelocityKmPerHour} km/h (áp suất ${ord.undergroundPneumaticCapsuleDispatch.tubePressureBar} bar). Ga đích: ${ord.undergroundPneumaticCapsuleDispatch.pneumaticTerminalStationId}. Trạng thái: ${ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus}`}>
                            <span style={{ fontSize: '13px' }}>🚇</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'ejected_at_terminal_station' ? '#059669' : ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'collected_by_local_runner' ? '#0891b2' : '#2563eb',
                              background: ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'ejected_at_terminal_station' ? '#ecfdf5' : ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'collected_by_local_runner' ? '#cffafe' : '#eff6ff',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Khí Nén Ngầm: {ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'ejected_at_terminal_station' ? 'Đã Phóng Ra Ga Đích' : ord.undergroundPneumaticCapsuleDispatch.capsuleEjectionStatus === 'collected_by_local_runner' ? 'Bưu Tá Đã Tiếp Nhận' : 'Tốc Độ Cao Ống Ngầm'} ({ord.undergroundPneumaticCapsuleDispatch.transitVelocityKmPerHour} km/h)
                            </span>
                          </div>
                        </>
                      )}
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
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CloseIcon size={10} color="#ef4444" />
                          </span>
                          <span>{t('cancel_order', 'Yêu cầu hủy đơn')}</span>
                        </button>
                      )}
                      {ord.status !== 'cancelled' && (ord.stepIndex || 1) < 4 && (
                        <button
                          type="button"
                          className="shopee-btn"
                          style={{
                            fontSize: '11.5px',
                            background: 'rgba(37, 99, 235, 0.08)',
                            border: '1px solid rgba(37, 99, 235, 0.28)',
                            color: '#2563eb',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                          onClick={() => handleSimulateNextStep(ord.orderId)}
                          title="Mô phỏng bưu tá giao hàng bước tiếp theo"
                        >
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={11} color="#2563eb" />
                          </span>
                          <span>{t('order_track_simulate_step', 'Mô phỏng giao')}</span>
                        </button>
                      )}
                      {/* Utility Action: In hóa đơn VAT */}
                      <button
                        type="button"
                        className="shopee-order-btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setSelectedInvoiceOrder(ord)}
                        title="Xem và in hóa đơn giá trị gia tăng (VAT)"
                      >
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ReceiptIcon size={11} color="#0284c7" />
                        </span>
                        <span>{t('print_invoice', 'In hóa đơn VAT')}</span>
                      </button>
                      {/* Utility Action: Trả hàng / Hoàn tiền */}
                      {(ord.status === 'completed' || ord.status === 'delivered') && (
                        <button
                          type="button"
                          className="shopee-order-btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => setSelectedReturnOrder(ord)}
                        >
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(147, 51, 234, 0.12)', border: '1px solid rgba(147, 51, 234, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReturnIcon size={11} color="#9333ea" />
                          </span>
                          <span>{t('return_refund', 'Trả hàng / Hoàn tiền')}</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Stage-Specific Action Buttons */}
                    <div className="shopee-order-actions-right">
                      {/* Giai đoạn 1: Chờ xác nhận (pending, confirmed) */}
                      {(ord.status === 'pending' || ord.status === 'confirmed') && (
                        <>
                          {(ord.paymentMethod?.includes('VietQR') || ord.paymentMethod === 'BANK') && (
                            <button
                              type="button"
                              className="shopee-btn"
                              style={{
                                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                              }}
                              onClick={() => setSelectedVietQROrder(ord)}
                            >
                              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QrCodeIcon size={11} color="#ffffff" />
                              </span>
                              <span>Thanh toán VietQR</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChatIcon size={11} color="#2563eb" />
                            </span>
                            <span>{t('chat_with_shop', 'Chat với Shop')}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EyeIcon size={11} color="#2563eb" />
                            </span>
                            <span>{t('view_details', 'Xem chi tiết')}</span>
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 2: Đang giao (shipping, delivering) */}
                      {(ord.status === 'shipping' || ord.status === 'delivering') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setSelectedLiveMapOrder(ord)}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <TruckIcon size={11} color="#0284c7" />
                            </span>
                            <span>{t('shipper_map', 'Bản đồ Shipper SPX')}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#2563eb', color: '#2563eb', background: 'rgba(37, 99, 235, 0.05)' }}
                            onClick={() => setSelectedRescheduleOrder(ord)}
                            title="Hẹn lại ngày hoặc khung giờ nhận hàng SPX Express"
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ClockIcon size={11} color="#2563eb" />
                            </span>
                            <span>{ord.deliveryReschedule?.requestedDate ? 'Đổi Lại Lịch Giao' : 'Hẹn Lại Giờ Giao'}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPinIcon size={11} color="#ea580c" />
                            </span>
                            <span>{t('view_tracking_details', 'Lịch trình')}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleConfirmDelivered(ord.orderId)}
                            title="Xác nhận bạn đã nhận được gói hàng an toàn"
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckIcon size={11} color="#ffffff" />
                            </span>
                            <span>{t('confirm_delivered', 'Đã nhận hàng')}</span>
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 3: Hoàn thành (completed, delivered) */}
                      {(ord.status === 'completed' || ord.status === 'delivered') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EyeIcon size={11} color="#2563eb" />
                            </span>
                            <span>{t('view_details', 'Xem chi tiết')}</span>
                          </button>

                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <RefreshIcon size={11} color="#10b981" />
                            </span>
                            <span>{t('buy_again_whole', 'Mua lại đơn này')}</span>
                          </button>

                          <button
                            type="button"
                            className="shopee-btn"
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                            }}
                            onClick={() => handleSmartOneClickReorder(ord)}
                            title="Tự động đặt lại đơn hàng với mã giảm tri ân 10% REORDER10"
                          >
                            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <RefreshIcon size={10} color="#ffffff" />
                            </span>
                            <span>1-Click Reorder (-10%)</span>
                          </button>

                          {ord.reviewed ? (
                            <span
                              className="shopee-badge-success"
                              style={{
                                fontSize: '12px',
                                padding: '6px 13px',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.28)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={10} color="#059669" />
                              </span>
                              <span>{t('reviewed_badge', 'Đã đánh giá (+200 Xu)')}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="shopee-order-btn-review"
                              onClick={() => setSelectedReviewOrder(ord)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <StarIcon size={11} color="#d97706" fill="#d97706" />
                              </span>
                              <span>{t('review_order_btn', 'Đánh giá (+200 Xu)')}</span>
                            </button>
                          )}

                          {ord.csatFeedback?.rating ? (
                            <span
                              style={{
                                fontSize: '11.5px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.1)',
                                color: '#0284c7',
                                border: '1px solid rgba(2, 132, 199, 0.25)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              title={`Đã chấm ${ord.csatFeedback.rating} sao giao vận`}
                            >
                              <TruckIcon size={12} color="#0284c7" />
                              <span>SPX: {ord.csatFeedback.rating}★</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="shopee-order-btn-outline"
                              onClick={() => setSelectedCsatOrder(ord)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Đánh giá bưu tá và tốc độ giao hàng SPX"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TruckIcon size={11} color="#0284c7" />
                              </span>
                              <span>Đánh giá SPX</span>
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
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <RefreshIcon size={11} color="#ea580c" />
                            </span>
                            <span>{t('buy_again_whole', 'Mua lại đơn này')}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EyeIcon size={11} color="#2563eb" />
                            </span>
                            <span>{t('view_details', 'Xem chi tiết')}</span>
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 5: Đổi trả (returned, returning) */}
                      {(ord.status === 'returned' || ord.status === 'returning') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EyeIcon size={11} color="#2563eb" />
                            </span>
                            <span>{t('view_details', 'Xem chi tiết')}</span>
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(147, 51, 234, 0.12)', border: '1px solid rgba(147, 51, 234, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChatIcon size={11} color="#9333ea" />
                            </span>
                            <span>{t('chat_with_shop', 'Chat với Shop')}</span>
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
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronUpIcon size={16} color="#2563eb" />
          </span>
        </button>
      )}

      {/* VietQR Payment Modal */}
      {selectedVietQROrder && (
        <VietQRPaymentModal
          isOpen={Boolean(selectedVietQROrder)}
          onClose={() => handleCloseChildModal(() => setSelectedVietQROrder(null))}
          orderId={selectedVietQROrder.orderId}
          amount={selectedVietQROrder.total}
          onPaymentSuccess={() => {
            const updated = orders.map((o) =>
              o.orderId === selectedVietQROrder.orderId
                ? { ...o, status: 'confirmed', statusText: 'Đã thanh toán VietQR' }
                : o
            );
            saveOrders(updated);
            showToast(`Đã ghi nhận thanh toán VietQR thành công cho đơn #${selectedVietQROrder.orderId}!`, 'success');
            setSelectedVietQROrder(null);
          }}
        />
      )}

      {/* Delivery CSAT Feedback Modal (Feature 90) */}
      {selectedCsatOrder && (
        <DeliveryCsatFeedbackModal
          order={selectedCsatOrder}
          onClose={() => setSelectedCsatOrder(null)}
          onSuccess={(feedback) => {
            const updated = orders.map((o) =>
              (o.orderId || o._id) === (selectedCsatOrder.orderId || selectedCsatOrder._id)
                ? { ...o, csatFeedback: feedback }
                : o
            );
            saveOrders(updated);
          }}
        />
      )}

      {/* Delivery Reschedule Modal (Feature 94) */}
      {selectedRescheduleOrder && (
        <DeliveryRescheduleModal
          order={selectedRescheduleOrder}
          onClose={() => setSelectedRescheduleOrder(null)}
          onSuccess={(rescheduleData) => {
            const updated = orders.map((o) =>
              (o.orderId || o._id) === (selectedRescheduleOrder.orderId || selectedRescheduleOrder._id)
                ? { ...o, deliveryReschedule: rescheduleData }
                : o
            );
            saveOrders(updated);
          }}
        />
      )}
    </main>
  );
}
