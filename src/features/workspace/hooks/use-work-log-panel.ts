import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/features/auth/auth-context";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import type { TicketReportRow } from "@/features/reporting/api/reporting.api";
import {
  DAY_MS,
  PRESETS,
  fetchWindowFor,
  inRange,
  resolveRange,
  sprintWindowOf,
  type PresetKey,
} from "../lib/work-log-range";
import {
  buildChartData,
  buildStageOptions,
  perDayTotals,
  perPersonTotals,
  perProjectTotals,
  ticketIdsByDay,
  type TicketRowView,
} from "../lib/work-log-derive";
import { useScopeSprints, useWorkLogData, type ProjectScope } from "./use-work-log-data";

/**
 * State and derived numbers behind My Work Log: filters (projects, sprints, people, date range),
 * the reads they drive, and every per-day / per-project / per-person / per-ticket rollup.
 */
export function useWorkLogPanel() {
  const { user, hasAnyRole, adminAccountIds } = useAuth();
  // Includes archived projects so past hours logged there still count.
  const { allProjects: projects } = useProjects();
  const tz = useTimezone();

  // Only account admins (and super admins) may report on other people, and only inside accounts
  // they administer. The server decides who is reportable; this only shows/hides the picker.
  const isSuper = hasAnyRole(["super_admin"]);
  const adminProjectIds = useMemo(() => {
    const adminAccounts = new Set(adminAccountIds ?? []);
    return isSuper
      ? projects.map((p) => p.id)
      : projects.filter((p) => adminAccounts.has(p.accountId)).map((p) => p.id);
  }, [projects, adminAccountIds, isSuper]);

  // Multi-select of projects to report on. Empty = every project in scope.
  const [projectIds, setProjectIds] = useState<string[]>([]);
  // Multi-select of people to report on. Empty = just the signed-in user.
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [preset, setPreset] = useState<PresetKey>("last7");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [ticketTab, setTicketTab] = useState<"open" | "closed">("open");
  // Day picked by clicking a bar in the chart; the ticket table then shows that day only.
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  // Sprints picked in the sprint filter (single sprint-type project only).
  const [sprintIds, setSprintIds] = useState<string[]>([]);

  const targetUserIds = useMemo(
    () => (resourceIds.length ? resourceIds : user?.id ? [user.id] : []),
    [resourceIds, user?.id],
  );
  const scopedProjects = useMemo(
    () => (projectIds.length ? projects.filter((p) => projectIds.includes(p.id)) : projects),
    [projects, projectIds],
  );
  const scope = useMemo<ProjectScope>(
    () => ({
      ids: scopedProjects.map((p) => p.id),
      filterIds: projectIds.length ? projectIds : undefined,
    }),
    [scopedProjects, projectIds],
  );
  const canPickResource = useMemo(() => {
    const admin = new Set(adminProjectIds);
    return scope.ids.some((id) => admin.has(id));
  }, [scope.ids, adminProjectIds]);

  // Losing admin scope must immediately fall back to the personal view.
  useEffect(() => {
    if (!canPickResource && resourceIds.length) setResourceIds([]);
  }, [canPickResource, resourceIds.length]);
  // Changing the date range, people or projects invalidates a picked chart day.
  useEffect(() => {
    setDayFilter(null);
  }, [preset, customFrom, customTo, resourceIds, projectIds, sprintIds]);
  // Switching project (or leaving single-project mode) clears picked sprints.
  useEffect(() => {
    setSprintIds([]);
  }, [projectIds]);

  const { data: sprints = [] } = useScopeSprints(scope);

  // --- Sprint filter: only with exactly one sprint-type project selected. ---
  const sprintProject =
    projectIds.length === 1 ? (projects.find((p) => p.id === projectIds[0]) ?? null) : null;
  const showSprintFilter = !!sprintProject && sprintProject.projectType === "sprint";
  const sprintOptions = useMemo(() => {
    if (!showSprintFilter || !sprintProject) return [];
    return sprints
      .filter((s) => s.projectId === sprintProject.id)
      .map((s) => ({ ...s, window: sprintWindowOf(s, tz) }))
      .sort((a, b) => {
        const aActive = a.status === "active" ? 0 : 1;
        const bActive = b.status === "active" ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return (b.window?.from ?? 0) - (a.window?.from ?? 0);
      });
  }, [sprints, showSprintFilter, sprintProject, tz]);
  const selectedSprints = useMemo(
    () => sprintOptions.filter((s) => sprintIds.includes(s.id) && s.window),
    [sprintOptions, sprintIds],
  );
  const sprintWindows = useMemo(() => selectedSprints.map((s) => s.window!), [selectedSprints]);
  const sprintSpan = useMemo(
    () =>
      sprintWindows.length
        ? {
            from: Math.min(...sprintWindows.map((w) => w.from)),
            to: Math.max(...sprintWindows.map((w) => w.to)),
          }
        : null,
    [sprintWindows],
  );

  const range = useMemo(
    () => resolveRange(preset, customFrom, customTo, sprintSpan, tz),
    [preset, customFrom, customTo, tz, sprintSpan],
  );
  const fetchWindow = useMemo(() => fetchWindowFor(range, tz), [range, tz]);

  const data = useWorkLogData({ scope, targetUserIds, fetchWindow, userId: user?.id });
  const { tickets, logs, columns, nameFor, loading } = data;

  const ticketById = useMemo(() => new Map(tickets.map((t) => [t.id, t])), [tickets]);
  const doneColumnIds = useMemo(
    () => new Set(columns.filter((c) => c.isDone).map((c) => c.id)),
    [columns],
  );
  const columnName = useMemo(() => new Map(columns.map((c) => [c.id, c.name])), [columns]);
  const projectName = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const sprintName = useMemo(() => new Map(sprints.map((s) => [s.id, s.name])), [sprints]);

  /** With sprints picked, only tickets currently in one of those sprints count. */
  const inSelectedSprints = useMemo(() => {
    const set = sprintWindows.length ? new Set(selectedSprints.map((s) => s.id)) : null;
    return (t: Pick<TicketReportRow, "sprintId"> | undefined) =>
      !set || (!!t?.sprintId && set.has(t.sprintId));
  }, [sprintWindows, selectedSprints]);

  /**
   * Logs on a ticket inside the project scope. With sprints picked, only hours on tickets in those
   * sprints, logged inside one of those sprints' dates, count.
   */
  const scopedLogs = useMemo(
    () =>
      logs.filter((l) => {
        const ticket = ticketById.get(l.ticketId);
        if (!ticket) return false;
        if (!sprintWindows.length) return true;
        if (!inSelectedSprints(ticket)) return false;
        return sprintWindows.some((w) => inRange(l.loggedAt, w));
      }),
    [logs, ticketById, sprintWindows, inSelectedSprints],
  );
  /** Logs inside the selected range (also what the exports contain). */
  const rangeLogs = useMemo(
    () => scopedLogs.filter((l) => inRange(l.loggedAt, range)),
    [scopedLogs, range],
  );
  const totalMinutes = useMemo(
    () => rangeLogs.reduce((sum, l) => sum + (l.minutes ?? 0), 0),
    [rangeLogs],
  );

  const perDay = useMemo(
    () => perDayTotals(scopedLogs, range, tz.startOfDay),
    [scopedLogs, range, tz],
  );
  const perProject = useMemo(
    () => perProjectTotals(scopedLogs, range, ticketById, projectName),
    [scopedLogs, range, ticketById, projectName],
  );
  const perPerson = useMemo(
    () => perPersonTotals(scopedLogs, range, targetUserIds, nameFor),
    [scopedLogs, range, targetUserIds, nameFor],
  );

  /** Assigned workload for everyone selected (all time, scope-filtered). */
  const workload = useMemo(() => {
    const selected = new Set(targetUserIds);
    const mine = tickets.filter(
      (t) => t.assigneeId && selected.has(t.assigneeId) && inSelectedSprints(t),
    );
    const completed = mine.filter((t) => t.columnId && doneColumnIds.has(t.columnId)).length;
    return { total: mine.length, completed, pending: mine.length - completed };
  }, [tickets, targetUserIds, doneColumnIds, inSelectedSprints]);

  /** Builds one table row for a ticket, with hours logged inside the range. */
  const buildRow = useMemo(() => {
    const minutesByTicket = new Map<string, number>();
    for (const l of rangeLogs)
      minutesByTicket.set(l.ticketId, (minutesByTicket.get(l.ticketId) ?? 0) + (l.minutes ?? 0));
    return (t: TicketReportRow): TicketRowView => {
      const stage = (t.columnId && columnName.get(t.columnId)) || t.stageName || null;
      const stageDone =
        (!!t.columnId && doneColumnIds.has(t.columnId)) || /\b(done|complete)\b/i.test(stage ?? "");
      return {
        id: t.id,
        code: t.code,
        title: t.title,
        priority: t.priority,
        type: t.type,
        dueDate: t.dueDate,
        updatedAt: t.updatedAt,
        stage,
        stageDone,
        sprint: (t.sprintId && sprintName.get(t.sprintId)) || "No sprint",
        project: projectName.get(t.projectId) ?? "Unknown project",
        assignee: t.assigneeId ? nameFor(t.assigneeId) : "—",
        loggedMinutes: minutesByTicket.get(t.id) ?? 0,
      };
    };
  }, [rangeLogs, columnName, doneColumnIds, sprintName, projectName, nameFor]);

  const loggedInRangeTicketIds = useMemo(
    () => new Set(rangeLogs.map((l) => l.ticketId)),
    [rangeLogs],
  );

  /**
   * "Custom" with no dates picked means no date filter: everything the selected people are
   * assigned plus every ticket they logged time on. Otherwise ONLY tickets with hours logged by
   * the selected people inside the range.
   */
  const dateFilterActive = !!sprintSpan || !(preset === "custom" && !customFrom);
  const assignedTickets = useMemo(() => {
    const selected = new Set(targetUserIds);
    return tickets
      .filter((t) => {
        if (!inSelectedSprints(t)) return false;
        const assigned = !!t.assigneeId && selected.has(t.assigneeId);
        if (!dateFilterActive) return assigned || loggedInRangeTicketIds.has(t.id);
        return loggedInRangeTicketIds.has(t.id);
      })
      .map(buildRow)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [
    tickets,
    targetUserIds,
    buildRow,
    dateFilterActive,
    loggedInRangeTicketIds,
    inSelectedSprints,
  ]);

  const idsByDay = useMemo(
    () => ticketIdsByDay(scopedLogs, range, tz.startOfDay),
    [scopedLogs, range, tz],
  );
  /** Tickets worked on the day picked in the chart (assigned or not). */
  const dayTickets = useMemo(() => {
    if (dayFilter === null) return null;
    const ids = idsByDay.get(dayFilter);
    if (!ids) return [];
    return tickets
      .filter((t) => ids.has(t.id))
      .map(buildRow)
      .sort((a, b) => b.loggedMinutes - a.loggedMinutes);
  }, [dayFilter, idsByDay, tickets, buildRow]);

  const stageOptions = useMemo(
    () => buildStageOptions(columns, scopedProjects),
    [columns, scopedProjects],
  );
  const allStages = stageFilter.length === 0 || stageFilter.length === stageOptions.length;
  const filteredTickets = useMemo(() => {
    const base = dayTickets ?? assignedTickets;
    return allStages ? base : base.filter((t) => stageFilter.includes(t.stage ?? "No stage"));
  }, [dayTickets, assignedTickets, stageFilter, allStages]);
  const openTickets = useMemo(() => filteredTickets.filter((t) => !t.stageDone), [filteredTickets]);
  const closedTickets = useMemo(
    () => filteredTickets.filter((t) => t.stageDone),
    [filteredTickets],
  );

  const chartPeople = useMemo(
    () => targetUserIds.map((id) => ({ id, name: nameFor(id) })),
    [targetUserIds, nameFor],
  );
  const chartData = useMemo(
    () => buildChartData(scopedLogs, range, chartPeople, ticketById, tz),
    [scopedLogs, range, chartPeople, ticketById, tz],
  );

  // --- Labels ---
  const shortDate = (ms: number) => tz.formatDate(ms, { month: "short", day: "numeric" });
  const rangeLabel = sprintSpan
    ? `${
        selectedSprints.length <= 2
          ? selectedSprints.map((s) => s.name).join(", ")
          : `${selectedSprints.length} sprints`
      } (${shortDate(sprintSpan.from)} – ${shortDate(sprintSpan.to - DAY_MS)})`
    : preset === "custom" && customFrom
      ? `${format(customFrom, "MMM d, yyyy")} – ${format(customTo ?? customFrom, "MMM d, yyyy")}`
      : (PRESETS.find((p) => p.key === preset)?.label ?? "");
  const scopeLabel =
    projectIds.length === 0
      ? "All my projects"
      : projectIds.length === 1
        ? (projectName.get(projectIds[0]) ?? "1 project")
        : `${projectIds.length} projects`;
  const selfName = nameFor(user?.id ?? "");
  const peopleLabel =
    resourceIds.length === 0
      ? selfName
      : resourceIds.length === 1
        ? nameFor(resourceIds[0])
        : `${resourceIds.length} people`;

  const toggle = (id: string) => (prev: string[]) =>
    prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];

  return {
    tz,
    projects,
    resources: data.resources,
    columnsFetching: data.columnsFetching,
    refetchColumns: data.refetchColumns,
    loading,
    nameFor,
    selfName,
    // filters
    projectIds,
    setProjectIds,
    toggleProject: (id: string) => setProjectIds(toggle(id)),
    resourceIds,
    setResourceIds,
    toggleResource: (id: string) => setResourceIds(toggle(id)),
    canPickResource,
    preset,
    setPreset,
    customFrom,
    customTo,
    setCustomRange: (from: Date | undefined, to: Date | undefined) => {
      setCustomFrom(from);
      setCustomTo(to);
    },
    showSprintFilter,
    sprintOptions,
    sprintIds,
    setSprintIds,
    toggleSprint: (id: string) => setSprintIds(toggle(id)),
    selectedSprints,
    sprintSpan,
    stageFilter,
    setStageFilter,
    stageOptions,
    allStages,
    ticketTab,
    setTicketTab,
    dayFilter,
    setDayFilter,
    // derived
    targetUserIds,
    range,
    rangeLabel,
    scopeLabel,
    peopleLabel,
    totalMinutes,
    perDay,
    perProject,
    perPerson,
    workload,
    tickets,
    ticketById,
    buildRow,
    rangeLogs,
    filteredTickets,
    openTickets,
    closedTickets,
    chartPeople,
    chartData,
  };
}

export type WorkLogPanelState = ReturnType<typeof useWorkLogPanel>;
