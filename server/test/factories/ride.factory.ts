import { randomUUID } from 'node:crypto';
import type { NewRide } from '../../src/db/types.js';
import { nextCounter } from './_counter.js';

interface MakeRideOptions extends Partial<NewRide> {
  user_id: string;
  bike_id: string;
}

export function makeRide(options: MakeRideOptions): NewRide {
  const n = nextCounter('ride');
  const candidate: NewRide = {
    id: randomUUID(),
    distance_km: 10 + n,
    duration_min: 30,
    date: '2026-01-01',
    notes: null,
    ...options,
  };
  return candidate;
}
