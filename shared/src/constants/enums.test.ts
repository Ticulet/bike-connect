import { describe, expect, it } from 'vitest';
import {
  BIKE_TYPES,
  COMPONENT_CATEGORIES,
  MAINTENANCE_TYPES,
  POST_CATEGORIES,
  POST_STATUSES,
} from './enums.js';

// Coverage checklist:
// - BIKE_TYPES: exact membership + length
// - COMPONENT_CATEGORIES: exact membership + length
// - MAINTENANCE_TYPES: exact membership + length
// - POST_CATEGORIES: exact membership + length
// - POST_STATUSES: exact membership + length

describe('BIKE_TYPES', () => {
  it('contains exactly the six supported bike types', () => {
    expect([...BIKE_TYPES].sort()).toEqual(
      ['gravel', 'mtb', 'other', 'road', 'touring', 'urban'],
    );
  });
});

describe('COMPONENT_CATEGORIES', () => {
  it('contains 23 component categories', () => {
    expect(COMPONENT_CATEGORIES).toHaveLength(23);
  });

  it('includes the headline drivetrain components', () => {
    for (const part of ['chain', 'cassette', 'crankset']) {
      expect(COMPONENT_CATEGORIES).toContain(part);
    }
  });

  it('includes the "other" catch-all', () => {
    expect(COMPONENT_CATEGORIES).toContain('other');
  });
});

describe('MAINTENANCE_TYPES', () => {
  it('contains exactly the four maintenance types', () => {
    expect([...MAINTENANCE_TYPES].sort()).toEqual(
      ['inspection', 'repair', 'service', 'upgrade'],
    );
  });
});

describe('POST_CATEGORIES', () => {
  it('contains the four post categories', () => {
    expect([...POST_CATEGORIES].sort()).toEqual(
      ['general', 'maintenance_guide', 'review', 'ride_report'],
    );
  });
});

describe('POST_STATUSES', () => {
  it('contains only draft and published', () => {
    expect([...POST_STATUSES].sort()).toEqual(['draft', 'published']);
  });
});
