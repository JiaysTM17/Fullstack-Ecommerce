import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.js";
import requestLogger from "./middlewares/requestLogger.js";

dotenv.config();

// Connect to database (gracefully falls back to in-memory store if MongoDB is offline)
connectDB();

const app = express();

// Security: limit JSON body size to 500kb (increased for product images arrays)
app.use(express.json({ limit: "500kb" }));

// CORS: support comma-separated origins in CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Request Logger — ghi log chuẩn hóa mọi request
app.use(requestLogger);

// Rate Limiter — giới hạn request trên toàn API
app.use("/api", apiLimiter);

// Health check with system info
app.get("/", (req, res) => {
  res.json({
    message: "Mini Shopee Enterprise Multi-Vendor Marketplace API is running",
    version: "3.0.0",
    stack: {
      runtime: "Node.js " + process.version,
      framework: "Express.js",
      database: "MongoDB (fallback: In-Memory Store with JSON persistence)",
      auth: "JWT + bcryptjs",
      security: "Rate Limiter + Request Logger + Input Validator",
    },
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
      cart: "/api/cart",
      vouchers: "/api/vouchers",
      reviews: "/api/reviews",
      shops: "/api/shops",
      seller: "/api/seller",
      admin: "/api/admin",
      wishlist: "/api/wishlist",
      notifications: "/api/notifications",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (11 route groups)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
