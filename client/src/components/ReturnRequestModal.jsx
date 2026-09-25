import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const RETURN_REASONS = [
  'Hàng bị lỗi kỹ thuật / Không hoạt động',
  'Hàng bị bể vỡ, móp méo trong quá trình giao',
  'Giao sai sản phẩm / sai phân loại (màu sắc, kích thước)',
  'Sản phẩm khác xa so với hình ảnh & mô tả',
  'Nghi ngờ hàng giả, hàng nhái kém chất lượng',
  'Đổi ý, không còn nhu cầu sử dụng sản phẩm',
];

export default function ReturnRequestModal({ order, onClose, onSubmit }) {
  if (!order) return null;

  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [refundMethod, setRefundMethod] = useState('wallet'); // 'wallet' | 'bank'
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [note, setNote] = useState('');
  const [filesMock, setFilesMock] = useState(['anh_san_pham_loi_1.jpg']);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      orderId: order.orderId,
      reason,
      refundMethod: refundMethod === 'wallet' ? 'Ví điện tử Mini Shopee' : `Ngân hàng ${bankName} (${accountNumber})`,
      note,
      refundAmount: order.total,
    });
  };

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
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
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-modal, 0 20px 40px rgba(0,0,0,0.25))',
          border: '1px solid var(--border-medium, #e2e8f0)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              🔄 Yêu Cầu Trả Hàng & Hoàn Tiền
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Mã đơn hàng: <strong>{order.orderId}</strong> · Shop: {order.shopName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order Item Brief */}
          <div
            style={{
              background: 'var(--bg-muted, #f8fafc)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              border: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {order.items?.[0]?.name || 'Sản phẩm mua sắm'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Số lượng: {order.items?.[0]?.quantity || 1}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Số tiền hoàn dự kiến:</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
                {formatCurrency(order.total)}
              </div>
            </div>
          </div>

          {/* Reason Select */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Lý do bạn muốn trả hàng:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #cbd5e1)',
                background: 'var(--bg-card, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13.5px',
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              Phương thức nhận tiền hoàn:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                style={{
                  border: `2px solid ${refundMethod === 'wallet' ? 'var(--primary-color, #ea580c)' : 'var(--border-medium, #cbd5e1)'}`,
                  background: refundMethod === 'wallet' ? 'var(--primary-light, #fff7ed)' : 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value="wallet"
                  checked={refundMethod === 'wallet'}
                  onChange={() => setRefundMethod('wallet')}
                />
                <span>Ví Mini Shopee (Tức thì)</span>
              </label>

              <label
                style={{
                  border: `2px solid ${refundMethod === 'bank' ? 'var(--primary-color, #ea580c)' : 'var(--border-medium, #cbd5e1)'}`,
                  background: refundMethod === 'bank' ? 'var(--primary-light, #fff7ed)' : 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value="bank"
                  checked={refundMethod === 'bank'}
                  onChange={() => setRefundMethod('bank')}
                />
                <span>Tài khoản Ngân hàng</span>
              </label>
            </div>
          </div>

          {/* Bank details input if bank method selected */}
          {refundMethod === 'bank' && (
            <div
              style={{
                background: 'var(--bg-muted, #f8fafc)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-light, #e2e8f0)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Ngân hàng thụ hưởng:
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="Vietcombank">Vietcombank - Ngân hàng Ngoại Thương</option>
                  <option value="MBBank">MBBank - Ngân hàng Quân Đội</option>
                  <option value="Techcombank">Techcombank - Kỹ Thương</option>
                  <option value="VPBank">VPBank - Việt Nam Thịnh Vượng</option>
                  <option value="ACB">ACB - Á Châu</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Số tài khoản:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 1029384756"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxBox: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Chủ tài khoản:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NGUYEN VAN A"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
              Mô tả chi tiết tình trạng sản phẩm:
            </label>
            <textarea
              rows="3"
              required
              placeholder="Vui lòng cung cấp chi tiết tình trạng lỗi hoặc vấn đề của sản phẩm..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #cbd5e1)',
                background: 'var(--bg-card, #ffffff)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Evidence Attachments */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Hình ảnh / Video bằng chứng:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {filesMock.map((file, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-muted, #f1f5f9)',
                    border: '1px solid var(--border-medium, #cbd5e1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📷 {file}</span>
                </div>
              ))}
              <label
                style={{
                  background: 'var(--bg-card)',
                  border: '1px dashed var(--primary-color, #ea580c)',
                  color: 'var(--primary-color, #ea580c)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                + Thêm ảnh
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFilesMock((prev) => [...prev, e.target.files[0].name]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Submit & Cancel */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="shopee-btn shopee-btn-primary"
              style={{ fontWeight: 700 }}
            >
              ✓ Xác Nhận Gửi Yêu Cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
