import { describe, expect, it } from 'vitest';
import {
  authUserSchema,
  googleCallbackSchema,
  loginResponseSchema,
} from './auth.schema.js';

// Coverage checklist:
// - googleCallbackSchema: required code, optional state
// - authUserSchema: all fields, nullable avatar/bio, UUID + email + datetime validation
// - loginResponseSchema: nested authUserSchema validation

const validAuthUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'rider@example.com',
  display_name: 'Elena',
  avatar_url: 'https://example.com/avatar.png',
  bio: 'Gravel-curious roadie.',
  created_at: '2026-01-01T12:00:00.000Z',
};

describe('googleCallbackSchema', () => {
  it('accepts a code-only payload', () => {
    const result = googleCallbackSchema.safeParse({ code: 'abc123' });

    expect(result.success).toBe(true);
  });

  it('accepts code + state', () => {
    const result = googleCallbackSchema.safeParse({ code: 'abc', state: 'xyz' });

    expect(result.success).toBe(true);
  });

  it('rejects a missing code', () => {
    const result = googleCallbackSchema.safeParse({ state: 'xyz' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['code']);
    }
  });
});

describe('authUserSchema', () => {
  it('accepts a complete user', () => {
    const result = authUserSchema.safeParse(validAuthUser);

    expect(result.success).toBe(true);
  });

  it('accepts a null avatar_url', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, avatar_url: null });

    expect(result.success).toBe(true);
  });

  it('accepts a null bio', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, bio: null });

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID id', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, id: 'abc' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['id']);
    }
  });

  it('rejects a non-email string', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, email: 'not-an-email' });

    expect(result.success).toBe(false);
  });

  it('rejects a non-URL avatar', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, avatar_url: 'not a url' });

    expect(result.success).toBe(false);
  });

  it('rejects a non-ISO created_at', () => {
    const result = authUserSchema.safeParse({ ...validAuthUser, created_at: '2026-01-01' });

    expect(result.success).toBe(false);
  });
});

describe('loginResponseSchema', () => {
  it('accepts a payload with a valid nested user', () => {
    const result = loginResponseSchema.safeParse({ user: validAuthUser });

    expect(result.success).toBe(true);
  });

  it('rejects a missing user', () => {
    const result = loginResponseSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['user']);
    }
  });

  it('rejects a malformed nested user', () => {
    const result = loginResponseSchema.safeParse({
      user: { ...validAuthUser, email: 'bad' },
    });

    expect(result.success).toBe(false);
  });
});
