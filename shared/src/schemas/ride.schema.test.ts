import { describe, expect, it } from 'vitest';
import { createRideSchema, updateRideSchema } from './ride.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createRideSchema: distance_km positive, <= max, multipleOf 0.01; optional
//   positive int duration_min; required date; optional notes (max 2000)
// - updateRideSchema: partial

const validRide = {
  distance_km: 42.5,
  date: '2026-02-01',
};

describe('createRideSchema', () => {
  it('accepts a minimal valid ride', () => {
    const result = createRideSchema.safeParse(validRide);

    expect(result.success).toBe(true);
  });

  it('rejects a zero distance', () => {
    const result = createRideSchema.safeParse({ ...validRide, distance_km: 0 });

    expect(result.success).toBe(false);
  });

  it('rejects a negative distance', () => {
    const result = createRideSchema.safeParse({ ...validRide, distance_km: -5 });

    expect(result.success).toBe(false);
  });

  it('rejects a distance over the cap', () => {
    const result = createRideSchema.safeParse({
      ...validRide,
      distance_km: VALIDATION_LIMITS.RIDE_DISTANCE_MAX + 1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects distance with more than 2 decimal places', () => {
    const result = createRideSchema.safeParse({ ...validRide, distance_km: 10.123 });

    expect(result.success).toBe(false);
  });

  it('rejects a zero duration_min', () => {
    const result = createRideSchema.safeParse({ ...validRide, duration_min: 0 });

    expect(result.success).toBe(false);
  });

  it('rejects a non-integer duration_min', () => {
    const result = createRideSchema.safeParse({ ...validRide, duration_min: 30.5 });

    expect(result.success).toBe(false);
  });

  it('accepts notes at max length', () => {
    const result = createRideSchema.safeParse({
      ...validRide,
      notes: 'a'.repeat(VALIDATION_LIMITS.RIDE_NOTES_MAX),
    });

    expect(result.success).toBe(true);
  });

  it('rejects notes over max length', () => {
    const result = createRideSchema.safeParse({
      ...validRide,
      notes: 'a'.repeat(VALIDATION_LIMITS.RIDE_NOTES_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid date', () => {
    const result = createRideSchema.safeParse({ ...validRide, date: '2026-99-99' });

    expect(result.success).toBe(false);
  });
});

describe('updateRideSchema', () => {
  it('accepts an empty payload', () => {
    const result = updateRideSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts a partial update', () => {
    const result = updateRideSchema.safeParse({ distance_km: 15.0 });

    expect(result.success).toBe(true);
  });

  it('still enforces field rules on partial updates', () => {
    const result = updateRideSchema.safeParse({ distance_km: -1 });

    expect(result.success).toBe(false);
  });
});
