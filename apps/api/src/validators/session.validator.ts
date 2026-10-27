import { z } from 'zod';

export const startSessionSchema = z.object({
  name: z.string().min(1).default('Quick Workout'),
  program_id: z.string().optional(),
  notes: z.string().optional(),
}).optional().default({ name: 'Quick Workout' });

export const addSetSchema = z.object({
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  set_number: z.number().int().min(1),
  weight_kg: z.number().nonnegative().optional().default(0),
  reps: z.number().int().nonnegative(),
  rpe: z.number().min(1).max(10).optional().nullable(),
  set_type: z.enum(['normal', 'warmup', 'dropset', 'failure', 'amrap']).default('normal'),
});

export const finishSessionSchema = z.object({
  notes: z.string().optional(),
  total_volume_kg: z.number().nonnegative().optional(),
  duration_sec: z.number().int().nonnegative().optional(),
}).optional().default({});

export const retroactiveSessionSchema = z.object({
  session_date: z.string().min(1, 'Session date is required'),
  duration_minutes: z.number().int().min(1).max(600).optional(),
  notes: z.string().max(1000).optional(),
  exercises: z.array(
    z.object({
      exercise_id: z.string().optional(),
      exercise_name: z.string().min(1),
      sets: z.array(
        z.object({
          set_number: z.number().int().min(1),
          weight_kg: z.number().nonnegative().default(0),
          reps: z.number().int().nonnegative().default(0),
          set_type: z.enum(['normal', 'warmup', 'dropset', 'drop', 'failure', 'amrap']).default('normal'),
          rpe: z.number().min(1).max(10).optional().nullable(),
        })
      ).min(1, 'At least one set is required per exercise'),
    })
  ).min(1, 'At least one exercise is required'),
});

export const importSpreadsheetSchema = z.object({
  fileData: z.string().min(1, 'File data is required'),
  fileType: z.enum(['csv', 'excel']).optional(),
  fileName: z.string().optional(),
});
