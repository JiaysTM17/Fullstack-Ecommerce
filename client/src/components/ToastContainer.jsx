import React from 'react';
import { useToast } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        const borderColor = isSuccess ? '#10b981' : isError ? '#ef4444' : '#3b82f6';
        const icon = isSuccess ? '✓' : isError ? '✕' : 'ℹ';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              border: `1px solid var(--border-color, #e2e8f0)`,
              borderLeft: `5px solid ${borderColor}`,
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              animation: 'slide-in-right 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: borderColor,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ fontWeight: 500, lineHeight: 1.4 }}>{toast.message}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action.onClick();
                    removeToast(toast.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ea580c',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
