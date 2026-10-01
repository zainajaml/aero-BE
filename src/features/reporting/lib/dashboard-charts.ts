import type {
  BoardColumn,
  Sprint,
  TicketSummary,
  WorkLogEntry,
  StageTransition,
} from "../api/reporting.api";

const DAY_MS = 86_400_000;

// Chart palette: theme-aware bar colors so stacked bars remain legible on both
// the warm paper background (light) and charcoal background (dark).
export const CHART_COLORS = [
  "var(--chart-bar-1)",
  "var(--chart-bar-2)",
  "var(--chart-bar-3)",
  "var(--chart-bar-4)",
  "var(--chart-bar-5)",
  "var(--chart-bar-6)",
];

export type ChartRow = Record<string, number | string>;

/** Calendar helpers bound to the profile timezone (fixed offset, no DST). */
export type DayClock = {
  offsetMin: number;
  startOfDay: (value?: string | number | Date) => number;
};

/** `YYYY-MM-DD` of an instant in the profile timezone. */
function zonedDayKey(ms: number, offsetMin: number): string {
  return new Date(ms + offsetMin * 60_000).toISOString().slice(0, 10);
}

/** `dd/mm/yy` of an instant in the profile timezone. */
export function formatShortDate(ms: number, offsetMin: number): string {
  const [y, m, d] = zonedDayKey(ms, offsetMin).split("-");
  return `${d}/${m}/${y.slice(-2)}`;
}

const byPosition = (a: Sprint, b: Sprint) =>
  (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name);

/**
 * The current sprint is the first active one; when no sprint is active we fall back to the most
 * recently ended sprint, then to the first planned one, so the dashboard never renders an empty
 * "no sprint selected" state.
 */
export function pickCurrentSprint(sprints: Sprint[]): Sprint | null {
  const active = sprints.find((s) => s.status === "active");
  if (active) return active;
  const ended = sprints
    .filter((s) => s.status === "completed" && s.endsAt)
    .sort((a, b) => new Date(b.endsAt!).getTime() - new Date(a.endsAt!).getTime())[0];
  if (ended) return ended;
  const planned = sprints.filter((s) => s.status === "planned").sort(byPosition)[0];
  return planned ?? sprints[0] ?? null;
}

/** Sprint filter options ordered to match the backlog page (manual order: position, then name). */
export function sortSprintOptions(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort(byPosition);
}

const ticketLabel = (t: TicketSummary) => t.code ?? t.title ?? "—";

/** Stacked bars: estimate vs hours logged (split by person) per ticket. */
export function buildTicketChart(
  tickets: TicketSummary[],
  logs: WorkLogEntry[],
  nameById: Map<string, string>,
): { rows: ChartRow[]; people: string[] } {
  const codeById = new Map<string, string>();
  for (const t of tickets) codeById.set(t.id, ticketLabel(t));
  // ticketCode -> (person -> minutes)
  const buckets = new Map<string, Map<string, number>>();
  const personSet = new Set<string>();
  for (const log of logs) {
    const code = codeById.get(log.ticketId) ?? "—";
    const person = nameById.get(log.userId) ?? "Unknown";
    personSet.add(person);
    if (!buckets.has(code)) buckets.set(code, new Map());
    const b = buckets.get(code)!;
    b.set(person, (b.get(person) ?? 0) + (log.minutes ?? 0));
  }
  const people = Array.from(personSet).sort();
  const rows = tickets
    .map((t) => {
      const code = ticketLabel(t);
      const perPerson = buckets.get(code) ?? new Map<string, number>();
      const row: ChartRow = { name: code };
      let total = 0;
      for (const p of people) {
        const h = (perPerson.get(p) ?? 0) / 60;
        row[p] = h;
        total += h;
      }
      row.Estimate = (t.estimateMinutes ?? 0) / 60;
      row.__total = total;
      return row;
    })
    .filter((r) => (r.__total as number) > 0 || (r.Estimate as number) > 0)
    .sort((a, b) => (a.__total as number) - (b.__total as number));
  return { rows, people };
}

