import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisInstance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const memoryStore = new Map<string, { value: unknown; expiresAt: number }>();

function pruneExpiredKeys() {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (now > item.expiresAt) {
      memoryStore.delete(key);
    }
  }
}

export const redis = {
  isConfigured: () => !!redisInstance,
  async get<T>(key: string): Promise<T | null> {
    if (redisInstance) {
      return redisInstance.get<T>(key);
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value as T;
  },
  async set(key: string, value: unknown, options?: { ex?: number }): Promise<'OK'> {
    if (redisInstance) {
      if (options?.ex) {
        await redisInstance.set(key, value, { ex: options.ex });
        return 'OK';
      }
      await redisInstance.set(key, value);
      return 'OK';
    }
    if (memoryStore.size > 100) {
      pruneExpiredKeys();
    }
    const ttlMs = (options?.ex ?? 3600) * 1000;
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
    return 'OK';
  },
  async del(key: string): Promise<number> {
    if (redisInstance) {
      return redisInstance.del(key);
    }
    return memoryStore.delete(key) ? 1 : 0;
  },
};
