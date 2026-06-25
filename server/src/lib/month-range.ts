/**
 * The current calendar month as a half-open date range [start, endExclusive),
 * each formatted as YYYY-MM-DD for comparison against a SQL `date` column.
 *
 * Boundaries come from the instant's local calendar fields, so the "month" is
 * the server's local month. Built from plain year/month arithmetic (never an
 * intermediate Date-to-string conversion) to avoid UTC-offset day shifts.
 */
export function currentMonthRange(now: Date): { start: string; endExclusive: string } {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;

  const firstOfMonth = (fullYear: number, monthZeroBased: number): string =>
    `${fullYear}-${String(monthZeroBased + 1).padStart(2, '0')}-01`;

  return {
    start: firstOfMonth(year, month),
    endExclusive: firstOfMonth(nextYear, nextMonth),
  };
}
