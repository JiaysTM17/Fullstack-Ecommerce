/**
 * Request Validator Middleware — Validation helpers tập trung
 * Cung cấp các hàm validate phổ biến cho toàn bộ API
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^\S+@\S+\.\S+$/.test(email.trim());
};

/**
 * Validate số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidVietnamesePhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  return /^0\d{9}$/.test(phone.trim());
};

/**
 * Validate MongoDB ObjectId format (24 hex chars) hoặc custom ID
 * @param {string} id
 * @returns {boolean}
 */
export const isValidId = (id) => {
  if (!id || typeof id !== "string") return false;
  return id.trim().length > 0;
};

/**
 * Sanitize string — loại bỏ HTML tags và script injection
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
};

/**
 * Validate password strength — tối thiểu 6 ký tự
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Mật khẩu là bắt buộc" };
  }
  if (password.length < 6) {
    return { valid: false, message: "Mật khẩu tối thiểu phải từ 6 ký tự" };
  }
  return { valid: true, message: "" };
};

/**
 * Validate strong password — tối thiểu 8 ký tự, có uppercase + number
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validateStrongPassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Mật khẩu là bắt buộc" };
  }
  if (password.length < 8) {
    return { valid: false, message: "Mật khẩu tối thiểu phải từ 8 ký tự" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Mật khẩu phải có ít nhất 1 chữ hoa" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Mật khẩu phải có ít nhất 1 chữ số" };
  }
  return { valid: true, message: "" };
};

/**
 * Validate required fields — kiểm tra object có đủ fields bắt buộc
 * @param {object} body - request body
 * @param {string[]} requiredFields - danh sách field bắt buộc
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const validateRequired = (body, requiredFields) => {
  const missing = [];
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      missing.push(field);
    }
  }
  return { valid: missing.length === 0, missing };
};

/**
 * Validate pagination params
 * @param {object} query
 * @returns {{ page: number, limit: number }}
 */
export const validatePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit };
};

export default {
  isValidEmail,
  isValidVietnamesePhone,
  isValidId,
  sanitizeString,
  validatePassword,
  validateStrongPassword,
  validateRequired,
  validatePagination,
};
