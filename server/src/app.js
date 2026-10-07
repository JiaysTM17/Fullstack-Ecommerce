import express from "express";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import crypto from "node:crypto";
import connectDB from "./config/db.js";
import { applySecurityMiddleware, REQUEST_SIZE_LIMITS } from "./middlewares/security.js";
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
import logger from "./utils/logger.js";
import { validateEnv } from "./utils/envValidator.js";

dotenv.config();

// Validate environment variables at startup
validateEnv();

// Connect to database (gracefully falls back to in-memory store if MongoDB is offline)
connectDB();

const app = express();

// ============================================================
// SECURITY MIDDLEWARE STACK (Batch 1 Upgrade)
// ============================================================

// 1. Security headers (Helmet), NoSQL injection, HPP, XSS sanitization
applySecurityMiddleware(app);

// 2. Response compression (gzip/deflate)
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

// 3. Body parsers with size limits
app.use(express.json({ limit: REQUEST_SIZE_LIMITS.json }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_SIZE_LIMITS.urlencoded }));

// 4. CORS: support comma-separated origins in CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID", "X-Response-Time", "X-RateLimit-Remaining"],
    maxAge: 600, // Cache preflight for 10 minutes
  })
);

// ============================================================
// OBSERVABILITY MIDDLEWARE (Batch 2 Upgrade)
// ============================================================

// 5. Request ID — unique identifier per request
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

// 6. Response time tracking
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  const originalEnd = res.end;
  res.end = function (...args) {
    if (!res.headersSent) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      res.setHeader("X-Response-Time", `${duration.toFixed(2)}ms`);
    }
    return originalEnd.apply(this, args);
  };
  next();
});

// 7. HTTP logging (Morgan in dev, custom structured in prod)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 8. Request Logger — ghi log chuẩn hóa mọi request
app.use(requestLogger);

// 9. Rate Limiter — giới hạn request trên toàn API
app.use("/api", apiLimiter);

// ============================================================
// HEALTH CHECK & SYSTEM INFO
// ============================================================

app.get("/", (req, res) => {
  res.json({
    message: "Mini Shopee Enterprise Multi-Vendor Marketplace API is running",
    version: "4.0.0",
    stack: {
      runtime: "Node.js " + process.version,
      framework: "Express.js",
      database: "MongoDB (fallback: In-Memory Store with JSON persistence)",
      auth: "JWT + bcryptjs",
      security: [
        "Helmet HTTP Headers",
        "NoSQL Injection Protection",
        "XSS Sanitization",
        "HPP Protection",
        "Rate Limiter",
        "CORS Hardened",
        "Response Compression",
        "Request ID Tracking",
      ],
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
  const memUsage = process.memoryUsage();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    },
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

// ============================================================
// MOUNT ROUTES (11 route groups)
// ============================================================
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

// ============================================================
// ERROR HANDLING (must be last)
// ============================================================
app.use(notFound);
app.use(errorHandler);

export default app;
