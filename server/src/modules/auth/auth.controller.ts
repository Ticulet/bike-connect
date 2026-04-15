import type { Request, Response, NextFunction } from 'express';
import { processGoogleLogin } from './auth.service.js';
import { signToken, setTokenCookie, clearTokenCookie } from './jwt.service.js';
import { env } from '../../config/env.js';

export async function googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = req.googleProfile;
    if (!profile) {
      res.redirect(`${env.CORS_ORIGIN}/login`);
      return;
    }
    const user = await processGoogleLogin(profile);
    const token = signToken(user.id);
    setTokenCookie(res, token);
    res.redirect(`${env.CORS_ORIGIN}/dashboard`);
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response, next: NextFunction): void {
  try {
    clearTokenCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export function me(req: Request, res: Response): void {
  res.json(req.user);
}
