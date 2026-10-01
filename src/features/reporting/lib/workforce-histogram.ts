import type { useTimezone } from "@/features/users/lib/timezone";
import type { Utilization } from "../api/reporting.api";
import { DAY_MS } from "./workforce-range";

type TzCtx = ReturnType<typeof useTimezone>;

export type HoursHistogram = {
  data: Record<string, number | string>[];
  persons: { id: string; name: string }[];
  hasData: boolean;
};

/**
 * Daily stacked-bar data: hours logged per person per calendar day (in the active timezone) across
 * the window. Pure chart bucketing of the server's log list; utilisation itself comes from the server.
 */
export function buildHoursHistogram(
  utilization: Utilization | undefined,
  window: { start: number; end: number },
  tz: TzCtx,
): HoursHistogram {
  const { start, end } = window;
  const names = new Map((utilization?.members ?? []).map((m) => [m.userId, m.displayName]));

  const dayStarts: number[] = [];
  let cursor = tz.startOfDay(start);
  while (cursor < end) {
    dayStarts.push(cursor);
    cursor += DAY_MS;
  }
  if (dayStarts.length === 0) dayStarts.push(tz.startOfDay(start));

  const byDay = new Map<number, Map<string, number>>();
  const personIds = new Set<string>();
  for (const l of utilization?.logs ?? []) {
    if (!names.has(l.userId)) continue;
    const t = new Date(l.loggedAt).getTime();
    if (t < start || t >= end) continue;
    const day = tz.startOfDay(t);
    if (!byDay.has(day)) byDay.set(day, new Map());
    const bucket = byDay.get(day)!;
    bucket.set(l.userId, (bucket.get(l.userId) ?? 0) + l.minutes);
    personIds.add(l.userId);
  }

  const persons = Array.from(personIds)
    .map((id) => ({ id, name: names.get(id) ?? "Member" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const data = dayStarts.map((day) => {
    const row: Record<string, number | string> = {
      date: tz.formatDate(day, { weekday: "short", month: "short", day: "numeric" }),
    };
    const bucket = byDay.get(day);
    for (const p of persons) {
      row[p.id] = bucket ? Math.round(((bucket.get(p.id) ?? 0) / 60) * 100) / 100 : 0;
    }
    return row;
  });

  return { data, persons, hasData: personIds.size > 0 };
}
