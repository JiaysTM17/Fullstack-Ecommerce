# Integration Agent Notes

## Branches Integrated
- Base: `agent/claude-backend`
- Client logic: `agent/codex-client-logic`
- UI components: `agent/antigravity-ui` (merge pending in this integration flow)

## Client Notes
- `client/src/App.jsx` owns `BrowserRouter`, `CartProvider`, and route definitions.
- If a future `client/src/main.jsx` wraps the app with `BrowserRouter`, remove the wrapper from `App.jsx` to avoid nested routers.
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

## Integration Todo
- Merge UI components/styles from `agent/antigravity-ui`.
- Import `client/src/styles/index.css` into the client entry.
- Create missing client project files (`package.json`, `index.html`, `src/main.jsx`) if they are not supplied by another branch.
- Wire page logic to UI components where practical.
- Verify client build and server startup.
- Seed data and test end-to-end once MongoDB is available.

## Git Safety
- Integration branch: `integration/final-merge`.
- Do not push to `main` or `master`.
- If remote push is rejected because of non-fast-forward/conflict, do not force push. Record the error and stop for manual coordination.
