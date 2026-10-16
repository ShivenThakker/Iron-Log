import { z } from 'zod';

export const createProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  description: z.string().optional(),
  split_type: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_active: z.boolean().default(true),
});

export const updateProgramSchema = createProgramSchema.partial();
