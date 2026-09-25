import React, { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../utils/translations';

const LanguageContext = createContext(null);
const LANG_STORAGE_KEY = 'mini_shopee_lang';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'en' ? 'en' : 'vi';
    } catch {
      return 'vi';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
      document.documentElement.setAttribute('lang', language);
    } catch (e) {
      console.error('Lỗi lưu ngôn ngữ:', e);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  const setLanguage = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguageState(lang);
    }
  };

  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.vi;
    return dict[key] !== undefined ? dict[key] : (fallback || key);
  };

  const value = {
    language,
    isVietnamese: language === 'vi',
    isEnglish: language === 'en',
    toggleLanguage,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage phải được sử dụng trong LanguageProvider');
  }
  return context;
}
