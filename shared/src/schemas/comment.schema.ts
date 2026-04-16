import { z } from 'zod';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createCommentSchema = z.object({
  content: z.string().min(1).max(VALIDATION_LIMITS.COMMENT_CONTENT_MAX),
  parent_id: z.string().uuid().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(VALIDATION_LIMITS.COMMENT_CONTENT_MAX),
});
