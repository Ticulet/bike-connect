import { randomUUID } from 'node:crypto';
import type { NewMaintenanceLog, MaintenanceType } from '../../src/db/types.js';
import { nextCounter } from './_counter.js';

interface MakeMaintenanceLogOptions extends Partial<NewMaintenanceLog> {
  bike_id: string;
}

export function makeMaintenanceLog(options: MakeMaintenanceLogOptions): NewMaintenanceLog {
  const n = nextCounter('maintenance');
  const type: MaintenanceType = options.type ?? 'service';
  const candidate: NewMaintenanceLog = {
    id: randomUUID(),
    component_id: null,
    type,
    title: `Test Service ${n}`,
    description: null,
    cost: null,
    mileage_at_service: null,
    performed_at: '2026-01-01',
    ...options,
  };
  return candidate;
}
