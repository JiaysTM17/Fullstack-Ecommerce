import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthModalContext = createContext(null);

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [initialRole, setInitialRole] = useState('customer'); // 'customer' | 'seller' | 'admin'
  const navigate = useNavigate();

  const openAuthModal = useCallback((tab = 'login', role = 'customer') => {
    setAuthTab(tab);
    setInitialRole(role);
    // Ensure all auth requests navigate directly to the dedicated full-page auth experience
    if (tab === 'register') {
      navigate('/register');
    } else {
      navigate('/login');
    }
  }, [navigate]);

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
