import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();

router.post('/streaks', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
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
