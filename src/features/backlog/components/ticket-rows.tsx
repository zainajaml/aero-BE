import { Checkbox } from "@/shared/ui/checkbox";
import { ROW_PREVIEW_HEIGHT, type BacklogTicket, type SortKey } from "../lib/backlog-types";
import { applyStageFilter } from "../lib/backlog-filters";
import { orderManualTickets, sortTickets } from "../lib/ticket-sort";
import type { BacklogData } from "../hooks/use-backlog-data";
import { DraggableRow } from "./dnd-primitives";

/** Everything a zone (sprint or backlog) needs to render its rows. */
export interface RowsContext {
  data: BacklogData;
  stages: string[];
  sortBy: SortKey;
  canWrite: boolean;
  selectedIds: string[];
  setSelectedIds: (update: (prev: string[]) => string[]) => void;
  onToggleSelect: (ticketId: string, next: boolean, zoneId: string) => void;
  onOpenTicket: (ticketId: string) => void;
  onChangeEpic: (ticketId: string, epicId: string | null) => void;
  onChangeStage: (ticketId: string, columnId: string) => void;
  previewShiftById: Map<string, number>;
}

/** Tickets of a zone after the page's stage filter. */
export const visibleZoneItems = (items: BacklogTicket[], ctx: RowsContext) =>
  applyStageFilter(items, ctx.stages, ctx.data.backlogColumn?.id ?? null);

/** Tri-state "select all" checkbox of a zone header. */
export function SelectAllCheckbox({ items, ctx }: { items: BacklogTicket[]; ctx: RowsContext }) {
  const visible = visibleZoneItems(items, ctx);
  const allSelected = visible.length > 0 && visible.every((t) => ctx.selectedIds.includes(t.id));
  const someSelected = visible.some((t) => ctx.selectedIds.includes(t.id));
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={allSelected ? true : someSelected ? "indeterminate" : false}
        onCheckedChange={(v) => {
          if (v === true) {
            ctx.setSelectedIds((prev) => [...new Set([...prev, ...visible.map((t) => t.id)])]);
          } else {
            const visibleIds = new Set(visible.map((t) => t.id));
            ctx.setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
          }
        }}
        aria-label={allSelected ? "Deselect all" : "Select all"}
        className="h-3.5 w-3.5 rounded-[5px] border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      />
    </span>
  );
}

/** Sorted, draggable rows of one zone. */
export function ZoneRows({
  items: rawItems,
  emptyText,
  zoneId,
  ctx,
}: {
  items: BacklogTicket[];
  emptyText: string;
  zoneId: string;
  ctx: RowsContext;
}) {
  const { data } = ctx;
  const items = visibleZoneItems(rawItems, ctx);
  const ordered =
    ctx.sortBy === "manual"
      ? orderManualTickets(items)
      : sortTickets(
          items,
          ctx.sortBy,
          "asc",
          data.epicNamesByTicket,
          data.columnMap,
          data.backlogOrderIndex,
        );

  return (
    <div className="space-y-1.5">
      {ordered.map((t) => {
        const col = t.columnId ? data.columnMap.get(t.columnId) : data.backlogColumn;
        return (
          <DraggableRow
            key={t.id}
            ticket={t}
            stage={zoneId === "backlog" ? null : (col?.name ?? null)}
            stageDone={col?.isDone ?? false}
            logged={t.loggedMinutes ?? 0}
            epicNames={data.epicNamesByTicket.get(t.id)}
            epicIds={t.epicIds}
            epicOptions={data.projectEpics}
            stageOptions={data.columns}
            columnId={t.columnId ?? data.backlogColumn?.id ?? null}
            editable={ctx.canWrite}
            onChangeEpic={ctx.canWrite ? (epicId) => ctx.onChangeEpic(t.id, epicId) : undefined}
            onChangeStage={
              ctx.canWrite ? (columnId) => ctx.onChangeStage(t.id, columnId) : undefined
            }
            assigneeName={t.assigneeId ? data.assigneeName(t.assigneeId) : null}
            assigneeAvatar={t.assigneeId ? data.assigneeAvatar(t.assigneeId) : null}
            onClick={() => ctx.onOpenTicket(t.id)}
            manual={ctx.sortBy === "manual"}
            previewOffset={(ctx.previewShiftById.get(t.id) ?? 0) * ROW_PREVIEW_HEIGHT}
            selected={ctx.selectedIds.includes(t.id)}
            selectionActive={ctx.selectedIds.length > 0}
            onSelectedChange={
              ctx.canWrite ? (next) => ctx.onToggleSelect(t.id, next, zoneId) : undefined
            }
          />
        );
      })}

      {items.length === 0 && (
        <div className="py-3 text-center text-xs text-muted-foreground">{emptyText}</div>
      )}
    </div>
  );
}
