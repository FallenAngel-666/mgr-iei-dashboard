/**
 * IEI MGR Student Chapter — Distributed Redis Store & Resilient Fallback
 * Concurrency-safe sliding window rate limiter & FIFO waiting room queue
 */

import Redis from 'ioredis';

// High-performance Lua script for atomic sliding window rate limiting
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

-- Remove timestamps older than window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

-- Count current entries in window
local currentRequests = redis.call('ZCARD', key)

if currentRequests < limit then
  -- Add unique entry with microsecond score
  redis.call('ZADD', key, now, ARGV[4])
  redis.call('EXPIRE', key, math.ceil(window / 1000) + 5)
  return {1, limit - currentRequests - 1, 0}
else
  -- Rate limit exceeded. Find oldest timestamp to calculate retry-after
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retryAfterMs = 0
  if #oldest > 0 then
    local oldestTime = tonumber(oldest[2])
    retryAfterMs = math.max(0, (oldestTime + window) - now)
  end
  return {0, 0, math.ceil(retryAfterMs / 1000)}
end
`;

class InvertedMemoryStore {
  constructor() {
    this.zsets = new Map();
    this.hashes = new Map();
    this.keys = new Map();
  }

  slidingWindow(key, now, windowMs, limit, entryId) {
    if (!this.zsets.has(key)) {
      this.zsets.set(key, []);
    }
    const list = this.zsets.get(key);
    const clearBefore = now - windowMs;
    // Filter out old entries
    const fresh = list.filter(item => item.score > clearBefore);
    if (fresh.length < limit) {
      fresh.push({ id: entryId, score: now });
      this.zsets.set(key, fresh);
      return { allowed: true, remaining: limit - fresh.length, retryAfterSec: 0 };
    } else {
      const oldest = fresh[0]?.score || now;
      const retryAfterSec = Math.max(1, Math.ceil(((oldest + windowMs) - now) / 1000));
      this.zsets.set(key, fresh);
      return { allowed: false, remaining: 0, retryAfterSec };
    }
  }

  // Queue helper methods
  addToQueue(queueKey, score, member) {
    if (!this.zsets.has(queueKey)) this.zsets.set(queueKey, []);
    const arr = this.zsets.get(queueKey);
    const existingIdx = arr.findIndex(x => x.id === member);
    if (existingIdx >= 0) {
      arr[existingIdx].score = score;
    } else {
      arr.push({ id: member, score });
    }
    arr.sort((a, b) => a.score - b.score);
  }

  getRank(queueKey, member) {
    const arr = this.zsets.get(queueKey) || [];
    const idx = arr.findIndex(x => x.id === member);
    return idx >= 0 ? idx + 1 : null;
  }

  removeFromQueue(queueKey, member) {
    const arr = this.zsets.get(queueKey) || [];
    this.zsets.set(queueKey, arr.filter(x => x.id !== member));
  }

  popLowest(queueKey, count) {
    const arr = this.zsets.get(queueKey) || [];
    const popped = arr.splice(0, count);
    this.zsets.set(queueKey, arr);
    return popped.map(x => x.id);
  }

  getQueueCount(queueKey) {
    return (this.zsets.get(queueKey) || []).length;
  }

  setKey(key, val, ttlSec) {
    this.keys.set(key, { val, exp: Date.now() + (ttlSec * 1000) });
  }

  getKey(key) {
    const item = this.keys.get(key);
    if (!item) return null;
    if (Date.now() > item.exp) {
      this.keys.delete(key);
      return null;
    }
    return item.val;
  }

  delKey(key) {
    this.keys.delete(key);
  }

  countPrefix(prefix) {
    let c = 0;
    const now = Date.now();
    for (const [k, v] of this.keys.entries()) {
      if (k.startsWith(prefix)) {
        if (now <= v.exp) c++;
        else this.keys.delete(k);
      }
    }
    return c;
  }
}

class RedisService {
  constructor() {
    this.isRedisConnected = false;
    this.memoryStore = new InvertedMemoryStore();
    this.client = null;
    this.initClient();
  }

  initClient() {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          const delay = Math.min(times * 200, 3000);
          return delay;
        }
      });

      this.client.defineCommand('slidingWindowRateLimit', {
        numberOfKeys: 1,
        lua: SLIDING_WINDOW_LUA
      });

      this.client.connect().then(() => {
        this.isRedisConnected = true;
        console.log(`[Redis] Connected successfully to ${redisHost}:${redisPort}`);
      }).catch((err) => {
        this.isRedisConnected = false;
        console.warn(`[Redis] Standalone/Development mode: Redis unavailable (${err.message}). Safe resilient memory store activated.`);
      });

      this.client.on('error', (err) => {
        this.isRedisConnected = false;
      });

      this.client.on('ready', () => {
        this.isRedisConnected = true;
      });

      this.client.on('close', () => {
        this.isRedisConnected = false;
      });
    } catch (e) {
      this.isRedisConnected = false;
      console.warn('[Redis] Initialization warning:', e.message);
    }
  }

  /**
   * Check rate limit using atomic sliding window
   */
  async checkRateLimit(key, windowSeconds, maxAllowed) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const entryId = `${now}-${Math.random().toString(36).substring(2, 8)}`;

    if (this.isRedisConnected && this.client) {
      try {
        const result = await this.client.slidingWindowRateLimit(key, now, windowMs, maxAllowed, entryId);
        const [allowed, remaining, retryAfterSec] = result;
        return {
          allowed: allowed === 1,
          remaining: Math.max(0, remaining),
          retryAfterSec: retryAfterSec || 0
        };
      } catch (err) {
        // Fallback to memory store if Redis query fails
      }
    }

    return this.memoryStore.slidingWindow(key, now, windowMs, maxAllowed, entryId);
  }

  // Waiting Room FIFO Operations
  async enqueueVisitor(queueKey, visitorId, score) {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.zadd(queueKey, score, visitorId);
        return;
      } catch (e) {}
    }
    this.memoryStore.addToQueue(queueKey, score, visitorId);
  }

  async getQueuePosition(queueKey, visitorId) {
    if (this.isRedisConnected && this.client) {
      try {
        const rank = await this.client.zrank(queueKey, visitorId);
        return rank !== null ? rank + 1 : null;
      } catch (e) {}
    }
    return this.memoryStore.getRank(queueKey, visitorId);
  }

  async dequeueVisitor(queueKey, visitorId) {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.zrem(queueKey, visitorId);
        return;
      } catch (e) {}
    }
    this.memoryStore.removeFromQueue(queueKey, visitorId);
  }

  async popNextAdmissions(queueKey, count) {
    if (this.isRedisConnected && this.client) {
      try {
        const items = await this.client.zrange(queueKey, 0, count - 1);
        if (items.length > 0) {
          await this.client.zrem(queueKey, ...items);
        }
        return items;
      } catch (e) {}
    }
    return this.memoryStore.popLowest(queueKey, count);
  }

  async getQueueLength(queueKey) {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.zcard(queueKey);
      } catch (e) {}
    }
    return this.memoryStore.getQueueCount(queueKey);
  }

  // Session Management
  async registerActiveSession(sessionId, metadata, ttlSec) {
    const key = `iei:session:${sessionId}`;
    const data = JSON.stringify(metadata);
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.set(key, data, 'EX', ttlSec);
        return;
      } catch (e) {}
    }
    this.memoryStore.setKey(key, data, ttlSec);
  }

  async getActiveSession(sessionId) {
    const key = `iei:session:${sessionId}`;
    if (this.isRedisConnected && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (e) {}
    }
    const memVal = this.memoryStore.getKey(key);
    return memVal ? JSON.parse(memVal) : null;
  }

  async refreshActiveSession(sessionId, ttlSec) {
    const key = `iei:session:${sessionId}`;
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.expire(key, ttlSec);
        return;
      } catch (e) {}
    }
    const item = this.memoryStore.getKey(key);
    if (item) this.memoryStore.setKey(key, item, ttlSec);
  }

  async removeActiveSession(sessionId) {
    const key = `iei:session:${sessionId}`;
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (e) {}
    }
    this.memoryStore.delKey(key);
  }

  async countActiveSessions() {
    if (this.isRedisConnected && this.client) {
      try {
        const keys = await this.client.keys('iei:session:*');
        return keys.length;
      } catch (e) {}
    }
    return this.memoryStore.countPrefix('iei:session:');
  }

  // Health and connectivity
  isHealthy() {
    return {
      connected: this.isRedisConnected,
      engine: this.isRedisConnected ? 'Redis 7 (Shared Memory Cluster)' : 'In-Memory Resilient Fallback Engine'
    };
  }
}

export const redisService = new RedisService();
