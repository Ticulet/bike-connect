import type { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const profile = await usersService.getPublicProfile(id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params['id'] as string;
    const activity = await usersService.listPublicActivity(id);
    res.json(activity);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await usersService.updateProfile(req.user!.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
