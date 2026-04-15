import { z } from 'zod';
import { POST_CATEGORIES, POST_STATUSES } from '../constants/enums.js';
import { PAGINATION, VALIDATION_LIMITS } from '../constants/config.js';

export const createPostSchema = z.object({
  title: z.string().min(1).max(VALIDATION_LIMITS.POST_TITLE_MAX),
  content: z.record(z.unknown()),
  excerpt: z.string().max(VALIDATION_LIMITS.POST_EXCERPT_MAX).optional(),
  cover_image_url: z.string().url().optional(),
  category: z.enum(POST_CATEGORIES),
  status: z.enum(POST_STATUSES).default('draft'),
  tag_ids: z.array(z.number().int().positive()).optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const postQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  category: z.enum(POST_CATEGORIES).optional(),
  tag: z.string().optional(),
});
