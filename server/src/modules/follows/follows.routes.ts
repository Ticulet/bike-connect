import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import * as followsController from './follows.controller.js';

export const userFollowsRouter = Router({ mergeParams: true });

userFollowsRouter.get('/stats', optionalAuth, followsController.getStats);
userFollowsRouter.post('/toggle', requireAuth, followsController.toggle);
userFollowsRouter.get('/followers', followsController.listFollowers);
userFollowsRouter.get('/following', followsController.listFollowing);
