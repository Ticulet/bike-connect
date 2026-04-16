import type { Request, Response, NextFunction } from 'express';
import { feedService } from './feed.service.js';
import type { PostQuery } from '@bike-connect/shared';

export async function getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as PostQuery;
    const result = await feedService.getFeed(req.user!.id, query.cursor, query.limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
