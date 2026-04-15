import { z } from 'zod';
import { BIKE_TYPES } from '../constants/enums.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createBikeSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.BIKE_NAME_MAX),
  brand: z.string().min(1).max(VALIDATION_LIMITS.BIKE_BRAND_MAX),
  model: z.string().min(1).max(VALIDATION_LIMITS.BIKE_MODEL_MAX),
  year: z
    .number()
    .int()
    .min(VALIDATION_LIMITS.BIKE_YEAR_MIN)
    .refine(
      (y) => y <= new Date().getFullYear() + 1,
      'Year cannot be more than one year in the future',
    ),
  type: z.enum(BIKE_TYPES),
  description: z.string().max(VALIDATION_LIMITS.BIKE_DESCRIPTION_MAX).optional(),
  is_public: z.boolean().default(false),
});

export const updateBikeSchema = createBikeSchema.partial();
