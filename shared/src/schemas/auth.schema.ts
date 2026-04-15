import { z } from 'zod';

export const googleCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().nullable(),
  created_at: z.string().datetime(),
});

// Auth uses httpOnly cookies — tokens are not exposed in response body
export const loginResponseSchema = z.object({
  user: authUserSchema,
});
