import { userRepository } from '../repositories/user.repository';

export class UserService {
  async updateProfile(userId: string, profileData: any) {
    const { target_weight_kg, ...userData } = profileData;
    
    if (target_weight_kg !== undefined) {
      await userRepository.setWeightGoal(userId, target_weight_kg);
    }
    
    return userRepository.updateUserProfile(userId, userData);
  }
}

export const userService = new UserService();
