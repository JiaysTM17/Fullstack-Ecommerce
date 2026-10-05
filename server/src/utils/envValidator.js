/**
 * Environment Validator — Kiểm tra biến môi trường bắt buộc khi khởi động
 * Fail-fast nếu thiếu config quan trọng
 */

import logger from "./logger.js";

const REQUIRED_VARS = [];

const OPTIONAL_VARS = [
  { name: "PORT", default: "5000", description: "Cổng máy chủ" },
  { name: "MONGO_URI", default: "mongodb://127.0.0.1:27017/mini-shopee", description: "MongoDB connection string" },
  { name: "CLIENT_URL", default: "http://localhost:5173", description: "Frontend URL (CORS)" },
  { name: "NODE_ENV", default: "development", description: "Môi trường chạy" },
  { name: "JWT_SECRET", default: null, description: "Secret key cho JWT" },
  { name: "JWT_EXPIRES_IN", default: "7d", description: "Thời gian hết hạn JWT" },
  { name: "LOG_LEVEL", default: "DEBUG", description: "Mức logging (ERROR/WARN/INFO/DEBUG)" },
];

export function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    logger.error(`❌ Thiếu biến môi trường bắt buộc: ${missing.join(", ")}`);
    logger.error("Vui lòng tạo file .env với đầy đủ các biến cần thiết.");
    process.exit(1);
  }

  // Check optional variables and set defaults
  for (const { name, default: defaultVal, description } of OPTIONAL_VARS) {
    if (!process.env[name]) {
      if (defaultVal) {
        process.env[name] = defaultVal;
        warnings.push(`${name} → sử dụng giá trị mặc định: "${defaultVal}" (${description})`);
      } else {
        warnings.push(`${name} → chưa được thiết lập (${description})`);
      }
    }
  }

  if (warnings.length > 0) {
    logger.info("📋 Environment config:");
    for (const w of warnings) {
      logger.debug(`  ↳ ${w}`);
    }
  }

  // Security warnings
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("default")) {
      logger.warn("⚠️  JWT_SECRET đang dùng giá trị mặc định! Hãy đổi sang secret mạnh cho production.");
    }
  }

  logger.info(`✅ Environment validated: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
}

export default validateEnv;
