import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import '../styles/dashboard.css';

const INITIAL_CUSTOMER_ORDERS = [
  {
    orderId: "ORD918231",
    trackingCode: "SPX-VN-84729104",
    createdAt: "2026-09-24 14:20",
    shopName: "Thời Trang GenZ Official",
    items: [
      {
        name: "Áo thun nam basic cotton 100% thoáng mát dệt sợi tự nhiên",
        price: 199000,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200",
      },
    ],
    total: 423000,
    subtotal: 398000,
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

  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all' | '30days' | '3months' | 'year2026'
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
  const [selectedChatShop, setSelectedChatShop] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [selectedLiveMapOrder, setSelectedLiveMapOrder] = useState(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Tôi muốn thay đổi địa chỉ nhận hàng');
  const [cancelNote, setCancelNote] = useState('');

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
      const recipient = ord.customerName || ord.customer?.fullName || user?.name || 'Khách Hàng Mini Shopee';
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
    link.setAttribute('download', 'Lich-Su-Don-Hang-Mini-Shopee.csv');
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
      icon: '⚠️',
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
      if (o.orderId === reviewData.orderId) {
        return {
          ...o,
          reviewed: true,
          reviewData,
        };
      }
      return o;
    });
    saveOrders(updated);

    // Lưu đánh giá vào bộ nhớ sản phẩm để hiển thị ngay trên PDP
    try {
      const pKey = `mini_shopee_product_reviews_${reviewData.productId}`;
      const rawPrev = localStorage.getItem(pKey);
      const prevReviews = rawPrev ? JSON.parse(rawPrev) : [];
      const newRev = {
        id: `rev_${Date.now()}`,
        userName: user?.name || 'Khách hàng Mini Shopee',
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

    // Thưởng 200 Mini Xu cho khách hàng
    if (earnCoins) {
      earnCoins(200, `Thưởng đánh giá sản phẩm đơn hàng #${reviewData.orderId}`, reviewData.orderId, 'review');
    }

    pushBuyerNotification({
      type: 'voucher',
      icon: '🪙',
      title: `Nhận +200 Mini Xu thưởng`,
      message: `Bạn nhận được 200 Mini Xu thưởng nhờ đánh giá sản phẩm cho đơn #${reviewData.orderId}!`,
      link: '/profile',
    });

    setSelectedReviewOrder(null);
    showToast('🎉 Cảm ơn bạn! Đã gửi đánh giá thành công và nhận thưởng +200 Mini Xu!', 'success');
  };

  const handleBuyAgain = (item) => {
    addToCart(item, 1);
    showToast(t('buy_again_toast', `Đã thêm "${item.name}" vào giỏ hàng để mua lại!`), 'success');
    navigate('/cart');
  };

  const handleReorderWholeOrder = (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart(item, item.quantity || 1);
    });
    showToast(`Đã thêm ${order.items.length} sản phẩm từ đơn #${order.orderId} vào giỏ hàng!`, 'success');
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

    showToast('🎉 Bạn đã xác nhận nhận hàng! Hãy để lại đánh giá để nhận ngay +200 Mini Xu.', 'success');
    const target = updated.find((o) => o.orderId === orderId);
    if (target) {
      setSelectedReviewOrder(target);
    }
  };

  return (
    <main className="shopee-container" style={{ padding: '28px 16px', maxWidth: '980px' }}>
      <div 
        style={{ 
          background: 'var(--bg-card, #ffffff)', 
          borderRadius: 'var(--radius-lg, 12px)', 
          padding: '24px', 
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              📦 {t('my_orders', 'Đơn Hàng Của Tôi')}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
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
            background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(208, 1, 27, 0.04) 100%)',
            border: '1px solid rgba(234, 88, 12, 0.3)',
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
              <span style={{ fontSize: '22px' }}>🏪</span>
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
              <span style={{ fontSize: '22px' }}>⚡</span>
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
          {/* Top Bar: Nav Tabs with vibrant Shopee Orange underline */}
          <div className="shopee-order-tabs-nav">
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
                  type="button"
                  className={`shopee-order-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  {count > 0 && <span className="shopee-order-tab-badge">{count}</span>}
                  {isActive && <div className="shopee-order-tab-indicator" />}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Search Box & Date Range Filter Toolbar */}
          <div className="shopee-order-toolbar-inner">
            <div className="orders-search-row">
              <div className="orders-search-box">
                <span className="orders-search-icon">🔍</span>
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
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="orders-export-group">
                <button
                  type="button"
                  className="shopee-order-btn-outline"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleExportCSV}
                  title="Xuất danh sách đơn hàng sang file CSV (hỗ trợ Excel)"
                >
                  📥 Xuất CSV
                </button>
                <button
                  type="button"
                  className="shopee-order-btn-outline"
                  style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handlePrintReport}
                  title="In hoặc lưu file PDF báo cáo lịch sử đơn hàng"
                >
                  🖨 In báo cáo
                </button>
              </div>
            </div>

            <div className="orders-filter-chips-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginRight: '2px' }}>
                  📅 Khoảng thời gian:
                </span>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: '30days', label: '30 ngày gần đây' },
                  { id: '3months', label: '3 tháng qua' },
                  { id: 'year2026', label: 'Năm 2026' },
                ].map((dr) => (
                  <button
                    key={dr.id}
                    type="button"
                    className={`order-filter-chip ${dateRange === dr.id ? 'active' : ''}`}
                    onClick={() => setDateRange(dr.id)}
                  >
                    {dr.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)' }}>
                Đang hiển thị <strong>{filteredOrders.length}</strong> đơn hàng
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('no_orders_in_tab', 'Không có đơn hàng nào trong mục này.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                        🏪 {ord.shopName}
                      </span>
                      <button
                        type="button"
                        className="shopee-order-chat-btn"
                        onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                        title="Chat ngay với người bán"
                      >
                        💬 Chat ngay
                      </button>
                      <span
                        className="shopee-order-id-chip"
                        onClick={() => handleCopy(ord.orderId, 'mã đơn hàng')}
                        title="Nhấn để sao chép mã đơn hàng"
                      >
                        #{ord.orderId} 📋
                      </span>
                    </div>

                    <div className="shopee-order-header-status">
                      <span className="order-date-text">{ord.createdAt}</span>
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

                  {/* Tracking Stepper Progress (when active) with Delivery Wire */}
                  {ord.stepIndex > 0 && ord.status !== 'cancelled' && (
                    <div className="shopee-order-stepper-wrap">
                      <div className="order-stepper-container" style={{ margin: 0 }}>
                        <div className="order-stepper-track-wrap">
                          {/* Base Wire / Sợi dây nền */}
                          <div className="order-stepper-cable-base" />
                          {/* Active Progress Wire / Sợi dây truyền màu xanh lá */}
                          <div
                            className="order-stepper-cable-active"
                            style={{
                              width: `${((Math.min(ord.stepIndex || 1, 4) - 1) / 3) * 75}%`,
                            }}
                          />

                          {[
                            { num: 1, label: t('step_order_placed', 'Đã Đặt Hàng') },
                            { num: 2, label: t('step_confirmed', 'Đã Xác Nhận') },
                            { num: 3, label: t('step_shipping', 'Đang Vận Chuyển') },
                            { num: 4, label: t('step_delivered', 'Đã Giao Hàng') },
                          ].map((step, idx) => {
                            const isCompleted = (ord.stepIndex || 1) >= step.num;
                            const isActive = (ord.stepIndex || 1) === step.num && ord.status !== 'completed';
                            return (
                              <div
                                key={idx}
                                className={`order-stepper-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                              >
                                <div className="order-stepper-circle">
                                  {isCompleted ? '✓' : step.num}
                                </div>
                                <span className="order-stepper-label">
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="shopee-order-items-list">
                    {(ord.items || []).map((item, idx) => (
                      <div key={idx} className="shopee-order-item-card">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="shopee-order-item-img"
                        />
                        <div className="shopee-order-item-info">
                          <div className="shopee-order-item-title">{item.name}</div>
                          {item.variant && (
                            <span className="shopee-order-item-variant">
                              Phân loại: {item.variant}
                            </span>
                          )}
                          <div className="shopee-order-item-qty">
                            Số lượng: x{item.quantity || 1}
                          </div>
                        </div>

                        <div className="shopee-order-item-pricing">
                          <span className="shopee-order-item-price">
                            {formatCurrency(item.price)}
                          </span>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            style={{ fontSize: '11.5px', padding: '4px 10px' }}
                            onClick={() => handleBuyAgain(item)}
                            title="Thêm sản phẩm này vào giỏ hàng để mua lại"
                          >
                            🔁 Mua lại
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Summary Bar */}
                  <div className="shopee-order-card-summary-bar">
                    <div className="shopee-order-summary-left">
                      <span>{t('payment_method', 'Thanh toán')}: <strong>{ord.paymentMethod || 'COD'}</strong></span>
                      {ord.trackingCode && (
                        <span
                          className="copy-pill"
                          onClick={() => handleCopy(ord.trackingCode, 'mã vận đơn SPX')}
                          title="Nhấn để sao chép mã vận đơn SPX"
                        >
                          🚚 SPX: <strong>{ord.trackingCode}</strong> 📋
                        </span>
                      )}
                    </div>

                    <div className="shopee-order-summary-right">
                      <div className="shopee-order-total-row">
                        <span className="shopee-order-total-label">{t('total_payment', 'Thành tiền')}:</span>
                        <span className="shopee-order-total-amount">{formatCurrency(totalPayment)}</span>
                      </div>
                      {(voucherDiscount > 0 || coinDiscount > 0) && (
                        <div className="shopee-order-discount-hint">
                          ✨ Tiết kiệm {formatCurrency(voucherDiscount + coinDiscount)} từ Voucher & Xu
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="shopee-order-card-actions-bar">
                    {/* Left: Simulation button if in testing mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {ord.status !== 'cancelled' && (ord.stepIndex || 1) < 4 && (
                        <button
                          type="button"
                          className="shopee-btn"
                          style={{
                            fontSize: '11.5px',
                            background: 'var(--primary-light, #eff6ff)',
                            border: '1px solid var(--primary-border, #bfdbfe)',
                            color: 'var(--primary-color, #2563eb)',
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: '6px',
                          }}
                          onClick={() => handleSimulateNextStep(ord.orderId)}
                          title="Mô phỏng bưu tá giao hàng bước tiếp theo"
                        >
                          ⚡ {t('order_track_simulate_step', 'Mô phỏng giao')}
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
                            className="shopee-order-btn-danger-outline"
                            onClick={() => setSelectedCancelOrder(ord)}
                          >
                            ✕ {t('cancel_order', 'Hủy đơn hàng')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            💬 Chat với Shop
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-primary"
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            👁 {t('view_details', 'Xem chi tiết')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 2: Đang giao (shipping, delivering) */}
                      {(ord.status === 'shipping' || ord.status === 'delivering') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => setSelectedLiveMapOrder(ord)}
                          >
                            🚚 {t('shipper_map', 'Bản đồ Shipper SPX')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            📍 {t('view_tracking_details', 'Lịch trình')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-success"
                            onClick={() => handleConfirmDelivered(ord.orderId)}
                            title="Xác nhận bạn đã nhận được gói hàng an toàn"
                          >
                            ✓ {t('confirm_delivered', 'Đã nhận hàng')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 3: Hoàn thành (completed, delivered) */}
                      {(ord.status === 'completed' || ord.status === 'delivered') && (
                        <>
                          {ord.reviewed ? (
                            <span
                              className="shopee-badge-success"
                              style={{
                                fontSize: '12px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              ✓ {t('reviewed_badge', 'Đã đánh giá (+200 Xu)')}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="shopee-order-btn-primary"
                              onClick={() => setSelectedReviewOrder(ord)}
                            >
                              ⭐ {t('review_order_btn', 'Đánh giá (+200 Xu)')}
                            </button>
                          )}
                          <button
                            type="button"
                            className={ord.reviewed ? 'shopee-order-btn-primary' : 'shopee-order-btn-outline'}
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            🔄 {t('buy_again_whole', 'Mua lại đơn này')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => setSelectedReturnOrder(ord)}
                          >
                            ↩ {t('return_refund', 'Trả hàng/Hoàn tiền')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                          >
                            🧾 {t('print_invoice', 'In hóa đơn VAT')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            👁 {t('view_details', 'Xem chi tiết')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 4: Đã hủy (cancelled) */}
                      {ord.status === 'cancelled' && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-primary"
                            onClick={() => handleReorderWholeOrder(ord)}
                            title="Mua lại tất cả sản phẩm trong đơn hàng này"
                          >
                            🔄 {t('buy_again_whole', 'Mua lại đơn này')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            👁 {t('view_details', 'Xem chi tiết')}
                          </button>
                        </>
                      )}

                      {/* Giai đoạn 5: Đổi trả (returned, returning) */}
                      {(ord.status === 'returned' || ord.status === 'returning') && (
                        <>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => {
                              setSelectedDetailOrder(ord);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            👁 {t('view_details', 'Xem chi tiết')}
                          </button>
                          <button
                            type="button"
                            className="shopee-order-btn-outline"
                            onClick={() => setSelectedChatShop({ shop: { name: ord.shopName, id: ord.shopId }, currentProduct: ord.items?.[0] })}
                          >
                            💬 Chat với Shop
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
      </div>

      {/* Modal Detailed Timeline */}
      {selectedOrderDetails && (
        <div className="shopee-modal-overlay">
          <div className="shopee-modal-content" style={{ maxWidth: '500px' }}>
            <div className="shopee-modal-header">
              <h3>
                {t('order_timeline_title', 'Hành Trình Đơn Hàng')}: {selectedOrderDetails.orderId}
              </h3>
              <button
                type="button"
                className="shopee-modal-close"
                onClick={() => setSelectedOrderDetails(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {(selectedOrderDetails.timeline || []).map((tl, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                  <div style={{ color: 'var(--primary-color, #2563eb)', fontWeight: 700, minWidth: '85px' }}>{tl.time}</div>
                  <div style={{ color: 'var(--text-primary)' }}>{tl.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedOrderDetails.status !== 'cancelled' && (selectedOrderDetails.stepIndex || 1) < 4 && (
                <button
                  type="button"
                  className="shopee-btn"
                  style={{
                    background: 'var(--primary-light, #eff6ff)',
                    border: '1px solid var(--primary-border, #bfdbfe)',
                    color: 'var(--primary-color, #2563eb)',
                    fontWeight: 700,
                    fontSize: '12.5px',
                  }}
                  onClick={() => handleSimulateNextStep(selectedOrderDetails.orderId)}
                >
                  ⚡ {t('order_track_simulate_step')}
                </button>
              )}

              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ marginLeft: 'auto' }}
              >
                {t('close', 'Đã hiểu')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice & VAT Receipt Modal */}
      {selectedInvoiceOrder && (
        <InvoiceReceiptModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Return & Refund Request Modal */}
      {selectedReturnOrder && (
        <ReturnRequestModal
          order={selectedReturnOrder}
          onClose={() => setSelectedReturnOrder(null)}
          onSubmit={handleReturnSubmit}
        />
      )}

      {/* Live Driver & GPS Map Modal */}
      {selectedLiveMapOrder && (
        <DeliveryLiveMapModal
          order={selectedLiveMapOrder}
          onClose={() => setSelectedLiveMapOrder(null)}
        />
      )}

      {/* Cancellation Reason Modal */}
      {selectedCancelOrder && (
        <div
          className="shopee-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCancelOrder(null);
          }}
        >
          <div
            className="anim-modal-content"
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-medium, #cbd5e1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light, #e2e8f0)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✕</span>
                <span>Hủy Đơn Hàng: {selectedCancelOrder.orderId}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCancelOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Vui lòng chọn lý do hủy đơn hàng để giúp sàn và nhà bán nâng cao chất lượng phục vụ:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {CANCEL_REASONS.map((r, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13.5px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: cancelReason === r ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-muted, #f8fafc)',
                    border: `1px solid ${cancelReason === r ? 'var(--primary-color, #4f46e5)' : 'var(--border-light, #e2e8f0)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === r}
                    onChange={() => setCancelReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Ghi chú thêm (không bắt buộc):
              </label>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Nhập chi tiết lý do bạn muốn hủy đơn..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-medium, #cbd5e1)',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                onClick={() => setSelectedCancelOrder(null)}
                style={{ fontSize: '13px' }}
              >
                Giữ Lại Đơn
              </button>
              <button
                type="button"
                className="shopee-btn"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                onClick={handleConfirmCancelOrder}
              >
                Xác Nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đánh Giá Sản Phẩm (+200 Mini Xu) */}
      {selectedReviewOrder && (
        <ProductReviewModal
          order={selectedReviewOrder}
          onClose={() => setSelectedReviewOrder(null)}
          onSubmitReview={handleReviewSubmit}
        />
      )}

      {/* Comprehensive Order Detail Modal (Milestone M2 & M3) */}
      {isDetailModalOpen && selectedDetailOrder && (
        <OrderDetailModal
          order={selectedDetailOrder}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDetailOrder(null);
          }}
          onOpenChat={(order) => {
            setSelectedChatShop({
              shop: { name: order?.shopName || 'Shop', id: order?.shopId },
              currentProduct: order?.items?.[0],
            });
          }}
          onOpenTracking={(order) => setSelectedLiveMapOrder(order)}
          onOpenLiveMap={(order) => setSelectedLiveMapOrder(order)}
          onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
          onBuyAgainItem={(item) => handleBuyAgain(item)}
          onReorderWhole={(order) => handleReorderWholeOrder(order)}
        />
      )}

      {/* Real-time Shop Seller Chat Modal */}
      {selectedChatShop && (
        <ShopChatModal
          shop={selectedChatShop.shop}
          currentProduct={selectedChatShop.currentProduct}
          onClose={() => setSelectedChatShop(null)}
        />
      )}
    </main>
  );
}
