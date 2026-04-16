import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createMaintenanceLogSchema, updateMaintenanceLogSchema } from '@bike-connect/shared';
import * as maintenanceController from './maintenance.controller.js';

export const maintenanceRouter = Router({ mergeParams: true });

maintenanceRouter.get('/', requireAuth, maintenanceController.list);
maintenanceRouter.post(
  '/',
  requireAuth,
  validate(createMaintenanceLogSchema, 'body'),
  maintenanceController.create,
);
maintenanceRouter.patch(
  '/:logId',
  requireAuth,
  validate(updateMaintenanceLogSchema, 'body'),
  maintenanceController.update,
);
maintenanceRouter.delete('/:logId', requireAuth, maintenanceController.remove);
