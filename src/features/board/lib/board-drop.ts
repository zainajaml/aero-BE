import { orderByPosition } from "./board-sort";
import type { BoardTicket } from "./board-types";

export interface BoardDrop {
  columnId: string;
  columnChanged: boolean;
  afterTicketId: string | null;
  beforeTicketId: string | null;
  /** Cache-only position for the optimistic update (the server recomputes it). */
  optimisticPosition: number;
}

/**
 * Target column and neighbours of a dropped card. `overId` is a column id or a ticket id.
 * Tickets without a column live in `defaultColId`. Returns null when nothing changes.
 */
export function computeBoardDrop(
  tickets: BoardTicket[],
  activeId: string,
  overId: string,
  defaultColId: string | undefined,
  insertAfter = false,
): BoardDrop | null {
  const active = tickets.find((t) => t.id === activeId);
  if (!active) return null;
  const colOf = (t: BoardTicket) => t.columnId ?? defaultColId;
  const overTicket = tickets.find((t) => t.id === overId);
  const targetCol = overTicket ? (colOf(overTicket) ?? overId) : overId;
  if (!targetCol) return null;
  const list = orderByPosition(tickets.filter((t) => t.id !== activeId && colOf(t) === targetCol));
  let insertIndex = overTicket ? list.findIndex((t) => t.id === overTicket.id) : list.length;
  if (insertIndex < 0) insertIndex = list.length;
  if (overTicket && insertAfter) insertIndex += 1;
  const prev = insertIndex > 0 ? list[insertIndex - 1] : null;
  const next = list[insertIndex] ?? null;

  const columnChanged = colOf(active) !== targetCol;
  if (!columnChanged) {
    const original = orderByPosition(tickets.filter((t) => colOf(t) === targetCol));
    const i = original.findIndex((t) => t.id === activeId);
    const origPrev = i > 0 ? original[i - 1].id : null;
    const origNext = i < original.length - 1 ? original[i + 1].id : null;
    if ((prev?.id ?? null) === origPrev && (next?.id ?? null) === origNext) return null;
  }

  let optimisticPosition: number;
  if (prev && next) optimisticPosition = (prev.position + next.position) / 2;
  else if (prev) optimisticPosition = prev.position + 1;
  else if (next) optimisticPosition = next.position - 1;
  else optimisticPosition = 0;
  return {
    columnId: targetCol,
    columnChanged,
    afterTicketId: prev?.id ?? null,
    beforeTicketId: next?.id ?? null,
    optimisticPosition,
  };
}
