import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema } from '@bike-connect/shared';
import * as usersController from './users.controller.js';

export const usersRouter = Router();

// /me MUST be before /:id to prevent "me" being treated as an id param
usersRouter.patch('/me', requireAuth, validate(updateUserSchema, 'body'), usersController.updateMe);
usersRouter.get('/:id', usersController.getProfile);
