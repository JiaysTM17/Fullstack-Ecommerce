import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Footer, Header, ToastContainer } from "./components";
import LiveChatWidget from "./components/LiveChatWidget";
import ProductCompareModal from "./components/ProductCompareModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CompareProvider } from "./context/CompareContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import { CoinProvider } from "./context/CoinContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import ShopStorefrontPage from "./pages/ShopStorefrontPage";
import WishlistPage from "./pages/WishlistPage";

function AppLayout() {
  const { totalQuantity } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (location.pathname === "/") {
      setSearchTerm(searchParams.get("keyword") || "");
    }
  }, [location.pathname, searchParams]);

  function handleSearchSubmit(keyword) {
    const nextParams = new URLSearchParams(searchParams);

    if (keyword) {
      nextParams.set("keyword", keyword);
    } else {
      nextParams.delete("keyword");
    }

    navigate(`/?${nextParams.toString()}`);
  }

  return (
    <>
      <Header
        cartCount={totalQuantity}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        onCartClick={() => navigate("/cart")}
        onLogoClick={() => navigate("/")}
        user={user}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
        onNavigate={(path) => navigate(path)}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/shop/:shopId" element={<ShopStorefrontPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <LiveChatWidget />
      <ProductCompareModal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <WishlistProvider>
                <CompareProvider>
                  <CoinProvider>
                    <CartProvider>
                      <AppLayout />
                    </CartProvider>
                  </CoinProvider>
                </CompareProvider>
              </WishlistProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
