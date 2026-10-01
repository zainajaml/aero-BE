import { GripVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { LABEL_W, type GanttTicket } from "../lib/gantt-model";
import type { GanttScale } from "../lib/gantt-scale";
import type { RowDrag } from "./gantt-dnd";

/** One ticket line: fixed label on the left, stage segments on the timeline. */
export function GanttTicketRow({
  ticket: t,
  segments,
  scale,
  drag,
  onOpen,
}: {
  ticket: GanttTicket;
  segments: { name: string; start: number; end: number }[];
  scale: GanttScale;
  drag?: RowDrag;
  onOpen: (ticketId: string) => void;
}) {
  return (
    <div
      ref={drag?.setNodeRef}
      className={cn(
        "flex items-stretch border-b border-glass-border/30 last:border-0",
        drag?.isDragging && "opacity-40",
      )}
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-start gap-1.5 bg-card/60 py-2 pr-3 backdrop-blur"
        style={{ width: LABEL_W, paddingLeft: 32 }}
      >
        {drag && (
          <button
            type="button"
            aria-label="Drag ticket to another epic"
            className={cn(
              "mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground touch-none",
              drag.isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
            onClick={(event) => event.preventDefault()}
            {...drag.handleProps}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(t.id)}
          className="flex min-w-0 flex-1 items-start gap-1.5 text-left hover:opacity-80"
        >
          <span className="mt-px w-16 shrink-0 truncate font-mono text-[11px] text-muted-foreground">
            {t.code}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs leading-snug" title={t.title}>
            {t.title}
          </span>
        </button>
      </div>
      <div className="relative flex-1 py-2.5">
        {segments.map((seg, i) => {
          const width = Math.max(scale.pct(seg.end) - scale.pct(seg.start), 0.4);
          return (
            <div
              key={i}
              className="absolute top-1/2 flex h-4 -translate-y-1/2 items-center overflow-hidden rounded-md border border-muted-foreground/25 bg-muted/60"
              style={{ left: `${scale.pct(seg.start)}%`, width: `${width}%` }}
              title={`${seg.name} · ${scale.fmtDateTime(seg.start)} → ${scale.fmtDateTime(seg.end)}`}
            >
              <span className="truncate px-1.5 text-[9px] font-medium text-muted-foreground">
                {seg.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
