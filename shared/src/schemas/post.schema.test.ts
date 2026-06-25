import { describe, expect, it } from 'vitest';
import {
  createPostSchema,
  postQuerySchema,
  updatePostSchema,
} from './post.schema.js';
import { PAGINATION, VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createPostSchema: required title (min 1 / max 200); content record(unknown);
//   optional excerpt (max 500); optional URL cover; required category enum;
//   status enum with default 'draft'; optional array of positive ints tag_ids
// - updatePostSchema: partial + required expected_updated_at ISO datetime
// - postQuerySchema: pagination + optional category/tag

const validPost = {
  title: 'Hello',
  content: { type: 'doc', content: [] },
  category: 'general' as const,
};

describe('createPostSchema', () => {
  it('accepts a minimal post', () => {
    const result = createPostSchema.safeParse(validPost);

    expect(result.success).toBe(true);
  });

  it('defaults status to draft', () => {
    const result = createPostSchema.safeParse(validPost);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
    }
  });

  it('rejects an empty title', () => {
    const result = createPostSchema.safeParse({ ...validPost, title: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['title']);
    }
  });

  it('rejects a title over max', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      title: 'a'.repeat(VALIDATION_LIMITS.POST_TITLE_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown category', () => {
    const result = createPostSchema.safeParse({ ...validPost, category: 'random' });

    expect(result.success).toBe(false);
  });

  it('accepts all category enum values', () => {
    const cats = ['review', 'maintenance_guide', 'ride_report', 'general'] as const;
    for (const category of cats) {
      const result = createPostSchema.safeParse({ ...validPost, category });

      expect(result.success).toBe(true);
    }
  });

  it('rejects a non-URL cover_image_url', () => {
    const result = createPostSchema.safeParse({ ...validPost, cover_image_url: 'not-a-url' });

    expect(result.success).toBe(false);
  });

  it('accepts a root-relative cover_image_url (local image)', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      cover_image_url: '/blog-covers/dolomites-by-bike.jpg',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-positive tag id', () => {
    const result = createPostSchema.safeParse({ ...validPost, tag_ids: [0, 1] });

    expect(result.success).toBe(false);
  });

  it('accepts a valid tag id array', () => {
    const result = createPostSchema.safeParse({ ...validPost, tag_ids: [1, 2, 3] });

    expect(result.success).toBe(true);
  });

  it('rejects an excerpt over max', () => {
    const result = createPostSchema.safeParse({
      ...validPost,
      excerpt: 'a'.repeat(VALIDATION_LIMITS.POST_EXCERPT_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('accepts a null excerpt (nullable in the database)', () => {
    const result = createPostSchema.safeParse({ ...validPost, excerpt: null });

    expect(result.success).toBe(true);
  });

  it('accepts a null cover_image_url (nullable in the database)', () => {
    const result = createPostSchema.safeParse({ ...validPost, cover_image_url: null });

    expect(result.success).toBe(true);
  });
});

describe('updatePostSchema', () => {
  it('requires expected_updated_at', () => {
    const result = updatePostSchema.safeParse({ title: 'Updated' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['expected_updated_at']);
    }
  });

  it('accepts a partial update with a concurrency token', () => {
    const result = updatePostSchema.safeParse({
      title: 'Updated',
      expected_updated_at: '2026-01-01T12:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-ISO concurrency token', () => {
    const result = updatePostSchema.safeParse({
      title: 'Updated',
      expected_updated_at: '2026-01-01',
    });

    expect(result.success).toBe(false);
  });

  it('accepts null excerpt and cover_image_url (editing a post that has neither)', () => {
    // Regression: the edit form sends null for empty optional fields, which
    // previously failed validation with "Expected string, received null".
    const result = updatePostSchema.safeParse({
      title: 'Updated',
      excerpt: null,
      cover_image_url: null,
      expected_updated_at: '2026-01-01T12:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});

describe('postQuerySchema', () => {
  it('applies default limit', () => {
    const result = postQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(PAGINATION.DEFAULT_LIMIT);
    }
  });

  it('coerces limit from string', () => {
    const result = postQuerySchema.safeParse({ limit: '20' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects a category not in the enum', () => {
    const result = postQuerySchema.safeParse({ category: 'random' });

    expect(result.success).toBe(false);
  });

  it('accepts category + tag', () => {
    const result = postQuerySchema.safeParse({ category: 'review', tag: 'gravel' });

    expect(result.success).toBe(true);
  });

  it('rejects limit over max', () => {
    const result = postQuerySchema.safeParse({ limit: PAGINATION.MAX_LIMIT + 1 });

    expect(result.success).toBe(false);
  });
});
