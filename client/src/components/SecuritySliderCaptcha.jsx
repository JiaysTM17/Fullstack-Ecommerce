import React, { useState, useRef, useEffect } from 'react';

export default function SecuritySliderCaptcha({ onSuccess, onReset }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const trackRef = useRef(null);

  const handleStart = (e) => {
    if (isVerified) return;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || isVerified || !trackRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const trackRect = trackRef.current.getBoundingClientRect();
      const maxDrag = trackRect.width - 44; // handle width
      let currentDrag = clientX - trackRect.left - 22;

      if (currentDrag < 0) currentDrag = 0;
      if (currentDrag > maxDrag) currentDrag = maxDrag;

      setSliderPosition(currentDrag);

      // Threshold to verify: 92% of track
      if (currentDrag >= maxDrag * 0.92) {
        setIsDragging(false);
        setIsVerified(true);
        setSliderPosition(maxDrag);
        if (onSuccess) onSuccess();
      }
    };

    const handleEnd = () => {
      if (!isDragging || isVerified) return;
      setIsDragging(false);
      // If not completed, spring back to start
      setSliderPosition(0);
      if (onReset) onReset();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isVerified, onSuccess, onReset]);

  const resetCaptcha = () => {
    setIsVerified(false);
    setSliderPosition(0);
    setIsDragging(false);
  };

  return (
    <div className="shopee-security-slider-wrapper" style={{ margin: '14px 0' }}>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: '44px',
          background: isVerified ? '#ecfdf5' : '#f1f5f9',
          border: isVerified ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${sliderPosition + 44}px`,
            background: isVerified
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.4))'
              : 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.25))',
            transition: isDragging ? 'none' : 'width 0.25s ease',
          }}
        />

        {/* Prompt Label */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '12px',
            fontWeight: 600,
            color: isVerified ? '#059669' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          {isVerified ? (
            <>
              <span>✓</span>
              <span>Xác minh bảo mật thành công</span>
            </>
          ) : (
            <>
              <span>🛡️</span>
              <span>Kéo thanh trượt sang phải để xác thực</span>
            </>
          )}
        </span>

        {/* Draggable Handle */}
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          style={{
            position: 'absolute',
            left: `${sliderPosition}px`,
            top: '2px',
            width: '40px',
            height: '38px',
            background: isVerified
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: isVerified ? 'default' : 'grab',
            transition: isDragging ? 'none' : 'left 0.25s ease, background 0.2s ease',
            zIndex: 2,
          }}
        >
          {isVerified ? '✓' : '➔'}
        </div>
      </div>
    </div>
  );
}
