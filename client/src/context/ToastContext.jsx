import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', action = null) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast = { id, message, type, action };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts

    setTimeout(() => {
      removeToast(id);
    }, 3500);

    return id;
  }, [removeToast]);

  const value = {
    toasts,
    showToast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng trong ToastProvider');
  }
  return context;
}
