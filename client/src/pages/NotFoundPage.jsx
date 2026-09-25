import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="shopee-container shopee-empty-state">
      <h1>Khong tim thay trang</h1>
      <p>Duong dan nay khong ton tai hoac da bi thay doi.</p>
      <Link className="shopee-btn shopee-btn-primary" to="/">
        Ve trang chu
      </Link>
    </main>
  );
}
