import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { optionalAuth } from '../../middleware/auth.js';
import * as likesController from './likes.controller.js';

export const postLikesRouter = Router({ mergeParams: true });
postLikesRouter.get('/', optionalAuth, likesController.getInfo);
postLikesRouter.post('/toggle', requireAuth, likesController.toggle);
