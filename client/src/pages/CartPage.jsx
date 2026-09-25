import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";

export default function CartPage() {
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
      <main className="shopee-container shopee-empty-state">
        <h1>Gio hang dang trong</h1>
        <p>Hay them san pham de bat dau dat hang.</p>
        <Link className="shopee-btn shopee-btn-primary" to="/">
          Tiep tuc mua sam
        </Link>
      </main>
    );
  }

  return (
    <main className="shopee-container shopee-cart-page">
      <section>
        <h1>Gio hang</h1>
        {items.map((item) => (
          <article className="shopee-cart-item" key={item.productId}>
            <Link className="shopee-cart-item-product" to={`/products/${item.productId}`}>
              <span className="shopee-cart-item-image-wrapper">
                {item.image ? (
                  <img className="shopee-cart-item-image" src={item.image} alt={item.name} />
                ) : null}
              </span>
              <span className="shopee-cart-item-info">
                <strong className="shopee-cart-item-name">{item.name}</strong>
                <span className="shopee-cart-item-stock-tag">
                  Ton kho: {item.stock || "Dang cap nhat"}
                </span>
              </span>
            </Link>

            <span className="shopee-cart-item-price">{formatCurrency(item.price)}</span>

            <div className="shopee-cart-item-quantity">
              <div className="shopee-qty-control shopee-qty-md">
                <button
                  className="shopee-qty-btn"
                  disabled={item.quantity <= 1}
                  type="button"
                  onClick={() => decreaseQuantity(item.productId)}
                >
                  -
                </button>
                <input
                  className="shopee-qty-input"
                  min="1"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => setQuantity(item.productId, event.target.value)}
                />
                <button
                  className="shopee-qty-btn"
                  disabled={item.stock > 0 && item.quantity >= item.stock}
                  type="button"
                  onClick={() => increaseQuantity(item.productId)}
                >
                  +
                </button>
              </div>
            </div>

            <strong className="shopee-cart-item-subtotal">
              {formatCurrency(item.price * item.quantity)}
            </strong>

            <button
              className="shopee-cart-item-remove-btn"
              type="button"
              onClick={() => removeFromCart(item.productId)}
            >
              Xoa
            </button>
          </article>
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
