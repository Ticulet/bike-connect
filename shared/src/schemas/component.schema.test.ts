import { describe, expect, it } from 'vitest';
import { createComponentSchema, updateComponentSchema } from './component.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createComponentSchema: category enum; required name (min 1 / max 100);
//   optional brand/model/notes (max bound); optional installed_at date;
//   optional mileage_at_install (int nonnegative)
// - updateComponentSchema: partial

const validComponent = {
  category: 'chain' as const,
  name: 'Shimano 105',
};

describe('createComponentSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createComponentSchema.safeParse(validComponent);

    expect(result.success).toBe(true);
  });

  it('rejects an invalid category', () => {
    const result = createComponentSchema.safeParse({ ...validComponent, category: 'unicorn' });

    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = createComponentSchema.safeParse({ ...validComponent, name: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a name over max', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      name: 'a'.repeat(VALIDATION_LIMITS.COMPONENT_NAME_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid installed_at date', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      installed_at: '2024-05-20',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid installed_at date', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      installed_at: '2024-13-45',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a negative mileage', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      mileage_at_install: -1,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-integer mileage', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      mileage_at_install: 10.5,
    });

    expect(result.success).toBe(false);
  });

  it('rejects notes over max length', () => {
    const result = createComponentSchema.safeParse({
      ...validComponent,
      notes: 'a'.repeat(VALIDATION_LIMITS.COMPONENT_NOTES_MAX + 1),
    });

    expect(result.success).toBe(false);
  });
});

describe('updateComponentSchema', () => {
  it('accepts an empty payload', () => {
    const result = updateComponentSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts a single-field update', () => {
    const result = updateComponentSchema.safeParse({ name: 'Updated' });

    expect(result.success).toBe(true);
  });
});
