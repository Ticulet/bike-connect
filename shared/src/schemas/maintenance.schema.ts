import { z } from 'zod';
import { MAINTENANCE_TYPES } from '../constants/enums.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

export const createMaintenanceLogSchema = z.object({
  component_id: z.string().uuid().nullable().optional(),
  type: z.enum(MAINTENANCE_TYPES),
  title: z.string().min(1).max(VALIDATION_LIMITS.MAINTENANCE_TITLE_MAX),
  description: z.string().max(VALIDATION_LIMITS.MAINTENANCE_DESCRIPTION_MAX).optional(),
  cost: z.number().nonnegative().multipleOf(0.01).nullable().optional(),
  mileage_at_service: z.number().int().nonnegative().optional(),
  performed_at: z.string().date(),
});

export const updateMaintenanceLogSchema = createMaintenanceLogSchema.partial();
