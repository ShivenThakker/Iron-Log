import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisInstance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback map for development/offline
const memoryStore = new Map<string, { value: any; expiresAt: number }>();

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
  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    if (redisInstance) {
      if (options?.ex) {
        return redisInstance.set(key, value, { ex: options.ex });
      }
      return redisInstance.set(key, value);
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
