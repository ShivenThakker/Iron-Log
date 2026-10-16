import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class UserRepository {
  async getUserProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        date_of_birth: true,
        gender: true,
        height_cm: true,
        unit_system: true,
        fitness_goal: true,
        activity_level: true,
        experience_level: true,
        training_style: true,
        schedule_days_per_week: true,
        session_duration_min: true,
        injuries: true,
        created_at: true,
        weightGoal: true,
        nutritionGoal: true,
      },
    });
  }

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
