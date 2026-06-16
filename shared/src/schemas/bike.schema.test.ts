import { describe, expect, it } from 'vitest';
import { createBikeSchema, updateBikeSchema } from './bike.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createBikeSchema: required name/brand/model/year/type; year min 1900; year refine (not > currentYear + 1); type enum; optional description; is_public default false
// - updateBikeSchema: partial — all fields optional

const validBike = {
  name: 'My Gravel',
  brand: 'Open',
  model: 'U.P.',
  year: 2024,
  type: 'gravel' as const,
};

describe('createBikeSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = createBikeSchema.safeParse(validBike);

    expect(result.success).toBe(true);
  });

  it('defaults is_public to false', () => {
    const result = createBikeSchema.safeParse(validBike);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBe(false);
    }
  });

  it('rejects a missing name', () => {
    const { name: _omit, ...rest } = validBike;
    void _omit;
    const result = createBikeSchema.safeParse(rest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['name']);
    }
  });

  it('rejects an empty name', () => {
    const result = createBikeSchema.safeParse({ ...validBike, name: '' });

    expect(result.success).toBe(false);
  });

  it('accepts a name at max length', () => {
    const result = createBikeSchema.safeParse({
      ...validBike,
      name: 'a'.repeat(VALIDATION_LIMITS.BIKE_NAME_MAX),
    });

    expect(result.success).toBe(true);
  });

  it('rejects a name over max length', () => {
    const result = createBikeSchema.safeParse({
      ...validBike,
      name: 'a'.repeat(VALIDATION_LIMITS.BIKE_NAME_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a year before 1900', () => {
    const result = createBikeSchema.safeParse({ ...validBike, year: 1899 });

    expect(result.success).toBe(false);
  });

  it('rejects a year more than one year in the future', () => {
    const tooFarAhead = new Date().getFullYear() + 2;
    const result = createBikeSchema.safeParse({ ...validBike, year: tooFarAhead });

    expect(result.success).toBe(false);
  });

  it('accepts next year', () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = createBikeSchema.safeParse({ ...validBike, year: nextYear });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid bike type', () => {
    const result = createBikeSchema.safeParse({ ...validBike, type: 'unicycle' });

    expect(result.success).toBe(false);
  });

  it('accepts all enum bike types', () => {
    const types = ['road', 'mtb', 'gravel', 'urban', 'touring', 'other'] as const;
    for (const type of types) {
      const result = createBikeSchema.safeParse({ ...validBike, type });

      expect(result.success).toBe(true);
    }
  });

  it('rejects a description over max length', () => {
    const result = createBikeSchema.safeParse({
      ...validBike,
      description: 'a'.repeat(VALIDATION_LIMITS.BIKE_DESCRIPTION_MAX + 1),
    });

    expect(result.success).toBe(false);
  });
});

describe('updateBikeSchema', () => {
  it('accepts an empty payload', () => {
    const result = updateBikeSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('accepts a single field update', () => {
    const result = updateBikeSchema.safeParse({ name: 'New name' });

    expect(result.success).toBe(true);
  });

  it('still rejects an invalid field when supplied', () => {
    const result = updateBikeSchema.safeParse({ year: 1800 });

    expect(result.success).toBe(false);
  });

  it('preserves hero_image_url instead of stripping it (regression)', () => {
    const result = updateBikeSchema.safeParse({ hero_image_url: '/uploads/abc.png' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hero_image_url).toBe('/uploads/abc.png');
    }
  });
});

describe('hero_image_url validation', () => {
  it('accepts an absolute https URL', () => {
    const result = createBikeSchema.safeParse({
      ...validBike,
      hero_image_url: 'https://res.cloudinary.com/demo/image/upload/x.png',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a root-relative server path', () => {
    const result = createBikeSchema.safeParse({ ...validBike, hero_image_url: '/uploads/abc.png' });

    expect(result.success).toBe(true);
  });

  it('accepts null (clearing the photo)', () => {
    const result = createBikeSchema.safeParse({ ...validBike, hero_image_url: null });

    expect(result.success).toBe(true);
  });

  it('rejects a bare string with no scheme or leading slash', () => {
    const result = createBikeSchema.safeParse({ ...validBike, hero_image_url: 'not-a-url' });

    expect(result.success).toBe(false);
  });

  it('rejects a protocol-relative URL (off-origin)', () => {
    const result = createBikeSchema.safeParse({ ...validBike, hero_image_url: '//evil.com/x.png' });

    expect(result.success).toBe(false);
  });
});
