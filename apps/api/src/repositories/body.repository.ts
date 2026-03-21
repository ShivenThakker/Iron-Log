import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class BodyRepository {
  async logWeight(userId: string, weightKg: number) {
    const log = await prisma.bodyWeightLog.create({
      data: {
        user: { connect: { id: userId } },
        weight_kg: weightKg,
        logged_at: new Date()
      }
    });

    // Gamification XP for consistency
    await prisma.xpTransaction.create({
       data: { user_id: userId, amount: 10, reason: 'Logged Bodyweight' }
    });

    return log;
  }

  async getWeightHistory(userId: string) {
    return prisma.bodyWeightLog.findMany({
      where: { user_id: userId },
      orderBy: { logged_at: 'asc' }
    });
  }

  async getWeightGoal(userId: string) {
    return prisma.weightGoal.findUnique({
      where: { user_id: userId }
    });
  }

  async logMeasurement(userId: string, data: any) {
    return prisma.bodyMeasurement.create({
      data: {
        user: { connect: { id: userId } },
        measurement_type: data.measurement_type,
        value_cm: data.value_cm,
        logged_at: new Date()
      }
    });
  }
}
export const bodyRepository = new BodyRepository();
