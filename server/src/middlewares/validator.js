/**
 * Request Validator Middleware — Validation helpers tập trung
 * Cung cấp các hàm validate phổ biến cho toàn bộ API
 * Upgrade: Thêm middleware factory cho route-level validation
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

// ============================================================
// MIDDLEWARE FACTORIES — Route-level validation (Upgrade)
// ============================================================

/**
 * Middleware: requireFields — Trả 400 nếu thiếu fields bắt buộc
 * @param {string[]} fields - Danh sách field bắt buộc trong req.body
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post("/register", requireFields(["email", "password", "fullName"]), register);
 */
export const requireFields = (fields) => {
  return (req, res, next) => {
    const { valid, missing } = validateRequired(req.body, fields);
    if (!valid) {
      return res.status(400).json({
        success: false,
        code: "MISSING_FIELDS",
        message: `Vui lòng điền đầy đủ: ${missing.join(", ")}`,
        missingFields: missing,
      });
    }
    next();
  };
};

/**
 * Middleware: validateBody — Validate body với custom rules
 * @param {Object} rules - { fieldName: { type, required, min, max, pattern, message } }
 * @returns {Function} Express middleware
 *
 * @example
 *   router.post("/products", validateBody({
 *     name: { type: "string", required: true, min: 2 },
 *     price: { type: "number", required: true, min: 0 },
 *   }), createProduct);
 */
export const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      // Required check
      if (rule.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field}: Trường này là bắt buộc`);
        continue;
      }

      // Skip optional empty fields
      if (value === undefined || value === null) continue;

      // Type check
      if (rule.type === "string" && typeof value !== "string") {
        errors.push(`${field}: Phải là chuỗi ký tự`);
      } else if (rule.type === "number" && (typeof value !== "number" || isNaN(value))) {
        errors.push(`${field}: Phải là số hợp lệ`);
      } else if (rule.type === "boolean" && typeof value !== "boolean") {
        errors.push(`${field}: Phải là true hoặc false`);
      } else if (rule.type === "email" && !isValidEmail(value)) {
        errors.push(`${field}: Email không hợp lệ`);
      } else if (rule.type === "phone" && !isValidVietnamesePhone(value)) {
        errors.push(`${field}: Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)`);
      }

      // Min/Max for strings (length) and numbers (value)
      if (rule.min !== undefined) {
        if (typeof value === "string" && value.length < rule.min) {
          errors.push(`${field}: Tối thiểu ${rule.min} ký tự`);
        } else if (typeof value === "number" && value < rule.min) {
          errors.push(`${field}: Giá trị tối thiểu là ${rule.min}`);
        }
      }
      if (rule.max !== undefined) {
        if (typeof value === "string" && value.length > rule.max) {
          errors.push(`${field}: Tối đa ${rule.max} ký tự`);
        } else if (typeof value === "number" && value > rule.max) {
          errors.push(`${field}: Giá trị tối đa là ${rule.max}`);
        }
      }

      // Pattern check
      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        errors.push(rule.message || `${field}: Không đúng định dạng yêu cầu`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: errors[0],
        errors,
      });
    }

    next();
  };
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
  requireFields,
  validateBody,
};
