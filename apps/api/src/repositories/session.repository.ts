import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class SessionRepository {
  async createSession(userId: string, data: any) {
    return prisma.workoutSession.create({
      data: {
        user: { connect: { id: userId } },
        started_at: data.started_at || new Date(),
        session_date: data.session_date || new Date(),
        workoutDay: data.workout_day_id ? { connect: { id: data.workout_day_id } } : undefined
      }
    });
  }

  async getSession(id: string, userId: string) {
    return prisma.workoutSession.findFirst({
      where: { id, user_id: userId },
      include: { exerciseSets: true, personalRecords: true, periodizationSuggestions: true }
    });
  }

  async addSet(sessionId: string, data: any) {
    return prisma.exerciseSet.create({
      data: {
        session_id: sessionId,
        exercise_id: data.exercise_id,
        set_number: data.set_number,
        set_type: data.set_type || 'normal',
        reps: data.reps,
        weight_kg: data.weight_kg,
        duration_seconds: data.duration_seconds,
        rpe: data.rpe
      }
    });
  }

  async finishSession(id: string, userId: string) {
    const session = await prisma.workoutSession.update({
      where: { id, user_id: userId },
      data: { finished_at: new Date() }
    });

    await prisma.xpTransaction.create({
      data: { user_id: userId, amount: 50, reason: 'Completed Workout Session' }
    });

    const xpRecord = await prisma.userXp.findUnique({ where: { user_id: userId } });
    if (!xpRecord) {
      await prisma.userXp.create({
        data: { user_id: userId, total_xp: 50, xp_this_week: 50, week_reset_at: new Date() }
      });
    } else {
      await prisma.userXp.update({
        where: { user_id: userId },
        data: { total_xp: { increment: 50 }, xp_this_week: { increment: 50 } }
      });
    }

    return session;
  }
  
  async getSessions(userId: string) {
    return prisma.workoutSession.findMany({
      where: { user_id: userId },
      orderBy: { started_at: 'desc' }
    });
  }
}
export const sessionRepository = new SessionRepository();
