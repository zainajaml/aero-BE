import type {
  BoardColumn,
  TicketReportRow,
  WorkLogEntry,
} from "@/features/reporting/api/reporting.api";
import { DAY_MS, inRange, type DayRange } from "./work-log-range";

/** One row of the ticket table (hours logged inside the selected range). */
export type TicketRowView = {
  id: string;
  code: string;
  title: string;
  priority: string;
  type: string;
  dueDate: string | null;
  updatedAt: string | null;
  stage: string | null;
  stageDone: boolean;
  sprint: string;
  project: string;
  assignee: string;
  loggedMinutes: number;
};

export type ChartRow = Record<string, number | string | string[]>;

/** Per-day buckets across the range (oldest first). */
export function perDayTotals(
  logs: WorkLogEntry[],
  range: DayRange,
  startOfDay: (v: number) => number,
): { day: number; minutes: number }[] {
  const buckets = new Map<number, number>();
  for (let d = range.from; d < range.to; d += DAY_MS) buckets.set(d, 0);
  for (const l of logs) {
    if (!inRange(l.loggedAt, range)) continue;
    const day = startOfDay(new Date(l.loggedAt).getTime());
    buckets.set(day, (buckets.get(day) ?? 0) + (l.minutes ?? 0));
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, minutes]) => ({ day, minutes }));
}

/** Per-project totals inside the range. */
export function perProjectTotals(
  logs: WorkLogEntry[],
  range: DayRange,
  ticketById: Map<string, TicketReportRow>,
  projectName: Map<string, string>,
): { pid: string; name: string; minutes: number }[] {
  const buckets = new Map<string, number>();
  for (const l of logs) {
    if (!inRange(l.loggedAt, range)) continue;
    const pid = ticketById.get(l.ticketId)?.projectId;
    if (!pid) continue;
    buckets.set(pid, (buckets.get(pid) ?? 0) + (l.minutes ?? 0));
  }
  return Array.from(buckets.entries())
    .map(([pid, minutes]) => ({ pid, name: projectName.get(pid) ?? "Unknown project", minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Per-person totals inside the range (every selected person, even with no time). */
export function perPersonTotals(
  logs: WorkLogEntry[],
  range: DayRange,
  userIds: string[],
  nameFor: (id: string) => string,
): { id: string; name: string; minutes: number }[] {
  const buckets = new Map<string, number>();
  for (const id of userIds) buckets.set(id, 0);
  for (const l of logs) {
    if (!inRange(l.loggedAt, range)) continue;
    buckets.set(l.userId, (buckets.get(l.userId) ?? 0) + (l.minutes ?? 0));
  }
  return Array.from(buckets.entries())
    .map(([id, minutes]) => ({ id, name: nameFor(id), minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Ticket ids the selected people logged time on inside the range, bucketed by day. */
export function ticketIdsByDay(
  logs: WorkLogEntry[],
  range: DayRange,
  startOfDay: (v: number) => number,
): Map<number, Set<string>> {
  const map = new Map<number, Set<string>>();
  for (const l of logs) {
    if (!inRange(l.loggedAt, range)) continue;
    const day = startOfDay(new Date(l.loggedAt).getTime());
    if (!map.has(day)) map.set(day, new Set());
    map.get(day)!.add(l.ticketId);
  }
  return map;
}

/**
 * Stage filter options: every column name in scope, with stages that only exist in "Spaceman"
 * projects listed last. A stage present in both groups is treated as non-Spaceman.
 */
export function buildStageOptions(
  columns: BoardColumn[],
  scopedProjects: { id: string; name: string }[],
): string[] {
  const spacemanProjectIds = new Set(
    scopedProjects.filter((p) => /spaceman/i.test(p.name)).map((p) => p.id),
  );
  const nameIsSpaceman = new Map<string, boolean>();
  for (const c of columns) {
    const name = c.name ?? "No stage";
    const isSpaceman = spacemanProjectIds.has(c.projectId);
    const existing = nameIsSpaceman.get(name);
    if (existing === undefined) nameIsSpaceman.set(name, isSpaceman);
    else if (existing && !isSpaceman) nameIsSpaceman.set(name, false);
  }
  const nonSpaceman: string[] = [];
  const spaceman: string[] = [];
  for (const [name, isSpaceman] of nameIsSpaceman) {
    if (name === "No stage") continue;
    (isSpaceman ? spaceman : nonSpaceman).push(name);
  }
  return [...nonSpaceman.sort(), ...spaceman.sort()];
}

/** Stacked per-day chart: one bar per date, one segment (hours) per selected person. */
export function buildChartData(
  logs: WorkLogEntry[],
  range: DayRange,
  people: { id: string }[],
  ticketById: Map<string, TicketReportRow>,
  tz: {
    startOfDay: (v: number) => number;
    formatDate: (v: number, o?: Intl.DateTimeFormatOptions) => string;
  },
): ChartRow[] {
  const rows: ChartRow[] = [];
  for (let d = range.from; d < range.to; d += DAY_MS) {
    const row: ChartRow = {
      day: d,
      label: tz.formatDate(d, { month: "2-digit", day: "2-digit" }),
    };
    for (const p of people) {
      row[p.id] = 0;
      row[`${p.id}_tickets`] = [] as string[];
    }
    rows.push(row);
  }
  const index = new Map(rows.map((r, i) => [r.day as number, i]));
  for (const l of logs) {
    if (!inRange(l.loggedAt, range)) continue;
    const i = index.get(tz.startOfDay(new Date(l.loggedAt).getTime()));
    if (i === undefined) continue;
    const row = rows[i];
    row[l.userId] = ((row[l.userId] as number) ?? 0) + (l.minutes ?? 0) / 60;
    const list = row[`${l.userId}_tickets`] as string[] | undefined;
    const code = ticketById.get(l.ticketId)?.code ?? l.ticketId;
    if (list && !list.includes(code)) list.push(code);
  }
  return rows;
}
