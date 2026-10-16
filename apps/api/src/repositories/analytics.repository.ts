import { prisma } from '../lib/prisma';

export class AnalyticsRepository {
  async getWorkoutStats(userId: string) {
    const totalSessions = await prisma.workoutSession.count({ 
      where: { user_id: userId, finished_at: { not: null } } 
    });
    
    const prCount = await prisma.personalRecord.count({ 
      where: { user_id: userId } 
    });
    
    const totalSets = await prisma.exerciseSet.count({
      where: { session: { user_id: userId } }
    });

    return { totalSessions, prCount, totalSets };
  }
}

export const analyticsRepository = new AnalyticsRepository();
