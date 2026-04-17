import { describe, expect, it } from 'vitest';
import { createCommentSchema, updateCommentSchema } from './comment.schema.js';
import { VALIDATION_LIMITS } from '../constants/config.js';

// Coverage checklist:
// - createCommentSchema: required content (min 1 / max 2000); optional nullable parent_id UUID
// - updateCommentSchema: required content only

describe('createCommentSchema', () => {
  it('accepts minimal content', () => {
    const result = createCommentSchema.safeParse({ content: 'Nice write-up.' });

    expect(result.success).toBe(true);
  });

  it('accepts content with a valid parent_id', () => {
    const result = createCommentSchema.safeParse({
      content: 'Reply text',
      parent_id: '123e4567-e89b-12d3-a456-426614174000',
    });

    expect(result.success).toBe(true);
  });

  it('accepts null parent_id for top-level comments', () => {
    const result = createCommentSchema.safeParse({
      content: 'Top-level comment',
      parent_id: null,
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = createCommentSchema.safeParse({ content: '' });

    expect(result.success).toBe(false);
  });

  it('rejects content over max length', () => {
    const result = createCommentSchema.safeParse({
      content: 'a'.repeat(VALIDATION_LIMITS.COMMENT_CONTENT_MAX + 1),
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID parent_id', () => {
    const result = createCommentSchema.safeParse({
      content: 'Hi',
      parent_id: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
  });
});

describe('updateCommentSchema', () => {
  it('accepts an edit payload', () => {
    const result = updateCommentSchema.safeParse({ content: 'edited' });

    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = updateCommentSchema.safeParse({ content: '' });

    expect(result.success).toBe(false);
  });

  it('rejects a missing content field', () => {
    const result = updateCommentSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
