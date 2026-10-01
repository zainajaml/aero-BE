/** Parse a duration string like "2h 15m", "1d 2h", "45m" or "90" into minutes. */
export function parseSpentToMinutes(input: string): number {
  const str = input.trim().toLowerCase();
  if (!str) return 0;
  if (/^\d+$/.test(str)) return Math.max(0, parseInt(str, 10)); // bare number = minutes
  let total = 0;
  const d = str.match(/(\d+)\s*d/);
  const h = str.match(/(\d+)\s*h/);
  const m = str.match(/(\d+)\s*m/);
  if (d) total += parseInt(d[1], 10) * 60 * 8;
  if (h) total += parseInt(h[1], 10) * 60;
  if (m) total += parseInt(m[1], 10);
  return Math.max(0, total);
}

/** Parse a clock string like "9:30 am", "13:45" or "9" into minutes since midnight. */
export function parseClockToMinutes(input: string): number | null {
  const str = input.trim().toLowerCase();
  // Compact digit entry: "1000" -> 10:00, "930" -> 9:30, optionally with am/pm.
  const compact = str.match(/^(\d{3,4})\s*(am|pm)?$/);
  if (compact) {
    const digits = compact[1];
    let hours = parseInt(digits.slice(0, digits.length - 2), 10);
    const mins = parseInt(digits.slice(-2), 10);
    const mer = compact[2];
    if (mins > 59 || hours > 23) return null;
    if (mer === "pm" && hours < 12) hours += 12;
    if (mer === "am" && hours === 12) hours = 0;
    return hours * 60 + mins;
  }
  const match = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const mer = match[3];
  if (mins > 59 || hours > 23) return null;
  if (mer === "pm" && hours < 12) hours += 12;
  if (mer === "am" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/** Format minutes since midnight into a "9:30 am" style clock string. */
export function minutesToClock(total: number): string {
  const norm = ((total % 1440) + 1440) % 1440;
  let hours = Math.floor(norm / 60);
  const mins = norm % 60;
  const mer = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(mins).padStart(2, "0")} ${mer}`;
}

/** Every 15-minute slot of the day as "9:30 am" style labels. */
export const TIME_SLOTS: string[] = Array.from({ length: 96 }, (_, i) => minutesToClock(i * 15));

/**
 * Duration between two clock strings, wrapping past midnight for overnight work.
 * Returns null when either side is unparseable.
 */
export function clockDuration(
  start: string,
  stop: string,
): { minutes: number; overnight: boolean } | null {
  const s = parseClockToMinutes(start);
  const e = parseClockToMinutes(stop);
  if (s == null || e == null) return null;
  const diff = e - s;
  if (diff > 0) return { minutes: diff, overnight: false };
  return { minutes: diff + 1440, overnight: true };
}

/**
 * True when the end clock is strictly after the start clock (same day).
 * Empty values are treated as "no conflict" so partial input isn't cleared.
 */
export function isEndAfterStart(start: string, end: string): boolean {
  const s = parseClockToMinutes(start);
  const e = parseClockToMinutes(end);
  if (s == null || e == null) return true;
  return e > s;
}

/**
 * Merge a calendar date with a "9:30 am" clock string so the stored
 * `loggedAt` timestamp preserves the exact start time the user picked.
 * Falls back to the date's own time when the clock string is empty/invalid.
 */
export function withClockTime(date: Date, clock: string): Date {
  const mins = parseClockToMinutes(clock);
  const out = new Date(date);
  if (mins == null) return out;
  out.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return out;
}
