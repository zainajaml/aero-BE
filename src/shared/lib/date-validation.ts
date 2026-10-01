/**
 * Shared start/end date validation used by every entity that has a date range
 * (sprints, time off, and any future project/milestone ranges).
 */
export const DATE_RANGE_ERROR = "Start date must be on or before the end date.";

/** Returns true when both dates are present and start is after end. */
export function isInvalidDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): boolean {
  if (!start || !end) return false;
  const s = start instanceof Date ? start.getTime() : new Date(start).getTime();
  const e = end instanceof Date ? end.getTime() : new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  return s > e;
}

/** Throws the standard validation error when the range is invalid. */
export function assertDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): void {
  if (isInvalidDateRange(start, end)) throw new Error(DATE_RANGE_ERROR);
}
