/**
 * Enhanced Error Handler Middleware — Phân loại lỗi theo type
 * Hỗ trợ: ValidationError, CastError, DuplicateKeyError, JWT errors, AppError
 * Upgrade: Sử dụng structured logger thay vì console.error
 */

import logger from "../utils/logger.js";

/**
 * Custom AppError class — Lỗi nghiệp vụ tùy chỉnh
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Lỗi hệ thống không xác định";
  let code = err.code || "INTERNAL_ERROR";

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors.join(". ") : "Dữ liệu không hợp lệ";
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Giá trị '${err.value}' không phải ID hợp lệ cho trường '${err.path}'`;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000 || err.code === "11000") {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `Giá trị cho '${field}' đã tồn tại trong hệ thống`;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Mã xác thực không hợp lệ";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  // Payload Too Large
  if (err.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Dữ liệu gửi lên quá lớn (giới hạn 500KB)";
  }

  // Syntax Error (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    code = "MALFORMED_JSON";
    message = "Dữ liệu JSON không hợp lệ";
  }

  // Structured logging thay vì console.error
  const requestId = req.requestId || "no-id";
  if (statusCode >= 500) {
    logger.error(`${code}: ${err.message}`, {
      requestId,
      statusCode,
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  } else if (statusCode >= 400) {
    logger.warn(`${code}: ${message}`, {
      requestId,
      statusCode,
      method: req.method,
      url: req.originalUrl,
    });
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    ...(req.requestId && { requestId }),
  });
};

export default errorHandler;
