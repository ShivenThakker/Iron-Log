import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';

const updateProfileSchema = z.object({
  fitness_goal: z.string().optional(),
  activity_level: z.string().optional(),
  experience_level: z.string().optional(),
  training_style: z.string().optional(),
  schedule_days_per_week: z.number().int().min(1).max(7).optional(),
  session_duration_min: z.number().int().min(15).max(180).optional(),
  height_cm: z.number().positive().optional(),
  unit_system: z.enum(['metric', 'imperial']).optional(),
  target_weight_kg: z.number().positive().optional(),
  injuries: z.array(z.string()).optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional()
});

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; 
    const validated = updateProfileSchema.parse(req.body);
    
    let updateData: any = { ...validated };
    if (validated.date_of_birth) {
      updateData.date_of_birth = new Date(validated.date_of_birth);
    }

    const updatedUser = await userService.updateProfile(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile' });
  }
};
