import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { ReturnIcon, CheckIcon, ShieldCheckIcon, CameraIcon, AlertCircleIcon, CloseIcon, ArrowLeftIcon, CreditCardIcon, QrCodeIcon } from './OrdersIcons';

const RETURN_REASONS = [
  'Hàng bị lỗi kỹ thuật / Không hoạt động được',
  'Hàng bị bể vỡ, móp méo hoặc hư hỏng do vận chuyển',
  'Giao sai sản phẩm / sai phân loại (màu sắc, kích thước, dung lượng)',
  'Sản phẩm khác xa so với hình ảnh & mô tả thực tế của Shop',
  'Thiếu linh kiện, phụ kiện hoặc quà tặng kèm',
  'Nghi ngờ hàng giả, hàng nhái kém chất lượng',
  'Hàng đã qua sử dụng, có dấu hiệu bóc tem niêm phong',
  'Đổi ý, không còn nhu cầu sử dụng (Sản phẩm còn nguyên seal)',
];

const VIETNAM_BANKS = [
  { code: 'Vietcombank', name: 'Vietcombank - Ngân hàng Ngoại Thương VN' },
  { code: 'MBBank', name: 'MBBank - Ngân hàng Quân Đội' },
  { code: 'Techcombank', name: 'Techcombank - Kỹ Thương VN' },
  { code: 'VPBank', name: 'VPBank - Việt Nam Thịnh Vượng' },
  { code: 'ACB', name: 'ACB - Ngân hàng Á Châu' },
  { code: 'BIDV', name: 'BIDV - Đầu Tư & Phát Triển VN' },
  { code: 'VietinBank', name: 'VietinBank - Công Thương VN' },
  { code: 'TPBank', name: 'TPBank - Tiên Phong' },
];

