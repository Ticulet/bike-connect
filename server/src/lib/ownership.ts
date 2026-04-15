import type { Request } from 'express';
import { ApiError } from './api-error.js';

export function assertOwnership(req: Request, resourceUserId: string): void {
  if (!req.user || req.user.id !== resourceUserId) {
    throw ApiError.forbidden('You do not own this resource');
  }
}
