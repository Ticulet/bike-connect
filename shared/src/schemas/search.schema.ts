import { z } from 'zod';
import { VALIDATION_LIMITS, PAGINATION } from '../constants/config.js';
import { BIKE_TYPES } from '../constants/enums.js';

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(VALIDATION_LIMITS.SEARCH_QUERY_MAX),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const exploreBikesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(12),
  type: z.enum(BIKE_TYPES).optional(),
});
