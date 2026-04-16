import type { Request, Response, NextFunction } from 'express';
import { bookmarksService } from './bookmarks.service.js';

export async function toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = req.params['postId'] as string;
    const result = await bookmarksService.toggleBookmark(req.user!.id, postId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bookmarks = await bookmarksService.listMine(req.user!.id);
    res.json(bookmarks);
  } catch (err) {
    next(err);
  }
}
