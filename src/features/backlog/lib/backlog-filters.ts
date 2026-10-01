import type { BacklogTicket } from "./backlog-types";

/** Page-wide filters (one place, not per sprint). */
export interface BacklogFilters {
  search: string;
  stages: string[];
  types: string[];
  priorities: string[];
  reporters: string[];
  /** "all", "__unassigned__" or a user id. */
  assignee: string;
}

export const EMPTY_FILTERS: BacklogFilters = {
  search: "",
  stages: [],
  types: [],
  priorities: [],
  reporters: [],
  assignee: "all",
};

export const TICKET_TYPES = ["task", "bug", "story", "epic"];
export const TICKET_PRIORITIES = ["urgent", "high", "medium", "low"];

/** Search + assignee/type/priority/reporter filters (stage is applied per zone). */
export function matchesFilters(t: BacklogTicket, f: BacklogFilters): boolean {
  const q = f.search.trim().toLowerCase();
  const matchesSearch =
    !q || (t.title ?? "").toLowerCase().includes(q) || (t.code ?? "").toLowerCase().includes(q);
  return (
    matchesSearch &&
    (f.assignee === "all" ||
      (f.assignee === "__unassigned__" ? !t.assigneeId : t.assigneeId === f.assignee)) &&
    (f.types.length === 0 || f.types.includes(t.type ?? "task")) &&
    (f.priorities.length === 0 || f.priorities.includes(t.priority ?? "medium")) &&
    (f.reporters.length === 0 || f.reporters.includes(t.reporterId ?? ""))
  );
}

/** Stage filter: tickets without a column count as the backlog column. */
export function applyStageFilter(
  items: BacklogTicket[],
  stages: string[],
  backlogColumnId: string | null,
): BacklogTicket[] {
  if (stages.length === 0) return items;
  return items.filter((t) => {
    const colId = t.columnId ?? backlogColumnId;
    return colId ? stages.includes(colId) : false;
  });
}

export function activeFilterCount(f: BacklogFilters): number {
  return (
    f.stages.length +
    f.types.length +
    f.priorities.length +
    f.reporters.length +
    (f.assignee === "all" ? 0 : 1)
  );
}

export const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
