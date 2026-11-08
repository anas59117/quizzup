// Redis pub/sub adapter for horizontal scaling.
// When REDIS_URL is set, game events are broadcast across instances so
// matchmaking and room state stay consistent behind a load balancer.
// Without REDIS_URL the adapter is a no-op passthrough — the server
// continues to work as a single-process monolith.

let redis;
try { redis = require('redis'); } catch { redis = null; }

class RedisAdapter {
  constructor() {
    this.pub = null;
    this.sub = null;
    this.handlers = new Map();
    this.ready = false;
    this.instanceId = `inst_${process.pid}_${Date.now().toString(36)}`;
  }

  async connect(url) {
    if (!redis) {
      console.warn('[redis-adapter] redis package not installed — running single-instance.');
      return false;
    }
    if (!url) return false;
    try {
      this.pub = redis.createClient({ url });
      this.sub = this.pub.duplicate();
      await Promise.all([this.pub.connect(), this.sub.connect()]);
      this.ready = true;
      console.log(`[redis-adapter] Connected (instance=${this.instanceId})`);
      return true;
    } catch (err) {
      console.error('[redis-adapter] Connection failed:', err.message);
      this.pub = null;
      this.sub = null;
      return false;
    }
  }

  // Publish an event to all instances
  async publish(channel, data) {
    if (!this.ready) return;
    try {
      await this.pub.publish(channel, JSON.stringify({
        ...data,
        _from: this.instanceId,
        _ts: Date.now()
      }));
    } catch (err) {
      console.error('[redis-adapter] publish error:', err.message);
    }
  }

  // Subscribe to events from other instances
  async subscribe(channel, handler) {
    if (!this.ready) return;
    this.handlers.set(channel, handler);
    await this.sub.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        // Ignore own messages
        if (data._from === this.instanceId) return;
        handler(data);
      } catch (err) {
        console.error('[redis-adapter] message parse error:', err.message);
      }
    });
  }

  // Shared counter (rate limiting, connection counts)
  async incr(key, ttlSeconds = 60) {
    if (!this.ready) return null;
    try {
      const val = await this.pub.incr(key);
      if (val === 1) await this.pub.expire(key, ttlSeconds);
      return val;
    } catch { return null; }
  }

  async decr(key) {
    if (!this.ready) return null;
    try { return await this.pub.decr(key); } catch { return null; }
  }

  async get(key) {
    if (!this.ready) return null;
    try { return await this.pub.get(key); } catch { return null; }
  }

  async set(key, value, ttlSeconds) {
    if (!this.ready) return;
    try {
      if (ttlSeconds) await this.pub.setEx(key, ttlSeconds, String(value));
      else await this.pub.set(key, String(value));
    } catch {}
  }

  async del(key) {
    if (!this.ready) return;
    try { await this.pub.del(key); } catch {}
  }

  async disconnect() {
    if (this.pub) await this.pub.quit().catch(() => {});
    if (this.sub) await this.sub.quit().catch(() => {});
    this.ready = false;
  }
}

// Singleton
const adapter = new RedisAdapter();
module.exports = adapter;
