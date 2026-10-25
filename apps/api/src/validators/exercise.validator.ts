import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, 'Exercise name is required').max(100),
  primary_muscle: z.string().trim().min(1, 'Primary muscle is required').max(50),
  secondary_muscles: z.union([z.string(), z.array(z.string())]).optional(),
  equipment: z.string().trim().min(1, 'Equipment is required').max(50).default('Barbell'),
  exercise_type: z.enum(['reps', 'duration', 'bodyweight', 'cardio']).default('reps'),
  instructions: z.string().max(2000).optional(),
});
