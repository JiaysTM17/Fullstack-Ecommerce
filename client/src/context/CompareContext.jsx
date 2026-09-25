import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useLanguage } from './LanguageContext';

const CompareContext = createContext();

const COMPARE_STORAGE_KEY = 'mini_shopee_compared_products';

export function CompareProvider({ children }) {
  const [comparedProducts, setComparedProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(comparedProducts));
    } catch {
      // ignore
    }
  }, [comparedProducts]);

  const addToCompare = (product) => {
    const id = product._id || product.id;
    if (comparedProducts.some((p) => (p._id || p.id) === id)) {
      showToast(t('compare_already_added', 'Sản phẩm đã có trong danh sách so sánh!'), 'info');
      setIsModalOpen(true);
      return;
    }

    if (comparedProducts.length >= 3) {
      showToast(t('compare_max_reached', 'Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!'), 'warning');
      setIsModalOpen(true);
      return;
    }

    setComparedProducts((prev) => [...prev, product]);
    showToast(t('compare_added_toast', `Đã thêm "${product.name.slice(0, 28)}..." vào danh sách so sánh!`), 'success');
  };

  const removeFromCompare = (productId) => {
    setComparedProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
  };

  const clearCompare = () => {
    setComparedProducts([]);
  };

  const isCompared = (productId) => {
    return comparedProducts.some((p) => (p._id || p.id) === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isCompared,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
