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
