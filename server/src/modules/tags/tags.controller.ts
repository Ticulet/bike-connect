import type { Request, Response, NextFunction } from 'express';
import { tagsService } from './tags.service.js';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawSearch = req.query['search'];
    const search = typeof rawSearch === 'string' ? rawSearch : undefined;
    const tags = await tagsService.listTags(search);
    res.json(tags);
  } catch (err) {
    next(err);
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slug = req.params['slug'] as string;
    const tag = await tagsService.getTagBySlug(slug);
    res.json(tag);
  } catch (err) {
    next(err);
  }
}
