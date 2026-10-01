import { TicketCode } from "@/features/tickets/components/ticket-code";
import type { BacklogTicket } from "../lib/backlog-types";
import type { BacklogData } from "../hooks/use-backlog-data";
import { CompactRow } from "./compact-row";

/** Drag overlay: the dragged row, plus a stack of the other selected tickets in a multi-drag. */
export function DragPreview({
  ticket,
  data,
  selectedIds,
}: {
  ticket: BacklogTicket;
  data: BacklogData;
  selectedIds: string[];
}) {
  const col = ticket.columnId ? data.columnMap.get(ticket.columnId) : data.backlogColumn;
  const multi = selectedIds.length > 1 && selectedIds.includes(ticket.id);
  const others = multi
    ? data.tickets.filter((t) => selectedIds.includes(t.id) && t.id !== ticket.id)
    : [];
  const preview = others.slice(0, 4);
  const extra = others.length - preview.length;
  return (
    <div className="relative">
      {multi && (
        <span className="absolute -left-2 -top-2 z-20 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
          {selectedIds.length}
        </span>
      )}
      <div className="relative rounded-lg border-2 border-dashed border-primary/70 bg-background/95 shadow-lg">
        <CompactRow
          ticket={ticket}
          stage={col?.name ?? null}
          stageDone={col?.isDone ?? false}
          logged={ticket.loggedMinutes ?? 0}
          epicNames={data.epicNamesByTicket.get(ticket.id)}
          editable={false}
          assigneeName={ticket.assigneeId ? data.assigneeName(ticket.assigneeId) : null}
          assigneeAvatar={ticket.assigneeId ? data.assigneeAvatar(ticket.assigneeId) : null}
          onClick={() => {}}
        />
      </div>
      {multi && (
        <div className="ml-6 mt-1 w-[320px] overflow-hidden rounded-lg border border-border bg-background/95 shadow-lg">
          {preview.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs last:border-b-0"
            >
              <TicketCode code={t.code} size="xs" className="normal-case tracking-normal" />
              <span className="truncate text-foreground">{t.title}</span>
            </div>
          ))}
          {extra > 0 && (
            <div className="px-3 py-1.5 text-[11px] text-muted-foreground">+{extra} more</div>
          )}
        </div>
      )}
    </div>
  );
}
