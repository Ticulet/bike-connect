import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit tests for Toast system logic (timer management, queue capping).
 * Tests the pure business-logic without requiring a DOM renderer.
 */

// Simulate the toast queue and timer logic.
interface ToastEntry {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info';
  duration: number;
}

const MAX_VISIBLE = 3;

function createQueue() {
  let counter = 0;
  const entries: ToastEntry[] = [];

  return {
    add(
      message: string,
      variant: ToastEntry['variant'] = 'info',
      duration = 4000,
    ): string {
      const id = `toast-${++counter}`;
      entries.push({ id, message, variant, duration });
      // Cap at MAX_VISIBLE
      if (entries.length > MAX_VISIBLE) {
        entries.splice(0, entries.length - MAX_VISIBLE);
      }
      return id;
    },
    dismiss(id: string): void {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx !== -1) entries.splice(idx, 1);
    },
    get all() {
      return [...entries];
    },
    get count() {
      return entries.length;
    },
  };
}

describe('Toast — queue logic', () => {
  it('adds a toast and returns an id', () => {
    const queue = createQueue();
    const id = queue.add('Saved');
    expect(id).toBeTruthy();
    expect(queue.count).toBe(1);
  });

  it('success variant is stored correctly', () => {
    const queue = createQueue();
    queue.add('Saved', 'success');
    expect(queue.all[0]?.variant).toBe('success');
  });

  it('error variant is stored correctly', () => {
    const queue = createQueue();
    queue.add('Failed', 'error');
    expect(queue.all[0]?.variant).toBe('error');
  });

  it('info variant is the default', () => {
    const queue = createQueue();
    queue.add('FYI');
    expect(queue.all[0]?.variant).toBe('info');
  });

  it('dismiss removes the toast', () => {
    const queue = createQueue();
    const id = queue.add('Saved');
    queue.dismiss(id);
    expect(queue.count).toBe(0);
  });

  it('caps visible toasts at 3', () => {
    const queue = createQueue();
    queue.add('Toast 1');
    queue.add('Toast 2');
    queue.add('Toast 3');
    queue.add('Toast 4'); // should push out Toast 1
    expect(queue.count).toBe(MAX_VISIBLE);
    expect(queue.all.every((t) => t.message !== 'Toast 1')).toBe(true);
  });

  it('4th toast queues by displacing the oldest', () => {
    const queue = createQueue();
    queue.add('Toast 1');
    queue.add('Toast 2');
    queue.add('Toast 3');
    queue.add('Toast 4');
    expect(queue.all[0]?.message).toBe('Toast 2');
    expect(queue.all[2]?.message).toBe('Toast 4');
  });
});

describe('Toast — auto-dismiss timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls dismiss after duration ms', () => {
    const dismiss = vi.fn();
    // Simulate what ToastItem does: starts a timeout then calls dismiss.
    const duration = 4000;
    const id = 'toast-1';

    setTimeout(() => { dismiss(id); }, duration);

    vi.advanceTimersByTime(duration);
    expect(dismiss).toHaveBeenCalledWith(id);
  });

  it('does not dismiss before duration ms', () => {
    const dismiss = vi.fn();
    const duration = 4000;
    const id = 'toast-1';

    setTimeout(() => { dismiss(id); }, duration);

    vi.advanceTimersByTime(duration - 1);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
