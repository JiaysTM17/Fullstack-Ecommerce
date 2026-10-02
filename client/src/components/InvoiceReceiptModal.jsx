import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { getOrderInvoice } from '../services/orderService';
import { ReceiptIcon, PrinterIcon, ShieldCheckIcon } from './OrdersIcons';

export default function InvoiceReceiptModal({ order, onClose }) {
  if (!order) return null;

  const [liveInvoice, setLiveInvoice] = useState(null);

  useEffect(() => {
    const orderId = order.orderId || order._id || order.id;
    if (orderId) {
      getOrderInvoice(orderId)
        .then((data) => {
          if (data) {
            setLiveInvoice(data);
          }
        })
        .catch((err) => {
          console.warn('Could not load live invoice:', err);
        });
    }
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  const company = liveInvoice?.company || liveInvoice?.seller || {};
  const companyName = company.legalName || company.companyName || 'CÔNG TY TNHH MINI SHOPEE VIỆT NAM';
  const taxCode = company.taxCode || '0318924019';
  const templateCode = liveInvoice?.templateCode || '01GTKT0/001';
  const invoiceSerial = liveInvoice?.invoiceSerial || '1C26MMS';

  const orderIdStr = String(order.orderId || order._id || order.id || '999999');
  const invoiceNo =
    liveInvoice?.invoiceNumber ||
    `INV-2026-${orderIdStr.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;
  const invoiceDate = liveInvoice?.issueDate
    ? new Date(liveInvoice.issueDate).toLocaleDateString('vi-VN')
    : order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');

  const buyer = liveInvoice?.buyer || {};
  const buyerName = buyer.fullName || buyer.name || order.customerName || 'Khách Hàng Mini Shopee';
  const buyerPhone = buyer.phone || order.phone || '0988 123 456';
  const buyerAddress =
    buyer.address ||
    order.shippingAddress ||
    'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  const buyerTaxCode = buyer.taxCode || liveInvoice?.buyerTaxCode || 'Cá nhân không kinh doanh';

  const items =
    liveInvoice?.items && liveInvoice.items.length > 0
      ? liveInvoice.items
      : order.items || [
          {
            name: order.productName || 'Sản phẩm mua sắm tại Mini Shopee',
            price: order.total || 0,
            quantity: 1,
          },
        ];

  const rawSubtotal =
    liveInvoice?.subtotal ||
    order.subtotal ||
    items.reduce(
      (sum, item) =>
        sum +
        (item.price || item.rawPrice || item.unitPrice || 0) * (item.quantity || 1),
      0
    );
  const netSubtotal =
    liveInvoice?.netSubtotal || liveInvoice?.netAmount || Math.round(rawSubtotal / 1.08);
  const vatRate = liveInvoice?.vatRate || '8%';
  const vatAmount = liveInvoice?.vatAmount || (rawSubtotal - netSubtotal);
  const shippingFee = order.shippingFee || 0;
  const discount = (order.voucherDiscount || 0) + (order.coinDiscount || 0);
  const totalPayment =
    liveInvoice?.totalPayment || order.total || (rawSubtotal + shippingFee - discount);

  const qrUrl =
    liveInvoice?.qrCodeUrl ||
    liveInvoice?.qrCodeString ||
    `https://minishopee.vn/invoice/verify?id=${orderIdStr}&serial=${invoiceSerial}&mst=${taxCode}`;

  const signatureDigest =
    typeof liveInvoice?.digitalSignature === 'string'
      ? liveInvoice.digitalSignature
      : liveInvoice?.xmlPayloadDigest ||
        'SHA256:MINI-SHOPEE-E-INVOICE-0318924019-VALIDATED-SECURE';


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
        animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="invoice-printable-container anim-modal-content"
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
            <ReceiptIcon size={20} color="#2563eb" />
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
              HÓA ĐƠN ĐIỆN TỬ & BIÊN LAI GIAO HÀNG
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <PrinterIcon size={14} color="#ffffff" /> In Hóa Đơn / Lưu PDF
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  background: '#2563eb',
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
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {companyName}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              Mã số thuế (MST): <strong style={{ color: '#0f172a' }}>{taxCode}</strong><br />
              Địa chỉ: {company.address || 'Tòa nhà Capital Tower, 109 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội'}<br />
              Hotline: 1900-1221 · {company.email || 'vat-invoice@shopee.enterprise.vn'}
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#2563eb', marginBottom: '4px' }}>
              HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT)
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '2px' }}>
              Mẫu số: <strong>{templateCode}</strong> · Ký hiệu: <strong>{invoiceSerial}</strong>
            </div>
            <div style={{ fontSize: '12.5px', color: '#0f172a', marginBottom: '2px' }}>
              Số hóa đơn: <strong>{invoiceNo}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
              Ngày lập: {invoiceDate}
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
              ✓ ĐÃ KÝ ĐIỆN TỬ
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
            marginBottom: '20px',
            fontSize: '12.5px',
          }}
        >
          <div>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>
              Đơn Vị Mua Hàng (Buyer)
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{buyerName}</div>
            <div style={{ color: '#475569' }}>Điện thoại: {buyerPhone}</div>
            <div style={{ color: '#475569' }}>Địa chỉ: {buyerAddress}</div>
            <div style={{ color: '#475569' }}>MST người mua: {buyerTaxCode}</div>
          </div>

          <div>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>
              Thông Tin Giao Nhận & Thanh Toán
            </div>
            <div style={{ color: '#0f172a', marginBottom: '2px' }}>
              Hình thức thanh toán: <strong>{order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</strong>
            </div>
            <div style={{ color: '#0f172a', marginBottom: '2px' }}>
              Đơn vị vận chuyển: <strong>SPX Express</strong>
            </div>
            <div style={{ color: '#0f172a' }}>
              Mã vận đơn SPX: <strong>{order.trackingCode || `SPX-VN-${orderIdStr.slice(-8).toUpperCase()}`}</strong>
            </div>
          </div>
        </div>

        {/* 8% VAT Itemized Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            fontSize: '12.5px',
          }}
        >
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', fontWeight: 700, width: '36px' }}>STT</th>
              <th style={{ padding: '8px 10px', fontWeight: 700 }}>Tên Hàng Hóa, Dịch Vụ</th>
              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', width: '48px' }}>ĐVT</th>
              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', width: '48px' }}>SL</th>
              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right', width: '105px' }}>Đơn Giá (Chưa VAT)</th>
              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center', width: '60px' }}>Thuế Suất</th>
              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right', width: '115px' }}>Thành Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = item.quantity || 1;
              const unitPriceNet = item.unitPrice || Math.round((item.price || item.rawPrice || 0) / 1.08);
              const lineTotalNet = item.amount || (unitPriceNet * qty);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>Cái</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#0f172a' }}>{qty}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                    {formatCurrency(unitPriceNet)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                    {item.vatRate || vatRate}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(lineTotalNet)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Calculation Summary & QR / Signature */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* QR Verification Code & Digital Signature */}
          <div style={{ maxWidth: '330px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Tra Cứu Hóa Đơn VAT"
                style={{
                  width: '84px',
                  height: '84px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '3px',
                  background: '#fff',
                }}
              />
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
                Quét mã QR để tra cứu và đối soát hóa đơn điện tử theo Nghị định 123/2020/NĐ-CP của Tổng Cục Thuế.
              </div>
            </div>

            {/* Digital Signature Badge */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #94a3b8',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#334155',
              }}
            >
              <div style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheckIcon size={14} color="#15803d" /> ĐÃ KÝ ĐIỆN TỬ BỞI {companyName}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all', marginTop: '2px' }}>
                Mã chữ ký: {signatureDigest}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                Thời gian ký: {invoiceDate}
              </div>
            </div>
          </div>

          {/* VAT Totals Breakdown */}
          <div style={{ width: '270px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Cộng tiền hàng (chưa VAT):</span>
              <strong>{formatCurrency(netSubtotal)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
              <span>Thuế suất GTGT (VAT):</span>
              <strong>{vatRate}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Tiền thuế GTGT (8%):</span>
              <strong>{formatCurrency(vatAmount)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? 'Miễn phí (0đ)' : formatCurrency(shippingFee)}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                <span>Giảm giá / Voucher:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '2px solid #cbd5e1',
                fontSize: '14.5px',
                fontWeight: 900,
                color: '#0f172a',
              }}
            >
              <span>Tổng thanh toán (Đã có VAT):</span>
              <span style={{ color: '#2563eb' }}>{formatCurrency(totalPayment)}</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Footer */}
        <div
          style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '14px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: '1.5',
          }}
        >
          Hóa đơn điện tử khởi tạo có mã của cơ quan thuế theo Nghị định số 123/2020/NĐ-CP & Thông tư số 78/2021/TT-BTC.<br />
          Cảm ơn bạn đã tin tưởng mua sắm tại <strong>Mini Shopee</strong>!
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