/** Tickets per board stage (left→right), stacked by individual ticket. */
export function buildStageChart(
  cols: BoardColumn[],
  tickets: TicketSummary[],
): { rows: ChartRow[]; keys: string[] } {
  const ordered = [...cols].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const colName = new Map<string, string>();
  for (const c of cols) colName.set(c.id, c.name ?? "—");
  const firstColId = ordered[0]?.id;
  // stage name -> row; each ticket contributes a 1-unit segment keyed by its code.
  const byStage = new Map<string, ChartRow>();
  for (const c of ordered) byStage.set(c.name ?? "—", { stage: c.name ?? "—" });
  const keys: string[] = [];
  for (const t of tickets) {
    const stageName =
      (t.columnId && colName.get(t.columnId)) || colName.get(firstColId ?? "") || "Unassigned";
    let row = byStage.get(stageName);
    if (!row) {
      row = { stage: stageName };
      byStage.set(stageName, row);
    }
    const key = t.code ?? t.title ?? t.id;
    row[key] = 1;
    keys.push(key);
  }
  return { rows: Array.from(byStage.values()), keys };
}

/**
 * Histogram: minutes logged per day (profile-timezone days), stacked by person. Sprint projects
 * span the sprint window; kanban spans from the first log. The window always stretches to cover
 * logs dated before the start or after today.
 */
export function buildHistogram(
  logs: WorkLogEntry[],
  sprintStartsAt: string | null | undefined,
  nameById: Map<string, string>,
  clock: DayClock,
): { rows: ChartRow[]; people: string[] } {
  const times = logs.map((l) => new Date(l.loggedAt).getTime()).filter(Number.isFinite);
  const earliestLog = times.length ? Math.min(...times) : Infinity;
  const latestLog = times.length ? Math.max(...times) : -Infinity;
  let startMs: number | null = null;
  if (sprintStartsAt) startMs = new Date(sprintStartsAt).getTime();
  else if (Number.isFinite(earliestLog)) startMs = earliestLog;
  if (startMs === null) return { rows: [], people: [] };
  if (Number.isFinite(earliestLog) && earliestLog < startMs) startMs = earliestLog;
  const start = clock.startOfDay(startMs);
  const end = Math.max(Date.now(), Number.isFinite(latestLog) ? latestLog : -Infinity);

  // day key -> (person -> minutes)
  const buckets = new Map<string, Map<string, number>>();
  for (let d = start; d <= end; d += DAY_MS) {
    buckets.set(zonedDayKey(d, clock.offsetMin), new Map());
  }
  const personSet = new Set<string>();
  for (const log of logs) {
    const day = buckets.get(zonedDayKey(new Date(log.loggedAt).getTime(), clock.offsetMin));
    if (!day) continue;
    const person = nameById.get(log.userId) ?? "Unknown";
    personSet.add(person);
    day.set(person, (day.get(person) ?? 0) + (log.minutes ?? 0));
  }
  const people = Array.from(personSet).sort();
  const rows = Array.from(buckets.entries()).map(([day, perPerson]) => {
    const row: ChartRow = { day: day.slice(5) };
    for (const p of people) row[p] = (perPerson.get(p) ?? 0) / 60;
    return row;
  });
  return { rows, people };
}

/** Stable color per person, shared across both logged-time charts. */
export function personColors(...groups: string[][]): Map<string, string> {
  const all = Array.from(new Set(groups.flat())).sort();
  const m = new Map<string, string>();
  all.forEach((p, i) => m.set(p, CHART_COLORS[i % CHART_COLORS.length]));
  return m;
}

export type CloseInfo = { deltaHours: number; closed: boolean } | null;

/**
 * Planned end vs now (open sprints) or vs the actual close (completed sprints: the latest time
 * any sprint ticket entered a done column, per stage history). Positive = early / time left.
 */
export function computeCloseInfo(
  sprint: Sprint | null,
  history: StageTransition[],
  doneIds: Set<string>,
  ticketIds: Set<string>,
): CloseInfo {
  if (!sprint?.endsAt) return null;
  const end = new Date(sprint.endsAt).getTime();
  if (sprint.status === "completed") {
    const closeTimes = history
      .filter((h) => ticketIds.has(h.ticketId) && h.columnId && doneIds.has(h.columnId))
      .map((h) => new Date(h.enteredAt).getTime());
    if (!closeTimes.length) return null;
    const actualClose = Math.max(...closeTimes);
    return { deltaHours: Math.round((end - actualClose) / 3_600_000), closed: true };
  }
  return { deltaHours: Math.round((end - Date.now()) / 3_600_000), closed: false };
}

export function formatCloseDelta(info: CloseInfo): string {
  if (info === null) return "—";
  const h = info.deltaHours;
  const abs = Math.abs(h);
  const d = Math.floor(abs / 24);
  const rh = abs % 24;
  const parts = [d ? `${d}d` : "", `${rh}h`].filter(Boolean).join(" ");
  // Under target = negative (green), over target = positive (red).
  return h > 0 ? `-${parts}` : `+${parts}`;
}
