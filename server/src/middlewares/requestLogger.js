/**
 * Request Logger Middleware — Ghi log chuẩn hóa cho mọi request
 * Bao gồm requestId UUID, method, path, statusCode, responseTime, userId
 */

import crypto from "node:crypto";

export const requestLogger = (req, res, next) => {
  // Gắn requestId UUID duy nhất cho mỗi request
  req.requestId = crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.startTime = Date.now();

  // Gắn requestId vào response header
  res.setHeader("X-Request-Id", req.requestId);

  // Hook vào response finish event để log
  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - req.startTime;
    const userId = req.user ? (req.user._id || req.user.id || "unknown") : "anonymous";

    const logEntry = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId,
      ip: req.ip || req.connection?.remoteAddress,
      timestamp: new Date().toISOString(),
    };

    // Log format: [REQUEST_ID] METHOD /path STATUS TIME userId
    const logLine = `[${logEntry.requestId.slice(0, 8)}] ${logEntry.method} ${logEntry.path} ${logEntry.statusCode} ${logEntry.responseTime} user:${userId}`;

    if (res.statusCode >= 500) {
      console.error(`❌ ${logLine}`);
    } else if (res.statusCode >= 400) {
      console.warn(`⚠️  ${logLine}`);
    } else if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${logLine}`);
    }

    originalEnd.apply(this, args);
  };

  next();
};

export default requestLogger;
