import type { GanttGroup, GanttTicket, StageMark, ViewMode } from "./gantt-model";
import { sprintNotStarted } from "./gantt-model";

/** Maps times onto the timeline and formats them in the user's timezone. */
export interface GanttScale {
  pct: (t: number) => number;
  fmtDate: (d: number | string | Date) => string;
  fmtDateTime: (d: number | string | Date) => string;
  domainMin: number;
}

/**
 * Stage segments of a ticket row. Tickets never extend past today (the sprint bar may still
 * show a future end), and tickets of a not-yet-started sprint show no segments at all.
 */
export function ticketSegments(
  t: GanttTicket,
  group: GanttGroup,
  stages: StageMark[],
  viewMode: ViewMode,
  sprintStatusOf: (sprintId: string) => string | undefined,
  domainMin: number,
) {
  const now = Date.now();
  const groupStart =
    group.startsAt != null ? new Date(group.startsAt).getTime() : (stages[0]?.at ?? domainMin);
  const groupEnd = Math.min(group.endsAt != null ? new Date(group.endsAt).getTime() : now, now);

  let notStarted: boolean;
  if (viewMode === "sprints") {
    notStarted = sprintNotStarted(group.status);
  } else {
    // Only suppress when the ticket belongs to a not-yet-started sprint.
    const status = t.sprintId ? sprintStatusOf(t.sprintId) : undefined;
    notStarted = status !== undefined && sprintNotStarted(status);
  }
  if (notStarted) return [];
  return stages.map((s, i) => {
    const start = Math.min(i === 0 ? groupStart : s.at, now);
    const end = Math.min(stages[i + 1]?.at ?? groupEnd, now);
    return { name: s.name, start, end: Math.max(end, start) };
  });
}
