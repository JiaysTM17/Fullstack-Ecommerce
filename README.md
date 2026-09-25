# Mini Shopee - Full-stack Ecommerce

Mini Shopee is a small full-stack ecommerce project built with React, Node.js, Express, and MongoDB. It supports browsing products, viewing product details, managing a localStorage cart, and submitting checkout orders through a REST API.

## Tech Stack

- Front-end: React, Vite, React Router DOM, CSS
- Back-end: Node.js, Express, Mongoose
- Database: MongoDB
- Client state: React Context API
- Client storage: localStorage

## Project Structure

```txt
client/
  src/
    components/
    context/
    pages/
    services/
    styles/
    utils/
server/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    seed/
    utils/
docs/progress/
```

## Environment Setup

Create `server/.env` from `server/.env.example`:

```txt
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `client/.env` from `client/.env.example`:

```txt
VITE_API_URL=http://localhost:5000
```

## Install

```bash
cd server
npm install

cd ../client
pnpm install
```

## Seed Products

MongoDB must be running before seeding.

```bash
cd server
npm run seed
```

## Run

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
pnpm run dev
```

Open the client at `http://localhost:5173`.

## API Endpoints

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`

`GET /api/products` response:

```json
{
  "success": true,
  "data": {
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 0,
      "totalPages": 1
    }
  }
}
```

`POST /api/orders` request:

```json
{
  "customer": {
    "fullName": "Nguyen Van A",
    "phone": "0909123456",
    "email": "a@example.com",
    "address": "123 Nguyen Trai, TP.HCM",
    "note": ""
  },
  "items": [
    {
      "productId": "product_id",
      "name": "Ao thun nam basic",
      "price": 199000,
      "image": "https://example.com/image.jpg",
      "quantity": 2
    }
  ],
  "shippingFee": 30000,
  "paymentMethod": "COD"
}
```

The server recalculates `subtotal` and `total` from submitted items.

## Main Features

- Product listing with search and sort query params
- Product detail page
- Cart Context with add/remove/increase/decrease/direct quantity change
- Cart persistence in localStorage
- Checkout form validation
- Order creation through Express API
- Responsive ecommerce UI components

## Notes

- The app requires MongoDB local or MongoDB Atlas.
- Seed product images use remote Unsplash URLs.
- If client and server use different ports, update `VITE_API_URL` and `CLIENT_URL`.
