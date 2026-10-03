import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { StoreIcon, MapPinIcon, PackageIcon, ChatIcon, PrinterIcon, CheckIcon, CloseIcon } from './OrdersIcons';

export default function PackingSlipModal({ order, shop, onClose }) {
  if (!order) return null;

  const trackingCode = order.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const orderId = order.orderId || order.id || 'ORD_UNKNOWN';
  const shopName = shop?.name || "Thời Trang GenZ Official";
  const shopPhone = shop?.phone || "0912345678";
  const shopAddress = shop?.address || "Kho Tổng Tân Bình, TP. Hồ Chí Minh";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="shopee-modal-overlay" onClick={onClose} style={{ animation: 'modalOverlayFadeIn 0.2s ease-out forwards', zIndex: 9999 }}>
      <div
        className="shopee-modal anim-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#1e293b'
        }}
      >
        {/* Header Phiếu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 900 }}>
                SPX EXPRESS
              </span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                PHIẾU XUẤT KHO & ĐÓNG GÓI
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Phiếu kiểm soát đóng gói hàng hóa trước khi bàn giao đơn vị vận chuyển
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Mã đơn hàng:</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ea580c', letterSpacing: '0.5px' }}>
              #{orderId}
            </div>
          </div>
        </div>

        {/* Thông tin Shop & Khách hàng */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <StoreIcon size={13} color="#ea580c" /> ĐƠN VỊ XUẤT HÀNG (SHOP)
            </div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{shopName}</div>
            <div style={{ color: '#475569', marginTop: '2px' }}>Kho: {shopAddress}</div>
            <div style={{ color: '#475569', marginTop: '2px' }}>Hotline: {shopPhone}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPinIcon size={13} color="#2563eb" /> NGƯỜI NHẬN HÀNG (KHÁCH)
            </div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
              {order.customerName || order.customer?.fullName || 'Khách Hàng Mini Shopee'}
            </div>
            <div style={{ color: '#475569', marginTop: '2px' }}>
              SĐT: <strong>{order.phone || order.customer?.phone || '0901234567'}</strong>
            </div>
            <div style={{ color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
              Địa chỉ: {order.address || order.customer?.address || 'TP. Hồ Chí Minh'}
            </div>
          </div>
        </div>

        {/* Bảng Danh Sách Sản Phẩm Cần Nhặt & Kiểm Hàng */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageIcon size={15} color="#ea580c" /> DANH SÁCH MẶT HÀNG KIỂM TRA ({order.items?.length || 1} sản phẩm):
            </strong>
            <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckIcon size={12} color="#16a34a" />
              <span>Tích chọn kiểm hàng trước khi dán tem</span>
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px', width: '36px', textAlign: 'center' }}>Kiểm</th>
                <th style={{ padding: '8px 10px' }}>Sản Phẩm & Quy Cách</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '70px' }}>Số Lượng</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>Đơn Giá</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mã SKU: #{item.productId || item.id || `SKU_${idx + 1}`}</div>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, fontSize: '14px', color: '#ea580c' }}>
                    x{item.quantity}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Thanh toán & Ghi chú */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '12.5px', marginBottom: '4px' }}>
              Phương thức thanh toán: <strong>{order.paymentMethod || 'VietQR'}</strong>
            </div>
            <div style={{ fontSize: '12.5px', marginBottom: '4px' }}>
              Mã vận đơn bưu cục: <strong style={{ color: '#ea580c' }}>{trackingCode}</strong>
            </div>
            {order.note && (
              <div style={{ fontSize: '12px', color: '#d97706', marginTop: '6px', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ChatIcon size={13} color="#d97706" /> <span><strong>Ghi chú của khách:</strong> {order.note}</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng Giá Trị Đơn Hàng:</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ea580c' }}>
              {formatCurrency(order.total || 0)}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
              (Đã bao gồm phí vận chuyển & VAT)
            </div>
          </div>
        </div>

        {/* Chữ ký 3 bên bàn giao */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', marginBottom: '24px', fontSize: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#475569' }}>NGƯỜI ĐÓNG GÓI</div>
            <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 600 }}>{shopName.split(' ')[0]} Store</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, color: '#475569' }}>THỦ KHO XUẤT HÀNG</div>
            <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '11px' }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 600 }}>Đã kiểm xuất</div>
          </div>

          <div>
            <div style={{ fontWeight: 800, color: '#475569' }}>BƯU TÁ SPX EXPRESS</div>
            <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '11px' }}>(Ký nhận kiện hàng)</div>
            <div style={{ height: '40px' }} />
            <div style={{ fontWeight: 600, color: '#ea580c' }}>SPX Courier</div>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <CloseIcon size={13} color="#64748b" />
            <span>Đóng</span>
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={handlePrint}
            style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <PrinterIcon size={14} color="#ffffff" />
            <span>In Phiếu Đóng Gói (A4)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
