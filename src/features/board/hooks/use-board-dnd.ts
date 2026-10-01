import { useRef, useState } from "react";
import {
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { computeBoardDrop } from "../lib/board-drop";
import type { BoardTicket } from "../lib/board-types";
import type { useMoveBoardTicket } from "./use-move-board-ticket";

/** Prefer dropping onto a card (for reordering) over the column container. */
export const boardCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const cardHit = hits.find((h) => h.data?.droppableContainer?.data?.current?.type === "card");
  return cardHit ? [cardHit] : hits;
};

/** Card drag state, live placeholder target and drop handling. */
export function useBoardDnd(
  tickets: BoardTicket[],
  defaultStageColId: string | undefined,
  move: ReturnType<typeof useMoveBoardTicket>,
) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [insertAfterOver, setInsertAfterOver] = useState(false);
  const lastCardOverIdRef = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reset = () => {
    lastCardOverIdRef.current = null;
    setInsertAfterOver(false);
    setActiveId(null);
    setOverId(null);
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    lastCardOverIdRef.current = null;
    setInsertAfterOver(false);
  };

  const onDragOver = (e: DragOverEvent) => {
    const nextId = e.over ? String(e.over.id) : null;
    if (!nextId) return;
    const overType = e.over?.data.current?.type;
    if (overType === "card") {
      lastCardOverIdRef.current = nextId;
      setOverId(nextId);
      const activeRect = e.active.rect.current.translated;
      const overRect = e.over?.rect;
      setInsertAfterOver(
        !!activeRect &&
          !!overRect &&
          activeRect.top + activeRect.height / 2 > overRect.top + overRect.height / 2,
      );
      return;
    }
    if (overType === "column") {
      const lastCard = lastCardOverIdRef.current
        ? tickets.find((t) => t.id === lastCardOverIdRef.current)
        : null;
      const lastCardColId = lastCard ? (lastCard.columnId ?? defaultStageColId) : null;
      setOverId(lastCardColId === nextId ? (lastCardOverIdRef.current ?? nextId) : nextId);
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const insertAfter = insertAfterOver;
    reset();
    if (!e.over) return;
    const ticketId = String(e.active.id);
    const dropOverId = String(e.over.id);
    if (ticketId === dropOverId) return;
    const drop = computeBoardDrop(tickets, ticketId, dropOverId, defaultStageColId, insertAfter);
    if (drop) move.mutate({ ticketId, drop });
  };

  // Live drop preview: which column the placeholder should appear in.
  const overTicket = overId ? (tickets.find((t) => t.id === overId) ?? null) : null;
  const previewColId =
    activeId && overId
      ? overTicket
        ? (overTicket.columnId ?? defaultStageColId ?? overId)
        : overId
      : null;

  /** Index of the drop placeholder within a column's displayed cards, or null. */
  const placeholderIndexFor = (colId: string, display: BoardTicket[]): number | null => {
    if (!activeId || previewColId !== colId) return null;
    if (overTicket && overTicket.id !== activeId) {
      const idx = display.findIndex((t) => t.id === overTicket.id);
      return idx >= 0 ? (insertAfterOver ? idx + 1 : idx) : display.length;
    }
    return display.length;
  };

  return {
    sensors,
    activeId,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel: reset,
    placeholderIndexFor,
  };
}
