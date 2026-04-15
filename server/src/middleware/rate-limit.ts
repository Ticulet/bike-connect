import rateLimit from 'express-rate-limit';

const rateLimitResponse = (code: string, message: string) => ({
  error: { code, message },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
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
