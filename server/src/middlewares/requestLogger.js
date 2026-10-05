/**
 * Request Logger Middleware — Ghi log chuẩn hóa cho mọi request
 * Sử dụng structured logger thay vì console.log thô
 * Tích hợp: requestId, userId, responseTime, status-based log level
 */

import logger from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  req.startTime = Date.now();

  // Hook vào response finish event để log
  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - req.startTime;
    const userId = req.user ? (req.user._id || req.user.id || "unknown") : "anonymous";

    // Log via structured logger
    logger.http(req, res, responseTime);

    originalEnd.apply(this, args);
  };

  next();
};

export default requestLogger;
