import { useRef, useState } from "react";
import {
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  COMPLETED_SPRINT_MSG,
  SPRINT_GAP,
  type BacklogSprint,
  type BacklogTicket,
  type SortKey,
} from "../lib/backlog-types";
import { deriveManualDrop, getManualShiftById, projectManualMove } from "../lib/manual-drag";
import {
  deriveSprintDrop,
  getSprintShiftById,
  projectSprintMove,
  reorderableSprints,
} from "../lib/sprint-drag";
import type { useBacklogTicketMutations } from "./use-backlog-ticket-mutations";
import type { useSprintMutations } from "./use-sprint-mutations";

export interface PendingBulkMove {
  ids: string[];
  sprintId: string | null;
  name: string;
}

interface Options {
  tickets: BacklogTicket[];
  sprints: BacklogSprint[];
  sortBy: SortKey;
  selectedIds: string[];
  ticketMutations: ReturnType<typeof useBacklogTicketMutations>;
  sprintMutations: ReturnType<typeof useSprintMutations>;
  onBulkMoveRequest: (move: PendingBulkMove) => void;
}

export const backlogCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  return pointerHits.length ? pointerHits : closestCenter(args);
};

/** Drag state and handlers for ticket moves/reorders and unstarted-sprint reorders. */
export function useBacklogDnd({
  tickets,
  sprints,
  sortBy,
  selectedIds,
  ticketMutations,
  sprintMutations,
  onBulkMoveRequest,
}: Options) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [overSprintId, setOverSprintId] = useState<string | null>(null);
  const sprintHeights = useRef<Map<string, number>>(new Map());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reorderable = reorderableSprints(sprints);
  const manual = sortBy === "manual";

  // Live preview of the manual reorder.
  const previewing = manual && !!activeId && !!overId;
  const manualPreview = previewing ? projectManualMove(tickets, activeId!, overId!) : tickets;
  const previewShiftById = previewing
    ? getManualShiftById(tickets, manualPreview, activeId!)
    : new Map<string, number>();

  // Live preview of the sprint reorder.
  const sprintPreviewOrder =
    activeSprintId && overSprintId
      ? projectSprintMove(reorderable, activeSprintId, overSprintId)
      : reorderable;
  const sprintShiftById = activeSprintId
    ? getSprintShiftById(reorderable, sprintPreviewOrder, activeSprintId)
    : new Map<string, number>();
  const sprintPreviewOffset = (sprintId: string) => {
    const shift = sprintShiftById.get(sprintId) ?? 0;
    if (!shift || !activeSprintId) return 0;
    const height = sprintHeights.current.get(activeSprintId) ?? 0;
    return Math.sign(shift) * (height + SPRINT_GAP);
  };
  const registerSprintHeight = (id: string, height: number) => {
    sprintHeights.current.set(id, height);
  };

  const isCompleted = (id: string | null | undefined) =>
    !!id && sprints.some((s) => s.id === id && s.status === "completed");

  // A drag-over target as a sprint reorder target: a reorderable sprint id or a sentinel.
  const resolveSprintTarget = (overRaw: string | null): string | null => {
    if (!overRaw) return null;
    let over = overRaw.startsWith("sprint:") ? overRaw.slice(7) : overRaw;
    if (over === "backlog") return "__bottom__";
    const overTicket = tickets.find((t) => t.id === over);
    if (overTicket) over = overTicket.sprintId ?? "backlog";
    if (over === "backlog") return "__bottom__";
    const s = sprints.find((x) => x.id === over);
    if (!s) return "__bottom__";
    if (s.status === "active") return "__top__";
    if (s.status === "completed") return "__bottom__";
    return s.id;
  };

  const reset = () => {
    setActiveId(null);
    setOverId(null);
    setActiveSprintId(null);
    setOverSprintId(null);
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith("sprint:")) setActiveSprintId(id.slice(7));
    else setActiveId(id);
  };

  const onDragOver = (e: DragOverEvent) => {
    if (activeSprintId) {
      const target = resolveSprintTarget(e.over ? String(e.over.id) : null);
      if (target === null || target === activeSprintId) return;
      setOverSprintId((current) => (current === target ? current : target));
      return;
    }
    const nextOverId = e.over ? String(e.over.id) : null;
    if (nextOverId && activeId && nextOverId === activeId) return;
    setOverId((current) => (current === nextOverId ? current : nextOverId));
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (activeSprintId) {
      const sprintId = activeSprintId;
      const target = overSprintId;
      reset();
      if (!target) return;
      const projected = projectSprintMove(reorderable, sprintId, target);
      const drop = deriveSprintDrop(reorderable, projected, sprintId);
      if (drop) sprintMutations.reorder.mutate({ sprintId, ...drop });
      return;
    }

    reset();
    if (!e.over) return;
    const ticketId = String(e.active.id);
    const dropTargetId = String(e.over.id);
    const dragged = tickets.find((x) => x.id === ticketId);
    if (!dragged) return;

    // The drop target is either another ticket row (manual mode) or a zone.
    const overTicket = tickets.find((x) => x.id === dropTargetId);
    const targetSprintId = overTicket
      ? overTicket.sprintId
      : dropTargetId === "backlog"
        ? null
        : dropTargetId;

    if (isCompleted(targetSprintId) && (dragged.sprintId ?? null) !== (targetSprintId ?? null)) {
      toast.error(COMPLETED_SPRINT_MSG);
      return;
    }

    // Multi-select drag: move every selected ticket, with confirmation.
    if (selectedIds.length > 1 && selectedIds.includes(ticketId)) {
      if ((dragged.sprintId ?? null) === (targetSprintId ?? null)) return;
      const name = targetSprintId
        ? (sprints.find((s) => s.id === targetSprintId)?.name ?? "sprint")
        : "Backlog";
      onBulkMoveRequest({ ids: selectedIds, sprintId: targetSprintId ?? null, name });
      return;
    }

    if (manual) {
      const projected = projectManualMove(tickets, ticketId, dropTargetId);
      const drop = deriveManualDrop(tickets, projected, ticketId);
      if (drop) ticketMutations.reorder.mutate({ ticketId, ...drop });
      return;
    }

    if (dragged.sprintId === targetSprintId) return;
    ticketMutations.moveToSprint.mutate({ ticketId, sprintId: targetSprintId });
  };

  return {
    sensors,
    activeId,
    activeSprintId,
    previewShiftById,
    sprintPreviewOffset,
    registerSprintHeight,
    reorderable,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel: reset,
  };
}
