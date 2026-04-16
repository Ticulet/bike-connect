import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { postQuerySchema } from '@bike-connect/shared';
import * as feedController from './feed.controller.js';

export const feedRouter = Router();

feedRouter.get('/', requireAuth, validate(postQuerySchema, 'query'), feedController.getFeed);
