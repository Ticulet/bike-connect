/**
 * Format a kilometre distance for compact display, e.g. "0 km", "24 km",
 * "24.5 km". Rounds to one decimal and drops a trailing ".0". Non-finite or
 * non-positive values render as "0 km".
 */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km <= 0) {
    return '0 km';
  }
  const rounded = Math.round(km * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} km`;
}
