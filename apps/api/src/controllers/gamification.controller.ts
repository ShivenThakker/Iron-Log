import { Request, Response } from 'express';
import { RANKS } from '@ironlog/shared';
import { gamificationRepository } from '../repositories/gamification.repository';

export const getGamificationProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const xpRecord = await gamificationRepository.getOrCreateUserXp(userId);

    const currentRank = [...RANKS].reverse().find(r => xpRecord.total_xp >= r.minXp) || RANKS[0];
    const nextRank = RANKS.find(r => r.minXp > xpRecord.total_xp);

    const recentTransactions = await gamificationRepository.getRecentTransactions(userId, 10);

    res.json({
       xpRecord,
       currentRank,
       nextRank,
       recentTransactions
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
