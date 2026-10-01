import { useMemo } from "react";
import { keepPreviousData, useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  listPeople,
  listProjectColumns,
  listReportSprints,
  listReportTickets,
  listReportWorkLogs,
  listReportableUsers,
  type BoardColumn,
  type TicketReportRow,
} from "@/features/reporting/api/reporting.api";
import { reportingKeys } from "@/features/reporting/hooks/reporting-queries";
import { displayName } from "@/features/users/lib/names";
import type { DayRange } from "../lib/work-log-range";

/**
 * Projects the panel reports on. `ids` are the projects in scope (used to gate queries and to load
 * board columns); `filterIds` is what is sent to the report endpoints — `undefined` when no project
 * is picked, which the server resolves to every project the caller can see.
 */
export type ProjectScope = { ids: string[]; filterIds: string[] | undefined };

/** Ticket ids per request when resolving tickets that carry logged time (keeps URLs short). */
const ID_CHUNK = 200;

/** Sprints of the projects in scope (sprint names for the table and the sprint filter). */
export function useScopeSprints(scope: ProjectScope) {
  const q = { projectIds: scope.filterIds };
  return useQuery({
    queryKey: reportingKeys.reportSprints(q),
    enabled: scope.ids.length > 0,
    queryFn: () => listReportSprints(q),
  });
}

const combineColumns = (results: UseQueryResult<BoardColumn[]>[]) => ({
  columns: results.flatMap((r) => r.data ?? []),
  isFetching: results.some((r) => r.isFetching),
  refetch: () => Promise.all(results.map((r) => r.refetch())),
});

/** Board columns of every project in scope — the stage filter lists all of their names. */
function useScopeColumns(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: reportingKeys.columns(projectId),
      queryFn: () => listProjectColumns(projectId),
    })),
    combine: combineColumns,
  });
}

async function ticketsByIds(projectIds: string[] | undefined, ids: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) chunks.push(ids.slice(i, i + ID_CHUNK));
  const pages = await Promise.all(
    chunks.map((chunk) => listReportTickets({ projectIds, ids: chunk })),
  );
  return pages.flat();
}

/**
 * Every read behind the My Work Log panel: work logs of the selected people inside the fetch
 * window, the tickets they are assigned to or logged time on, sprints, stage columns, and the
 * people the caller may report on (decided by the server).
 */
export function useWorkLogData({
  scope,
  targetUserIds,
  fetchWindow,
  userId,
}: {
  scope: ProjectScope;
  targetUserIds: string[];
  fetchWindow: DayRange;
  userId: string | undefined;
}) {
  const hasScope = scope.ids.length > 0;
  const projectIds = scope.filterIds;

  // --- Tickets assigned to the selected people (workload + table). ---
  const assignedQuery = { projectIds, assigneeIds: targetUserIds };
  const { data: assignedRows = [], isLoading: ticketsLoading } = useQuery({
    queryKey: reportingKeys.reportTickets(assignedQuery),
    enabled: hasScope && targetUserIds.length > 0,
    queryFn: () => listReportTickets(assignedQuery),
  });

  const columnsResult = useScopeColumns(scope.ids);

  // --- Work logs for the selected people, bounded to the visible window. ---
  const logQuery = {
    userIds: targetUserIds,
    from: new Date(fetchWindow.from).toISOString(),
    to: new Date(fetchWindow.to).toISOString(),
  };
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: reportingKeys.workLogs(logQuery),
    enabled: targetUserIds.length > 0,
    queryFn: () => listReportWorkLogs(logQuery),
  });

  // Tickets that carry logged time but are assigned to someone else (e.g. moved
  // to QA). Needed so those hours still land in the day/project totals.
  const loggedTicketIds = useMemo(
    () => Array.from(new Set(logs.map((l) => l.ticketId).filter(Boolean))),
    [logs],
  );
  const { data: loggedRows = [] } = useQuery({
    queryKey: reportingKeys.reportTickets({ projectIds, ids: loggedTicketIds }),
    enabled: hasScope && loggedTicketIds.length > 0,
    queryFn: () => ticketsByIds(projectIds, loggedTicketIds),
  });

  /** Assigned tickets plus any ticket the selected people logged time on. */
  const tickets = useMemo(() => {
    const map = new Map<string, TicketReportRow>();
    for (const t of [...assignedRows, ...loggedRows]) map.set(t.id, t);
    return Array.from(map.values());
  }, [assignedRows, loggedRows]);

  // --- People the caller may report on (always includes the caller). ---
  const reportable = useQuery({
    queryKey: reportingKeys.reportableUsers(projectIds),
    enabled: !!userId,
    queryFn: () => listReportableUsers(projectIds),
    placeholderData: keepPreviousData,
  });
  const resources = useMemo(
    () => (reportable.data ?? []).map((r) => ({ id: r.id, name: r.displayName || "—" })),
    [reportable.data],
  );

  // --- Names of assignees outside the reportable set (e.g. a ticket moved to QA). ---
  const otherAssigneeIds = useMemo(() => {
    const known = new Set(resources.map((r) => r.id));
    const ids = new Set<string>();
    for (const t of tickets) if (t.assigneeId && !known.has(t.assigneeId)) ids.add(t.assigneeId);
    return Array.from(ids).sort();
  }, [tickets, resources]);
  const { data: people = [] } = useQuery({
    queryKey: reportingKeys.people(otherAssigneeIds),
    enabled: otherAssigneeIds.length > 0,
    queryFn: () => listPeople(otherAssigneeIds),
  });

  /** Display names for everyone in view. */
  const nameFor = useMemo(() => {
    const map = new Map<string, string>(people.map((p) => [p.id, displayName(p, "Unknown user")]));
    for (const r of resources) map.set(r.id, r.name);
    return (id: string) => map.get(id) ?? "Unknown user";
  }, [resources, people]);

  return {
    tickets,
    logs,
    columns: columnsResult.columns,
    columnsFetching: columnsResult.isFetching,
    refetchColumns: columnsResult.refetch,
    resources,
    /** False until the reportable-people list has loaded at least once. */
    resourcesReady: reportable.isSuccess,
    nameFor,
    // Disabled queries stay "pending" forever, so only treat it as loading when
    // there is actually something in scope to fetch.
    loading: hasScope && (ticketsLoading || logsLoading),
  };
}

export type WorkLogData = ReturnType<typeof useWorkLogData>;
