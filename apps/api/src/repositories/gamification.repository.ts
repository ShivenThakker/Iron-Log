import { prisma } from '../lib/prisma';

export class GamificationRepository {
  async getOrCreateUserXp(userId: string) {
    let xpRecord = await prisma.userXp.findUnique({ where: { user_id: userId } });
    if (!xpRecord) {
      xpRecord = await prisma.userXp.create({
        data: {
          user_id: userId,
          total_xp: 0,
          xp_this_week: 0,
          week_reset_at: new Date(),
        },
      });
    }
    return xpRecord;
  }

  async getRecentTransactions(userId: string, limit = 10) {
    return prisma.xpTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async awardXp(userId: string, amount: number, reason: string) {
    await prisma.xpTransaction.create({
      data: { user_id: userId, amount, reason },
    });

    const xpRecord = await prisma.userXp.findUnique({ where: { user_id: userId } });
    if (!xpRecord) {
      return prisma.userXp.create({
        data: {
          user_id: userId,
          total_xp: amount,
          xp_this_week: amount,
          week_reset_at: new Date(),
        },
      });
    } else {
      return prisma.userXp.update({
        where: { user_id: userId },
        data: {
          total_xp: { increment: amount },
          xp_this_week: { increment: amount },
        },
      });
    }
  }
}

export const gamificationRepository = new GamificationRepository();
