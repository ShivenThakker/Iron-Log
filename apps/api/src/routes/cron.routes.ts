import { Router, Request, Response } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { env } from '../lib/env';

const router = Router();

function cronSecretMatches(header: unknown): boolean {
  if (!env.CRON_SECRET || typeof header !== 'string') return false; // fail closed
  const a = createHash('sha256').update(header).digest();
  const b = createHash('sha256').update(env.CRON_SECRET).digest();
  return timingSafeEqual(a, b);
}

router.post('/streaks', async (req: Request, res: Response): Promise<void> => {
  if (!cronSecretMatches(req.headers['x-cron-secret'])) {
    res.status(401).json({ error: 'Unauthorized cron request' });
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset weekly grace periods and weekly XP on Mondays
    if (today.getDay() === 1) {
      await prisma.streak.updateMany({
        data: { grace_used_this_week: false },
      });
      await prisma.userXp.updateMany({
        where: {
          week_reset_at: { lt: today },
        },
        data: { xp_this_week: 0, week_reset_at: today },
      });
      logger.info('Reset weekly streak grace periods and XP counters');
    }

    res.json({ success: true, timestamp: new Date() });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Cron streak execution failed');
    res.status(500).json({ error: err.message });
  }
});

export default router;
