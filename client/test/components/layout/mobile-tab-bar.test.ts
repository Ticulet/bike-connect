import { describe, it, expect } from 'vitest';

/**
 * Unit tests for MobileTabBar navigation items.
 * Tests the navigation item configuration logic.
 */

interface NavItem {
  label: string;
  to: string;
  requiresAuth: boolean;
}

function getMobileNavItems(isAuthenticated: boolean): NavItem[] {
  const base: NavItem[] = [
    { label: 'Read', to: '/posts', requiresAuth: false },
    { label: 'Explore', to: '/explore/bikes', requiresAuth: false },
  ];

  if (isAuthenticated) {
    return [
      ...base,
      { label: 'Feed', to: '/feed', requiresAuth: true },
      { label: 'You', to: '/me', requiresAuth: true },
    ];
  }

  return [
    ...base,
    { label: 'Sign in', to: '/login', requiresAuth: false },
  ];
}

describe('MobileTabBar — nav items', () => {
  it('anonymous user sees 3 items', () => {
    const items = getMobileNavItems(false);
    expect(items).toHaveLength(3);
  });

  it('authenticated user sees 4 items', () => {
    const items = getMobileNavItems(true);
    expect(items).toHaveLength(4);
  });

  it('always shows Read and Explore', () => {
    const anonItems = getMobileNavItems(false);
    const authItems = getMobileNavItems(true);

    expect(anonItems.some((i) => i.label === 'Read')).toBe(true);
    expect(anonItems.some((i) => i.label === 'Explore')).toBe(true);
    expect(authItems.some((i) => i.label === 'Read')).toBe(true);
    expect(authItems.some((i) => i.label === 'Explore')).toBe(true);
  });

  it('anonymous user sees Sign in instead of Feed/You', () => {
    const items = getMobileNavItems(false);
    expect(items.some((i) => i.label === 'Sign in')).toBe(true);
    expect(items.some((i) => i.label === 'Feed')).toBe(false);
    expect(items.some((i) => i.label === 'You')).toBe(false);
  });

  it('authenticated user sees Feed and You', () => {
    const items = getMobileNavItems(true);
    expect(items.some((i) => i.label === 'Feed')).toBe(true);
    expect(items.some((i) => i.label === 'You')).toBe(true);
    expect(items.some((i) => i.label === 'Sign in')).toBe(false);
  });

  it('You links to /me', () => {
    const items = getMobileNavItems(true);
    const you = items.find((i) => i.label === 'You');
    expect(you?.to).toBe('/me');
  });

  it('Read links to /posts', () => {
    const items = getMobileNavItems(false);
    const read = items.find((i) => i.label === 'Read');
    expect(read?.to).toBe('/posts');
  });
});
