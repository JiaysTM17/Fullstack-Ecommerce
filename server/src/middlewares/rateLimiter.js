/**
 * Rate Limiter Middleware — Giới hạn request theo IP
 * Chống brute force cho login/register, DDoS nhẹ cho API chung
 * Upgrade: Thêm X-RateLimit-* headers chuẩn RFC 6585
 */

import logger from "../utils/logger.js";

const rateLimitStore = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 phút

/**
 * Tạo rate limiter với windowMs và max tùy chỉnh
 * @param {number} max - Số request tối đa trong 1 window
 * @param {string} [message] - Thông báo lỗi
 */
export const createRateLimiter = (max = 100, message = "Quá nhiều yêu cầu, vui lòng thử lại sau") => {
  return (req, res, next) => {
    const key = `${req.ip}_${req.baseUrl || req.path}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, startTime: now });
      // Set rate limit headers
      res.set("X-RateLimit-Limit", String(max));
      res.set("X-RateLimit-Remaining", String(max - 1));
      res.set("X-RateLimit-Reset", String(Math.ceil((now + WINDOW_MS) / 1000)));
      return next();
    }

    const record = rateLimitStore.get(key);

    // Reset window nếu đã hết thời gian
    if (now - record.startTime > WINDOW_MS) {
      rateLimitStore.set(key, { count: 1, startTime: now });
      res.set("X-RateLimit-Limit", String(max));
      res.set("X-RateLimit-Remaining", String(max - 1));
      res.set("X-RateLimit-Reset", String(Math.ceil((now + WINDOW_MS) / 1000)));
      return next();
    }

    record.count++;
    const remaining = Math.max(0, max - record.count);
    const resetTime = Math.ceil((record.startTime + WINDOW_MS) / 1000);

    // Always set rate limit headers
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(resetTime));

    if (record.count > max) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - record.startTime)) / 1000);
      res.set("Retry-After", String(retryAfter));

      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.baseUrl || req.path}`, {
        requestId: req.requestId,
        ip: req.ip,
        count: record.count,
        max,
      });

      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

// Rate limiter mặc định cho API chung: 2000 req/15 phút (phù hợp SPA e-commerce đa request)
export const apiLimiter = createRateLimiter(2000, "Quá nhiều yêu cầu đến API, vui lòng thử lại sau 15 phút");

// Rate limiter cho auth: 1000 req/15 phút
export const authLimiter = createRateLimiter(1000, "Quá nhiều lần đăng nhập/đăng ký thất bại, vui lòng thử lại sau 15 phút");

// Dọn dẹp bộ nhớ định kỳ mỗi 30 phút
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, record] of rateLimitStore) {
    if (now - record.startTime > WINDOW_MS) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug(`Rate limiter cleanup: removed ${cleaned} expired entries`);
  }
}, 30 * 60 * 1000);

// Prevent interval from keeping process alive during shutdown
if (cleanupInterval.unref) cleanupInterval.unref();

export default { createRateLimiter, apiLimiter, authLimiter };
