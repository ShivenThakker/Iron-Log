import { PrismaClient, Prisma } from '@prisma/client';
import { sqliteAdapter } from '../lib/prisma-adapter';

const prisma = new PrismaClient({ adapter: sqliteAdapter });

export class UserRepository {
  async updateUserProfile(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async setWeightGoal(userId: string, targetKg: number) {
    return prisma.weightGoal.upsert({
      where: { user_id: userId },
      create: { user_id: userId, goal_weight_kg: targetKg },
      update: { goal_weight_kg: targetKg },
    });
  }
}

export const userRepository = new UserRepository();
