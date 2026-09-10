// Per-connection WebSocket rate limiter. Tracks message counts in a sliding
// window and rejects bursts that exceed the threshold. Prevents a single
// client from flooding the server with messages (spam, bot abuse, rapid-fire
// answers). Lightweight — no external deps, O(1) per check.

const DEFAULT_WINDOW_MS = 2000;
const DEFAULT_MAX_MESSAGES = 15;

class RateLimiter {
  constructor(windowMs = DEFAULT_WINDOW_MS, maxMessages = DEFAULT_MAX_MESSAGES) {
    this.windowMs = windowMs;
    this.maxMessages = maxMessages;
    this.clients = new Map();
  }

  check(id) {
    const now = Date.now();
    let bucket = this.clients.get(id);
    if (!bucket || now - bucket.windowStart > this.windowMs) {
      bucket = { windowStart: now, count: 0 };
      this.clients.set(id, bucket);
    }
    bucket.count++;
    return bucket.count <= this.maxMessages;
  }

  remove(id) {
    this.clients.delete(id);
  }

  // Periodic cleanup of stale entries (call from a setInterval).
  sweep() {
    const cutoff = Date.now() - this.windowMs * 2;
    for (const [id, bucket] of this.clients) {
      if (bucket.windowStart < cutoff) this.clients.delete(id);
    }
  }
}

module.exports = RateLimiter;
