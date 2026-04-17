import { describe, expect, it } from 'vitest';
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  PAGINATION,
  VALIDATION_LIMITS,
} from './config.js';

// Coverage checklist:
// - PAGINATION: DEFAULT_LIMIT ≤ MAX_LIMIT, both positive ints
// - VALIDATION_LIMITS: every key is a positive integer
// - IMAGE_MAX_SIZE_BYTES: 5 MB
// - ALLOWED_IMAGE_TYPES: three expected MIME types

describe('PAGINATION', () => {
  it('default is within max', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBeGreaterThan(0);
    expect(PAGINATION.DEFAULT_LIMIT).toBeLessThanOrEqual(PAGINATION.MAX_LIMIT);
  });

  it('uses integer values', () => {
    expect(Number.isInteger(PAGINATION.DEFAULT_LIMIT)).toBe(true);
    expect(Number.isInteger(PAGINATION.MAX_LIMIT)).toBe(true);
  });
});

describe('VALIDATION_LIMITS', () => {
  it('every limit is a positive integer', () => {
    for (const [key, value] of Object.entries(VALIDATION_LIMITS)) {
      expect(value, `${key} should be a positive integer`).toBeGreaterThan(0);
      expect(Number.isInteger(value), `${key} should be an integer`).toBe(true);
    }
  });
});

describe('IMAGE_MAX_SIZE_BYTES', () => {
  it('is 5 MB', () => {
    expect(IMAGE_MAX_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('ALLOWED_IMAGE_TYPES', () => {
  it('contains exactly jpeg, png, webp', () => {
    expect([...ALLOWED_IMAGE_TYPES].sort()).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
  });
});
