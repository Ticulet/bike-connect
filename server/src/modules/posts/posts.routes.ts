import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { postCreationLimiter } from '../../middleware/rate-limit.js';
import { createPostSchema, updatePostSchema, postQuerySchema } from '@bike-connect/shared';
import * as postsController from './posts.controller.js';

export const postsRouter = Router();

postsRouter.get('/', validate(postQuerySchema, 'query'), postsController.list);
postsRouter.get('/me', requireAuth, postsController.listMine);
postsRouter.get('/by-id/:id', requireAuth, postsController.getById);
postsRouter.get('/:slug', postsController.getBySlug);
postsRouter.post('/', requireAuth, postCreationLimiter, validate(createPostSchema, 'body'), postsController.create);
postsRouter.patch('/:id', requireAuth, validate(updatePostSchema, 'body'), postsController.update);
postsRouter.delete('/:id', requireAuth, postsController.remove);
