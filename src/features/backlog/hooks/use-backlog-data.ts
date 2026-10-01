import { useMemo } from "react";
import { displayName } from "@/features/users/lib/names";
import {
  useColumns,
  useEpics,
  usePeople,
  useProjectEstimates,
  useProjectTickets,
  useRates,
  useSprints,
} from "@/features/tickets/hooks/ticket-queries";
import type { BacklogTicket } from "../lib/backlog-types";
import { buildTicketCost } from "../lib/ticket-cost";
import { findBacklogColumn } from "../lib/ticket-stage";

const EMPTY_TICKETS: BacklogTicket[] = [];

/** Every query the backlog page reads, plus the lookup maps derived from them. */
export function useBacklogData(projectId: string | null | undefined) {
  const { data: rawTickets = EMPTY_TICKETS } = useProjectTickets(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: columns = [] } = useColumns(projectId);
  const { data: projectEpics = [] } = useEpics(projectId);
  const { data: rates = [] } = useRates(projectId);
  const { data: estimates = [] } = useProjectEstimates(projectId);

  // Newest first, as the source listed them ("Created" sort relies on this order).
  const tickets = useMemo(
    () => [...rawTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rawTickets],
  );

  const personIds = useMemo(() => tickets.flatMap((t) => [t.assigneeId, t.reporterId]), [tickets]);
  const { map: people } = usePeople(personIds);

  return useMemo(() => {
    const columnMap = new Map(columns.map((c) => [c.id, c]));
    const backlogColumn = findBacklogColumn(columns);
    const epicNameById = new Map(projectEpics.map((e) => [e.id, e.name]));
    const epicNamesByTicket = new Map<string, string[]>();
    for (const t of tickets) {
      const names = t.epicIds.map((id) => epicNameById.get(id)).filter((n): n is string => !!n);
      if (names.length > 0) epicNamesByTicket.set(t.id, names);
    }

    const assigneeIds = [
      ...new Set(tickets.map((t) => t.assigneeId).filter((id): id is string => !!id)),
    ];
    const reporterIds = [
      ...new Set(tickets.map((t) => t.reporterId).filter((id): id is string => !!id)),
    ];
    const assigneeOptions = assigneeIds
      .filter((id) => people.has(id))
      .map((id) => ({ id, name: displayName(people.get(id), "") || "Unknown" }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const reporterOptions = reporterIds
      .filter((id) => people.has(id))
      .map((id) => ({ id, name: displayName(people.get(id), "Unknown") }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const assigneeName = (id: string) => displayName(people.get(id), "") || null;
    const assigneeAvatar = (id: string) => people.get(id)?.avatarUrl ?? null;

    return {
      tickets,
      sprints,
      columns,
      projectEpics,
      columnMap,
      backlogColumn,
      backlogOrderIndex: backlogColumn?.orderIndex ?? Infinity,
      epicNamesByTicket,
      assigneeOptions,
      reporterOptions,
      assigneeName,
      assigneeAvatar,
      hasUnassigned: tickets.some((t) => !t.assigneeId),
      ticketCost: buildTicketCost(rates, estimates),
    };
  }, [tickets, sprints, columns, projectEpics, people, rates, estimates]);
}

export type BacklogData = ReturnType<typeof useBacklogData>;
