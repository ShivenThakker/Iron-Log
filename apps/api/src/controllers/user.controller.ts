import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  fitness_goal: z.string().optional(),
  activity_level: z.string().optional(),
  experience_level: z.string().optional(),
  training_style: z.string().optional(),
  training_split_preference: z.string().optional(),
  schedule_days_per_week: z.number().int().min(1).max(7).optional(),
  session_duration_min: z.number().int().min(15).max(180).optional(),
  workout_duration_min: z.number().int().min(15).max(180).optional(),
  height_cm: z.number().positive().optional(),
  unit_system: z.enum(['metric', 'imperial']).optional(),
  target_weight_kg: z.number().positive().optional(),
  injuries: z.union([z.string(), z.array(z.string())]).optional(),
  injuries_limitations: z.union([z.string(), z.array(z.string())]).optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  track_nutrition: z.boolean().optional(),
  daily_calorie_target: z.number().optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await userService.getProfile(userId);
    if (!profile) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }
    res.status(200).json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch profile';
    res.status(500).json({ error: message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id; 
    const validated = updateProfileSchema.parse(req.body);
    
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.training_split_preference && !updateData.training_style) {
      updateData.training_style = validated.training_split_preference;
    }
    delete updateData.training_split_preference;

    if (validated.workout_duration_min && !updateData.session_duration_min) {
      updateData.session_duration_min = validated.workout_duration_min;
    }
    delete updateData.workout_duration_min;

    if (validated.injuries_limitations && !updateData.injuries) {
      updateData.injuries = validated.injuries_limitations;
    }
    delete updateData.injuries_limitations;

    if (validated.date_of_birth) {
      updateData.date_of_birth = new Date(validated.date_of_birth);
    }
    if (Array.isArray(updateData.injuries)) {
      updateData.injuries = JSON.stringify(updateData.injuries);
    }

    const updatedUser = await userService.updateProfile(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    res.status(400).json({ error: message });
  }
};
