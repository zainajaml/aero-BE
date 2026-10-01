import type { useTimezone } from "@/features/users/lib/timezone";

type TzCtx = ReturnType<typeof useTimezone>;

/** Half-open [from, to) window in epoch ms. */
export type DayRange = { from: number; to: number };

export type PresetKey = "today" | "yesterday" | "last7" | "last30" | "month" | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last week" },
  { key: "last30", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

export const DAY_MS = 86_400_000;

/** A sprint's dates as whole days (start day through end day, inclusive) in the user's timezone. */
export function sprintWindowOf(
  s: { startsAt: string | null; endsAt: string | null },
  tz: TzCtx,
): DayRange | null {
  if (!s.startsAt) return null;
  const start = new Date(s.startsAt).getTime();
  // No end date yet (still running) -> through today.
  const end = s.endsAt ? new Date(s.endsAt).getTime() : Date.now();
  return { from: tz.startOfDay(start), to: tz.startOfDay(Math.max(start, end)) + DAY_MS };
}

/** Date range (epoch ms) resolved in the user's active timezone. Picked sprints win. */
export function resolveRange(
  preset: PresetKey,
  customFrom: Date | undefined,
  customTo: Date | undefined,
  sprintSpan: DayRange | null,
  tz: TzCtx,
): DayRange {
  if (sprintSpan) return sprintSpan;
  const todayStart = tz.startOfDay();
  switch (preset) {
    case "today":
      return { from: todayStart, to: todayStart + DAY_MS };
    case "yesterday":
      return { from: todayStart - DAY_MS, to: todayStart };
    case "last7": {
      const thisMonday = tz.startOfWeek();
      return { from: thisMonday - 7 * DAY_MS, to: thisMonday };
    }
    case "last30":
      return { from: todayStart - 29 * DAY_MS, to: todayStart + DAY_MS };
    case "month":
      return { from: tz.startOfMonth(), to: todayStart + DAY_MS };
    case "custom": {
      if (!customFrom) return { from: todayStart, to: todayStart + DAY_MS };
      const from = tz.startOfDay(customFrom);
      const to = tz.startOfDay(customTo ?? customFrom) + DAY_MS;
      return from <= to ? { from, to } : { from: to - DAY_MS, to: from + DAY_MS };
    }
  }
}

/**
 * Widest window the panel can display: the selected range plus a small buffer. Fetching only this
 * window keeps the query bounded instead of pulling a user's entire logging history.
 */
export function fetchWindowFor(range: DayRange, tz: TzCtx): DayRange {
  const todayStart = tz.startOfDay();
  return {
    from: Math.min(range.from, tz.startOfWeek(), todayStart - DAY_MS),
    to: Math.max(range.to, todayStart + DAY_MS),
  };
}

export const inRange = (iso: string, r: DayRange) => {
  const t = new Date(iso).getTime();
  return t >= r.from && t < r.to;
};
