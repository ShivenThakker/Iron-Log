import { z } from 'zod';

export const logWeightSchema = z.object({
  weight_kg: z.number().positive('Weight must be positive'),
  notes: z.string().optional(),
});

export const logMeasurementSchema = z.object({
  chest_cm: z.number().positive().optional(),
  waist_cm: z.number().positive().optional(),
  hips_cm: z.number().positive().optional(),
  left_arm_cm: z.number().positive().optional(),
  right_arm_cm: z.number().positive().optional(),
  biceps_left_cm: z.number().positive().optional(),
  biceps_right_cm: z.number().positive().optional(),
  left_thigh_cm: z.number().positive().optional(),
  right_thigh_cm: z.number().positive().optional(),
  thigh_left_cm: z.number().positive().optional(),
  thigh_right_cm: z.number().positive().optional(),
  calves_cm: z.number().positive().optional(),
  shoulders_cm: z.number().positive().optional(),
  neck_cm: z.number().positive().optional(),
  body_fat_pct: z.number().positive().optional(),
  logged_at: z.string().optional(),
}).transform((data) => ({
  ...data,
  left_arm_cm: data.left_arm_cm ?? data.biceps_left_cm,
  right_arm_cm: data.right_arm_cm ?? data.biceps_right_cm,
  left_thigh_cm: data.left_thigh_cm ?? data.thigh_left_cm,
  right_thigh_cm: data.right_thigh_cm ?? data.thigh_right_cm,
}));
