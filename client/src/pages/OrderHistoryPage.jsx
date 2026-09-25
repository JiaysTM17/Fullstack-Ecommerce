import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
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

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState(INITIAL_CUSTOMER_ORDERS);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'all') return true;
    return ord.status === activeTab;
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm(t('confirm_cancel_order', "Bạn có chắc chắn muốn hủy đơn hàng này?"))) {
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, status: "cancelled", statusText: t('status_cancelled_by_you', "Đã hủy bởi bạn"), stepIndex: 0 }
            : o
        )
      );
      showToast(t('order_cancelled_toast', 'Đã hủy đơn hàng thành công'), 'info');
    }
  };

  const handleBuyAgain = (item) => {
    addToCart(item, 1);
    showToast(t('buy_again_toast', 'Đã thêm sản phẩm vào giỏ hàng để mua lại!'), 'success');
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
                          : 'status-cancelled'
                      }`}
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

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {ord.status === 'shipping' && (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '12px' }}
                          onClick={() => handleCancelOrder(ord.orderId)}
                        >
                          {t('cancel_order', 'Hủy đơn hàng')}
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

                      <button
                        type="button"
                        className="shopee-btn shopee-btn-primary"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleBuyAgain(ord.items[0])}
                      >
                        {t('buy_again', 'Mua Lại')}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setSelectedOrderDetails(null)}
              >
                {t('close', 'Đã hiểu')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
