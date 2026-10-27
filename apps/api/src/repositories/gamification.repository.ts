import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

let cachedTrophies: any[] | null = null;
let lastTrophyFetch = 0;
const TROPHY_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export class GamificationRepository {
  async getOrCreateUserXp(userId: string) {
    return prisma.userXp.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        total_xp: 0,
        xp_this_week: 0,
        week_reset_at: new Date(),
      },
      update: {},
    });
  }

  async getRecentTransactions(userId: string, limit = 10) {
    return prisma.xpTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async awardXp(userId: string, amount: number, reason: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    await client.xpTransaction.create({
      data: { user_id: userId, amount, reason },
    });

    return client.userXp.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        total_xp: amount,
        xp_this_week: amount,
        week_reset_at: new Date(),
      },
      update: {
        total_xp: { increment: amount },
        xp_this_week: { increment: amount },
      },
    });
  }

  async getTrophyCase(userId: string) {
    const now = Date.now();
    let allTrophies = cachedTrophies;
    if (!allTrophies || now - lastTrophyFetch > TROPHY_CACHE_TTL) {
      allTrophies = await prisma.trophy.findMany({
        orderBy: { xp_reward: 'asc' },
      });
      cachedTrophies = allTrophies;
      lastTrophyFetch = now;
    }

    const unlockedTrophies = await prisma.userTrophy.findMany({
      where: { user_id: userId },
    });

    const unlockedMap = new Map<string, Date>();
    for (const ut of unlockedTrophies) {
      unlockedMap.set(ut.trophy_id, ut.unlocked_at);
    }

    const trophiesWithStatus = allTrophies.map((trophy) => ({
      id: trophy.id,
      name: trophy.name,
      description: trophy.description,
      category: trophy.category,
      requirement_type: trophy.requirement_type,
      requirement_value: trophy.requirement_value,
      xp_reward: trophy.xp_reward,
      is_unlocked: unlockedMap.has(trophy.id),
      unlocked_at: unlockedMap.get(trophy.id) || null,
    }));

    const totalCount = trophiesWithStatus.length;
    const unlockedCount = trophiesWithStatus.filter((t) => t.is_unlocked).length;

    const categories = {
      streak: trophiesWithStatus.filter((t) => t.category === 'streak'),
      workouts: trophiesWithStatus.filter((t) => t.category === 'workouts'),
      milestones: trophiesWithStatus.filter((t) => t.category === 'milestones'),
      special: trophiesWithStatus.filter((t) => t.category === 'special'),
    };

    return {
      progress: `${unlockedCount}/${totalCount}`,
      unlockedCount,
      totalCount,
      categories,
      trophies: trophiesWithStatus,
    };
  }

  async checkAndUnlockTrophies(userId: string) {
    const [userTrophies, allTrophies, workoutCount, prCount, streak] = await Promise.all([
      prisma.userTrophy.findMany({ where: { user_id: userId }, select: { trophy_id: true } }),
      prisma.trophy.findMany(),
      prisma.workoutSession.count({ where: { user_id: userId, finished_at: { not: null } } }),
      prisma.personalRecord.count({ where: { user_id: userId } }),
      prisma.streak.findUnique({ where: { user_id: userId } }),
    ]);

    const currentStreakDays = streak?.current_streak || 0;
    const unlockedIds = new Set(userTrophies.map((ut) => ut.trophy_id));
    const newlyUnlocked: string[] = [];

    for (const trophy of allTrophies) {
      if (unlockedIds.has(trophy.id)) continue;

      let qualified = false;

      if (trophy.requirement_type === 'workout_count' && workoutCount >= (trophy.requirement_value || 1)) {
        qualified = true;
      } else if (trophy.requirement_type === 'pr_count' && prCount >= (trophy.requirement_value || 1)) {
        qualified = true;
      } else if (trophy.requirement_type === 'streak_days' && currentStreakDays >= (trophy.requirement_value || 7)) {
        qualified = true;
      }

      if (qualified) {
        try {
          await prisma.userTrophy.create({
            data: {
              user_id: userId,
              trophy_id: trophy.id,
              unlocked_at: new Date(),
            },
          });
          if (trophy.xp_reward && trophy.xp_reward > 0) {
            await this.awardXp(userId, trophy.xp_reward, `Unlocked Trophy: ${trophy.name}`);
          }
          newlyUnlocked.push(trophy.name);
        } catch {
          // Trophy already unlocked concurrently
        }
      }
    }

    return newlyUnlocked;
  }
}

export const gamificationRepository = new GamificationRepository();
