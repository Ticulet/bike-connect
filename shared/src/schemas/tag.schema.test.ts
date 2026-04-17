import { describe, expect, it } from 'vitest';
import { createTagSchema, updateTagSchema } from './tag.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createTagSchema: required name (min 1 / max 50)
// - updateTagSchema: partial

describe('createTagSchema', () => {
  it('accepts a valid tag', () => {
    const result = createTagSchema.safeParse({ name: 'gravel' });

    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = createTagSchema.safeParse({ name: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a name over the max length', () => {
    const result = createTagSchema.safeParse({
      name: 'a'.repeat(VALIDATION_LIMITS.TAG_NAME_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('accepts a name at the max length', () => {
    const result = createTagSchema.safeParse({
      name: 'a'.repeat(VALIDATION_LIMITS.TAG_NAME_MAX),
    });

    expect(result.success).toBe(true);
  });
});

describe('updateTagSchema', () => {
  it('accepts an empty payload', () => {
    const result = updateTagSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects an empty name when provided', () => {
    const result = updateTagSchema.safeParse({ name: '' });

    expect(result.success).toBe(false);
  });
});
