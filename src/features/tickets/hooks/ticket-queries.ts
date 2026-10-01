import { useMemo } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useProjects } from "@/features/projects/project-context";
import {
  getTicket,
  listAttachments,
  listComments,
  listEstimates,
  listProjectEstimates,
  listProjectTickets,
  listStageHistory,
  listWorkLogs,
} from "../api/tickets.api";
import {
  listAssignablePeople,
  listColumns,
  listEpics,
  listPeople,
  listRates,
  listSprints,
  type Person,
} from "../api/planning.api";

/** One key factory for the ticket domain; every key carries its ids. */
export const ticketKeys = {
  all: ["tickets"] as const,
  project: (projectId: string | null | undefined) =>
    [...ticketKeys.all, "project", projectId ?? null] as const,
  detail: (ticketId: string) => [...ticketKeys.all, "detail", ticketId] as const,
  estimates: (ticketId: string) => [...ticketKeys.all, "estimates", ticketId] as const,
  workLogs: (ticketId: string) => [...ticketKeys.all, "work-logs", ticketId] as const,
  comments: (ticketId: string) => [...ticketKeys.all, "comments", ticketId] as const,
  attachments: (ticketId: string) => [...ticketKeys.all, "attachments", ticketId] as const,
  projectEstimates: (projectId: string | null | undefined) =>
    [...ticketKeys.all, "project-estimates", projectId ?? null] as const,
  stageHistory: (projectId: string | null | undefined) =>
    [...ticketKeys.all, "stage-history", projectId ?? null] as const,
};

export const planningKeys = {
  all: ["planning"] as const,
  sprints: (projectId: string | null | undefined) =>
    [...planningKeys.all, "sprints", projectId ?? null] as const,
  columns: (projectId: string | null | undefined) =>
    [...planningKeys.all, "columns", projectId ?? null] as const,
  epics: (projectId: string | null | undefined) =>
    [...planningKeys.all, "epics", projectId ?? null] as const,
  assignable: (projectId: string | null | undefined) =>
    [...planningKeys.all, "assignable", projectId ?? null] as const,
  people: (ids: string[]) => [...planningKeys.all, "people", ids.join(",")] as const,
  rates: (projectIds: string[]) => [...planningKeys.all, "rates", projectIds.join(",")] as const,
};

// ---------------------------------------------------------------- invalidation

/** Refresh every ticket list/summary of a project (board, backlog, gantt, cost). */
export function invalidateProjectTickets(qc: QueryClient, projectId: string | null | undefined) {
  void qc.invalidateQueries({ queryKey: ticketKeys.project(projectId) });
  void qc.invalidateQueries({ queryKey: ticketKeys.projectEstimates(projectId) });
  void qc.invalidateQueries({ queryKey: ticketKeys.stageHistory(projectId) });
}

/** After a write on one ticket: its detail + children and the project lists. */
export function invalidateTicket(
  qc: QueryClient,
  ticketId: string,
  projectId: string | null | undefined,
) {
  void qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
  void qc.invalidateQueries({ queryKey: ticketKeys.estimates(ticketId) });
  void qc.invalidateQueries({ queryKey: ticketKeys.workLogs(ticketId) });
  invalidateProjectTickets(qc, projectId);
}

export const invalidateSprints = (qc: QueryClient, projectId: string | null | undefined) =>
  void qc.invalidateQueries({ queryKey: planningKeys.sprints(projectId) });
export const invalidateColumns = (qc: QueryClient, projectId: string | null | undefined) =>
  void qc.invalidateQueries({ queryKey: planningKeys.columns(projectId) });
export const invalidateEpics = (qc: QueryClient, projectId: string | null | undefined) =>
  void qc.invalidateQueries({ queryKey: planningKeys.epics(projectId) });

// ---------------------------------------------------------------- queries

export function useProjectTickets(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.project(projectId),
    enabled: !!projectId,
    queryFn: () => listProjectTickets(projectId!),
  });
}

export function useTicket(ticketId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId ?? ""),
    enabled: !!ticketId,
    queryFn: () => getTicket(ticketId!),
  });
}

export function useSprints(projectId: string | null | undefined) {
  return useQuery({
    queryKey: planningKeys.sprints(projectId),
    enabled: !!projectId,
    queryFn: () => listSprints(projectId!),
  });
}

export function useColumns(projectId: string | null | undefined) {
  return useQuery({
    queryKey: planningKeys.columns(projectId),
    enabled: !!projectId,
    queryFn: async () =>
      (await listColumns(projectId!)).slice().sort((a, b) => a.orderIndex - b.orderIndex),
  });
}

export function useEpics(projectId: string | null | undefined) {
  return useQuery({
    queryKey: planningKeys.epics(projectId),
    enabled: !!projectId,
    queryFn: async () =>
      (await listEpics(projectId!)).slice().sort((a, b) => a.name.localeCompare(b.name)),
  });
}

/** People who can be assigned tickets in the project. */
export function useAssignablePeople(projectId: string | null | undefined) {
  return useQuery({
    queryKey: planningKeys.assignable(projectId),
    enabled: !!projectId,
    queryFn: () => listAssignablePeople(projectId!),
  });
}

/** Profile cards for arbitrary user ids, as a map by id. */
export function usePeople(ids: Array<string | null | undefined>) {
  const unique = useMemo(() => [...new Set(ids.filter((id): id is string => !!id))].sort(), [ids]);
  const query = useQuery({
    queryKey: planningKeys.people(unique),
    enabled: unique.length > 0,
    queryFn: async () => {
      const out: Person[] = [];
      for (let i = 0; i < unique.length; i += 100) {
        out.push(...(await listPeople(unique.slice(i, i + 100))));
      }
      return out;
    },
    staleTime: 60_000,
  });
  const map = useMemo(() => new Map((query.data ?? []).map((p) => [p.id, p])), [query.data]);
  return { ...query, map };
}

export function useProjectEstimates(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.projectEstimates(projectId),
    enabled: !!projectId,
    queryFn: () => listProjectEstimates(projectId!),
  });
}

export function useStageHistory(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.stageHistory(projectId),
    enabled: !!projectId,
    queryFn: () => listStageHistory(projectId!),
  });
}

export function useTicketEstimates(ticketId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.estimates(ticketId ?? ""),
    enabled: !!ticketId,
    queryFn: () => listEstimates(ticketId!),
  });
}

export function useTicketWorkLogs(ticketId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.workLogs(ticketId ?? ""),
    enabled: !!ticketId,
    queryFn: () => listWorkLogs(ticketId!),
  });
}

export function useTicketComments(ticketId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.comments(ticketId ?? ""),
    enabled: !!ticketId,
    queryFn: () => listComments(ticketId!),
  });
}

export function useTicketAttachments(ticketId: string | null | undefined) {
  return useQuery({
    queryKey: ticketKeys.attachments(ticketId ?? ""),
    enabled: !!ticketId,
    queryFn: () => listAttachments(ticketId!),
  });
}

/** Rate-card rows of the given projects (all visible projects when no id is given). */
export function useRates(projectId?: string | null) {
  const { allProjects } = useProjects();
  const ids = useMemo(
    () => (projectId ? [projectId] : allProjects.map((p) => p.id)).slice().sort(),
    [projectId, allProjects],
  );
  return useQuery({
    queryKey: planningKeys.rates(ids),
    enabled: ids.length > 0,
    queryFn: () => listRates(ids),
    staleTime: 60_000,
  });
}
