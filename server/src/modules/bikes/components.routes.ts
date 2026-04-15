import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createComponentSchema, updateComponentSchema } from '@bike-connect/shared';
import * as componentsController from './components.controller.js';

export const componentsRouter = Router({ mergeParams: true });

componentsRouter.get('/', optionalAuth, componentsController.list);
componentsRouter.post(
  '/',
  requireAuth,
  validate(createComponentSchema, 'body'),
  componentsController.create,
);
componentsRouter.patch(
  '/:componentId',
  requireAuth,
  validate(updateComponentSchema, 'body'),
  componentsController.update,
);
componentsRouter.delete('/:componentId', requireAuth, componentsController.remove);
