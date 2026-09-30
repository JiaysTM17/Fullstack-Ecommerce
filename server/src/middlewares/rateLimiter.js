/**
 * Rate Limiter Middleware — Giới hạn request theo IP
 * Chống brute force cho login/register, DDoS nhẹ cho API chung
 */

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
      return next();
    }

    const record = rateLimitStore.get(key);

    // Reset window nếu đã hết thời gian
    if (now - record.startTime > WINDOW_MS) {
      rateLimitStore.set(key, { count: 1, startTime: now });
      return next();
    }

    record.count++;

    if (record.count > max) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - record.startTime)) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

// Rate limiter mặc định cho API chung: 100 req/15 phút
export const apiLimiter = createRateLimiter(100, "Quá nhiều yêu cầu đến API, vui lòng thử lại sau 15 phút");

// Rate limiter nghiêm ngặt cho auth: 10 req/15 phút
export const authLimiter = createRateLimiter(10, "Quá nhiều lần đăng nhập/đăng ký thất bại, vui lòng thử lại sau 15 phút");

// Dọn dẹp bộ nhớ định kỳ mỗi 30 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now - record.startTime > WINDOW_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 30 * 60 * 1000);

export default { createRateLimiter, apiLimiter, authLimiter };
