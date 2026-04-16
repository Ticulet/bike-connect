import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBikeSchema, updateBikeSchema } from '@bike-connect/shared';
import * as bikesController from './bikes.controller.js';
import { componentsRouter } from './components.routes.js';
import { maintenanceRouter } from '../maintenance/maintenance.routes.js';

export const bikesRouter = Router();

bikesRouter.get('/', requireAuth, bikesController.listMine);
bikesRouter.get('/:id', optionalAuth, bikesController.getById);
bikesRouter.post('/', requireAuth, validate(createBikeSchema, 'body'), bikesController.create);
bikesRouter.patch('/:id', requireAuth, validate(updateBikeSchema, 'body'), bikesController.update);
bikesRouter.delete('/:id', requireAuth, bikesController.remove);

bikesRouter.use('/:id/components', componentsRouter);
bikesRouter.use('/:id/maintenance', maintenanceRouter);
