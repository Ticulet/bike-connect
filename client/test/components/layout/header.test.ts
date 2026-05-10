import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Header navigation structure.
 * Tests the nav item configuration logic.
 */

interface NavLink {
  label: string;
  to: string;
  authOnly?: boolean;
}

function getHeaderNavLinks(isAuthenticated: boolean): NavLink[] {
  const publicLinks: NavLink[] = [
    { label: 'Read', to: '/posts' },
    { label: 'Explore', to: '/explore/bikes' },
  ];

  if (isAuthenticated) {
    return [...publicLinks, { label: 'Feed', to: '/feed', authOnly: true }];
  }
  return publicLinks;
}

function getAccountLink(isAuthenticated: boolean, displayName: string) {
  if (isAuthenticated) {
    return {
      type: 'you' as const,
      to: '/me',
      ariaLabel: `Your hub, signed in as ${displayName}`,
    };
  }
  return {
    type: 'signin' as const,
    to: '/login',
  };
}

describe('Header — nav links', () => {
  it('renders 3 nav links when authenticated (Read, Explore, Feed)', () => {
    const links = getHeaderNavLinks(true);
    expect(links).toHaveLength(3);
    expect(links.map((l) => l.label)).toEqual(['Read', 'Explore', 'Feed']);
  });

  it('renders 2 nav links when anonymous (Read, Explore)', () => {
    const links = getHeaderNavLinks(false);
    expect(links).toHaveLength(2);
    expect(links.map((l) => l.label)).toEqual(['Read', 'Explore']);
  });

  it('Feed link only shown to authenticated users', () => {
    expect(getHeaderNavLinks(true).some((l) => l.label === 'Feed')).toBe(true);
    expect(getHeaderNavLinks(false).some((l) => l.label === 'Feed')).toBe(false);
  });

  it('Read links to /posts', () => {
    const link = getHeaderNavLinks(false).find((l) => l.label === 'Read');
    expect(link?.to).toBe('/posts');
  });

  it('Explore links to /explore/bikes', () => {
    const link = getHeaderNavLinks(false).find((l) => l.label === 'Explore');
    expect(link?.to).toBe('/explore/bikes');
  });
});

describe('Header — account slot', () => {
  it('"You" link shown when authenticated', () => {
    const account = getAccountLink(true, 'Alice');
    expect(account.type).toBe('you');
    expect(account.to).toBe('/me');
  });

  it('"You" link aria-label contains display name', () => {
    const account = getAccountLink(true, 'Alice');
    expect(account.ariaLabel).toContain('Alice');
  });

  it('"Sign in" link shown when anonymous', () => {
    const account = getAccountLink(false, '');
    expect(account.type).toBe('signin');
    expect(account.to).toBe('/login');
  });
});
