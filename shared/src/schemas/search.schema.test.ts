import { describe, expect, it } from 'vitest';
import { exploreBikesQuerySchema, searchQuerySchema } from './search.schema.js';
import { PAGINATION, VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - searchQuerySchema: required q (min 1 / max 200); limit coerce + default
// - exploreBikesQuerySchema: optional cursor; limit default 12; optional type enum

describe('searchQuerySchema', () => {
  it('accepts a minimal query', () => {
    const result = searchQuerySchema.safeParse({ q: 'gravel' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(PAGINATION.DEFAULT_LIMIT);
    }
  });

  it('rejects an empty query', () => {
    const result = searchQuerySchema.safeParse({ q: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a query over max length', () => {
    const result = searchQuerySchema.safeParse({
      q: 'a'.repeat(VALIDATION_LIMITS.SEARCH_QUERY_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('coerces a string limit', () => {
    const result = searchQuerySchema.safeParse({ q: 'x', limit: '15' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(15);
    }
  });
});

describe('exploreBikesQuerySchema', () => {
  it('accepts empty with defaults', () => {
    const result = exploreBikesQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(12);
    }
  });

  it('accepts a cursor', () => {
    const result = exploreBikesQuerySchema.safeParse({ cursor: 'encoded' });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const result = exploreBikesQuerySchema.safeParse({ type: 'unicycle' });

    expect(result.success).toBe(false);
  });

  it('accepts a valid bike type', () => {
    const result = exploreBikesQuerySchema.safeParse({ type: 'road' });

    expect(result.success).toBe(true);
  });

  it('rejects limit above max', () => {
    const result = exploreBikesQuerySchema.safeParse({ limit: PAGINATION.MAX_LIMIT + 1 });

    expect(result.success).toBe(false);
  });
});
