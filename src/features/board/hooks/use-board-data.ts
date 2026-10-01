import { useMemo } from "react";
import { displayName } from "@/features/users/lib/names";
import {
  useColumns,
  usePeople,
  useProjectTickets,
  useSprints,
} from "@/features/tickets/hooks/ticket-queries";
import type { TicketSummary } from "@/features/tickets/api/tickets.api";
import type { BoardTicket } from "../lib/board-types";

const EMPTY: TicketSummary[] = [];

/** Columns, sprints and tickets of the board, with assignee cards and reporter options. */
export function useBoardData(projectId: string | null | undefined) {
  const { data: columns = [] } = useColumns(projectId);
  const { data: rawSprints = [] } = useSprints(projectId);
  const { data: rawTickets = EMPTY } = useProjectTickets(projectId);

  const personIds = useMemo(
    () => rawTickets.flatMap((t) => [t.assigneeId, t.reporterId]),
    [rawTickets],
  );
  const { map: people } = usePeople(personIds);

  return useMemo(() => {
    // Newest sprints first (source order).
    const sprints = [...rawSprints].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const tickets: BoardTicket[] = rawTickets.map((t) => {
      const p = t.assigneeId ? people.get(t.assigneeId) : undefined;
      return {
        ...t,
        assignee: p
          ? {
              fullName: p.fullName,
              firstName: p.firstName,
              lastName: p.lastName,
              avatarUrl: p.avatarUrl,
            }
          : null,
      };
    });
    const epicMap = new Map(tickets.map((t) => [t.id, t.epicIds]));
    const reporterIds = [
      ...new Set(rawTickets.map((t) => t.reporterId).filter((id): id is string => !!id)),
    ];
    const reporterOptions = reporterIds
      .map((id) => ({ id, name: displayName(people.get(id), "Unknown") }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // Tickets without a stage are shown in the Backlog column (else the first one).
    const defaultStageCol = columns.find((c) => c.name.toLowerCase() === "backlog") ?? columns[0];
    return {
      columns,
      sprints,
      tickets,
      epicMap,
      reporterOptions,
      defaultStageColId: defaultStageCol?.id,
    };
  }, [columns, rawSprints, rawTickets, people]);
}
