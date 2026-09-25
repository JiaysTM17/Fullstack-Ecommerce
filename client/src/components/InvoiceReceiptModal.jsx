import React from 'react';
import { formatCurrency } from '../utils/formatCurrency';

export default function InvoiceReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `INV-${order.orderId || '999999'}`;
  const invoiceDate = order.createdAt || new Date().toLocaleDateString('vi-VN');
  const items = order.items || [
    {
      name: order.productName || 'Sản phẩm mua sắm tại Mini Shopee',
      price: order.total || 0,
      quantity: 1,
    }
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const discount = order.voucherDiscount || 0;
  const shippingFee = order.shippingFee || (order.total > 300000 ? 0 : 25000);
  const total = order.total || (subtotal + shippingFee - discount);

  return (
    <div
      className="shopee-modal-overlay invoice-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="invoice-printable-container"
        style={{
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Actions bar (hidden in print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧾</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
              HÓA ĐƠN ĐIỆN TỬ & BIÊN LAI GIAO HÀNG
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🖨️ In Hóa Đơn / Lưu PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px 14px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ✕ Đóng
            </button>
          </div>
        </div>

        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  background: '#ea580c',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                }}
              >
                S
              </div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                MINI SHOPEE
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
              Công ty Cổ phần Thương Mại Điện Tử Mini Shopee<br />
              Mã số thuế: <strong>0318924019</strong><br />
              Địa chỉ: Tầng 12, Tòa nhà Bitexco, Bến Nghé, Q.1, TP. HCM<br />
              Hotline: 1900 1234 · cskh@minishopee.vn
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginBottom: '4px' }}>
              BIÊN LAI BÁN HÀNG
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '2px' }}>
              Số: <strong>{invoiceNo}</strong>
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '6px' }}>
              Ngày: {invoiceDate}
            </div>
            <span
              style={{
                display: 'inline-block',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              ✓ ĐÃ XÁC NHẬN
            </span>
          </div>
        </div>

        {/* Customer & Order Metadata */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <div>
            <div style={{ color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Thông Tin Người Mua
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.customerName || 'Khách Hàng Mini Shopee'}</div>
            <div style={{ color: '#475569' }}>{order.phone || '0988 123 456'}</div>
            <div style={{ color: '#475569' }}>{order.shippingAddress || 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'}</div>
          </div>

          <div>
            <div style={{ color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Phương Thức & Đơn Vị Vận Chuyển
            </div>
            <div style={{ color: '#0f172a' }}>
              Thanh toán: <strong>{order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</strong>
            </div>
            <div style={{ color: '#0f172a' }}>
              Vận chuyển: <strong>SPX Express</strong>
            </div>
            <div style={{ color: '#0f172a' }}>
              Mã theo dõi: <strong>{order.trackingCode || `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`}</strong>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', fontWeight: 700, width: '40px' }}>STT</th>
              <th style={{ padding: '10px 12px', fontWeight: 700 }}>Tên Sản Phẩm</th>
              <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center', width: '70px' }}>SL</th>
              <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right', width: '110px' }}>Đơn Giá</th>
              <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'right', width: '120px' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = item.quantity || 1;
              const lineTotal = item.price * qty;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#0f172a' }}>{qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          {/* QR Verification Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://minishopee.vn/verify-invoice/${invoiceNo}`}
              alt="QR Tra Cứu Hóa Đơn"
              style={{
                width: '84px',
                height: '84px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px',
                background: '#fff',
              }}
            />
            <div style={{ fontSize: '11.5px', color: '#64748b', maxWidth: '200px', lineHeight: '1.4' }}>
              Quét mã QR để kiểm tra tính hợp lệ của biên lai điện tử trên cổng Mini Shopee e-Invoice Portal.
            </div>
          </div>

          {/* Totals */}
          <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Cộng tiền hàng:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? 'Miễn phí (0đ)' : formatCurrency(shippingFee)}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                <span>Voucher giảm giá:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid #cbd5e1',
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              <span>Tổng thanh toán:</span>
              <span style={{ color: '#ea580c' }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div
          style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '16px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            lineHeight: '1.5',
          }}
        >
          Cảm ơn bạn đã tin tưởng mua sắm tại <strong>Mini Shopee</strong>!<br />
          Mọi thắc mắc về đơn hàng và hóa đơn, vui lòng liên hệ Trung tâm Trợ giúp hoặc gửi tin nhắn tại Kênh CSKH.
        </div>
      </div>

      {/* Embedded print style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-modal-overlay,
          .invoice-printable-container,
          .invoice-printable-container * {
            visibility: visible;
          }
          .invoice-modal-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: #ffffff !important;
            padding: 0 !important;
          }
          .invoice-printable-container {
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
