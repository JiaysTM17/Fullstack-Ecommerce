/**
 * Structured Logger — Logging chuẩn hóa sản xuất
 * Thay thế console.log thô bằng logger có level, timestamp, request context
 * 
 * Levels: ERROR > WARN > INFO > DEBUG
 * Format: [LEVEL][TIMESTAMP][requestId] message {metadata}
 */

const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };

const CURRENT_LEVEL = LOG_LEVELS[
  (process.env.LOG_LEVEL || "DEBUG").toUpperCase()
] ?? LOG_LEVELS.DEBUG;

const COLORS = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m",  // Yellow
  INFO: "\x1b[36m",  // Cyan
  DEBUG: "\x1b[90m", // Gray
  RESET: "\x1b[0m",
};

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, meta = {}) {
  const timestamp = formatTimestamp();
  const requestId = meta.requestId || "-";
  const colorCode = COLORS[level] || "";
  const reset = COLORS.RESET;

  // Remove requestId from meta to avoid duplication
  const { requestId: _, ...restMeta } = meta;
  const metaStr = Object.keys(restMeta).length > 0
    ? ` ${JSON.stringify(restMeta)}`
    : "";

  return `${colorCode}[${level}]${reset}[${timestamp}][${requestId}] ${message}${metaStr}`;
}

const logger = {
  error(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(formatMessage("ERROR", message, meta));
    }
  },

  warn(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(formatMessage("WARN", message, meta));
    }
  },

  info(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      console.log(formatMessage("INFO", message, meta));
    }
  },

  debug(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage("DEBUG", message, meta));
    }
  },

  /**
   * Log an HTTP request (used by requestLogger middleware)
   */
  http(req, res, duration) {
    const level = res.statusCode >= 500 ? "ERROR"
      : res.statusCode >= 400 ? "WARN"
      : "INFO";

    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    this[level.toLowerCase()](message, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get("User-Agent")?.slice(0, 80),
    });
  },
};

export default logger;
