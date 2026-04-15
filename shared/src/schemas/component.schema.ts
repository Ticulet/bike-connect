import { z } from 'zod';
import { COMPONENT_CATEGORIES } from '../constants/enums.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createComponentSchema = z.object({
  category: z.enum(COMPONENT_CATEGORIES),
  name: z.string().min(1).max(VALIDATION_LIMITS.COMPONENT_NAME_MAX),
  brand: z.string().max(VALIDATION_LIMITS.COMPONENT_BRAND_MAX).optional(),
  model: z.string().max(VALIDATION_LIMITS.COMPONENT_MODEL_MAX).optional(),
  installed_at: z.string().date().optional(),
  mileage_at_install: z.number().int().nonnegative().optional(),
  notes: z.string().max(VALIDATION_LIMITS.COMPONENT_NOTES_MAX).optional(),
});

export const updateComponentSchema = createComponentSchema.partial();
