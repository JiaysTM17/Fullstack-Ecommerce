import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [initialRole, setInitialRole] = useState('customer'); // 'customer' | 'seller' | 'admin'

  const openAuthModal = useCallback((tab = 'login', role = 'customer') => {
    setAuthTab(tab);
    setInitialRole(role);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        authTab,
        setAuthTab,
        initialRole,
        setInitialRole,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    return {
      isOpen: false,
      authTab: 'login',
      setAuthTab: () => {},
      initialRole: 'customer',
      setInitialRole: () => {},
      openAuthModal: () => {},
      closeAuthModal: () => {},
    };
  }
  return context;
};

export default AuthModalContext;
