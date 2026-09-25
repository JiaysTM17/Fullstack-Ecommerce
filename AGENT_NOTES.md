# Integration Agent Notes

## Branches Integrated
- Base/backend: `agent/claude-backend`
- Client logic/cart: `agent/codex-client-logic`
- UI components/styles: `agent/antigravity-ui`
- Final branch: `integration/final-merge`

## Client Notes
- `client/src/App.jsx` owns `BrowserRouter`, `CartProvider`, route definitions, and the app layout.
- `client/src/main.jsx` renders `<App />` and imports global CSS.
- API base URL uses `import.meta.env.VITE_API_URL` with fallback `http://localhost:5000`.
- Cart persists to `localStorage` key `cart`.
- Cart still reads previous `mini_shopee_cart` data once for migration, then removes it after saving.
- Cart context exposes `addToCart`, `removeFromCart`, `increaseQuantity`, `decreaseQuantity`, `setQuantity`, `clearCart`, `getCartCount`, and `getCartSubtotal`.

## UI Components
- Components live in `client/src/components/` and are exported from `client/src/components/index.js`.
- Available components: `Header`, `Footer`, `ProductCard`, `ProductGrid`, `CartItem`, `QuantityControl`, `CheckoutForm`, `Loading`, and `EmptyState`.
- Global styles live in `client/src/styles/index.css`.
- Components receive data and callbacks through props; business logic stays in pages/context/services.

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

## Verify Notes
- Server can start only after dependencies are installed and MongoDB settings are valid.
- End-to-end data flow requires seed data from `server/src/seed/productSeed.js`.
- If MongoDB is unavailable, build checks can still pass but API smoke tests that hit the database will fail.

## Git Safety
- Do not push to `main` or `master`.
- If remote push is rejected because of non-fast-forward/conflict, do not force push. Record the error and stop for manual coordination.
