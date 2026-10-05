/**
 * Security Middleware Module — Bảo mật HTTP toàn diện
 * Tích hợp: Helmet, NoSQL Injection, HPP, XSS Sanitization
 */

import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

// ============================================================
// 1. HELMET — HTTP Security Headers
// ============================================================
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Tắt CSP cho API (frontend tự quản lý)
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ============================================================
// 2. NOSQL INJECTION SANITIZATION
// ============================================================
export const noSqlInjection = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(
      `[SECURITY] NoSQL injection attempt blocked on key "${key}" from ${req.ip}`
    );
  },
});

// ============================================================
// 3. HTTP PARAMETER POLLUTION PROTECTION
// ============================================================
export const parameterPollution = hpp({
  whitelist: [
    "price",
    "rating",
    "category",
    "brand",
    "shopId",
    "status",
    "sort",
    "order",
    "page",
    "limit",
    "minPrice",
    "maxPrice",
    "minRating",
  ],
});

// ============================================================
// 4. XSS SANITIZATION — Chống Script Injection
// ============================================================
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
];

function deepSanitize(obj) {
  if (typeof obj === "string") {
    let sanitized = obj;
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, "");
    }
    return sanitized;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (obj !== null && typeof obj === "object") {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[key] = deepSanitize(value);
    }
    return clean;
  }
  return obj;
}

export const xssSanitize = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = deepSanitize(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = deepSanitize(req.params);
  }
  next();
};

// ============================================================
// 5. REQUEST SIZE LIMITER (thêm protection cho URL-encoded)
// ============================================================
export const REQUEST_SIZE_LIMITS = {
  json: "500kb",
  urlencoded: "500kb",
};

// ============================================================
// 6. COMBINED SECURITY MIDDLEWARE STACK
// ============================================================
export const applySecurityMiddleware = (app) => {
  app.use(securityHeaders);
  app.use(noSqlInjection);
  app.use(parameterPollution);
  app.use(xssSanitize);
};

export default {
  securityHeaders,
  noSqlInjection,
  parameterPollution,
  xssSanitize,
  applySecurityMiddleware,
  REQUEST_SIZE_LIMITS,
};
