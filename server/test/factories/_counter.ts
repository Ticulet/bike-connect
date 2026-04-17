/**
 * Deterministic-per-worker counter used by factories to generate unique-but-
 * predictable identifiers without touching Math.random.
 */

const counters = new Map<string, number>();

export function nextCounter(key: string): number {
  const current = counters.get(key) ?? 0;
  const next = current + 1;
  counters.set(key, next);
  return next;
}

export function workerTag(): string {
  const raw = process.env.VITEST_WORKER_ID ?? process.env.VITEST_POOL_ID ?? '0';
  return raw.replace(/[^a-zA-Z0-9]/g, '');
}
