import { describe, expect, it } from 'vitest';
import { currentMonthRange } from '../src/lib/month-range.js';

describe('currentMonthRange', () => {
  it('returns the first of the month and first of next month', () => {
    // Month is 0-based in the Date constructor: 5 = June.
    const { start, endExclusive } = currentMonthRange(new Date(2026, 5, 25));
    expect(start).toBe('2026-06-01');
    expect(endExclusive).toBe('2026-07-01');
  });

  it('rolls over to the next year in December', () => {
    const { start, endExclusive } = currentMonthRange(new Date(2026, 11, 31));
    expect(start).toBe('2026-12-01');
    expect(endExclusive).toBe('2027-01-01');
  });

  it('handles January', () => {
    const { start, endExclusive } = currentMonthRange(new Date(2026, 0, 10));
    expect(start).toBe('2026-01-01');
    expect(endExclusive).toBe('2026-02-01');
  });

  it('zero-pads single-digit months', () => {
    const { start, endExclusive } = currentMonthRange(new Date(2026, 8, 15));
    expect(start).toBe('2026-09-01');
    expect(endExclusive).toBe('2026-10-01');
  });

  it('is independent of the day and time within the month', () => {
    const early = currentMonthRange(new Date(2026, 2, 1, 0, 0, 0));
    const late = currentMonthRange(new Date(2026, 2, 31, 23, 59, 59));
    expect(early).toEqual(late);
    expect(early.start).toBe('2026-03-01');
    expect(early.endExclusive).toBe('2026-04-01');
  });
});
