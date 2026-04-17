import { randomUUID } from 'node:crypto';
import type { NewBike, BikeType } from '../../src/db/types.js';
import { nextCounter } from './_counter.js';

interface MakeBikeOptions extends Partial<NewBike> {
  user_id: string;
}

export function makeBike(options: MakeBikeOptions): NewBike {
  const n = nextCounter('bike');
  const type: BikeType = options.type ?? 'road';
  const candidate: NewBike = {
    id: randomUUID(),
    name: `Test Bike ${n}`,
    brand: 'Test Brand',
    model: `Model ${n}`,
    year: 2024,
    type,
    description: null,
    hero_image_url: null,
    is_public: false,
    ...options,
  };
  return candidate;
}
