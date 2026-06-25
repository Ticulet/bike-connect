import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from '@bike-connect/shared';
import * as usersController from './users.controller.js';
import * as bikesController from '../bikes/bikes.controller.js';
import * as ridesController from '../rides/rides.controller.js';
import { userFollowsRouter } from '../follows/follows.routes.js';

export const usersRouter = Router();

// /me MUST be before /:id to prevent "me" being treated as an id param
usersRouter.patch('/me', requireAuth, validate(updateUserSchema, 'body'), usersController.updateMe);
usersRouter.get('/me/ride-stats', requireAuth, ridesController.getMyMonthlyStats);
usersRouter.get('/:id', usersController.getProfile);
usersRouter.get('/:id/bikes', bikesController.listPublicByUser);
usersRouter.get('/:id/activity', usersController.getActivity);
usersRouter.use('/:id/follows', userFollowsRouter);
