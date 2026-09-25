# Codex Client Logic Progress

## Cap nhat: 2026-09-25 10:08:27 +07:00

### Page da hoan thanh
- HomePage: goi `GET /api/products`, co loading/error/empty state, render product card fallback trong page, them san pham vao gio.
- ProductDetailPage: doc `id` tu route, goi `GET /api/products/:id`, chon quantity, them vao gio, mua ngay sang checkout.
- CartPage: hien thi gio hang, tang/giam/xoa san pham, tinh tam tinh, chan giam quantity duoi 1.
- CheckoutPage: chan checkout khi gio rong, validate form, gui `POST /api/orders`, clear cart va sang trang thanh cong.
- OrderSuccessPage: hien thi thong bao thanh cong va orderId neu backend tra ve.
- NotFoundPage: fallback route khong ton tai.

### Cart logic da hoan thanh
- `addToCart(product, quantity = 1)`
- `removeFromCart(productId)`
- `increaseQuantity(productId)`
- `decreaseQuantity(productId)`
- `clearCart()`
- `getCartCount()`
- `getCartSubtotal()`
- Luu gio hang vao `localStorage` bang key `mini_shopee_cart`.
- Load lai gio hang tu `localStorage` khi app khoi dong.
- Them cung san pham se tang quantity, khong tao dong trung.
- Quantity khong nho hon 1 va khong vuot stock neu co stock.

### Service API da hoan thanh
- `client/src/services/api.js`: fetch wrapper, base URL tu `VITE_API_URL`, fallback `http://localhost:5000`.
- `client/src/services/productService.js`: `getProducts`, `getProductById`.
- `client/src/services/orderService.js`: `createOrder`.

### File da tao/sua
- `client/src/App.jsx`
- `client/src/context/CartContext.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/ProductDetailPage.jsx`
- `client/src/pages/CartPage.jsx`
- `client/src/pages/CheckoutPage.jsx`
- `client/src/pages/OrderSuccessPage.jsx`
- `client/src/pages/NotFoundPage.jsx`
- `client/src/services/api.js`
- `client/src/services/productService.js`
- `client/src/services/orderService.js`
- `client/src/utils/formatCurrency.js`
- `client/src/utils/validators.js`
- `docs/progress/codex-progress.md`
- `AGENT_NOTES.md`

### Route da them
- `/`
- `/products/:id`
- `/cart`
- `/checkout`
- `/order-success`
- `*`

### API can dong bo voi backend
- `GET /api/products` nen tra `{ success, data, pagination }` hoac array san pham.
- `GET /api/products/:id` nen tra `{ success, data }`.
- `POST /api/orders` nen nhan `customer`, `items`, `subtotal`, `shippingFee`, `total`, `paymentMethod`.
- `POST /api/orders` nen tra `data.orderId` hoac `_id/id` de hien thi tren OrderSuccessPage.

### Van de dang gap
- Repo hien tai chua co commit nen khong co nen `client/package.json` va `client/src/main.jsx` de chay truc tiep.
- `react-router-dom` can co trong dependencies cua client.
- Cac file CSS trong `client/src/styles` dang nam ngoai pham vi Codex, khong duoc them vao commit nay neu la cua agent UI.

### Viec can Integration Agent xu ly
- Dam bao `client/src/main.jsx` render `<App />`.
- Dam bao `react`, `react-dom`, `react-router-dom` co trong `client/package.json`.
- Quyet dinh co import cac file CSS cua UI agent vao entrypoint hay khong.
- Dong bo response backend dung contract phia tren.
