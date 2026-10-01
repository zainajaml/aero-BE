import type { BacklogTicket } from "./backlog-types";
import { orderManualTickets } from "./ticket-sort";

/**
 * Projects where the dragged ticket lands (for the live preview). Positions here are list
 * indexes for display only — the server computes the persisted position from the neighbours.
 */
export function projectManualMove(
  allTickets: BacklogTicket[],
  activeId: string,
  overId: string,
): BacklogTicket[] {
  const active = allTickets.find((ticket) => ticket.id === activeId);
  if (!active || activeId === overId) return allTickets;

  const overTicket = allTickets.find((ticket) => ticket.id === overId);
  const targetSprintId = overTicket ? overTicket.sprintId : overId === "backlog" ? null : overId;
  const targetList = orderManualTickets(
    allTickets.filter((ticket) => ticket.sprintId === targetSprintId && ticket.id !== activeId),
  );

  const insertIndex = overTicket
    ? Math.max(
        targetList.findIndex((ticket) => ticket.id === overTicket.id),
        0,
      )
    : targetList.length;

  const positionUpdates = new Map<string, { sprintId: string | null; position: number }>();
  const projectedTarget = [...targetList];
  projectedTarget.splice(insertIndex, 0, { ...active, sprintId: targetSprintId });
  projectedTarget.forEach((ticket, index) => {
    positionUpdates.set(ticket.id, { sprintId: targetSprintId, position: index });
  });

  if (active.sprintId !== targetSprintId) {
    const projectedSource = orderManualTickets(
      allTickets.filter((ticket) => ticket.sprintId === active.sprintId && ticket.id !== activeId),
    );
    projectedSource.forEach((ticket, index) => {
      positionUpdates.set(ticket.id, { sprintId: active.sprintId, position: index });
    });
  }

  return allTickets.map((ticket) => {
    const update = positionUpdates.get(ticket.id);
    return update ? { ...ticket, ...update } : ticket;
  });
}

export interface ManualDrop {
  sprintId: string | null;
  afterTicketId: string | null;
  beforeTicketId: string | null;
  /** Cache-only position for the optimistic update (the server recomputes it). */
  optimisticPosition: number;
}

/** Neighbour ids of the dropped ticket, or null when nothing changes. */
export function deriveManualDrop(
  snapshot: BacklogTicket[],
  projected: BacklogTicket[],
  activeId: string,
): ManualDrop | null {
  const snapshotById = new Map(snapshot.map((ticket) => [ticket.id, ticket]));
  const projectedActive = projected.find((ticket) => ticket.id === activeId);
  const originalActive = snapshotById.get(activeId);
  if (!projectedActive || !originalActive) return null;

  const orderedTarget = orderManualTickets(
    projected.filter((ticket) => ticket.sprintId === projectedActive.sprintId),
  );
  const index = orderedTarget.findIndex((ticket) => ticket.id === activeId);
  if (index === -1) return null;

  const previous = index > 0 ? snapshotById.get(orderedTarget[index - 1].id) : null;
  const next =
    index < orderedTarget.length - 1 ? snapshotById.get(orderedTarget[index + 1].id) : null;

  if (originalActive.sprintId === projectedActive.sprintId) {
    const original = orderManualTickets(
      snapshot.filter((ticket) => ticket.sprintId === originalActive.sprintId),
    );
    const i = original.findIndex((ticket) => ticket.id === activeId);
    const origPrev = i > 0 ? original[i - 1].id : null;
    const origNext = i < original.length - 1 ? original[i + 1].id : null;
    if ((previous?.id ?? null) === origPrev && (next?.id ?? null) === origNext) return null;
  }

  let optimisticPosition = 0;
  if (previous && next) optimisticPosition = (previous.position + next.position) / 2;
  else if (previous) optimisticPosition = previous.position + 1;
  else if (next) optimisticPosition = next.position - 1;

  return {
    sprintId: projectedActive.sprintId,
    afterTicketId: previous?.id ?? null,
    beforeTicketId: next?.id ?? null,
    optimisticPosition,
  };
}

/** How many rows each other ticket shifts in the live preview. */
export function getManualShiftById(
  snapshot: BacklogTicket[],
  preview: BacklogTicket[],
  activeId: string,
) {
  const shiftById = new Map<string, number>();
  const sprintIds = new Set<string | null>();

  snapshot.forEach((ticket) => sprintIds.add(ticket.sprintId));
  preview.forEach((ticket) => sprintIds.add(ticket.sprintId));

  sprintIds.forEach((sprintId) => {
    const original = orderManualTickets(snapshot.filter((ticket) => ticket.sprintId === sprintId));
    const projected = orderManualTickets(preview.filter((ticket) => ticket.sprintId === sprintId));
    const originalIndex = new Map(original.map((ticket, index) => [ticket.id, index]));

    projected.forEach((ticket, index) => {
      if (ticket.id === activeId) return;
      const startIndex = originalIndex.get(ticket.id);
      if (startIndex === undefined) return;
      const shift = index - startIndex;
      if (shift !== 0) shiftById.set(ticket.id, shift);
    });
  });

  return shiftById;
}
