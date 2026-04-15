import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createTagSchema = z.object({
  name: z.string().min(1).max(VALIDATION_LIMITS.TAG_NAME_MAX),
});

export const updateTagSchema = createTagSchema.partial();
