import React from 'react';

export default function ShippingLabelModal({ order, shopName = "Thời Trang GenZ", onClose }) {
  if (!order) return null;

  const trackingCode = order.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return (
    <div className="shopee-modal-overlay">
      <div
        className="shopee-modal"
        style={{ maxWidth: '600px', background: '#fff', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #222', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>PHIẾU GIAO HÀNG / VẬN ĐƠN</h2>
            <small style={{ color: '#666' }}>ĐƠN VỊ VẬN CHUYỂN: SPX EXPRESS VIỆT NAM</small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>{trackingCode}</span>
          </div>
        </div>

        {/* Sender and Receiver */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', border: '1px solid #ddd', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          <div>
            <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>NGƯỜI GỬI (SHOP):</strong>
            <div style={{ fontWeight: 700 }}>{shopName}</div>
            <div>Kho tổng Tân Bình, TP. Hồ Chí Minh</div>
            <div>Hotline: 1900 6868</div>
          </div>
          <div>
            <strong style={{ color: '#555', display: 'block', marginBottom: '4px' }}>NGƯỜI NHẬN (KHÁCH):</strong>
            <div style={{ fontWeight: 700 }}>{order.customer?.fullName || 'Khách hàng'}</div>
            <div>{order.customer?.phone || '0909xxxxxx'}</div>
            <div>{order.customer?.address || '123 Đường ABC, Phường 1, Quận 1, TP.HCM'}</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>CHI TIẾT HÀNG HÓA:</strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Tên sản phẩm</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>SL</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{item.name}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                    {(item.price * item.quantity).toLocaleString()}₫
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Barcode mockup */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>TIỀN THU HỘ (COD):</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
              {(order.total || order.subtotal || 0).toLocaleString()}₫
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ letterSpacing: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px' }}>||||||||||||||||||||||||||||</div>
            <small style={{ fontSize: '10px', color: '#888' }}>MÃ BARCODE: {trackingCode}</small>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={() => window.print()}
          >
            🖨️ In Vận Đơn Ngay
          </button>
        </div>
      </div>
    </div>
  );
}
