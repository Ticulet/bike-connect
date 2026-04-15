import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../lib/api-error.js';
import { imageStorage } from './images.service.js';

export async function upload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }
    const result = await imageStorage.upload(req.file);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
