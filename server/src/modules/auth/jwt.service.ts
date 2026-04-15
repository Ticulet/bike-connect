import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { Response } from 'express';
import { env } from '../../config/env.js';

const COOKIE_NAME = 'bike_connect_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  // JWT_EXPIRY is validated at startup via Zod (e.g. "7d"). The cast is safe
  // because jsonwebtoken requires the ms-compatible StringValue type but Zod
  // infers z.string() as plain string. Runtime validity is guaranteed by env schema.
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as StringValue,
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

  if (typeof payload !== 'object' || payload === null || typeof (payload as Record<string, unknown>)['sub'] !== 'string') {
    throw new Error('Invalid token payload');
  }

  return { sub: (payload as Record<string, unknown>)['sub'] as string };
}

export function setTokenCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_MS,
  });
}

export function clearTokenCookie(res: Response): void {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function getTokenFromCookies(cookies: Record<string, unknown>): string | undefined {
  const value = cookies[COOKIE_NAME];
  return typeof value === 'string' ? value : undefined;
}
