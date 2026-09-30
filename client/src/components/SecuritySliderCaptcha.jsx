import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Enterprise Security Slider Captcha Component
 * Anti-Bot interactive verification with smooth drag physics, click-to-verify fallback,
 * and multi-event touch/mouse bindings.
 */
export default function SecuritySliderCaptcha({
  onSuccess,
  onVerified,
  onReset,
  isVerified: externalVerified = false,
  disabled = false,
  disabledMessage = 'Vui lòng điền đủ thông tin hợp lệ phía trên để mở khóa',
}) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [internalVerified, setInternalVerified] = useState(false);
  const trackRef = useRef(null);

  const isVerified = externalVerified || internalVerified;

  // Sync with external reset
  useEffect(() => {
    if (!externalVerified && internalVerified && externalVerified !== undefined) {
      setInternalVerified(false);
      setSliderPosition(0);
    }
  }, [externalVerified, internalVerified]);

  const triggerVerified = useCallback(() => {
    if (disabled) return;
    setIsDragging(false);
    setInternalVerified(true);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      setSliderPosition(trackRect.width - 44);
    }
    if (typeof onVerified === 'function') onVerified();
    if (typeof onSuccess === 'function') onSuccess();
  }, [onVerified, onSuccess, disabled]);

  const handleStart = (e) => {
    if (isVerified || disabled) return;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || isVerified || !trackRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const trackRect = trackRef.current.getBoundingClientRect();
      const maxDrag = Math.max(trackRect.width - 44, 100);
      let currentDrag = clientX - trackRect.left - 22;

      if (currentDrag < 0) currentDrag = 0;
      if (currentDrag > maxDrag) currentDrag = maxDrag;

      setSliderPosition(currentDrag);

      // Threshold: 85% of track qualifies as verification
      if (currentDrag >= maxDrag * 0.85) {
        triggerVerified();
      }
    };

    const handleEnd = () => {
      if (!isDragging || isVerified) return;
      setIsDragging(false);
      // Spring back to start
      setSliderPosition(0);
      if (typeof onReset === 'function') onReset();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isVerified, triggerVerified, onReset]);

  // Click on track: quick slide & verify for seamless UX
  const handleTrackClick = (e) => {
    if (isVerified || disabled || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    if (clickX > 44) {
      triggerVerified();
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setInternalVerified(false);
    setSliderPosition(0);
    setIsDragging(false);
    if (typeof onReset === 'function') onReset();
  };

  return (
    <div className="shopee-security-slider-wrapper" style={{ margin: '14px 0' }}>
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: 'relative',
          height: '46px',
          background: isVerified ? '#ecfdf5' : disabled ? '#f8fafc' : '#f1f5f9',
          border: isVerified ? '1.5px solid #10b981' : disabled ? '1.5px dashed #cbd5e1' : '1.5px solid #cbd5e1',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          cursor: isVerified ? 'default' : disabled ? 'not-allowed' : 'pointer',
          boxShadow: isVerified
            ? '0 2px 8px rgba(16, 185, 129, 0.15)'
            : 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.25s ease',
          opacity: disabled ? 0.85 : 1,
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isVerified ? '100%' : `${sliderPosition + 44}px`,
            background: isVerified
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.45))'
              : disabled
              ? 'transparent'
              : 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.35))',
            transition: isDragging ? 'none' : 'width 0.25s ease',
          }}
        />

        {/* Prompt Label */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '12px',
            fontWeight: 700,
            color: isVerified ? '#047857' : disabled ? '#94a3b8' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
            padding: '0 40px',
            textAlign: 'center',
          }}
        >
          {isVerified ? (
            <>
              <span style={{ fontSize: '15px', color: '#10b981' }}>✓</span>
              <span>Đã xác minh bảo mật thành công</span>
            </>
          ) : disabled ? (
            <>
              <span style={{ fontSize: '13px', opacity: 0.7 }}>🛡️</span>
              <span>{disabledMessage}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px', color: '#2563eb' }}>❯❯</span>
              <span>Kéo thanh trượt sang phải để xác nhận</span>
            </>
          )}
        </span>

        {/* Draggable Handle */}
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute',
            left: isVerified && trackRef.current
              ? `${trackRef.current.clientWidth - 46}px`
              : `${sliderPosition}px`,
            top: '2px',
            width: '42px',
            height: '40px',
            background: isVerified
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : disabled
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '9999px',
            boxShadow: disabled ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: disabled ? '#94a3b8' : '#ffffff',
            cursor: isVerified ? 'default' : disabled ? 'not-allowed' : 'grab',
            transition: isDragging ? 'none' : 'left 0.25s ease, background 0.25s ease',
            zIndex: 2,
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          {isVerified ? '✓' : disabled ? '🔒' : '➔'}
        </div>
      </div>
    </div>
  );
}
