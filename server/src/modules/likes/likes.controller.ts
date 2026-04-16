import type { Request, Response, NextFunction } from 'express';
import { likesService } from './likes.service.js';

export async function toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params['postId'] as string;
    const result = await likesService.toggleLike(req.user!.id, postId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params['postId'] as string;
    const result = await likesService.getInfo(postId, req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
