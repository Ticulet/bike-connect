import type { ComponentCategory } from '../../db/types.js';

export interface ComponentThreshold {
  km: number;
  months: number;
}

export const DEFAULT_THRESHOLDS: Partial<Record<ComponentCategory, ComponentThreshold>> = {
  chain: { km: 3000, months: 6 },
  cassette: { km: 9000, months: 18 },
  tires: { km: 5000, months: 12 },
  brakes: { km: 5000, months: 12 },
  bar_tape: { km: 2000, months: 12 },
  groupset: { km: 15000, months: 36 },
  wheels: { km: 15000, months: 48 },
  fork: { km: 10000, months: 36 },
  bottom_bracket: { km: 8000, months: 24 },
  headset: { km: 10000, months: 36 },
};
