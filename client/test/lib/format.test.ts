import { describe, expect, it } from 'vitest';
import { formatDistanceKm } from '../../src/lib/format.js';

describe('formatDistanceKm', () => {
  it('renders zero as "0 km"', () => {
    expect(formatDistanceKm(0)).toBe('0 km');
  });

  it('renders whole numbers without decimals', () => {
    expect(formatDistanceKm(24)).toBe('24 km');
  });

  it('renders one decimal place', () => {
    expect(formatDistanceKm(24.5)).toBe('24.5 km');
  });

  it('rounds to one decimal', () => {
    expect(formatDistanceKm(24.57)).toBe('24.6 km');
    expect(formatDistanceKm(24.04)).toBe('24 km');
  });

  it('treats negative or non-finite values as zero', () => {
    expect(formatDistanceKm(-5)).toBe('0 km');
    expect(formatDistanceKm(Number.NaN)).toBe('0 km');
  });
});
