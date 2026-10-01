import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProjects } from "@/features/projects/project-context";
import { listProjectTickets, listStageHistory } from "@/features/tickets/api/tickets.api";
import { listColumns, listEpics, listSprints } from "@/features/tickets/api/planning.api";
import { planningKeys, ticketKeys } from "@/features/tickets/hooks/ticket-queries";
import type { ProjectData } from "../lib/gantt-model";

/**
 * Per-project tickets, sprints, columns, epics and stage history for the timeline: the active
 * project, or every project the user can see when none is selected.
 */
export function useGanttData(): ProjectData[] {
  const { activeProject, allProjects } = useProjects();
  const projects = useMemo(
    () =>
      (activeProject ? [activeProject] : [...allProjects])
        .map((p) => ({ id: p.id, name: p.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeProject, allProjects],
  );

  const tickets = useQueries({
    queries: projects.map((p) => ({
      queryKey: ticketKeys.project(p.id),
      queryFn: () => listProjectTickets(p.id),
    })),
  });
  const sprints = useQueries({
    queries: projects.map((p) => ({
      queryKey: planningKeys.sprints(p.id),
      queryFn: () => listSprints(p.id),
    })),
  });
  const columns = useQueries({
    queries: projects.map((p) => ({
      queryKey: planningKeys.columns(p.id),
      queryFn: async () =>
        (await listColumns(p.id)).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    })),
  });
  const epics = useQueries({
    queries: projects.map((p) => ({
      queryKey: planningKeys.epics(p.id),
      queryFn: async () =>
        (await listEpics(p.id)).slice().sort((a, b) => a.name.localeCompare(b.name)),
    })),
  });
  const history = useQueries({
    queries: projects.map((p) => ({
      queryKey: ticketKeys.stageHistory(p.id),
      queryFn: () => listStageHistory(p.id),
    })),
  });

  return projects.map((project, i) => ({
    project,
    tickets: tickets[i]?.data ?? [],
    sprints: sprints[i]?.data ?? [],
    columns: columns[i]?.data ?? [],
    epics: epics[i]?.data ?? [],
    history: history[i]?.data ?? [],
  }));
}
