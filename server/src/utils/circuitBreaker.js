import logger from "./logger.js";

/**
 * Circuit Breaker States
 */
export const CircuitState = Object.freeze({
  CLOSED: "CLOSED",       // Normal operation, calls pass through
  OPEN: "OPEN",           // Service failing, calls fail fast without hitting upstream
  HALF_OPEN: "HALF_OPEN", // Probing whether upstream service has recovered
});

/**
 * Circuit Breaker with Exponential Backoff and Full Jitter
 * Prevents Cascading Failures when third-party gateways (VietQR, SPX Carrier, AI APIs) degrade or fail.
 */
export class CircuitBreaker {
  constructor({
    name = "DefaultCircuitBreaker",
    failureThreshold = 3,         // Consecutive errors or error rate to trip breaker
    resetTimeoutMs = 10000,       // Sleep window before entering HALF_OPEN
    halfOpenSuccessThreshold = 2, // Successful probe requests to close breaker
    fallback = null,              // Default fallback function or value
    timeoutMs = 5000,             // Request timeout
  } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.halfOpenSuccessThreshold = halfOpenSuccessThreshold;
    this.fallback = fallback;
    this.timeoutMs = timeoutMs;

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }

  /**
   * Exponential Backoff with Full Jitter:
   * sleep = random_between(0, min(maxSleep, baseSleep * 2^attempt))
   */
  static calculateBackoffWithJitter(attempt, baseMs = 200, maxMs = 5000) {
    const temp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    const sleep = Math.floor(Math.random() * (temp + 1));
    return sleep;
  }

  isOpen() {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
        return false;
      }
      return true;
    }
    return false;
  }

  transitionTo(newState) {
    logger.info(`CircuitBreaker [${this.name}] state changed: ${this.state} -> ${newState}`);
    this.state = newState;
    if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }

  onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    logger.warn(`CircuitBreaker [${this.name}] recorded failure #${this.failureCount}: ${error?.message}`);

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Execute an async action protected by this Circuit Breaker
   */
  async execute(action, customFallback = this.fallback) {
    if (this.isOpen()) {
      const errorMsg = `CircuitBreaker [${this.name}] is OPEN. Fast-failing upstream call.`;
      logger.warn(errorMsg);
      if (typeof customFallback === "function") {
        return customFallback(new Error(errorMsg));
      }
      if (customFallback !== null && customFallback !== undefined) {
        return customFallback;
      }
      const err = new Error(errorMsg);
      err.circuitBreakerOpen = true;
      throw err;
    }

    try {
      // Wrap action with timeout
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`CircuitBreaker [${this.name}] call timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      });

      const result = await Promise.race([
        action(),
        timeoutPromise,
      ]);

      clearTimeout(timeoutHandle);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (typeof customFallback === "function") {
        return customFallback(err);
      }
      if (customFallback !== null && customFallback !== undefined) {
        return customFallback;
      }
      throw err;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
    };
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }
}
