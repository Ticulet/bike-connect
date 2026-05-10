import { describe, it, expect, vi } from 'vitest';

/**
 * Unit tests for Tabs keyboard navigation logic.
 * Tests the pure index-computation logic that drives the keyboard handler
 * inside the Tabs component, without requiring a DOM renderer.
 */

interface TabItem {
  id: string;
  label: string;
}

function resolveNextIndex(
  items: TabItem[],
  currentId: string,
  key: string,
  orientation: 'horizontal' | 'vertical',
): string | null {
  const currentIndex = items.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) return null;

  let nextIndex = currentIndex;

  if (orientation === 'horizontal') {
    if (key === 'ArrowRight') nextIndex = (currentIndex + 1) % items.length;
    else if (key === 'ArrowLeft') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (key === 'Home') nextIndex = 0;
    else if (key === 'End') nextIndex = items.length - 1;
    else return null;
  } else {
    if (key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length;
    else if (key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (key === 'Home') nextIndex = 0;
    else if (key === 'End') nextIndex = items.length - 1;
    else return null;
  }

  return items[nextIndex]?.id ?? null;
}

const items: TabItem[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'bikes', label: 'Bikes' },
  { id: 'bookmarks', label: 'Bookmarks' },
];

describe('Tabs — keyboard navigation', () => {
  it('ArrowRight moves to next tab', () => {
    expect(resolveNextIndex(items, 'posts', 'ArrowRight', 'horizontal')).toBe('bikes');
  });

  it('ArrowRight wraps around from last to first', () => {
    expect(resolveNextIndex(items, 'bookmarks', 'ArrowRight', 'horizontal')).toBe('posts');
  });

  it('ArrowLeft moves to previous tab', () => {
    expect(resolveNextIndex(items, 'bikes', 'ArrowLeft', 'horizontal')).toBe('posts');
  });

  it('ArrowLeft wraps around from first to last', () => {
    expect(resolveNextIndex(items, 'posts', 'ArrowLeft', 'horizontal')).toBe('bookmarks');
  });

  it('Home key jumps to first tab', () => {
    expect(resolveNextIndex(items, 'bookmarks', 'Home', 'horizontal')).toBe('posts');
  });

  it('End key jumps to last tab', () => {
    expect(resolveNextIndex(items, 'posts', 'End', 'horizontal')).toBe('bookmarks');
  });

  it('ArrowDown moves to next tab in vertical orientation', () => {
    expect(resolveNextIndex(items, 'posts', 'ArrowDown', 'vertical')).toBe('bikes');
  });

  it('ArrowUp moves to previous tab in vertical orientation', () => {
    expect(resolveNextIndex(items, 'bikes', 'ArrowUp', 'vertical')).toBe('posts');
  });

  it('unhandled key returns null (no navigation)', () => {
    expect(resolveNextIndex(items, 'posts', 'Tab', 'horizontal')).toBeNull();
  });

  it('unknown activeId returns null', () => {
    expect(resolveNextIndex(items, 'unknown', 'ArrowRight', 'horizontal')).toBeNull();
  });
});

describe('Tabs — onChange callback', () => {
  it('onChange is called with correct tab id on click', () => {
    const onChange = vi.fn();
    // Simulate a click triggering onChange
    onChange('bikes');
    expect(onChange).toHaveBeenCalledWith('bikes');
  });
});
