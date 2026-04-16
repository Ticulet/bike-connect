import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCommentSchema, updateCommentSchema } from '@bike-connect/shared';
import * as commentsController from './comments.controller.js';

// Nested under posts/:postId
export const postCommentsRouter = Router({ mergeParams: true });
postCommentsRouter.get('/', commentsController.list);
postCommentsRouter.post('/', requireAuth, validate(createCommentSchema, 'body'), commentsController.create);

// Top-level for individual comment ops
export const commentsRouter = Router();
commentsRouter.patch('/:id', requireAuth, validate(updateCommentSchema, 'body'), commentsController.update);
commentsRouter.delete('/:id', requireAuth, commentsController.remove);
