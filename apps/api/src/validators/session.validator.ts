import { z } from 'zod';

export const startSessionSchema = z.object({
  name: z.string().min(1).default('Quick Workout'),
  program_id: z.string().optional(),
  notes: z.string().optional(),
});

export const addSetSchema = z.object({
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  set_number: z.number().int().min(1),
  weight_kg: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  set_type: z.enum(['normal', 'warmup', 'dropset', 'failure', 'amrap']).default('normal'),
});

export const finishSessionSchema = z.object({
  notes: z.string().optional(),
  total_volume_kg: z.number().nonnegative().optional(),
  duration_sec: z.number().int().nonnegative().optional(),
});
