import { z } from 'zod';

export const parsedExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  target_sets: z.coerce.number().int().min(1).max(20).default(3),
  target_reps: z.union([z.string(), z.number()]).transform((val) => String(val)),
  target_weight_kg: z.coerce.number().min(0).max(1000).optional().nullable(),
  rest_seconds: z.coerce.number().int().min(0).max(900).optional().default(90),
  superset_group_id: z.string().max(40).optional().nullable(),
});

export const parsedDaySchema = z.object({
  day_name: z.string().min(1).max(100),
  is_rest_day: z.boolean().optional(),
  exercises: z.array(parsedExerciseSchema).max(30),
});

export const parsedWorkoutPlanSchema = z.object({
  program_name: z.string().min(1).max(100),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  schedule_days_per_week: z.coerce.number().int().min(1).max(7).optional().default(3),
  description: z.string().max(1000).optional(),
  days: z.array(parsedDaySchema).min(1).max(7),
});
