import type { Request, Response, NextFunction } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { processGoogleLogin } from './auth.service.js';
import { signToken, setTokenCookie, clearTokenCookie } from './jwt.service.js';
import { env } from '../../config/env.js';

export async function googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // passport.config.ts passes the raw Google Profile through as the user.
    // We cast it back here to process the login before setting the real DB user.
    const profile = req.user as unknown as Profile;
    const user = await processGoogleLogin(profile);
    const token = signToken(user.id);
    setTokenCookie(res, token);
    res.redirect(`${env.CORS_ORIGIN}/dashboard`);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
}

export function me(req: Request, res: Response): void {
  res.json(req.user);
}
