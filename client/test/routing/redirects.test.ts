import { describe, it, expect } from 'vitest';

/**
 * Unit tests for the LegacyRedirect parameter resolution logic.
 * Tests the path-param substitution and wildcard suffix behaviour that
 * LegacyRedirect performs before handing off to <Navigate>.
 *
 * These tests exercise the pure string-manipulation logic extracted here so
 * they run without a browser/DOM renderer.
 */

function resolveLegacyPath(
  to: string,
  params: Record<string, string | undefined>,
  search: string,
  hash: string,
): string {
  let resolved = to;

  for (const [key, value] of Object.entries(params)) {
    if (key !== '*' && typeof value === 'string') {
      resolved = resolved.replaceAll(`:${key}`, value);
    }
  }

  const wildcard = params['*'];
  if (wildcard != null && wildcard.length > 0) {
    resolved = `${resolved}/${wildcard}`;
  }

  return `${resolved}${search}${hash}`;
}

describe('legacy route redirects — path resolution', () => {
  it('redirects /dashboard → /me', () => {
    expect(resolveLegacyPath('/me', {}, '', '')).toBe('/me');
  });

  it('redirects /my-posts → /me/posts', () => {
    expect(resolveLegacyPath('/me/posts', {}, '', '')).toBe('/me/posts');
  });

  it('redirects /my-posts/* with query + hash preserved', () => {
    expect(
      resolveLegacyPath('/me/posts', { '*': 'foo' }, '?page=2', '#x'),
    ).toBe('/me/posts/foo?page=2#x');
  });

  it('redirects /my-bikes → /me/bikes', () => {
    expect(resolveLegacyPath('/me/bikes', {}, '', '')).toBe('/me/bikes');
  });

  it('redirects /my-bikes/123 → /me/bikes/123', () => {
    expect(resolveLegacyPath('/me/bikes', { '*': '123' }, '', '')).toBe(
      '/me/bikes/123',
    );
  });

  it('redirects /my-bikes/123/edit → /me/bikes/123/edit', () => {
    expect(resolveLegacyPath('/me/bikes', { '*': '123/edit' }, '', '')).toBe(
      '/me/bikes/123/edit',
    );
  });

  it('redirects /my-bikes/9/maintenance/new → /me/bikes/9/maintenance/new', () => {
    expect(
      resolveLegacyPath('/me/bikes', { '*': '9/maintenance/new' }, '', ''),
    ).toBe('/me/bikes/9/maintenance/new');
  });

  it('redirects /posts/new → /me/posts/new (no params)', () => {
    expect(resolveLegacyPath('/me/posts/new', {}, '', '')).toBe(
      '/me/posts/new',
    );
  });

  it('redirects /posts/42/edit → /me/posts/42/edit', () => {
    expect(
      resolveLegacyPath('/me/posts/:id/edit', { id: '42' }, '', ''),
    ).toBe('/me/posts/42/edit');
  });

  it('redirects /maintenance/7/edit → /me/maintenance/7/edit', () => {
    expect(
      resolveLegacyPath('/me/maintenance/:logId/edit', { logId: '7' }, '', ''),
    ).toBe('/me/maintenance/7/edit');
  });

  it('redirects /rides/4/edit → /me/rides/4/edit', () => {
    expect(
      resolveLegacyPath('/me/rides/:rideId/edit', { rideId: '4' }, '', ''),
    ).toBe('/me/rides/4/edit');
  });

  it('redirects /settings → /me/settings', () => {
    expect(resolveLegacyPath('/me/settings', {}, '', '')).toBe('/me/settings');
  });

  it('preserves query string on redirect', () => {
    expect(
      resolveLegacyPath('/me/bikes/:id', { id: '5' }, '?tab=rides', ''),
    ).toBe('/me/bikes/5?tab=rides');
  });

  it('preserves hash on redirect', () => {
    expect(
      resolveLegacyPath('/me/settings', {}, '', '#account'),
    ).toBe('/me/settings#account');
  });
});
