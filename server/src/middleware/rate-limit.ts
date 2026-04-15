import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const rateLimitResponse = (code: string, message: string) => ({
  error: { code, message },
});

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('RATE_LIMITED', 'Too many requests'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('RATE_LIMITED', 'Too many requests'),
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('RATE_LIMITED', 'Too many requests'),
});

export const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse('RATE_LIMITED', 'Too many requests'),
});
