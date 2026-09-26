import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import ReturnRequestModal from '../components/ReturnRequestModal';
import DeliveryLiveMapModal from '../components/DeliveryLiveMapModal';
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
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
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

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [selectedLiveMapOrder, setSelectedLiveMapOrder] = useState(null);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState(null);
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

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'all') return true;
    return ord.status === activeTab;
  });

  const handleConfirmCancelOrder = () => {
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
    setSelectedCancelOrder(null);
    setCancelNote('');
    showToast(t('order_cancelled_toast', 'Đã hủy đơn hàng thành công'), 'info');
  };

  const handleBuyAgain = (item) => {
    addToCart(item, 1);
    showToast(t('buy_again_toast', 'Đã thêm sản phẩm vào giỏ hàng để mua lại!'), 'success');
    navigate('/cart');
  };

  const handleReorderWholeOrder = (order) => {
    if (!order || !order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      addToCart(item, item.quantity || 1);
    });
    showToast(`Đã thêm ${order.items.length} sản phẩm từ đơn ${order.orderId} vào giỏ hàng!`, 'success');
    navigate('/cart');
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

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-medium, #e0e0e0)', paddingBottom: '14px', marginBottom: '22px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: t('all_orders', 'Tất cả đơn') },
            { id: 'shipping', label: t('status_shipping', 'Đang vận chuyển') },
            { id: 'completed', label: t('status_completed', 'Hoàn thành') },
            { id: 'returning', label: t('status_returning', 'Đổi trả / Hoàn tiền') },
            { id: 'cancelled', label: t('status_cancelled', 'Đã hủy') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`shopee-btn ${activeTab === tab.id ? 'shopee-btn-primary' : 'shopee-btn-secondary'}`}
              style={{ fontSize: '13px', padding: '7px 16px', borderRadius: '20px' }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p>{t('no_orders_in_tab', 'Không có đơn hàng nào trong mục này.')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((ord) => (
              <div
                key={ord.orderId}
                style={{
                  border: '1px solid var(--border-medium, #e0e0e0)',
                  borderRadius: '10px',
                  padding: '20px',
                  background: 'var(--bg-card, #fff)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light, #f0f0f0)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                      🏪 {ord.shopName}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {t('order_id', 'Mã đơn')}: <strong>{ord.orderId}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ord.createdAt}</span>
                    <span
                      className={`shopee-status-badge ${
                        ord.status === 'completed'
                          ? 'status-completed'
                          : ord.status === 'shipping'
                          ? 'status-shipping'
                          : ord.status === 'returning'
                          ? 'status-shipping'
                          : 'status-cancelled'
                      }`}
                      style={ord.status === 'returning' ? { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' } : {}}
                    >
                      {ord.statusText}
                    </span>
                  </div>
                </div>

                {/* Tracking Stepper Progress */}
                {ord.stepIndex > 0 && (
                  <div style={{ background: 'var(--bg-muted, #f8fafc)', border: '1px solid var(--border-light, #eee)', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      {[
                        { num: 1, label: t('step_order_placed', 'Đã Đặt Hàng') },
                        { num: 2, label: t('step_confirmed', 'Đã Xác Nhận') },
                        { num: 3, label: t('step_shipping', 'Đang Vận Chuyển') },
                        { num: 4, label: t('step_delivered', 'Đã Giao Hàng') },
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: ord.stepIndex >= step.num ? 'var(--color-success, #10b981)' : 'var(--border-dark, #cbd5e1)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                              marginBottom: '6px',
                            }}
                          >
                            {ord.stepIndex >= step.num ? '✓' : step.num}
                          </div>
                          <span style={{ fontSize: '11.5px', fontWeight: ord.stepIndex >= step.num ? 700 : 500, color: ord.stepIndex >= step.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                  {ord.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Số lượng: x{item.quantity}</div>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Row & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light, #f0f0f0)', paddingTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{t('payment_method', 'Thanh toán')}: <strong>{ord.paymentMethod}</strong></span>
                    {ord.trackingCode && (
                      <span style={{ marginLeft: '12px' }}>
                        Mã SPX: <strong style={{ color: 'var(--secondary-color, #0284c7)' }}>{ord.trackingCode}</strong>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '13px' }}>
                      {t('total_payment', 'Tổng thanh toán')}: <strong style={{ fontSize: '18px', color: 'var(--primary-color, #ea580c)' }}>{formatCurrency(ord.total)}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ord.status !== 'cancelled' && (ord.stepIndex || 1) < 4 && (
                        <button
                          type="button"
                          className="shopee-btn"
                          style={{
                            fontSize: '12px',
                            background: 'var(--primary-light, #fff7ed)',
                            border: '1px solid var(--primary-border, #fed7aa)',
                            color: 'var(--primary-color, #ea580c)',
                            fontWeight: 700,
                          }}
                          onClick={() => handleSimulateNextStep(ord.orderId)}
                          title="Mô phỏng bưu tá giao hàng bước tiếp theo"
                        >
                          ⚡ {t('order_track_simulate_step')}
                        </button>
                      )}

                      {ord.status === 'shipping' && (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '12px', color: '#ef4444', borderColor: '#fca5a5' }}
                          onClick={() => setSelectedCancelOrder(ord)}
                        >
                          ✕ {t('cancel_order', 'Hủy đơn hàng')}
                        </button>
                      )}

                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: '12px' }}
                        onClick={() => setSelectedOrderDetails(ord)}
                      >
                        {t('view_tracking_details', 'Xem lịch trình')}
                      </button>

                      {ord.status === 'shipping' && (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '12px', color: '#0284c7', borderColor: '#bae6fd' }}
                          onClick={() => setSelectedLiveMapOrder(ord)}
                        >
                          🗺️ Bản đồ Shipper
                        </button>
                      )}

                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: '12px' }}
                        onClick={() => setSelectedInvoiceOrder(ord)}
                      >
                        🧾 {t('print_invoice', 'In hóa đơn VAT')}
                      </button>

                      {ord.status === 'completed' && (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '12px', color: '#d97706', borderColor: '#fde68a' }}
                          onClick={() => setSelectedReturnOrder(ord)}
                        >
                          🔄 {t('return_refund', 'Trả hàng / Hoàn tiền')}
                        </button>
                      )}

                      <button
                        type="button"
                        className="shopee-btn shopee-btn-primary"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleReorderWholeOrder(ord)}
                        title="Mua lại tất cả sản phẩm trong đơn hàng này"
                      >
                        🔁 {t('buy_again_whole', 'Mua Lại Đơn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                  <div style={{ color: 'var(--primary-color, #ea580c)', fontWeight: 700, minWidth: '85px' }}>{tl.time}</div>
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
                    background: 'var(--primary-light, #fff7ed)',
                    border: '1px solid var(--primary-border, #fed7aa)',
                    color: 'var(--primary-color, #ea580c)',
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
    </main>
  );
}
