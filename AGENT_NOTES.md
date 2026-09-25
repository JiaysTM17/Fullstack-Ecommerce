# Codex Agent Notes

## Scope
- Codex implemented front-end logic, cart state, routing, service API wrappers, checkout validation, and progress tracking.
- No server files were edited.
- No README or other agent progress files were edited.
- UI styles/components were not edited. Existing `client/src/styles` files appear to belong to UI work and were left untouched.

## Dependencies needed
- `react`
- `react-dom`
- `react-router-dom`

Suggested install command for the client once `client/package.json` is owned by Integration Agent:

```bash
npm install react react-dom react-router-dom
```

## Integration notes
- `client/src/App.jsx` includes `BrowserRouter`, `CartProvider`, and route definitions.
- If Integration Agent wraps the app with `BrowserRouter` in `main.jsx`, remove the wrapper from `App.jsx` to avoid nested routers.
- API base URL uses `import.meta.env.VITE_API_URL` with fallback `http://localhost:5000`.
- Cart persists to `localStorage` key `mini_shopee_cart`.

## Backend contract
- `GET /api/products` should return either an array or `{ success: true, data: [...], pagination }`.
- `GET /api/products/:id` should return `{ success: true, data: product }`.
- `POST /api/orders` should accept order payload and return `{ success: true, data: { orderId, total, status } }`.

## Git safety
- Work branch: `agent/codex-client-logic`.
- If push fails because remote changed, branch is behind, non-fast-forward, or conflict occurs, do not merge/rebase automatically. Record the error here and in `docs/progress/codex-progress.md`, then stop for Integration Agent.

---

# Claude Backend Notes

**Branch:** `agent/claude-backend` | **Phạm vi:** `server/`, `docs/progress/claude-progress.md`, `AGENT_NOTES.md`

## Yêu cầu với Front-end / Integration Agent

1. **Biến môi trường client:** đặt `VITE_API_URL=http://localhost:5000` trong `client/.env`.

2. **Response shape của `GET /api/products`** (quan trọng, khác default):
   ```json
   { "success": true, "data": { "products": [...], "pagination": {...} } }
   ```
   → Client đọc `res.data.data.products` và `res.data.data.pagination`.

3. **Response shape của `GET /api/products/:id`:** `{ "success": true, "data": product }`

4. **Response shape của `POST /api/orders`:** 201 `{ "success": true, "data": { "orderId, total, status, message } }`
   - Lỗi 400: `{ "success": false, "message": "..." }`
   - Sau thành công, client nên điều hướng sang trang success kèm `orderId`.

5. **Validate phía client nên khớp backend:**
   - email regex
   - phone 9–11 chữ số (backend bỏ qua space)
   - `items` không được rỗng
   - customer: fullName, phone, email, address là bắt buộc

6. **Server CORS** chỉ cho phép `CLIENT_URL` (mặc định `http://localhost:5173`). Nếu client chạy port khác, sửa `server/.env`.

7. **Seed data:** chạy `cd server && npm run seed` để nạp 16 sản phẩm mẫu. Ảnh dùng Unsplash URL (cần internet).

## Git
- Không push lên `main`/`master`.
- Nếu push `agent/claude-backend` bị conflict remote → **không tự merge**, ghi lỗi vào đây và dừng an toàn cho Integration Agent.

## Trạng thái
- Xem `docs/progress/claude-progress.md` để biết API contract chi tiết và tiến độ.

---

# AGENT_NOTES — Antigravity UI Components

**Branch:** `agent/antigravity-ui` | **Phạm vi:** `client/src/components/`, `client/src/styles/`, `docs/progress/antigravity-progress.md`, `AGENT_NOTES.md`

## 1. UI Components đã hoàn thành (9/9)
- `Header.jsx`: Thanh header Shopee, search bar, logo, cart button với badge số lượng động.
- `Footer.jsx`: Chân trang thương mại điện tử chuẩn Shopee (CSKH, giới thiệu, thanh toán, vận chuyển).
- `ProductCard.jsx`: Card sản phẩm (ảnh 1:1 fallback, giá VND, giá gốc gạch ngang, badge giảm giá %, rating, đã bán, nút thêm giỏ).
- `ProductGrid.jsx`: Lưới responsive (2-5 cột), tích hợp tự động skeleton loading & empty state.
- `QuantityControl.jsx`: Tăng giảm số lượng có chặn biên min-max, input number, 3 kích cỡ `sm`, `md`, `lg`.
- `CartItem.jsx`: Dòng sản phẩm trong giỏ (ảnh thumbnail, tên, đơn giá, số lượng, thành tiền, nút xóa).
- `CheckoutForm.jsx`: Form thông tin khách hàng đầy đủ, validate SĐT/Email/Họ tên/Địa chỉ, chọn COD/Bank/Momo, loading spinner.
- `Loading.jsx`: Reusable loading hỗ trợ `spinner`, `skeleton-grid`, `skeleton-card`, `fullScreen`.
- `EmptyState.jsx`: Trạng thái rỗng với hình minh họa vector, tiêu đề, mô tả và nút hành động.
- `index.js`: Barrel export tập trung.

## 2. Stylesheet
- Toàn bộ styles nằm tại `client/src/styles/index.css` (bao gồm `theme.css`, `header.css`, `footer.css`, `product.css`, `cart.css`, `checkout.css`, `feedback.css`).
- Dùng CSS thuần + CSS variables màu Shopee (`#ee4d2d`), **không thêm dependencies ngoại vi**, tránh gây xung đột `package.json`.

## 3. Hướng dẫn tích hợp cho Integration Agent / Client Logic Agent
1. **Nhúng CSS toàn cục:**
   Trong `client/src/main.jsx` hoặc `client/src/App.jsx`:
   ```javascript
   import './styles/index.css';
   ```
2. **Import components:**
   ```javascript
   import {
     Header,
     Footer,
     ProductCard,
     ProductGrid,
     CartItem,
     QuantityControl,
     CheckoutForm,
     Loading,
     EmptyState
   } from './components';
   ```
3. **Props & Callback:**
   - Chi tiết props của từng component được ghi cụ thể trong `docs/progress/antigravity-progress.md`.
   - Tất cả components nhận data và callback qua props, không hard-code business logic.
