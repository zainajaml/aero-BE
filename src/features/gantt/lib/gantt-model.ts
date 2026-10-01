import type { TicketSummary, StageTransition } from "@/features/tickets/api/tickets.api";
import type { BoardColumn, Epic, Sprint } from "@/features/tickets/api/planning.api";

export const DAY = 86_400_000;
/** px reserved for the fixed left labels. */
export const LABEL_W = 360;

export const RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "60", label: "Last 60 days", days: 60 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "180", label: "Last 6 months", days: 180 },
  { value: "365", label: "Last 12 months", days: 365 },
] as const;

export type ViewMode = "sprints" | "epics";

export type GanttTicket = TicketSummary;

export interface GanttGroup {
  id: string;
  name: string;
  status?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  tickets: GanttTicket[];
}

export interface StageMark {
  name: string;
  at: number;
}

export interface ProjectData {
  project: { id: string; name: string };
  tickets: TicketSummary[];
  sprints: Sprint[];
  columns: BoardColumn[];
  epics: Epic[];
  history: StageTransition[];
}

const NO_EPIC_SUFFIX = ":no-epic";
export const isNoEpicGroup = (id: string) => id.endsWith(NO_EPIC_SUFFIX);

const CLOSED = ["completed", "closed", "done"];
export const isClosedStatus = (status: string | undefined) =>
  CLOSED.includes((status ?? "").toLowerCase());

/** A sprint that hasn't started (not active and not closed). */
export const sprintNotStarted = (status: string | undefined) =>
  (status ?? "").toLowerCase() !== "active" && !isClosedStatus(status);

/**
 * Stage timeline of every ticket: the recorded stage history, or (when none) a single mark for
 * its current stage at creation time.
 */
export function buildTimelineLookup(data: ProjectData[]) {
  const stagesByTicket = new Map<string, StageMark[]>();
  const colName = new Map<string, string>();
  for (const d of data) {
    for (const c of d.columns) colName.set(c.id, c.name);
    const sorted = [...d.history].sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
    for (const h of sorted) {
      const arr = stagesByTicket.get(h.ticketId) ?? [];
      arr.push({ name: h.columnName, at: new Date(h.enteredAt).getTime() });
      stagesByTicket.set(h.ticketId, arr);
    }
  }
  return (t: GanttTicket): StageMark[] => {
    const existing = stagesByTicket.get(t.id);
    if (existing && existing.length) return existing;
    const current = t.columnId ? colName.get(t.columnId) : undefined;
    return [{ name: current ?? "Backlog", at: new Date(t.createdAt).getTime() }];
  };
}

/** Groups (sprints or epics) per project; projects without groups are dropped. */
export function buildModel(data: ProjectData[], viewMode: ViewMode) {
  return data
    .map(({ project, tickets, sprints, epics }) => {
      let groups: GanttGroup[];
      if (viewMode === "sprints") {
        const ordered = [...sprints].sort((a, b) =>
          (a.startsAt ?? "￿").localeCompare(b.startsAt ?? "￿"),
        );
        groups = ordered.map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          startsAt: sprint.startsAt,
          endsAt: sprint.endsAt,
          tickets: tickets.filter((t) => t.sprintId === sprint.id),
        }));
      } else {
        // Every epic of the project (even empty ones) and the tickets assigned to each.
        const realEpicIds = new Set(epics.map((e) => e.id));
        groups = epics.map((epic) => ({
          id: epic.id,
          name: epic.name,
          tickets: tickets.filter((t) => t.epicIds.includes(epic.id)),
        }));
        const noEpic = tickets.filter(
          (t) => t.epicIds.filter((id) => realEpicIds.has(id)).length === 0,
        );
        if (noEpic.length) {
          groups.push({
            id: `${project.id}${NO_EPIC_SUFFIX}`,
            name: "No Epic Assigned",
            tickets: noEpic,
          });
        }
      }
      return { project, groups };
    })
    .filter((row) => row.groups.length > 0);
}

export type GanttModel = ReturnType<typeof buildModel>;

/** Global date domain across every visible group and stage marker. */
export function computeDomain(
  model: GanttModel,
  viewMode: ViewMode,
  range: string,
  timelineFor: (t: GanttTicket) => StageMark[],
) {
  const times: number[] = [];
  const now = Date.now();
  for (const { groups } of model) {
    for (const group of groups) {
      if (viewMode === "sprints") {
        if (group.startsAt) times.push(new Date(group.startsAt).getTime());
        if (group.endsAt) {
          const e = new Date(group.endsAt).getTime();
          times.push(e);
          if (!isClosedStatus(group.status) && now > e) times.push(now);
        }
      }
      for (const t of group.tickets) for (const s of timelineFor(t)) times.push(s.at);
    }
  }
  if (!times.length) return { min: now - 7 * DAY, max: now + 7 * DAY };

  let min = Math.min(...times);
  let max = Math.max(...times);
  const rangeDays = RANGE_OPTIONS.find((r) => r.value === range)?.days;
  if (rangeDays) {
    min = now - rangeDays * DAY;
    max = Math.max(max, now);
  }
  if (max - min < DAY) {
    min -= DAY;
    max += DAY;
  }
  const pad = (max - min) * 0.04;
  return { min: min - pad, max: max + pad };
}
