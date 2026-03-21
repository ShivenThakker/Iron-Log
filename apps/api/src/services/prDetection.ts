import { PrismaClient } from '@prisma/client';
import { sqliteAdapter } from '../lib/prisma-adapter';

const prisma = new PrismaClient({ adapter: sqliteAdapter });

export const calculateEstimated1RM = (weightKg: number, reps: number) => {
  return weightKg * (1 + reps / 30);
};

export const checkAndCreatePR = async (userId: string, exerciseId: string, weightKg: number, reps: number, sessionId: string) => {
  const currentPR = await prisma.personalRecord.findFirst({
    where: { user_id: userId, exercise_id: exerciseId },
    orderBy: { estimated_1rm_kg: 'desc' }
  });

  const estimated1RM = calculateEstimated1RM(weightKg, reps);

  if (!currentPR || estimated1RM > (currentPR.estimated_1rm_kg ?? 0)) {
    const newPr = await prisma.personalRecord.create({
      data: {
        user_id: userId,
        exercise_id: exerciseId,
        weight_kg: weightKg,
        reps,
        estimated_1rm_kg: estimated1RM,
        session_id: sessionId,
        achieved_at: new Date()
      }
    });

    await prisma.xpTransaction.create({
      data: { user_id: userId, amount: 25, reason: 'New Personal Record' }
    });
    
    // Check if user xp record exists
    const xpRecord = await prisma.userXp.findUnique({ where: { user_id: userId } });
    if (!xpRecord) {
      await prisma.userXp.create({
        data: { user_id: userId, total_xp: 25, xp_this_week: 25, week_reset_at: new Date() }
      });
    } else {
      await prisma.userXp.update({
        where: { user_id: userId },
        data: { total_xp: { increment: 25 }, xp_this_week: { increment: 25 } }
      });
    }

    return { isNewPR: true, record: newPr };
  }

  return { isNewPR: false };
};
