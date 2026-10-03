import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { getOrderInvoice } from '../services/orderService';
import { ReceiptIcon, PrinterIcon, ShieldCheckIcon, CloseIcon, CheckIcon, ArrowLeftIcon, CreditCardIcon, TruckIcon } from './OrdersIcons';

export default function InvoiceReceiptModal({ order, onClose, inline = false }) {
  if (!order) return null;

  const [liveInvoice, setLiveInvoice] = useState(null);

  useEffect(() => {
    const orderId = order.orderId || order._id || order.id;
    if (orderId) {
      getOrderInvoice(orderId)
        .then((data) => {
          if (data) setLiveInvoice(data);
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
  const rawCompanyName = company.legalName || company.companyName || 'CÔNG TY TNHH SHOPEE VIỆT NAM';
  const companyName = rawCompanyName.replace(/Mini\s*Shopee/gi, 'Shopee');
  const taxCode = company.taxCode || '0318924019';
  const templateCode = liveInvoice?.templateCode || '01GTKT0/001';
  const invoiceSerial = liveInvoice?.invoiceSerial || '1C26MS';

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
  const rawBuyerName = buyer.fullName || buyer.name || order.customerName || order.recipientName || 'Khách Hàng Shopee';
  const buyerName = rawBuyerName.replace(/Mini\s*Shopee/gi, 'Shopee');
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
            name: order.productName || 'Sản phẩm mua sắm tại Shopee',
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
    `https://shopee.vn/invoice/verify?id=${orderIdStr}&serial=${invoiceSerial}&mst=${taxCode}`;

  const signatureDigest =
    typeof liveInvoice?.digitalSignature === 'string'
      ? liveInvoice.digitalSignature
      : liveInvoice?.xmlPayloadDigest ||
        'SHA256:SHOPEE-E-INVOICE-0318924019-VALIDATED-SECURE';

  const invoiceContent = (
    <div
      className={`invoice-printable-container ${inline ? 'invoice-inline-container' : 'anim-modal-content'}`}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: inline ? '12px' : '16px',
        width: '100%',
        maxWidth: inline ? '100%' : '740px',
        maxHeight: inline ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
        border: inline ? 'none' : '1px solid #e2e8f0',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        overflow: inline ? 'visible' : 'hidden',
        margin: inline ? '0' : 'auto',
      }}
    >
      {/* Navigation & Actions Top Bar (hidden in print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: inline ? '14px 18px' : '12px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
          borderRadius: inline ? '12px 12px 0 0' : 0,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {inline && (
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{
                borderRadius: '6px',
                padding: '0 10px',
                fontWeight: 600,
                fontSize: '11.5px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginRight: '6px',
              }}
            >
              <ArrowLeftIcon size={13} color="#2563eb" />
              <span>Quay lại</span>
            </button>
          )}
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              flexShrink: 0,
            }}
          >
            <ReceiptIcon size={16} color="#ffffff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a', letterSpacing: '-0.2px' }}>
            Hóa Đơn Điện Tử & Biên Lai VAT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="shopee-order-btn-primary"
            onClick={handlePrint}
            style={{
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
            }}
          >
            <PrinterIcon size={13} color="#ffffff" /> In Hóa Đơn / Lưu PDF
          </button>
          {!inline && (
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{
                borderRadius: '8px',
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: '12px',
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <CloseIcon size={12} color="#64748b" />
              <span>Đóng</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable invoice document paper - Compact A4 Layout without Horizontal Overflow */}
      <div
        className="invoice-scroll-body"
        style={{
          padding: inline ? '18px 0' : '20px 24px',
          overflowY: inline ? 'visible' : 'auto',
          flex: inline ? 'initial' : 1,
          boxSizing: 'border-box',
        }}
      >
          {/* Invoice Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
              paddingBottom: '14px',
              borderBottom: '1.5px solid #e2e8f0',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                    color: '#ffffff',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <ReceiptIcon size={14} color="#ffffff" />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {companyName}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.45' }}>
                Mã số thuế: <strong style={{ color: '#0f172a' }}>{taxCode}</strong> · Hotline: 1900 1221<br />
                Địa chỉ: {company.address || 'Tòa nhà Capital Tower, 109 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội'}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
                HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT)
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '2px' }}>
                Mẫu số: <strong>{templateCode}</strong> · Ký hiệu: <strong>{invoiceSerial}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#0f172a', marginBottom: '2px' }}>
                Số HĐ: <strong>{invoiceNo}</strong> · Ngày: {invoiceDate}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '4px',
                }}
              >
                <CheckIcon size={11} color="#15803d" />
                <span>ĐÃ KÝ ĐIỆN TỬ</span>
              </span>
            </div>
          </div>

          {/* Customer & Order Metadata Grid */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '12px',
              marginBottom: '14px',
              fontSize: '11.5px',
            }}
          >
            <div>
              <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '3px' }}>
                Đơn Vị Mua Hàng (Buyer)
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1px', fontSize: '12.5px' }}>{buyerName}</div>
              <div style={{ color: '#475569' }}>Điện thoại: {buyerPhone}</div>
              <div style={{ color: '#475569' }}>Địa chỉ: {buyerAddress}</div>
              <div style={{ color: '#475569' }}>MST: {buyerTaxCode}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>
                Giao Nhận & Thanh Toán
              </div>
              <div style={{ color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCardIcon size={11} color="#2563eb" />
                </span>
                <span>Hình thức: <strong>{order.paymentMethod || 'Thanh toán khi nhận hàng (COD)'}</strong></span>
              </div>
              <div style={{ color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TruckIcon size={11} color="#ea580c" />
                </span>
                <span>Vận chuyển: <strong>SPX Express</strong></span>
              </div>
              <div style={{ color: '#0f172a' }}>
                Mã vận đơn SPX: <strong>{order.trackingCode || `SPX-VN-${orderIdStr.slice(-8).toUpperCase()}`}</strong>
              </div>
            </div>
          </div>

          {/* 8% VAT Itemized Table - Fully Responsive with 0 Horizontal Overflow */}
          <div
            style={{
              width: '100%',
              marginBottom: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                fontSize: '11.5px',
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px', fontWeight: 700, width: '32px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700 }}>Tên Hàng Hóa, Dịch Vụ</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'center', width: '38px' }}>ĐVT</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'center', width: '32px' }}>SL</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'right', width: '85px' }}>Đơn Giá (Net)</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'center', width: '42px' }}>Thuế</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, textAlign: 'right', width: '92px' }}>Thành Tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = item.quantity || 1;
                  const unitPriceNet = item.unitPrice || Math.round((item.price || item.rawPrice || 0) / 1.08);
                  const lineTotalNet = item.amount || (unitPriceNet * qty);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 8px', color: '#64748b', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0f172a', wordBreak: 'break-word', lineHeight: '1.35' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#64748b' }}>Cái</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{qty}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#475569' }}>
                        {formatCurrency(unitPriceNet)}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                        {item.vatRate || vatRate}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(lineTotalNet)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary & QR / Signature */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '14px',
              gap: '16px',
            }}
          >
            {/* QR Verification Code & Digital Signature */}
            <div style={{ flex: 1, maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(qrUrl)}`}
                  alt="QR Tra Cứu Hóa Đơn VAT"
                  style={{
                    width: '68px',
                    height: '68px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '2px',
                    background: '#fff',
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: '10.5px', color: '#64748b', lineHeight: '1.35' }}>
                  Quét mã QR để đối soát hóa đơn điện tử theo NĐ 123/2020/NĐ-CP & TT 78/2021/TT-BTC Tổng Cục Thuế.
                </div>
              </div>

              {/* Digital Signature Badge */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10.5px',
                  color: '#334155',
                }}
              >
                <div style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheckIcon size={11} color="#15803d" />
                  </span>
                  <span>ĐÃ KÝ SỐ BỞI {companyName}</span>
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', wordBreak: 'break-all', marginTop: '2px' }}>
                  Mã xác thực: {signatureDigest}
                </div>
              </div>
            </div>

            {/* VAT Totals Breakdown */}
            <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', flexShrink: 0 }}>
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
                  paddingTop: '6px',
                  borderTop: '1.5px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontWeight: 900,
                  color: '#0f172a',
                }}
              >
                <span>Tổng thanh toán:</span>
                <span style={{ color: '#2563eb' }}>{formatCurrency(totalPayment)}</span>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer & Footer */}
          <div
            style={{
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '10px',
              textAlign: 'center',
              fontSize: '10.5px',
              color: '#64748b',
              lineHeight: '1.4',
            }}
          >
            Hóa đơn điện tử khởi tạo có mã của cơ quan thuế theo Nghị định số 123/2020/NĐ-CP & Thông tư số 78/2021/TT-BTC.<br />
            Cảm ơn quý khách đã tin tưởng mua sắm tại <strong>Shopee</strong>!
          </div>
        </div>
      </div>
  );

  const printStyle = (
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
  );

  if (inline) {
    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.25s ease-out' }}>
        {invoiceContent}
        {printStyle}
      </div>
    );
  }

  return (
    <div
      className="shopee-modal-overlay invoice-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {invoiceContent}
      {printStyle}
    </div>
  );
}
