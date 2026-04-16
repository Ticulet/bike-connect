import { Router } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBikeSchema, updateBikeSchema, exploreBikesQuerySchema } from '@bike-connect/shared';
import * as bikesController from './bikes.controller.js';
import { componentsRouter } from './components.routes.js';
import { maintenanceRouter } from '../maintenance/maintenance.routes.js';
import { ridesRouter } from '../rides/rides.routes.js';
import { remindersRouter } from '../reminders/reminders.routes.js';

export const bikesRouter = Router();

bikesRouter.get('/', requireAuth, bikesController.listMine);
bikesRouter.get('/explore', optionalAuth, validate(exploreBikesQuerySchema, 'query'), bikesController.listExplore);
bikesRouter.get('/:id', optionalAuth, bikesController.getById);
bikesRouter.post('/', requireAuth, validate(createBikeSchema, 'body'), bikesController.create);
bikesRouter.patch('/:id', requireAuth, validate(updateBikeSchema, 'body'), bikesController.update);
bikesRouter.delete('/:id', requireAuth, bikesController.remove);

bikesRouter.use('/:id/components', componentsRouter);
bikesRouter.use('/:id/maintenance', maintenanceRouter);
bikesRouter.use('/:id/rides', ridesRouter);
bikesRouter.use('/:id/reminders', remindersRouter);
