export const BIKE_TYPES = [
  'road',
  'mtb',
  'gravel',
  'urban',
  'touring',
  'other',
] as const;

export type BikeType = (typeof BIKE_TYPES)[number];

export const COMPONENT_CATEGORIES = [
  'frame',
  'fork',
  'groupset',
  'wheels',
  'tires',
  'saddle',
  'handlebar',
  'seatpost',
  'pedals',
  'brakes',
  'chain',
  'cassette',
  'crankset',
  'bottom_bracket',
  'headset',
  'stem',
  'bar_tape',
  'computer',
  'lights',
  'rack',
  'fenders',
  'bottle_cage',
  'other',
] as const;

export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export const MAINTENANCE_TYPES = [
  'service',
  'repair',
  'upgrade',
  'inspection',
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const POST_CATEGORIES = [
  'review',
  'maintenance_guide',
  'ride_report',
  'general',
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_STATUSES = ['draft', 'published'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];
