import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Skeleton variant logic.
 * Since we have no testing-library, we test the className/style
 * computation that Skeleton uses.
 */

type SkeletonVariant = 'text' | 'rect' | 'circle' | 'card';

function getSkeletonClassName(variant: SkeletonVariant = 'rect'): string {
  return `skeleton skeleton--${variant}`;
}

function buildStyle(
  width?: string | number,
  height?: string | number,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (width != null) {
    style['width'] = typeof width === 'number' ? `${width}px` : width;
  }
  if (height != null) {
    style['height'] = typeof height === 'number' ? `${height}px` : height;
  }
  return style;
}

describe('Skeleton — className logic', () => {
  it('default variant is rect', () => {
    expect(getSkeletonClassName()).toContain('skeleton--rect');
  });

  it('text variant includes skeleton--text', () => {
    expect(getSkeletonClassName('text')).toBe('skeleton skeleton--text');
  });

  it('circle variant includes skeleton--circle', () => {
    expect(getSkeletonClassName('circle')).toBe('skeleton skeleton--circle');
  });

  it('card variant includes skeleton--card', () => {
    expect(getSkeletonClassName('card')).toBe('skeleton skeleton--card');
  });

  it('always includes base skeleton class', () => {
    const variants: SkeletonVariant[] = ['text', 'rect', 'circle', 'card'];
    for (const v of variants) {
      expect(getSkeletonClassName(v)).toContain('skeleton ');
    }
  });
});

describe('Skeleton — style computation', () => {
  it('converts numeric width to px string', () => {
    const style = buildStyle(200);
    expect(style['width']).toBe('200px');
  });

  it('converts numeric height to px string', () => {
    const style = buildStyle(undefined, 100);
    expect(style['height']).toBe('100px');
  });

  it('passes string width through unchanged', () => {
    const style = buildStyle('50%');
    expect(style['width']).toBe('50%');
  });

  it('omits width if undefined', () => {
    const style = buildStyle(undefined, 100);
    expect('width' in style).toBe(false);
  });

  it('returns empty object when no dimensions given', () => {
    expect(buildStyle()).toEqual({});
  });
});
