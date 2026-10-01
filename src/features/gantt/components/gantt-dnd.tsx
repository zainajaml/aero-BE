import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";

export interface RowDrag {
  setNodeRef: (node: HTMLElement | null) => void;
  handleProps: Record<string, unknown>;
  isDragging: boolean;
}

/** Makes a ticket row draggable between epic groups (render-prop, like the backlog). */
export function DraggableEpicTicket({
  dragId,
  children,
}: {
  dragId: string;
  children: (drag: RowDrag) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  const handleProps = {
    ...(attributes as unknown as Record<string, unknown>),
    ...(listeners as unknown as Record<string, unknown>),
  };
  return <>{children({ setNodeRef, handleProps, isDragging })}</>;
}

/** Droppable wrapper around an epic group (header + ticket rows). */
export function EpicDropZone({ id, children }: { id: string; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(isOver && "bg-primary/5 ring-1 ring-inset ring-primary/40")}
    >
      {children}
    </div>
  );
}
