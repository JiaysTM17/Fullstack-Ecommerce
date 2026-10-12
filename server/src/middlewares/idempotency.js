import crypto from "crypto";
import { sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

/**
 * Enterprise In-Memory Idempotency Store with Auto TTL Cleanup
 * Supports Distributed Lock / In-Flight Mutex semantics.
 * States:
 * - 'processing': Request is currently in flight. Prevents race conditions.
 * - 'completed': Request finished successfully. Caches response data and SHA-256 fingerprint.
 */
class IdempotencyStore {
  constructor(defaultTtlMs = 24 * 60 * 60 * 1000) { // 24 hours TTL
    this.store = new Map();
    this.defaultTtlMs = defaultTtlMs;

    // Periodic sweep every 30 minutes to purge expired keys
    this.sweepInterval = setInterval(() => {
      this.purgeExpired();
    }, 30 * 60 * 1000);

    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  purgeExpired() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  hashPayload(payload) {
    if (!payload) return "";
    const normalized = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Acquire lock or retrieve completed idempotency record
   * Returns:
   * - { status: 'acquired' } -> Can proceed
   * - { status: 'processing' } -> Race condition (in flight)
   * - { status: 'completed', record } -> Replay existing response
   * - { status: 'mismatch', record } -> Same key used with different payload
   */
  acquire(key, payload, ttlMs = this.defaultTtlMs) {
    const now = Date.now();
    const payloadHash = this.hashPayload(payload);
    const existing = this.store.get(key);

    if (existing) {
      if (existing.expiresAt && existing.expiresAt < now) {
        this.store.delete(key);
      } else {
        if (existing.status === "processing") {
          return { status: "processing", record: existing };
        }
        if (existing.status === "completed") {
          if (existing.payloadHash && existing.payloadHash !== payloadHash) {
            return { status: "mismatch", record: existing };
          }
          return { status: "completed", record: existing };
        }
      }
    }

    // Acquire lock in processing state
    const record = {
      key,
      status: "processing",
      payloadHash,
      createdAt: now,
      expiresAt: now + ttlMs,
    };
    this.store.set(key, record);
    return { status: "acquired", record };
  }

  /**
   * Complete the idempotent execution and store response
   */
  complete(key, statusCode, body) {
    const record = this.store.get(key);
    if (record) {
      record.status = "completed";
      record.statusCode = statusCode || 200;
      record.body = body;
      record.completedAt = Date.now();
    }
  }

  /**
   * Release lock on failure so subsequent retries are allowed
   */
  release(key) {
    this.store.delete(key);
  }

  /**
   * Clear all records (useful in tests)
   */
  clear() {
    this.store.clear();
  }
}

export const idempotencyStore = new IdempotencyStore();

/**
 * Express Middleware: Enterprise Idempotency Guard
 * Extracts Idempotency Key from:
 * - Header 'idempotency-key' (IETF standard)
 * - Header 'x-idempotency-key' (Legacy de-facto)
 * - Body property 'idempotencyKey'
 */
export const idempotencyGuard = (options = {}) => {
  return (req, res, next) => {
    // Only apply to state-changing HTTP methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    const key =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      (req.body && req.body.idempotencyKey);

    if (!key) {
      return next();
    }

    const trimmedKey = String(key).trim();
    if (!trimmedKey) {
      return next();
    }

    // Fingerprint request payload (excluding the idempotencyKey itself to avoid self-reference bias)
    let payloadForHashing = { ...req.body };
    delete payloadForHashing.idempotencyKey;

    const result = idempotencyStore.acquire(trimmedKey, payloadForHashing, options.ttlMs);

    if (result.status === "processing") {
      logger.warn(`Idempotency conflict (in-flight) for key: ${trimmedKey}`, {
        path: req.originalUrl,
        ip: req.ip,
      });
      res.setHeader("Retry-After", "2");
      return sendError(
        res,
        "Yêu cầu thanh toán/thao tác này đang được xử lý, vui lòng không nhấn gửi lại liên tục.",
        409
      );
    }

    if (result.status === "mismatch") {
      logger.warn(`Idempotency payload mismatch for key: ${trimmedKey}`, {
        path: req.originalUrl,
        ip: req.ip,
      });
      return sendError(
        res,
        "Idempotency-Key đã được sử dụng trước đó cho một giao dịch có nội dung khác (Unprocessable Entity).",
        422
      );
    }

    if (result.status === "completed") {
      logger.info(`Idempotency cache hit — Replaying response for key: ${trimmedKey}`, {
        path: req.originalUrl,
      });
      res.setHeader("Idempotent-Replay", "true");
      res.setHeader("X-Idempotency-Key", trimmedKey);
      return res.status(result.record.statusCode).json(result.record.body);
    }

    // Wrap res.json and res.send to capture response data on completion
    const originalJson = res.json.bind(res);
    let captured = false;

    res.json = (body) => {
      if (!captured) {
        captured = true;
        const statusCode = res.statusCode || 200;
        // Only mark completed for successful responses (2xx). On server error (5xx), release lock to allow retry.
        if (statusCode >= 200 && statusCode < 400) {
          idempotencyStore.complete(trimmedKey, statusCode, body);
        } else {
          idempotencyStore.release(trimmedKey);
        }
      }
      return originalJson(body);
    };

    // Release lock if connection aborts before finish
    res.on("close", () => {
      if (!res.writableEnded && !captured) {
        idempotencyStore.release(trimmedKey);
      }
    });

    next();
  };
};

export default {
  idempotencyStore,
  idempotencyGuard,
};
