import app from "./src/app.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`💥 Cổng PORT ${PORT} đang được sử dụng bởi một tiến trình khác (EADDRINUSE). Vui lòng dừng tiến trình cũ hoặc chọn cổng khác qua biến môi trường PORT.`);
    process.exit(1);
  } else {
    logger.error("💥 Lỗi khởi động HTTP server:", { error: err.message, stack: err.stack });
    process.exit(1);
  }
});

// ============================================================
// GRACEFUL SHUTDOWN — Xử lý tắt server an toàn
// ============================================================

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds max for cleanup

async function gracefulShutdown(signal) {
  logger.info(`\n📡 Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info("✅ HTTP server closed — no new connections accepted");
  });

  // Wait for ongoing requests to finish (max 10s)
  const timeout = setTimeout(() => {
    logger.warn("⚠️ Shutdown timeout exceeded. Forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Close database connections if any
    const mongoose = await import("mongoose");
    if (mongoose.default.connection.readyState === 1) {
      await mongoose.default.connection.close();
      logger.info("✅ MongoDB connection closed");
    }
  } catch {
    // Ignore — not critical
  }

  clearTimeout(timeout);
  logger.info("👋 Graceful shutdown complete. Goodbye!");
  process.exit(0);
}

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  logger.error("💥 UNCAUGHT EXCEPTION:", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("💥 UNHANDLED REJECTION:", { reason: String(reason) });
  process.exit(1);
});
