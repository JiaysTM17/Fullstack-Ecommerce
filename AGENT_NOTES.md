# Integration Agent Notes

## Branches Integrated
- Base: `agent/claude-backend` (server)
- Client logic: `agent/codex-client-logic`
- UI components: `agent/antigravity-ui` (merged 2026-09-25)

## Client Notes
- `client/src/App.jsx` owns `BrowserRouter`, `CartProvider`, and route definitions.
- `client/src/main.jsx` renders `<App />` and imports `styles/index.css`.
- API base URL uses `import.meta.env.VITE_API_URL` with fallback `http://localhost:5000`.
- Cart persists to `localStorage` key `cart`.
- Cart still reads the previous `mini_shopee_cart` key once for migration, then removes it after saving.
- Cart context exposes `addToCart`, `removeFromCart`, `increaseQuantity`, `decreaseQuantity`, `setQuantity`, `clearCart`, `getCartCount`, and `getCartSubtotal`.

## Backend Contract
- `GET /api/products` returns:
  ```json
  { "success": true, "data": { "products": [], "pagination": {} } }
  ```
- `GET /api/products/:id` returns:
  ```json
  { "success": true, "data": { "...": "product" } }
  ```
- `POST /api/orders` accepts `customer`, `items`, `shippingFee`, and `paymentMethod`. Client may send `subtotal` and `total`, but the server recalculates them from `items`.
- `POST /api/orders` returns:
  ```json
  { "success": true, "data": { "orderId": "...", "total": 0, "status": "pending", "message": "Order created successfully" } }
  ```
- Backend validates email, 9-11 digit phone numbers, non-empty items, and required item fields.
- Backend allows `paymentMethod` values `COD`, `BANK_TRANSFER`, `MOMO`, and `VNPAY`; invalid values default to `COD`.

## Environment
- Server `.env` should be copied from `server/.env.example`.
- Client `.env` should include:
  ```txt
  VITE_API_URL=http://localhost:5000
  ```
- Server `CLIENT_URL` supports comma-separated origins, for example:
  ```txt
  CLIENT_URL=http://localhost:5173,http://localhost:5174
  ```
- MongoDB must be running locally or `MONGO_URI` must point to MongoDB Atlas before seeding or testing APIs.

## Integration Completed (2026-09-25)
- ✅ Merged `agent/antigravity-ui` into `integration/final-merge`.
- ✅ Created `client/package.json`, `client/index.html`, `client/vite.config.js`, `client/src/main.jsx`, `client/.env.example`.
- ✅ Created root `README.md` and `.gitignore`.
- ✅ Imported `styles/index.css` in `client/src/main.jsx`.
- ✅ Wired `Header`, `Footer` into `App.jsx` via `AppLayout`.
- ✅ Wired `ProductGrid` into `HomePage`, `CartItem` into `CartPage`, `CheckoutForm` into `CheckoutPage`.
- ✅ Updated `CheckoutForm` phone validation to match backend: `/^[0-9]{9,11}$/`.
- ✅ Added `.shopee-filter-chip` style for keyword badge.
- ✅ Client `npm install` and `npm run build` — 61 modules, 0 errors.

## Remaining for Manual Testing
- Start MongoDB locally (or set `MONGO_URI` to Atlas).
- Run `cd server && npm run seed && npm run dev`.
- Run `cd client && npm run dev`.
- Test full flow: browse products → add to cart → checkout → order created.

## Git Safety
- Integration branch: `integration/final-merge`.
- Do not push to `main` or `master`.
- If remote push is rejected because of non-fast-forward/conflict, do not force push. Record the error and stop for manual coordination.
