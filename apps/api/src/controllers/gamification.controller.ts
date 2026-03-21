import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const RANKS = [
  { minXp: 0, name: 'Rookie' },
  { minXp: 1000, name: 'Iron Novice' },
  { minXp: 5000, name: 'Lifter' },
  { minXp: 10000, name: 'Veteran' },
  { minXp: 25000, name: 'Iron Master' }
];

export const getGamificationProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    let xpRecord = await prisma.userXp.findUnique({ where: { user_id: userId }});
    
    if (!xpRecord) {
       xpRecord = await prisma.userXp.create({ data: { user_id: userId, total_xp: 0, xp_this_week: 0, week_reset_at: new Date() } });
    }

    const currentRank = [...RANKS].reverse().find(r => xpRecord!.total_xp >= r.minXp) || RANKS[0];
    const nextRank = RANKS.find(r => r.minXp > xpRecord!.total_xp);

    const recentTransactions = await prisma.xpTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10
    });

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
