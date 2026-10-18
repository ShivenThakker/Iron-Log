import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let upstashRedis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  upstashRedis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const ratelimitInstances = new Map<string, Ratelimit>();

function getRedisLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!upstashRedis) return null;
  const key = `${limit}:${windowMs}`;
  let instance = ratelimitInstances.get(key);
  if (!instance) {
    const windowStr = windowMs >= 60000 ? (`${Math.round(windowMs / 60000)} m` as const) : (`${Math.round(windowMs / 1000)} s` as const);
    instance = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(limit, windowStr),
      prefix: `@ironlog/rl/${key}`,
    });
    ratelimitInstances.set(key, instance);
  }
  return instance;
}

// In-memory sliding window fallback for development
const requestTimestamps = new Map<string, number[]>();

export const rateLimit = (limit = 60, windowMs = 60000) => {
  const redisLimiter = getRedisLimiter(limit, windowMs);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = (req.user?.id || req.ip || 'anonymous') as string;

    if (redisLimiter) {
      try {
        const { success, limit: max, remaining, reset } = await redisLimiter.limit(identifier);
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', reset.toString());
        if (!success) {
          res.status(429).json({ error: 'Too many requests. Please try again later.' });
          return;
        }
        return next();
      } catch {
        // Fall back to in-memory if Redis temporarily fails
      }
    }

    const now = Date.now();
    const timestamps = requestTimestamps.get(identifier) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= limit) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    validTimestamps.push(now);
    requestTimestamps.set(identifier, validTimestamps);

    // Periodically prune expired keys to prevent memory leak
    if (requestTimestamps.size > 1000) {
      for (const [key, list] of requestTimestamps.entries()) {
        if (list.length === 0 || now - list[list.length - 1] > windowMs) {
          requestTimestamps.delete(key);
        }
      }
    }

    next();
  };
};
