import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getProductById } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        const result = await getProductById(id);

        if (!ignore) {
          setProduct(result);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Khong the tai chi tiet san pham");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id]);

  function updateQuantity(nextQuantity) {
    const stock = Number(product?.stock) || 0;
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);
    setQuantity(stock > 0 ? Math.min(safeQuantity, stock) : safeQuantity);
  }

  function handleAddToCart() {
    addToCart(product, quantity);
  }

  function handleBuyNow() {
    addToCart(product, quantity);
    navigate("/checkout");
  }

  if (loading) {
    return <main className="shopee-container">Dang tai chi tiet san pham...</main>;
  }

  if (error || !product) {
    return (
      <main className="shopee-container shopee-empty-state">
        <h1>Khong tim thay san pham</h1>
        <p>{error || "San pham khong ton tai."}</p>
        <Link className="shopee-btn shopee-btn-primary" to="/">
          Ve trang chu
        </Link>
      </main>
    );
  }

  return (
    <main className="shopee-container shopee-product-detail">
      <section className="shopee-product-detail-media">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div aria-label="Khong co anh san pham" />
        )}
      </section>

      <section className="shopee-product-detail-info">
        <p>{product.brand || "No brand"} / {product.category || "Danh muc"}</p>
        <h1>{product.name}</h1>
        <p className="shopee-product-detail-price">{formatCurrency(product.price)}</p>
        <p>★ {product.rating || 0} · Da ban {product.sold || 0}</p>
        <p>{product.description}</p>
        <p>Ton kho: {product.stock ?? "Dang cap nhat"}</p>

        <div className="shopee-qty-control shopee-qty-md">
          <button
            className="shopee-qty-btn"
            disabled={quantity <= 1}
            type="button"
            onClick={() => updateQuantity(quantity - 1)}
          >
            -
          </button>
          <input
            className="shopee-qty-input"
            min="1"
            type="number"
            value={quantity}
            onChange={(event) => updateQuantity(event.target.value)}
          />
          <button
            className="shopee-qty-btn"
            disabled={product.stock > 0 && quantity >= product.stock}
            type="button"
            onClick={() => updateQuantity(quantity + 1)}
          >
            +
          </button>
        </div>

        <div className="shopee-card-actions">
          <button className="shopee-btn shopee-btn-outline" type="button" onClick={handleAddToCart}>
            Them vao gio
          </button>
          <button className="shopee-btn shopee-btn-primary" type="button" onClick={handleBuyNow}>
            Mua ngay
          </button>
        </div>
      </section>
    </main>
  );
}
