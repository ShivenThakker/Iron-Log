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

export const retroactiveSessionSchema = z
  .object({
    date: z.string().optional(),
    session_date: z.string().optional(),
    workout_name: z.string().max(200).optional(),
    duration_minutes: z.coerce.number().int().min(1).max(600).optional().default(60),
    notes: z.string().max(1000).optional().nullable(),
    exercises: z
      .array(
        z
          .object({
            exercise_id: z.string().optional().nullable(),
            exercise_name: z.string().optional().nullable(),
            sets: z
              .array(
                z.object({
                  set_number: z.coerce.number().int().min(1).optional(),
                  weight_kg: z.coerce.number().nonnegative().optional().default(0),
                  reps: z.coerce.number().int().nonnegative().optional().default(0),
                  set_type: z
                    .enum(['normal', 'warmup', 'dropset', 'drop', 'failure', 'amrap'])
                    .optional()
                    .default('normal'),
                  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
                  duration_seconds: z.coerce.number().int().nonnegative().optional().nullable(),
                })
              )
              .min(1, 'At least one set is required per exercise'),
          })
          .refine(
            (ex) => !!(ex.exercise_id || (ex.exercise_name && ex.exercise_name.trim().length > 0)),
            {
              message: 'Either exercise_id or exercise_name is required',
            }
          )
      )
      .min(1, 'At least one exercise is required'),
  })
  .refine((data) => !!(data.date || data.session_date), {
    message: 'Session date is required',
    path: ['date'],
  });

export const importSpreadsheetSchema = z.object({
  fileData: z.string().min(1, 'File data is required'),
  fileType: z.enum(['csv', 'excel']).optional(),
  fileName: z.string().optional(),
  filename: z.string().optional(),
});
