import { z } from 'zod';

export const logWeightSchema = z.object({
  weight_kg: z.number().positive('Weight must be positive'),
  notes: z.string().optional(),
});

export const logMeasurementSchema = z.object({
  chest_cm: z.number().positive().optional(),
  waist_cm: z.number().positive().optional(),
  hips_cm: z.number().positive().optional(),
  biceps_left_cm: z.number().positive().optional(),
  biceps_right_cm: z.number().positive().optional(),
  thigh_left_cm: z.number().positive().optional(),
  thigh_right_cm: z.number().positive().optional(),
  calves_cm: z.number().positive().optional(),
  shoulders_cm: z.number().positive().optional(),
  neck_cm: z.number().positive().optional(),
});
