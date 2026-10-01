import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";

// Draggable wrapper providing a grip handle to a page row.
export function DraggablePage({
  dragId,
  children,
}: {
  dragId: string;
  children: (drag: {
    setNodeRef: (node: HTMLElement | null) => void;
    handleProps: Record<string, unknown>;
    isDragging: boolean;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  const handleProps = {
    ...(attributes as unknown as Record<string, unknown>),
    ...(listeners as unknown as Record<string, unknown>),
  };
  return <>{children({ setNodeRef, handleProps, isDragging })}</>;
}

// Droppable wrapper around a folder (or the ungrouped section).
export function DropZone({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg transition-colors",
        isOver && "bg-primary/5 ring-1 ring-inset ring-primary/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
