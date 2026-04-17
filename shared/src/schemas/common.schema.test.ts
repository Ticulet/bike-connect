import { describe, expect, it } from 'vitest';
import {
  idParamSchema,
  paginationQuerySchema,
  slugSchema,
  uuidSchema,
} from './common.schema.js';

// Coverage checklist:
// - uuidSchema: valid UUID, invalid format
// - slugSchema: valid slug, trailing hyphen, uppercase, spaces
// - idParamSchema: wraps uuidSchema — missing/valid/invalid
// - paginationQuerySchema: default limit, max/min bounds, coerce string, invalid cursor

describe('uuidSchema', () => {
  it('accepts a valid v4 UUID', () => {
    const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = uuidSchema.safeParse('not-a-uuid');

    expect(result.success).toBe(false);
  });

  it('rejects a number', () => {
    const result = uuidSchema.safeParse(42);

    expect(result.success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('accepts a lowercase hyphenated slug', () => {
    const result = slugSchema.safeParse('my-first-post');

    expect(result.success).toBe(true);
  });

  it('accepts a single-word slug', () => {
    const result = slugSchema.safeParse('hello');

    expect(result.success).toBe(true);
  });

  it('rejects uppercase characters', () => {
    const result = slugSchema.safeParse('My-Post');

    expect(result.success).toBe(false);
  });

  it('rejects a trailing hyphen', () => {
    const result = slugSchema.safeParse('my-post-');

    expect(result.success).toBe(false);
  });

  it('rejects a leading hyphen', () => {
    const result = slugSchema.safeParse('-my-post');

    expect(result.success).toBe(false);
  });

  it('rejects consecutive hyphens', () => {
    const result = slugSchema.safeParse('my--post');

    expect(result.success).toBe(false);
  });

  it('rejects spaces', () => {
    const result = slugSchema.safeParse('my post');

    expect(result.success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('accepts an object with a valid UUID id', () => {
    const result = idParamSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a missing id', () => {
    const result = idParamSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['id']);
    }
  });

  it('rejects a non-UUID id', () => {
    const result = idParamSchema.safeParse({ id: '123' });

    expect(result.success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies the default limit when omitted', () => {
    const result = paginationQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.cursor).toBeUndefined();
    }
  });

  it('coerces a numeric string limit', () => {
    const result = paginationQuerySchema.safeParse({ limit: '25' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
    }
  });

  it('rejects limit below 1', () => {
    const result = paginationQuerySchema.safeParse({ limit: 0 });

    expect(result.success).toBe(false);
  });

  it('rejects limit above max', () => {
    const result = paginationQuerySchema.safeParse({ limit: 51 });

    expect(result.success).toBe(false);
  });

  it('accepts a cursor string', () => {
    const result = paginationQuerySchema.safeParse({ cursor: 'abc123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe('abc123');
    }
  });
});
