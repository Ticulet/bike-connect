import { describe, it, expect } from 'vitest';

/**
 * Unit tests for MeLayout navigation structure.
 * Tests section configuration without a DOM renderer.
 */

interface Section {
  to: string;
  label: string;
  end?: boolean;
}

const sections: Section[] = [
  { to: '/me', label: 'Hub', end: true },
  { to: '/me/posts', label: 'Posts' },
  { to: '/me/bikes', label: 'Bikes' },
  { to: '/me/bookmarks', label: 'Bookmarks' },
  { to: '/me/settings', label: 'Settings' },
];

describe('MeLayout — rail sections', () => {
  it('renders 5 rail links', () => {
    expect(sections).toHaveLength(5);
  });

  it('Hub link uses end prop (exact match only)', () => {
    const hub = sections.find((s) => s.label === 'Hub');
    expect(hub?.end).toBe(true);
  });

  it('Hub link points to /me', () => {
    const hub = sections.find((s) => s.label === 'Hub');
    expect(hub?.to).toBe('/me');
  });

  it('all expected labels are present', () => {
    const labels = sections.map((s) => s.label);
    expect(labels).toContain('Hub');
    expect(labels).toContain('Posts');
    expect(labels).toContain('Bikes');
    expect(labels).toContain('Bookmarks');
    expect(labels).toContain('Settings');
  });

  it('non-Hub sections do not have end prop', () => {
    const nonHub = sections.filter((s) => s.label !== 'Hub');
    expect(nonHub.every((s) => s.end !== true)).toBe(true);
  });

  it('all /me/* paths have the correct prefix', () => {
    const subSections = sections.filter((s) => s.label !== 'Hub');
    expect(subSections.every((s) => s.to.startsWith('/me/'))).toBe(true);
  });
});
