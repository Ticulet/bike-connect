import { randomUUID } from 'node:crypto';
import type { NewBikeComponent, ComponentCategory } from '../../src/db/types.js';
import { nextCounter } from './_counter.js';

interface MakeComponentOptions extends Partial<NewBikeComponent> {
  bike_id: string;
}

export function makeBikeComponent(options: MakeComponentOptions): NewBikeComponent {
  const n = nextCounter('component');
  const category: ComponentCategory = options.category ?? 'chain';
  const candidate: NewBikeComponent = {
    id: randomUUID(),
    category,
    name: `Test Component ${n}`,
    brand: null,
    model: null,
    installed_at: null,
    mileage_at_install: null,
    notes: null,
    ...options,
  };
  return candidate;
}
