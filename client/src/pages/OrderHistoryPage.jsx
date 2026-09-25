import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState(INITIAL_CUSTOMER_ORDERS);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === 'all') return true;
    return ord.status === activeTab;
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, status: "cancelled", statusText: "Đã hủy bởi bạn", stepIndex: 0 }
            : o
        )
      );
    }
  };

  const handleBuyAgain = (item) => {
    addToCart(item, 1);
    navigate('/cart');
  };

  return (
    <main className="shopee-container" style={{ padding: '24px 16px', maxWidth: '980px' }}>
      <div className="shopee-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#111' }}>
              📦 Đơn Hàng Của Tôi
            </h1>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13.5px' }}>
              Theo dõi chi tiết tiến độ vận chuyển và lịch sử mua sắm.
            </p>
          </div>

          <Link to="/" className="shopee-btn shopee-btn-secondary" style={{ fontSize: '13px' }}>
            ← Tiếp tục mua sắm
          </Link>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e0e0e0', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'Tất cả đơn' },
            { id: 'shipping', label: 'Đang vận chuyển' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'cancelled', label: 'Đã hủy' },
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
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#777' }}>
            <p>Không có đơn hàng nào trong mục này.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((ord) => (
              <div
                key={ord.orderId}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '20px',
                  background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#111' }}>
                      🏪 {ord.shopName}
                    </span>
                    <span style={{ color: '#aaa' }}>|</span>
                    <span style={{ fontSize: '13px', color: '#555' }}>Mã đơn: <strong>{ord.orderId}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{ord.createdAt}</span>
                    <span
                      className={`shopee-badge ${
                        ord.status === 'completed'
                          ? 'shopee-badge-success'
                          : ord.status === 'shipping'
                          ? 'shopee-badge-warning'
                          : 'shopee-badge-danger'
                      }`}
                      style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px' }}
                    >
                      {ord.statusText}
                    </span>
                  </div>
                </div>

                {/* Tracking Stepper Progress (Amazon Timeline) */}
                {ord.stepIndex > 0 && (
                  <div style={{ background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px', padding: '14px 20px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                      {[
                        { num: 1, label: 'Đã Đặt Hàng' },
                        { num: 2, label: 'Đã Xác Nhận' },
                        { num: 3, label: 'Đang Vận Chuyển' },
                        { num: 4, label: 'Đã Giao Hàng' },
                      ].map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: ord.stepIndex >= step.num ? '#2e7d32' : '#ddd',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                              marginBottom: '6px',
                            }}
                          >
                            {ord.stepIndex > step.num ? '✓' : step.num}
                          </div>
                          <span style={{ fontSize: '11.5px', color: ord.stepIndex >= step.num ? '#2e7d32' : '#888', fontWeight: ord.stepIndex === step.num ? 700 : 500 }}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.trackingCode && (
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '10px', textAlign: 'center' }}>
                        Mã vận đơn SPX: <strong>{ord.trackingCode}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                  {ord.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={it.image}
                          alt={it.name}
                          style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                        />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#222' }}>{it.name}</div>
                          <div style={{ fontSize: '12px', color: '#777' }}>Số lượng: x{it.quantity}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#ee4d2d', fontSize: '15px' }}>
                          {formatCurrency(it.price * it.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '14px' }}>
                    Thành tiền: <strong style={{ color: '#ee4d2d', fontSize: '18px' }}>{formatCurrency(ord.total)}</strong>
                    <span style={{ fontSize: '12px', color: '#777', marginLeft: '8px' }}>({ord.paymentMethod})</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {ord.status === 'shipping' && (
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleCancelOrder(ord.orderId)}
                      >
                        Hủy đơn hàng
                      </button>
                    )}

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      style={{ fontSize: '12px' }}
                      onClick={() => setSelectedOrderDetails(ord)}
                    >
                      Xem lịch trình chi tiết
                    </button>

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary"
                      style={{ fontSize: '12px' }}
                      onClick={() => handleBuyAgain(ord.items[0])}
                    >
                      Mua Lại
                    </button>
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
          <div className="shopee-modal" style={{ maxWidth: '500px', background: '#fff', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Hành Trình Đơn Hàng: {selectedOrderDetails.orderId}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {(selectedOrderDetails.timeline || []).map((tl, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                  <div style={{ color: '#ee4d2d', fontWeight: 700, minWidth: '85px' }}>{tl.time}</div>
                  <div style={{ color: '#333' }}>{tl.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => setSelectedOrderDetails(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
