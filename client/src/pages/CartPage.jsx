import { Link, useNavigate } from "react-router-dom";
import { CartItem, EmptyState } from "../components";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    totalQuantity,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    removeFromCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <main className="shopee-container">
        <EmptyState
          title="Gio hang dang trong"
          description="Hay them san pham de bat dau dat hang."
          actionText="Tiep tuc mua sam"
          onAction={() => navigate("/")}
        />
      </main>
    );
  }

  return (
    <main className="shopee-container shopee-cart-page">
      <section>
        <h1>Gio hang</h1>
        {items.map((item) => (
          <CartItem
            key={item.productId}
            item={item}
            onIncrease={(cartItem) => increaseQuantity(cartItem.productId)}
            onDecrease={(cartItem) => decreaseQuantity(cartItem.productId)}
            onQuantityChange={(cartItem, quantity) => setQuantity(cartItem.productId, quantity)}
            onRemove={(cartItem) => removeFromCart(cartItem.productId)}
            onItemClick={(cartItem) => navigate(`/products/${cartItem.productId}`)}
            formatCurrency={formatCurrency}
          />
        ))}
      </section>

      <aside className="shopee-cart-summary">
        <h2>Tong don hang</h2>
        <p>So san pham: {totalQuantity}</p>
        <p>Tam tinh: {formatCurrency(subtotal)}</p>
        <Link className="shopee-btn shopee-btn-primary" to="/checkout">
          Thanh toan
        </Link>
      </aside>
    </main>
  );
}
