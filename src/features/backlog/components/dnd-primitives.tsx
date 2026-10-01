import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/shared/lib/utils";
import { CompactRow, type CompactRowProps } from "./compact-row";

/** Render-prop wrapper making a sprint panel draggable (unstarted sprints only). */
export function SprintDraggable({
  sprintId,
  disabled,
  previewOffset,
  onHeight,
  children,
}: {
  sprintId: string;
  disabled: boolean;
  previewOffset: number;
  onHeight: (id: string, height: number) => void;
  children: (drag: {
    setNodeRef: (node: HTMLElement | null) => void;
    handleProps: Record<string, unknown>;
    isDragging: boolean;
    style: CSSProperties;
  }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sprint:${sprintId}`,
    disabled,
  });
  const innerRef = useRef<HTMLElement | null>(null);
  const setRefs = (node: HTMLElement | null) => {
    setNodeRef(node);
    innerRef.current = node;
  };
  useEffect(() => {
    if (innerRef.current) onHeight(sprintId, innerRef.current.offsetHeight);
  });
  const style: CSSProperties = isDragging
    ? {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        position: "relative",
        zIndex: 50,
      }
    : {
        transform: previewOffset ? `translateY(${previewOffset}px)` : undefined,
        transition: "transform 150ms ease-out",
      };
  const handleProps = disabled
    ? {}
    : {
        ...(attributes as unknown as Record<string, unknown>),
        ...(listeners as unknown as Record<string, unknown>),
      };
  return <>{children({ setNodeRef: setRefs, handleProps, isDragging, style })}</>;
}

/** A ticket row that can be dragged; in manual sort it is also a drop target. */
export function DraggableRow(
  props: Omit<CompactRowProps, "dragging"> & { manual?: boolean; previewOffset?: number },
) {
  const { manual, previewOffset, ...rowProps } = props;
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: props.ticket.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: props.ticket.id, disabled: !manual });
  const setRefs = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };
  return (
    <div
      ref={setRefs}
      className={cn(
        "touch-none transition-transform duration-150 ease-out",
        isDragging && "opacity-0",
        manual && (isDragging ? "cursor-grabbing" : "cursor-grab"),
      )}
      style={{
        transform: !isDragging && previewOffset ? `translateY(${previewOffset}px)` : undefined,
      }}
      {...(manual ? (attributes as unknown as Record<string, unknown>) : {})}
      {...(manual ? (listeners as unknown as Record<string, unknown>) : {})}
    >
      <CompactRow {...rowProps} dragging={isDragging} />
    </div>
  );
}

/** Drop area of a sprint or the backlog ("backlog"). */
export function DropZone({
  id,
  children,
  label,
  suppressLabel,
}: {
  id: string;
  children: ReactNode;
  label?: string;
  suppressLabel?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[56px] rounded-xl border-2 border-transparent p-1.5 transition-colors ${
        isOver && !suppressLabel ? "bg-primary/5" : ""
      }`}
    >
      {children}
      {label && isOver && !suppressLabel && (
        <div className="mt-1 text-center text-xs text-primary">Drop to {label}</div>
      )}
    </div>
  );
}
