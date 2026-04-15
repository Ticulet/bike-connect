import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const updateUserSchema = z.object({
  display_name: z.string().min(1).max(VALIDATION_LIMITS.USER_DISPLAY_NAME_MAX).optional(),
  bio: z.string().max(VALIDATION_LIMITS.USER_BIO_MAX).optional(),
});
