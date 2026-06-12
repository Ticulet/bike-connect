import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'node:path';
import './modules/auth/passport.config.js';
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

// Rate limiter — scoped to /api so static /uploads images (and other assets)
// don't consume the request budget; only real API calls are counted.
app.use('/api', globalLimiter);

// Cookie parser
app.use(cookieParser());

// Passport (session: false — stateless JWT auth)
app.use(passport.initialize());

// JSON body parser (conservative global limit; routes needing more override per-route)
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', router);

// Local upload static serving — only when storage is local
if (env.IMAGE_STORAGE === 'local') {
  app.use('/uploads', express.static(path.resolve(env.LOCAL_UPLOAD_DIR)));
}

// 404 handler — must come after all routes
app.use((_req, _res, next) => {
  next(ApiError.notFound('Route'));
});

// Centralised error handler — must be last
app.use(errorHandler);
