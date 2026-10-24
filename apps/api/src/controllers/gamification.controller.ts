import { Request, Response } from 'express';
import { RANKS } from '@ironlog/shared';
import { gamificationRepository } from '../repositories/gamification.repository';

export const getGamificationProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const xpRecord = await gamificationRepository.getOrCreateUserXp(userId);

    const currentRank = [...RANKS].reverse().find((r) => xpRecord.total_xp >= r.minXp) || RANKS[0];
    const nextRank = RANKS.find((r) => r.minXp > xpRecord.total_xp);

    const recentTransactions = await gamificationRepository.getRecentTransactions(userId, 10);
    const trophyCase = await gamificationRepository.getTrophyCase(userId);

    // Calculate XP progress percentage to next rank
    let progressPct = 100;
    let xpToNextRank = 0;
    if (nextRank) {
      const range = nextRank.minXp - currentRank.minXp;
      const progress = xpRecord.total_xp - currentRank.minXp;
      progressPct = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
      xpToNextRank = nextRank.minXp - xpRecord.total_xp;
    }

    res.json({
      xpRecord,
      currentRank,
      nextRank,
      progressPct,
      xpToNextRank,
      recentTransactions,
      trophySummary: {
        unlocked: trophyCase.unlockedCount,
        total: trophyCase.totalCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


