import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createRideSchema = z.object({
  distance_km: z
    .number()
    .positive()
    .max(VALIDATION_LIMITS.RIDE_DISTANCE_MAX)
    .multipleOf(0.01),
  duration_min: z.number().int().positive().optional(),
  date: z.string().date(),
  notes: z.string().max(VALIDATION_LIMITS.RIDE_NOTES_MAX).optional(),
});

export const updateRideSchema = createRideSchema.partial();
