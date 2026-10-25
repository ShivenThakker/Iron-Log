import { Prisma } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { nutritionRepository } from '../repositories/nutrition.repository';

export interface UpdateProfileInput extends Prisma.UserUpdateInput {
  target_weight_kg?: number;
  daily_calorie_target?: number;
  track_nutrition?: boolean;
}

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.getUserProfile(userId);
    if (!user) return null;
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile: {
        fitness_goal: user.fitness_goal,
        experience_level: user.experience_level,
        daily_calorie_target: user.nutritionGoal?.daily_calories ?? 2500,
        schedule_days_per_week: user.schedule_days_per_week,
        height_cm: user.height_cm,
        target_weight_kg: user.weightGoal?.goal_weight_kg,
      },
    };
  }

  async updateProfile(userId: string, profileData: UpdateProfileInput) {
    const { target_weight_kg, daily_calorie_target, track_nutrition, ...userData } = profileData;
    
    if (target_weight_kg !== undefined) {
      await userRepository.setWeightGoal(userId, target_weight_kg);
    }

    if (daily_calorie_target !== undefined) {
      await nutritionRepository.setNutritionGoal(userId, { daily_calories: daily_calorie_target });
    }
    
    return userRepository.updateUserProfile(userId, userData);
  }
}

export const userService = new UserService();
