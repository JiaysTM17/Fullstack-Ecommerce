import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { TruckIcon, StoreIcon, MapPinIcon, PackageIcon, PrinterIcon, CloseIcon, QrCodeIcon } from './OrdersIcons';

export default function ShippingLabelModal({ order, shopName = "Thời Trang GenZ", onClose }) {
  if (!order) return null;

  const trackingCode = order.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return (
    <div className="shopee-modal-overlay" style={{ animation: 'modalOverlayFadeIn 0.22s ease-out forwards', zIndex: 9999 }}>
      <div
        className="shopee-modal anim-modal-content"
        style={{ maxWidth: '620px', background: '#ffffff', padding: '26px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
                flexShrink: 0,
              }}
            >
              <TruckIcon size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                PHIẾU GIAO HÀNG / VẬN ĐƠN
              </h2>
              <small style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span>ĐƠN VỊ VẬN CHUYỂN:</span>
                <strong style={{ color: '#ea580c' }}>SPX EXPRESS VIỆT NAM</strong>
              </small>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>MÃ VẬN ĐƠN SPX:</div>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c', letterSpacing: '0.5px' }}>{trackingCode}</span>
          </div>
        </div>

        {/* Sender and Receiver */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StoreIcon size={12} color="#ea580c" />
              </span>
              <span>NGƯỜI GỬI (SHOP):</span>
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{shopName}</div>
            <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>Kho tổng Tân Bình, TP. Hồ Chí Minh</div>
            <div style={{ color: '#475569', fontSize: '12px' }}>Hotline: 1900 6868</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPinIcon size={12} color="#2563eb" />
              </span>
              <span>NGƯỜI NHẬN (KHÁCH):</span>
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.customer?.fullName || 'Khách hàng'}</div>
            <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>{order.customer?.phone || '0909xxxxxx'}</div>
            <div style={{ color: '#475569', fontSize: '12px' }}>{order.customer?.address || '123 Đường ABC, Phường 1, Quận 1, TP.HCM'}</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0f172a' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageIcon size={12} color="#ea580c" />
            </span>
            <span>CHI TIẾT HÀNG HÓA ({order.items?.length || 1} sản phẩm):</span>
          </strong>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>Tên sản phẩm</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '50px' }}>SL</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', color: '#1e293b' }}>{item.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>{item.quantity}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Barcode mockup */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>TIỀN THU HỘ (COD):</div>
            <div style={{ fontSize: '19px', fontWeight: 900, color: '#ea580c' }}>
              {formatCurrency(order.total || order.subtotal || 0)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ letterSpacing: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>||||||||||||||||||||||||||||</div>
            <small style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', marginTop: '3px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCodeIcon size={10} color="#475569" />
              </span>
              <span>MÃ BARCODE: {trackingCode}</span>
            </small>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 16px', fontSize: '12.5px' }}
          >
            <CloseIcon size={13} color="#64748b" />
            <span>Đóng</span>
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 20px', fontSize: '12.5px', fontWeight: 700 }}
          >
            <PrinterIcon size={14} color="#ffffff" />
            <span>In Vận Đơn Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
