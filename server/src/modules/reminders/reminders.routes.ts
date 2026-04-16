import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as remindersController from './reminders.controller.js';

export const remindersRouter = Router({ mergeParams: true });
remindersRouter.get('/', requireAuth, remindersController.getReminders);
