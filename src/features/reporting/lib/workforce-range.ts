import type { useTimezone } from "@/features/users/lib/timezone";

export const TIME_RANGES = [
  { value: "24h", label: "Last 24 hours" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
] as const;

export const DAY_MS = 24 * 60 * 60 * 1000;

type TzCtx = ReturnType<typeof useTimezone>;

/**
 * The [start, end) window in epoch ms for a range preset, with calendar boundaries computed in the
 * active reporting timezone. The server treats `to` as exclusive, matching this window.
 */
export function getRangeWindow(value: string, tz: TzCtx): { start: number; end: number } {
  const end = Date.now();
  switch (value) {
    case "24h":
      return { start: end - DAY_MS, end };
    case "this_week":
      // Since last Monday in the active timezone (start of today if it's Monday).
      return { start: tz.startOfWeek(), end };
    case "last_week": {
      const thisMonday = tz.startOfWeek();
      return { start: thisMonday - 7 * DAY_MS, end: thisMonday };
    }
    case "this_month":
      return { start: tz.startOfMonth(), end };
    default:
      return { start: end - 7 * DAY_MS, end };
  }
}
