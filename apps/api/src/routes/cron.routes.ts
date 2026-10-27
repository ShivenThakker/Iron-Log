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

    // 1. Expire streaks for users inactive beyond grace period
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Inactive >= 2 days with grace already used
    const expiredGrace = await prisma.streak.updateMany({
      where: {
        current_streak: { gt: 0 },
        grace_used_this_week: true,
        last_active_date: { lt: twoDaysAgo },
      },
      data: { current_streak: 0 },
    });

    // Inactive >= 3 days regardless of grace
    const expiredInactive = await prisma.streak.updateMany({
      where: {
        current_streak: { gt: 0 },
        last_active_date: { lt: threeDaysAgo },
      },
      data: { current_streak: 0 },
    });

    if (expiredGrace.count > 0 || expiredInactive.count > 0) {
      logger.info({ expiredGrace: expiredGrace.count, expiredInactive: expiredInactive.count }, 'Expired inactive streaks');
    }

    // 2. Reset weekly grace periods and weekly XP on Mondays (runs only once per week)
    if (today.getDay() === 1) {
      const xpResetResult = await prisma.userXp.updateMany({
        where: {
          week_reset_at: { lt: today },
        },
        data: { xp_this_week: 0, week_reset_at: today },
      });
      if (xpResetResult.count > 0) {
        await prisma.streak.updateMany({
          data: { grace_used_this_week: false },
        });
        logger.info({ resetUsers: xpResetResult.count }, 'Reset weekly streak grace periods and XP counters');
      }
    }

    res.json({
      success: true,
      timestamp: new Date(),
      expiredCount: expiredGrace.count + expiredInactive.count,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ error: message }, 'Cron streak execution failed');
    res.status(500).json({ error: message });
  }
});

export default router;
