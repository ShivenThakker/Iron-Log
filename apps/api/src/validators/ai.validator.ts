import { z } from 'zod';
import { AI_LIMITS, ALLOWED_IMAGE_TYPES, matchesInjectionPattern, sanitizeUserText } from '../utils/promptGuard';

const NOT_ALLOWED = 'That message cannot be processed. Please rephrase it.';

const userText = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .transform(sanitizeUserText)
    .refine((text) => text.length > 0, { message: 'Message is empty.' })
    .refine((text) => !matchesInjectionPattern(text), { message: NOT_ALLOWED });

export const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z
    .union([
      z.string().transform(sanitizeUserText).refine((text) => !matchesInjectionPattern(text), { message: NOT_ALLOWED }),
      z.array(
        z.object({
          text: z.string().transform(sanitizeUserText).refine((text) => !matchesInjectionPattern(text), { message: NOT_ALLOWED }),
        })
      ),
    ])
    .optional(),
  message: z.string().transform(sanitizeUserText).refine((text) => !matchesInjectionPattern(text), { message: NOT_ALLOWED }).optional(),
});

export const chatMessageSchema = z.object({
  message: userText(AI_LIMITS.CHAT_MESSAGE_MAX),
  history: z.array(z.union([chatHistoryItemSchema, z.record(z.string(), z.any())])).max(20).optional(),
});

export const analyzeWorkoutSchema = z.object({
  routine: z.record(z.string(), z.any()).optional(),
});

export const generatePlanSchema = z
  .object({
    goal: z.string().max(200).optional().transform((v) => (v ? sanitizeUserText(v) : undefined)),
    experience_level: z.string().max(100).optional().transform((v) => (v ? sanitizeUserText(v) : undefined)),
    days_per_week: z.coerce.number().int().min(1).max(7).optional(),
    preferences: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

export const parsePlanSchema = z
  .object({
    text: userText(AI_LIMITS.PARSE_PLAN_TEXT_MAX).optional(),
    imageBase64: z.string().min(1).max(AI_LIMITS.IMAGE_BASE64_MAX).optional(),
    mimeType: z.enum(ALLOWED_IMAGE_TYPES).optional(),
  })
  .refine((body) => Boolean(body.text) || Boolean(body.imageBase64), { message: 'Send text or an image.' })
  .refine((body) => !body.imageBase64 || Boolean(body.mimeType), { message: 'mimeType is required with an image.' });

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
