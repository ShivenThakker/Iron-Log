import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimitInstance: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const upstashRedis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimitInstance = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
  });
}

// In-memory sliding window fallback for development
const requestTimestamps = new Map<string, number[]>();

export const rateLimit = (limit = 60, windowMs = 60000) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = (req.user?.id || req.ip || 'anonymous') as string;

    if (ratelimitInstance) {
      try {
        const { success, limit: max, remaining, reset } = await ratelimitInstance.limit(identifier);
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
    next();
  };
};
