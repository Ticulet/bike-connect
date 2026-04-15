import type { Request, Response, NextFunction } from 'express';
import { getTokenFromCookies, verifyToken, clearTokenCookie } from '../modules/auth/jwt.service.js';
import { usersRepository } from '../modules/users/users.repository.js';
import { ApiError } from '../lib/api-error.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getTokenFromCookies(req.cookies as Record<string, unknown>);

  if (!token) {
    next(ApiError.unauthorized());
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await usersRepository.findById(payload.sub);

    if (!user) {
      clearTokenCookie(res);
      next(ApiError.unauthorized());
      return;
    }

    req.user = user;
    next();
  } catch {
    clearTokenCookie(res);
    next(ApiError.unauthorized());
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getTokenFromCookies(req.cookies as Record<string, unknown>);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await usersRepository.findById(payload.sub);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    clearTokenCookie(res);
    next();
  }
}
