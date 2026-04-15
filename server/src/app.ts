import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { router } from './routes/index.js';
import { ApiError } from './lib/api-error.js';

export const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// Global rate limiter
app.use(globalLimiter);

// Cookie parser
app.use(cookieParser());

// JSON body parser (10 MB limit)
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', router);

// 404 handler — must come after all routes
app.use((_req, _res, next) => {
  next(ApiError.notFound('Route'));
});

// Centralised error handler — must be last
app.use(errorHandler);
