import { z } from 'zod';

export const createEquipmentProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').max(100),
  equipment_types: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});
