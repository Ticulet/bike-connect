import { Router } from 'express';
import passport from 'passport';
import { authLimiter } from '../../middleware/rate-limit.js';
import { requireAuth } from '../../middleware/auth.js';
import { googleCallback, logout, me } from './auth.controller.js';

export const authRouter = Router();

// Rate limit the OAuth entry + callback only — not /me or /logout which
// are called frequently by the frontend on every page load.
authRouter.get('/google', authLimiter, passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

authRouter.get(
  '/google/callback',
  authLimiter,
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback,
);

authRouter.post('/logout', requireAuth, logout);

authRouter.get('/me', requireAuth, me);
