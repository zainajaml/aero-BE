import { Fragment } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { TicketCard } from "@/features/tickets/components/ticket-card";
import type { BoardColumn as BoardCol } from "@/features/tickets/api/planning.api";
import type { BoardTicket } from "../lib/board-types";

function DraggableCard({
  ticket,
  onClick,
  showDragHandle,
  dragActive,
}: {
  ticket: BoardTicket;
  onClick: () => void;
  showDragHandle?: boolean;
  dragActive?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: ticket.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: ticket.id, data: { type: "card" } });
  return (
    <div
      data-id={ticket.id}
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      {...attributes}
      {...listeners}
      className="touch-none rounded-xl"
    >
      <TicketCard
        ticket={ticket}
        onClick={onClick}
        dragging={isDragging}
        className={
          dragActive
            ? "pointer-events-none hover:translate-y-0 hover:border-glass-border hover:shadow-none"
            : undefined
        }
        dragHandle={
          showDragHandle ? (
            <GripVertical className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
          ) : undefined
        }
      />
    </div>
  );
}

function DropPlaceholder() {
  return (
    <div className="pointer-events-none h-[96px] rounded-xl border-2 border-dashed border-neon-amber/80" />
  );
}

/** One board column: header with count, droppable card list with a live placeholder. */
export function BoardColumn({
  col,
  tickets,
  onCardClick,
  showDragHandle,
  placeholderIndex,
  dragActive,
}: {
  col: BoardCol;
  tickets: BoardTicket[];
  onCardClick: (id: string) => void;
  showDragHandle?: boolean;
  placeholderIndex?: number | null;
  dragActive?: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.id, data: { type: "column" } });
  return (
    <GlassPanel className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">{col.name}</h3>
          <NeonBadge tone={col.isDone ? "lime" : "muted"}>{tickets.length}</NeonBadge>
        </div>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto rounded-xl p-1.5">
        {tickets.map((t, i) => (
          <Fragment key={t.id}>
            {placeholderIndex === i && <DropPlaceholder />}
            <DraggableCard
              ticket={t}
              onClick={() => onCardClick(t.id)}
              showDragHandle={showDragHandle}
              dragActive={dragActive}
            />
          </Fragment>
        ))}
        {placeholderIndex === tickets.length && <DropPlaceholder />}
        {tickets.length === 0 && placeholderIndex == null && (
          <div className="py-8 text-center text-xs text-muted-foreground">Empty</div>
        )}
      </div>
    </GlassPanel>
  );
}
