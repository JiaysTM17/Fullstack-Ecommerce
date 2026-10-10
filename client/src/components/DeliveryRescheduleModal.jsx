import React, { useState } from 'react';
import { rescheduleOrderDeliveryAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ClockIcon, CloseIcon, TruckIcon, CheckIcon } from './OrdersIcons';

const TIME_SLOTS = [
  { id: 'MORNING_8_12', label: 'Buổi Sáng', time: '08:00 - 12:00', desc: 'Thích hợp nhận tại nhà riêng / chung cư' },
  { id: 'AFTERNOON_13_17', label: 'Buổi Chiều', time: '13:00 - 17:00', desc: 'Thích hợp nhận tại công ty / văn phòng làm việc' },
  { id: 'EVENING_18_21', label: 'Buổi Tối', time: '18:00 - 21:00', desc: 'Giao sau giờ tan tầm' },
  { id: 'ANYTIME', label: 'Cả Ngày', time: '08:00 - 18:00', desc: 'Giao trong giờ hành chính bình thường' },
];

export default function DeliveryRescheduleModal({ order, onClose, onSuccess }) {
  const { showToast } = useToast();
  
  // Mặc định ngày mai (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];
  
  // Tối đa 7 ngày sau
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const [requestedDate, setRequestedDate] = useState(minDateStr);
  const [timeSlot, setTimeSlot] = useState(order?.deliveryReschedule?.timeSlot || 'MORNING_8_12');
  const [note, setNote] = useState(order?.deliveryReschedule?.note || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestedDate) {
      showToast('Vui lòng chọn ngày giao hàng', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const targetId = order?.orderId || order?._id || order?.id;
      const res = await rescheduleOrderDeliveryAPI(targetId, {
        requestedDate,
        timeSlot,
        note,
      });

      if (res?.success) {
        showToast(res.message || 'Đã hẹn lại lịch giao hàng SPX thành công!', 'success');
        if (onSuccess) {
          onSuccess(res.data?.deliveryReschedule || {
            status: 'confirmed',
            requestedDate,
            timeSlot,
            note,
            rescheduledAt: new Date().toISOString(),
          });
        }
        onClose();
      } else {
        showToast(res?.message || 'Không thể dời lịch giao hàng. Vui lòng thử lại.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi yêu cầu hẹn lịch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInModal 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClockIcon size={18} color="#2563eb" />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Hẹn Lại Lịch Giao Hàng SPX Express
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                Đơn hàng #{order?.orderId || order?._id} · Miễn phí dịch vụ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Thông tin giải thích */}
          <div
            style={{
              padding: '12px 14px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              marginBottom: '18px',
              display: 'flex',
              gap: '10px',
              fontSize: '12.5px',
              color: '#1e40af',
              lineHeight: 1.5,
            }}
          >
            <TruckIcon size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              Bưu tá SPX Express sẽ lưu trữ gói hàng an toàn tại bưu cục gần nhất và ưu tiên giao đúng khung giờ quý khách đã chọn.
            </div>
          </div>

          {/* Chọn ngày giao */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Chọn ngày giao mới (Trong vòng 7 ngày tới)
            </label>
            <input
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* Chọn khung giờ */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Khung giờ mong muốn nhận hàng
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = timeSlot === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setTimeSlot(slot.id)}
                    style={{
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.04)' : '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#2563eb' : '#0f172a' }}>
                        {slot.label}
                      </span>
                      {isSelected && <CheckIcon size={14} color="#2563eb" />}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                      {slot.time}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {slot.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú cho bưu tá */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Ghi chú thêm cho bưu tá (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Gọi trước 15 phút, gửi bảo vệ tòa nhà nếu vắng mặt..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={150}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              {submitting ? 'Đang gửi...' : 'Xác Nhận Hẹn Lại Lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
