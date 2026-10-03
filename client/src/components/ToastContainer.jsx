import React from 'react';
import { useToast } from '../context/ToastContext';
import { CloseIcon, CheckIcon, AlertCircleIcon } from './OrdersIcons';

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

        const bgGradient = isSuccess
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : isError
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        const iconShadow = isSuccess
          ? '0 2px 8px rgba(16, 185, 129, 0.4)'
          : isError
          ? '0 2px 8px rgba(239, 68, 68, 0.4)'
          : '0 2px 8px rgba(59, 130, 246, 0.4)';
        const iconElement = isSuccess ? (
          <CheckIcon size={12} color="#ffffff" />
        ) : isError ? (
          <CloseIcon size={11} color="#ffffff" />
        ) : (
          <AlertCircleIcon size={13} color="#ffffff" />
        );

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              border: `1px solid var(--border-color, #e2e8f0)`,
              borderLeft: `5px solid ${borderColor}`,
              borderRadius: '10px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
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
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: bgGradient,
                  boxShadow: iconShadow,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {iconElement}
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
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Đóng thông báo"
              >
                <CloseIcon size={14} color="#94a3b8" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
