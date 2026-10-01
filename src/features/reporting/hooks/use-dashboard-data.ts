import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import { displayName } from "@/features/users/lib/names";
import {
  listPeople,
  listProjectColumns,
  listProjectSprints,
  listProjectTickets,
  listReportWorkLogs,
  listStageHistory,
} from "../api/reporting.api";
import { reportingKeys } from "./reporting-queries";
import {
  buildHistogram,
  buildStageChart,
  buildTicketChart,
  computeCloseInfo,
  personColors,
  pickCurrentSprint,
  sortSprintOptions,
} from "../lib/dashboard-charts";

/** Loads the dashboard's project data and derives the headline numbers and chart series. */
export function useDashboardData() {
  const { activeProject } = useProjects();
  const { info, startOfDay } = useTimezone();
  const pid = activeProject?.id;
  const isKanban = activeProject?.projectType === "kanban";
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Board columns: used to figure out which tickets are "closed" (done).
  const { data: cols = [] } = useQuery({
    queryKey: reportingKeys.columns(pid),
    enabled: !!pid,
    queryFn: () => listProjectColumns(pid!),
  });

  // All sprints for this project (active / planned / completed).
  const { data: sprints = [] } = useQuery({
    queryKey: reportingKeys.sprints(pid),
    enabled: !!pid,
    queryFn: () => listProjectSprints(pid!),
  });

  const currentSprint = useMemo(() => pickCurrentSprint(sprints), [sprints]);
  const sprintOptions = useMemo(() => sortSprintOptions(sprints), [sprints]);
  // The sprint whose data is currently displayed (defaults to the current one).
  const selectedSprint = useMemo(
    () =>
      (selectedSprintId ? sprints.find((s) => s.id === selectedSprintId) : null) ?? currentSprint,
    [selectedSprintId, sprints, currentSprint],
  );

  // All tickets in the project (we split by sprint ourselves).
  const { data: tickets = [] } = useQuery({
    queryKey: reportingKeys.tickets(pid),
    enabled: !!pid,
    queryFn: () => listProjectTickets(pid!),
  });

  // Tickets in scope: the whole board for kanban, else the selected sprint.
  const sprintTickets = useMemo(
    () =>
      isKanban
        ? tickets
        : selectedSprint
          ? tickets.filter((t) => t.sprintId === selectedSprint.id)
          : [],
    [tickets, selectedSprint, isKanban],
  );
  const sprintTicketIds = useMemo(() => new Set(sprintTickets.map((t) => t.id)), [sprintTickets]);

  // Every work log against the in-scope tickets (all time — people often log before the sprint
  // window opens).
  const logScope = useMemo(
    () => ({
      projectIds: pid ? [pid] : [],
      sprintIds: !isKanban && selectedSprint ? [selectedSprint.id] : undefined,
    }),
    [pid, isKanban, selectedSprint],
  );
  const { data: sprintLogs = [] } = useQuery({
    queryKey: reportingKeys.workLogs(logScope),
    enabled: !!pid && sprintTicketIds.size > 0,
    queryFn: () => listReportWorkLogs(logScope),
  });

  // Stage transitions, only needed for completed sprints (to find the actual close time).
  const { data: stageHistory = [] } = useQuery({
    queryKey: reportingKeys.stageHistory(pid),
    enabled: !!pid && sprintTicketIds.size > 0 && selectedSprint?.status === "completed",
    queryFn: () => listStageHistory(pid!),
  });

  // Names of the people who logged work (to label stacked bars).
  const loggerIds = useMemo(
    () => Array.from(new Set(sprintLogs.map((l) => l.userId).filter(Boolean))).sort(),
    [sprintLogs],
  );
  const { data: loggers = [] } = useQuery({
    queryKey: reportingKeys.people(loggerIds),
    enabled: loggerIds.length > 0,
    queryFn: () => listPeople(loggerIds),
  });
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of loggers) m.set(p.id, displayName(p, "Unknown"));
    return m;
  }, [loggers]);

  const doneIds = useMemo(() => new Set(cols.filter((c) => c.isDone).map((c) => c.id)), [cols]);

  const closed = sprintTickets.filter((t) => t.columnId && doneIds.has(t.columnId)).length;
  const total = sprintTickets.length;

  const ticketChart = useMemo(
    () => buildTicketChart(sprintTickets, sprintLogs, nameById),
    [sprintTickets, sprintLogs, nameById],
  );
  const stageChart = useMemo(() => buildStageChart(cols, sprintTickets), [cols, sprintTickets]);
  const histogram = useMemo(
    () =>
      buildHistogram(sprintLogs, selectedSprint?.startsAt, nameById, {
        offsetMin: info.offsetMin,
        startOfDay,
      }),
    [sprintLogs, selectedSprint, nameById, info.offsetMin, startOfDay],
  );
  const personColor = useMemo(
    () => personColors(ticketChart.people, histogram.people),
    [ticketChart.people, histogram.people],
  );

  const loggedTotal = sprintLogs.reduce((s, l) => s + (l.minutes ?? 0), 0);
  const estimatedTotal = sprintTickets.reduce((s, t) => s + (t.estimateMinutes ?? 0), 0);
  const closeInfo = useMemo(
    () => computeCloseInfo(selectedSprint, stageHistory, doneIds, sprintTicketIds),
    [selectedSprint, stageHistory, doneIds, sprintTicketIds],
  );

  // Map a ticket code/title (used as the bar label) back to its ticket id.
  const codeToTicketId = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of sprintTickets) m.set(t.code ?? t.title ?? "—", t.id);
    return m;
  }, [sprintTickets]);

  return {
    activeProject,
    isKanban,
    offsetMin: info.offsetMin,
    sprintOptions,
    selectedSprint,
    setSelectedSprintId,
    counts: { open: total - closed, closed, total },
    loggedTotal,
    estimatedTotal,
    closeInfo,
    ticketChart,
    stageChart,
    histogram,
    personColor,
    codeToTicketId,
  };
}
