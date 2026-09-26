import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security: limit JSON body size to 100kb
app.use(express.json({ limit: "100kb" }));

// CORS: support comma-separated origins in CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Fullstack E-Commerce API is running" });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
