import { describe, expect, it } from 'vitest';
import { updateUserSchema } from './user.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - updateUserSchema: optional display_name (min 1 / max 100), optional bio (max 500)

describe('updateUserSchema', () => {
  it('accepts an empty payload (both fields optional)', () => {
    const result = updateUserSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts a display_name at the max length', () => {
    const result = updateUserSchema.safeParse({
      display_name: 'a'.repeat(VALIDATION_LIMITS.USER_DISPLAY_NAME_MAX),
    });

    expect(result.success).toBe(true);
  });

  it('rejects a display_name over the max length', () => {
    const result = updateUserSchema.safeParse({
      display_name: 'a'.repeat(VALIDATION_LIMITS.USER_DISPLAY_NAME_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty display_name when provided', () => {
    const result = updateUserSchema.safeParse({ display_name: '' });

    expect(result.success).toBe(false);
  });

  it('accepts a bio at max length', () => {
    const result = updateUserSchema.safeParse({
      bio: 'a'.repeat(VALIDATION_LIMITS.USER_BIO_MAX),
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty bio string (only max bound)', () => {
    const result = updateUserSchema.safeParse({ bio: '' });

    expect(result.success).toBe(true);
  });

  it('rejects a bio over the max length', () => {
    const result = updateUserSchema.safeParse({
      bio: 'a'.repeat(VALIDATION_LIMITS.USER_BIO_MAX + 1),
    });

    expect(result.success).toBe(false);
  });
});
