import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import '../styles/dashboard.css';

// Mock danh sách đơn hàng đã mua của khách hàng
const MOCK_CUSTOMER_ORDERS = [
  {
    orderId: "ORD918231",
    createdAt: "2026-09-24 14:20",
    shopName: "Thời Trang GenZ Official",
    items: [
      { name: "Áo thun nam basic cotton 100% thoáng mát", price: 199000, quantity: 2, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }
    ],
    total: 428000,
    status: "shipping",
    statusText: "Đang giao hàng",
    paymentMethod: "COD"
  },
  {
    orderId: "ORD827103",
    createdAt: "2026-09-20 09:15",
    shopName: "TechWorld Store",
    items: [
      { name: "Tai nghe Bluetooth True Wireless chống ồn chủ động ANC", price: 650000, quantity: 1, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200" }
    ],
    total: 680000,
    status: "completed",
    statusText: "Giao thành công",
    paymentMethod: "BANK_TRANSFER"
  }
];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'shipping' | 'completed' | 'cancelled'
  const [orders] = useState(MOCK_CUSTOMER_ORDERS);

  const filteredOrders = orders.filter(ord => {
    if (activeTab === 'all') return true;
    return ord.status === activeTab;
  });

  return (
    <main className="shopee-container" style={{ padding: '24px 16px', maxWidth: '900px' }}>
      <div className="shopee-table-card">
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Đơn Hàng Của Tôi
        </h2>

        {/* Tab lọc trạng thái đơn */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'shipping', label: 'Đang vận chuyển' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`shopee-btn ${activeTab === tab.id ? 'shopee-btn-primary' : 'shopee-btn-secondary'}`}
              style={{ height: '32px', fontSize: '13px' }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Chưa có đơn hàng nào trong mục này.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map(order => (
              <div key={order.orderId} style={{ border: '1px solid var(--border-light)', borderRadius: '4px', padding: '16px', background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border-medium)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--primary-color)' }}>🏪 {order.shopName}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px' }}>Mã: #{order.orderId} · {order.createdAt}</span>
                  </div>
                  <span className={`shopee-status-badge status-${order.status}`}>
                    {order.statusText}
                  </span>
                </div>

                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                    <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Số lượng: x{item.quantity}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phương thức: {order.paymentMethod}</div>
                  <div style={{ fontSize: '15px' }}>
                    Thành tiền: <strong style={{ color: 'var(--primary-color)', fontSize: '18px' }}>{formatCurrency(order.total)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
