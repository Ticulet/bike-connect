import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createRideSchema, updateRideSchema } from '@bike-connect/shared';
import * as ridesController from './rides.controller.js';

export const ridesRouter = Router({ mergeParams: true });

ridesRouter.get('/', requireAuth, ridesController.list);
ridesRouter.get('/stats', requireAuth, ridesController.getStats);
ridesRouter.post('/', requireAuth, validate(createRideSchema, 'body'), ridesController.create);
ridesRouter.patch('/:rideId', requireAuth, validate(updateRideSchema, 'body'), ridesController.update);
ridesRouter.delete('/:rideId', requireAuth, ridesController.remove);
