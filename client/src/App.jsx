import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function Header() {
  const { totalQuantity } = useCart();

  return (
    <header className="shopee-header">
      <nav className="shopee-container shopee-header-nav" aria-label="Dieu huong chinh">
        <Link className="shopee-header-logo" to="/">
          Mini Shopee
        </Link>
        <div className="shopee-header-links">
          <Link to="/">San pham</Link>
          <Link to="/cart">Gio hang ({totalQuantity})</Link>
        </div>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
