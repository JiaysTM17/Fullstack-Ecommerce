/**
 * Token Bucket Rate Limiting Algorithm
 * Used in high-concurrency e-commerce systems to control traffic spikes,
 * prevent bot abuse during Flash Sale deal grabbing, and mitigate DDoS.
 *
 * Mathematical model:
 * - Bucket capacity B (burst volume)
 * - Refill rate R tokens/sec
 * - Current tokens at time t = min(B, tokens + (t - lastRefill) * R)
 */
export class TokenBucket {
  constructor(capacity = 10, refillRatePerSec = 2) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    if (elapsedSec > 0) {
      const addedTokens = elapsedSec * this.refillRatePerSec;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefill = now;
    }
  }

  tryConsume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        limit: this.capacity,
      };
    }

    const missingTokens = tokens - this.tokens;
    const retryAfterSec = Math.ceil(missingTokens / this.refillRatePerSec);
    return {
      allowed: false,
      remaining: Math.floor(this.tokens),
      limit: this.capacity,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Keyed Token Bucket Store (Memory-safe with TTL eviction)
 */
export class TokenBucketStore {
  constructor(defaultCapacity = 10, defaultRefillRate = 2) {
    this.buckets = new Map();
    this.defaultCapacity = defaultCapacity;
    this.defaultRefillRate = defaultRefillRate;
  }

  getBucket(key, capacity = this.defaultCapacity, refillRate = this.defaultRefillRate) {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(capacity, refillRate));
    }
    return this.buckets.get(key);
  }

  consume(key, tokens = 1, capacity, refillRate) {
    const bucket = this.getBucket(key, capacity, refillRate);
    return bucket.tryConsume(tokens);
  }

  clear() {
    this.buckets.clear();
  }
}

export const globalTokenBucketStore = new TokenBucketStore();

/**
 * Express Middleware factory for Token Bucket Rate Limiting
 */
export const tokenBucketLimiter = ({
  capacity = 10,
  refillRatePerSec = 2,
  keyGenerator = (req) => req.ip || "127.0.0.1",
  message = "Hệ thống đang quá tải do lượng truy cập săn Deal quá lớn, vui lòng thử lại sau.",
} = {}) => {
  const store = new TokenBucketStore(capacity, refillRatePerSec);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = store.consume(key, 1, capacity, refillRatePerSec);

    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSec));
      return res.status(429).json({
        success: false,
        status: "fail",
        error: "TOO_MANY_REQUESTS",
        message,
        retryAfter: result.retryAfterSec,
      });
    }

    next();
  };
};
