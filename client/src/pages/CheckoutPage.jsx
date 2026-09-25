import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckoutForm } from "../components";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { formatCurrency } from "../utils/formatCurrency";

const SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => subtotal + SHIPPING_FEE, [subtotal]);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  async function handleSubmit(formValues) {
    setSubmitError("");

    const orderPayload = {
      customer: {
        fullName: formValues.fullName.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        address: formValues.address.trim(),
        note: formValues.note.trim(),
      },
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
      })),
      subtotal,
      shippingFee: SHIPPING_FEE,
      total,
      paymentMethod: formValues.paymentMethod,
    };

    try {
      setSubmitting(true);
      const order = await createOrder(orderPayload);
      clearCart();
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: order?.orderId || order?._id || order?.id,
          total: order?.total || total,
        },
      });
    } catch (err) {
      setSubmitError(err.message || "Khong the tao don hang");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shopee-container shopee-checkout-page">
      <section>
        <CheckoutForm
          loading={submitting}
          onSubmit={handleSubmit}
          submitButtonText="Xac nhan dat hang"
        />
        {submitError ? <p className="shopee-form-error-msg">{submitError}</p> : null}
      </section>

      <aside className="shopee-cart-summary">
        <h2>Tom tat don hang</h2>
        {items.map((item) => (
          <p key={item.productId}>
            {item.name} x {item.quantity}: {formatCurrency(item.price * item.quantity)}
          </p>
        ))}
        <p>Tam tinh: {formatCurrency(subtotal)}</p>
        <p>Phi giao hang: {formatCurrency(SHIPPING_FEE)}</p>
        <strong>Tong cong: {formatCurrency(total)}</strong>
        <Link className="shopee-btn shopee-btn-secondary" to="/cart">
          Sua gio hang
        </Link>
      </aside>
    </main>
  );
}
