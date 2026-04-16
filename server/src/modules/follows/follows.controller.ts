import type { Request, Response, NextFunction } from 'express';
import { followsService } from './follows.service.js';

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const stats = await followsService.getFollowStats(id, req.user?.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const result = await followsService.toggleFollow(req.user!.id, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const followers = await followsService.listFollowers(id);
    res.json(followers);
  } catch (err) {
    next(err);
  }
}

export async function listFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const following = await followsService.listFollowing(id);
    res.json(following);
  } catch (err) {
    next(err);
  }
}
