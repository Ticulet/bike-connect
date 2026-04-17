import { describe, expect, it } from 'vitest';
import {
  createMaintenanceLogSchema,
  updateMaintenanceLogSchema,
} from './maintenance.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createMaintenanceLogSchema: optional nullable component_id UUID; type enum;
//   required title (min 1 / max 200); optional description (max 5000);
//   optional nullable cost (nonneg, multipleOf 0.01); optional mileage (int);
//   required performed_at date
// - updateMaintenanceLogSchema: partial

const validLog = {
  type: 'service' as const,
  title: 'Chain lube',
  performed_at: '2026-01-15',
};

describe('createMaintenanceLogSchema', () => {
  it('accepts a minimal valid log', () => {
    const result = createMaintenanceLogSchema.safeParse(validLog);

    expect(result.success).toBe(true);
  });

  it('accepts all maintenance types', () => {
    const types = ['service', 'repair', 'upgrade', 'inspection'] as const;
    for (const type of types) {
      const result = createMaintenanceLogSchema.safeParse({ ...validLog, type });

      expect(result.success).toBe(true);
    }
  });

  it('rejects an unknown type', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, type: 'mystery' });

    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, title: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a title over max', () => {
    const result = createMaintenanceLogSchema.safeParse({
      ...validLog,
      title: 'a'.repeat(VALIDATION_LIMITS.MAINTENANCE_TITLE_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a bad date', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, performed_at: '2026-13-40' });

    expect(result.success).toBe(false);
  });

  it('accepts a null component_id', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, component_id: null });

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID component_id', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, component_id: 'abc' });

    expect(result.success).toBe(false);
  });

  it('accepts a null cost', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, cost: null });

    expect(result.success).toBe(true);
  });

  it('rejects negative cost', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, cost: -10 });

    expect(result.success).toBe(false);
  });

  it('rejects a cost with too many decimals', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, cost: 12.345 });

    expect(result.success).toBe(false);
  });

  it('accepts a cost with two decimals', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, cost: 12.34 });

    expect(result.success).toBe(true);
  });

  it('rejects a negative mileage', () => {
    const result = createMaintenanceLogSchema.safeParse({ ...validLog, mileage_at_service: -5 });

    expect(result.success).toBe(false);
  });
});

describe('updateMaintenanceLogSchema', () => {
  it('accepts an empty payload', () => {
    const result = updateMaintenanceLogSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects a malformed partial update', () => {
    const result = updateMaintenanceLogSchema.safeParse({ title: '' });

    expect(result.success).toBe(false);
  });
});
