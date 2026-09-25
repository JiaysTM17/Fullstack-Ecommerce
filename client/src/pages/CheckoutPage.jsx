import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { formatCurrency } from "../utils/formatCurrency";
import { hasValidationErrors, validateCheckoutForm } from "../utils/validators";

const SHIPPING_FEE = 30000;

const initialFormValues = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  note: "",
  paymentMethod: "COD",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => subtotal + SHIPPING_FEE, [subtotal]);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateCheckoutForm(formValues);
    setErrors(nextErrors);
    setSubmitError("");

    if (hasValidationErrors(nextErrors)) {
      return;
    }

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
      <form className="shopee-checkout-form-card" onSubmit={handleSubmit}>
        <div className="shopee-checkout-header">
          <h1>Thong tin giao hang</h1>
        </div>

        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="fullName">
            Ho ten <span className="shopee-form-label-required">*</span>
          </label>
          <input
            className={`shopee-form-input ${errors.fullName ? "has-error" : ""}`}
            id="fullName"
            name="fullName"
            value={formValues.fullName}
            onChange={updateField}
          />
          {errors.fullName ? <span className="shopee-form-error-msg">{errors.fullName}</span> : null}
        </div>

        <div className="shopee-form-row">
          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="phone">
              So dien thoai <span className="shopee-form-label-required">*</span>
            </label>
            <input
              className={`shopee-form-input ${errors.phone ? "has-error" : ""}`}
              id="phone"
              name="phone"
              value={formValues.phone}
              onChange={updateField}
            />
            {errors.phone ? <span className="shopee-form-error-msg">{errors.phone}</span> : null}
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">
              Email <span className="shopee-form-label-required">*</span>
            </label>
            <input
              className={`shopee-form-input ${errors.email ? "has-error" : ""}`}
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={updateField}
            />
            {errors.email ? <span className="shopee-form-error-msg">{errors.email}</span> : null}
          </div>
        </div>

        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="address">
            Dia chi <span className="shopee-form-label-required">*</span>
          </label>
          <input
            className={`shopee-form-input ${errors.address ? "has-error" : ""}`}
            id="address"
            name="address"
            value={formValues.address}
            onChange={updateField}
          />
          {errors.address ? <span className="shopee-form-error-msg">{errors.address}</span> : null}
        </div>

        <div className="shopee-form-group">
          <label className="shopee-form-label" htmlFor="note">
            Ghi chu
          </label>
          <textarea
            className="shopee-form-textarea"
            id="note"
            name="note"
            value={formValues.note}
            onChange={updateField}
          />
        </div>

        <div className="shopee-payment-methods">
          <p className="shopee-payment-title">Phuong thuc thanh toan</p>
          <label className="shopee-payment-option active">
            <input
              checked={formValues.paymentMethod === "COD"}
              name="paymentMethod"
              type="radio"
              value="COD"
              onChange={updateField}
            />
            Thanh toan khi nhan hang
          </label>
        </div>

        {submitError ? <p className="shopee-form-error-msg">{submitError}</p> : null}

        <button className="shopee-checkout-submit-btn shopee-btn shopee-btn-primary" disabled={submitting} type="submit">
          {submitting ? "Dang dat hang..." : "Xac nhan dat hang"}
        </button>
      </form>

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
