import type { Request, Response, NextFunction } from 'express';
import { remindersService } from './reminders.service.js';

export async function getReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bikeId = req.params['id'] as string;
    const reminders = await remindersService.getBikeReminders(bikeId, req.user!.id);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
}