export default function ReturnRequestModal({ order, onClose, onSubmit, inline = false }) {
  if (!order) return null;

  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [refundMethod, setRefundMethod] = useState('wallet'); // 'wallet' | 'bank'
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const firstItem = order.items?.[0] || {
    name: order.productName || 'Sản phẩm mua sắm tại Shopee',
    quantity: 1,
    image: order.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setErrorMsg('');
    const newItems = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...newItems].slice(0, 5));
  };

  const handleRemoveImage = (idToRemove) => {
    setImages((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Ràng buộc 1: Mô tả chi tiết không được trống và tối thiểu 10 ký tự
    if (!note.trim()) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết tình trạng sản phẩm gặp sự cố!');
      return;
    }

    if (note.trim().length < 10) {
      setErrorMsg(`Mô tả quá ngắn (${note.trim().length}/10 ký tự). Vui lòng nhập tối thiểu 10 ký tự để Shopee xử lý nhanh chóng!`);
      return;
    }

    // Ràng buộc 2: Bắt buộc cung cấp ít nhất 1 hình ảnh hoặc video bằng chứng
    if (images.length === 0) {
      setErrorMsg('Vui lòng tải lên ít nhất 1 hình ảnh hoặc video chụp rõ lỗi/hư hỏng của sản phẩm!');
      return;
    }

    // Ràng buộc 3: Nếu chọn hoàn qua ngân hàng, phải điền số tài khoản và chủ tài khoản
    if (refundMethod === 'bank') {
      if (!accountNumber.trim()) {
        setErrorMsg('Vui lòng nhập số tài khoản ngân hàng nhận tiền hoàn!');
        return;
      }
      if (!accountName.trim()) {
        setErrorMsg('Vui lòng nhập tên chủ tài khoản ngân hàng (không dấu)!');
        return;
      }
    }

    onSubmit({
      orderId: order.orderId,
      reason,
      refundMethod:
        refundMethod === 'wallet'
          ? 'Ví ShopeePay (Hoàn tức thì)'
          : `Ngân hàng ${bankName} (${accountNumber} - ${accountName.toUpperCase()})`,
      note: note.trim(),
      refundAmount: order.total,
      images: images.map((img) => img.name),
    });
  };

  const returnContent = (
    <div
      className={inline ? 'return-req-inline-container' : 'anim-modal-content'}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: inline ? '12px' : '16px',
        width: '100%',
        maxWidth: inline ? '100%' : '560px',
        maxHeight: inline ? 'none' : '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
        border: inline ? 'none' : '1px solid #e2e8f0',
        position: 'relative',
        overflow: inline ? 'visible' : 'hidden',
        margin: inline ? '0' : 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: inline ? '14px 18px' : '14px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
                gap: '5px',
                marginRight: '6px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftIcon size={11} color="#2563eb" />
              </span>
              <span>Quay lại</span>
            </button>
          )}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(147, 51, 234, 0.3)',
              flexShrink: 0,
            }}
          >
            <ReturnIcon size={18} color="#ffffff" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.2px',
              }}
            >
              Yêu Cầu Trả Hàng & Hoàn Tiền
            </h3>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Mã đơn: <strong style={{ color: '#0f172a' }}>#{order.orderId}</strong> · Shop: {order.shopName || 'Shopee Mall'}
            </div>
          </div>
        </div>

          <button
            type="button"
            className="shopee-order-btn-outline"
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={11} color="#ef4444" />
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >
          {/* Validation Error Banner */}
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '14px',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircleIcon size={13} color="#ef4444" />
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Summary Box - Styled with unified slate & blue tone */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '14px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <img
                src={firstItem.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                alt={firstItem.name}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                  border: '1px solid #cbd5e1',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {firstItem.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {firstItem.variant ? `Phân loại: ${firstItem.variant} · ` : ''}
                  Số lượng: x{firstItem.quantity || 1}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '10.5px', color: '#64748b' }}>Tiền hoàn:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>
                {formatCurrency(order.total)}
              </div>
            </div>
          </div>

          {/* Shopee Guarantee Notice */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '9px 12px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheckIcon size={13} color="#15803d" />
            </span>
            <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: 1.4 }}>
              <strong>Shopee Đảm Bảo:</strong> Miễn phí 100% cước thu hồi hàng tại nhà bởi SPX Express. Yêu cầu của bạn được bảo vệ minh bạch.
            </div>
          </div>

          {/* Reason Select */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
              Lý do bạn muốn trả hàng / hoàn tiền <span style={{ color: '#ef4444' }}>*</span>:
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg('');
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '12.5px',
                outline: 'none',
              }}
            >
              {RETURN_REASONS.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Refund Method Radio */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
              Phương thức nhận tiền hoàn <span style={{ color: '#ef4444' }}>*</span>:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label
                style={{
                  border: `1.5px solid ${refundMethod === 'wallet' ? '#2563eb' : '#e2e8f0'}`,
                  background: refundMethod === 'wallet' ? '#eff6ff' : '#ffffff',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: refundMethod === 'wallet' ? '#2563eb' : '#334155',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value="wallet"
                  checked={refundMethod === 'wallet'}
                  onChange={() => {
                    setRefundMethod('wallet');
                    setErrorMsg('');
                  }}
                  style={{ accentColor: '#2563eb' }}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: refundMethod === 'wallet' ? '#dbeafe' : '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCardIcon size={11} color={refundMethod === 'wallet' ? '#2563eb' : '#ea580c'} />
                  </span>
                  <span>Ví ShopeePay (Tức thì)</span>
                </span>
              </label>

              <label
                style={{
                  border: `1.5px solid ${refundMethod === 'bank' ? '#2563eb' : '#e2e8f0'}`,
                  background: refundMethod === 'bank' ? '#eff6ff' : '#ffffff',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: refundMethod === 'bank' ? '#2563eb' : '#334155',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value="bank"
                  checked={refundMethod === 'bank'}
                  onChange={() => {
                    setRefundMethod('bank');
                    setErrorMsg('');
                  }}
                  style={{ accentColor: '#2563eb' }}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: refundMethod === 'bank' ? '#dbeafe' : '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCodeIcon size={11} color={refundMethod === 'bank' ? '#2563eb' : '#0284c7'} />
                  </span>
                  <span>Tài khoản Ngân hàng</span>
                </span>
              </label>
            </div>
          </div>

          {/* Bank details input if bank method selected */}
          {refundMethod === 'bank' && (
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: '#475569' }}>
                  Ngân hàng thụ hưởng:
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '12px',
                  }}
                >
                  {VIETNAM_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: '#475569' }}>
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 1029384756"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setErrorMsg('');
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '3px', color: '#475569' }}>
                    Chủ tài khoản (Không dấu):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NGUYEN VAN A"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value.toUpperCase());
                      setErrorMsg('');
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description Textarea with strict character count */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Mô tả chi tiết tình trạng sản phẩm <span style={{ color: '#ef4444' }}>*</span>:
              </label>
              <span style={{ fontSize: '11px', color: note.trim().length >= 10 ? '#059669' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {note.trim().length >= 10 ? (
                  <>
                    <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={9} color="#059669" />
                    </span>
                    <span>Đạt yêu cầu ({note.trim().length} ký tự)</span>
                  </>
                ) : (
                  `Tối thiểu 10 ký tự (${note.trim().length}/10)`
                )}
              </span>
            </div>
            <textarea
              rows={3}
              placeholder="Vui lòng mô tả cụ thể tình trạng lỗi, bao bì, tem mã vận đơn để Shop và Shopee xử lý khiếu nại nhanh nhất..."
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setErrorMsg('');
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '12px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Image & Video Evidence (Mandatory - Ràng buộc cấp hình ảnh) */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Hình ảnh / Video bằng chứng thực tế <span style={{ color: '#ef4444' }}>* (Bắt buộc)</span>:
              </label>
              <span style={{ fontSize: '11px', color: images.length >= 1 ? '#059669' : '#64748b' }}>
                {images.length >= 1 ? `Đã chọn ${images.length}/5 ảnh` : 'Tối thiểu 1 ảnh'}
              </span>
            </div>

            {/* Thumbnail preview list */}
            {images.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                {images.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'relative',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      height: '70px',
                      background: '#f8fafc',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '9px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                      title="Xóa minh chứng này"
                      aria-label="Xóa ảnh/video minh chứng"
                    >
                      <CloseIcon size={10} color="#ffffff" />
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        insetInline: 0,
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#fff',
                        fontSize: '8.5px',
                        padding: '1px 3px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.size}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Action Button - Clean Neutral Border matching Outside Page */}
            {images.length < 5 && (
              <label
                style={{
                  border: '1.5px dashed #93c5fd',
                  background: 'rgba(239, 246, 255, 0.6)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffffff', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(37, 99, 235, 0.15)' }}>
                  <CameraIcon size={14} color="#2563eb" />
                </span>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>
                    {images.length === 0 ? 'Tải lên hình ảnh / video sản phẩm lỗi hoặc hư hỏng *' : '+ Thêm hình ảnh / video khác'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                    (Tối đa 5 ảnh, định dạng JPG, PNG)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>

          {/* Action buttons at footer */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{
                padding: '6px 16px',
                fontSize: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={10} color="#ef4444" />
              </span>
              <span>Hủy bỏ</span>
            </button>
            <button
              type="submit"
              className="shopee-order-btn-primary"
              style={{
                padding: '6px 20px',
                fontSize: '12px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={11} color="#ffffff" />
              </span>
              <span>Xác Nhận Gửi Yêu Cầu</span>
            </button>
          </div>
        </form>
      </div>
  );

  if (inline) {
    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.25s ease-out' }}>
        {returnContent}
      </div>
    );
  }

  return (
    <div
      className="shopee-modal-overlay"
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
      {returnContent}
    </div>
  );
}
