import { Link, useLocation } from "react-router-dom";
import { formatCurrency } from "../utils/formatCurrency";

export default function OrderSuccessPage() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const total = location.state?.total;

  return (
    <main className="shopee-container shopee-empty-state">
      <h1>Dat hang thanh cong</h1>
      <p>Cam on ban da mua hang tai Mini Shopee.</p>
      {orderId ? <p>Ma don hang: {orderId}</p> : null}
      {total ? <p>Tong thanh toan: {formatCurrency(total)}</p> : null}
      <Link className="shopee-btn shopee-btn-primary" to="/">
        Tiep tuc mua sam
      </Link>
    </main>
  );
}
