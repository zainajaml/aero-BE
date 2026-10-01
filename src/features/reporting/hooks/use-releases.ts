import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listReportSprints,
  listReportTickets,
  type SprintReportRow,
  type TicketReportRow,
} from "../api/reporting.api";
import { reportingKeys } from "./reporting-queries";

const COMPLETED = ["completed"] as const;
const EMPTY_SPRINTS: SprintReportRow[] = [];

/**
 * Completed sprints (newest first, as ordered by the server) and their tickets grouped by sprint.
 * `projectId` undefined = every project the caller can see (the "All projects" view).
 */
export function useReleases(projectId: string | undefined, enabled: boolean) {
  const projectIds = useMemo(() => (projectId ? [projectId] : undefined), [projectId]);

  const sprintsQuery = useQuery({
    queryKey: reportingKeys.reportSprints({ projectIds, statuses: COMPLETED }),
    enabled,
    queryFn: () => listReportSprints({ projectIds, statuses: COMPLETED }),
  });
  const sprints = sprintsQuery.data ?? EMPTY_SPRINTS;
  const sprintIds = useMemo(() => sprints.map((s) => s.id), [sprints]);

  const ticketsQuery = useQuery({
    queryKey: reportingKeys.reportTickets({ sprintIds }),
    enabled: enabled && sprintIds.length > 0,
    queryFn: () => listReportTickets({ sprintIds }),
  });

  const ticketsBySprint = useMemo(() => {
    const grouped: Record<string, TicketReportRow[]> = {};
    // Same order as the original listing: by ticket type, ascending.
    const sorted = [...(ticketsQuery.data ?? [])].sort((a, b) =>
      a.type < b.type ? -1 : a.type > b.type ? 1 : 0,
    );
    for (const t of sorted) {
      if (!t.sprintId) continue;
      (grouped[t.sprintId] ??= []).push(t);
    }
    return grouped;
  }, [ticketsQuery.data]);

  const isLoading = sprintsQuery.isLoading || (sprintIds.length > 0 && ticketsQuery.isLoading);
  return { sprints, ticketsBySprint, isLoading };
}
