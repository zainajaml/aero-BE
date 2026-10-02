import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { PILL_BUTTON } from "@/shared/lib/cta";
import type { BacklogSprint } from "../lib/backlog-types";

interface Props {
  selectedIds: string[];
  /** Ids the select-all toggle acts on (the selection's zone, or everything visible). */
  zoneIds: string[];
  onSetSelected: (ids: string[]) => void;
  isKanban: boolean;
  sprints: BacklogSprint[];
  onMove: (sprintId: string | null) => void;
  onEdit: () => void;
  isManager: boolean;
  deletableCount: number;
  blockedCount: number;
  deleting: boolean;
  onDelete: () => void;
  onClear: () => void;
}

/** Floating bar shown while tickets are selected: move, edit, delete, clear. */
export function BulkActionBar({
  selectedIds,
  zoneIds,
  onSetSelected,
  isKanban,
  sprints,
  onMove,
  onEdit,
  isManager,
  deletableCount,
  blockedCount,
  deleting,
  onDelete,
  onClear,
}: Props) {
  const allSelected = zoneIds.length > 0 && zoneIds.every((id) => selectedIds.includes(id));
  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex items-center justify-center px-4 md:left-64">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-glass-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 px-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onSetSelected(
                allSelected
                  ? selectedIds.filter((id) => !zoneIds.includes(id))
                  : [...new Set([...selectedIds, ...zoneIds])],
              )
            }
            className={PILL_BUTTON}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
          <span className="h-4 w-px bg-border" aria-hidden />
          <span className="text-xs font-semibold tabular-nums">{selectedIds.length} selected</span>
        </div>
        <span className="h-5 w-px bg-border" aria-hidden />

        {!isKanban && (
          <Select value="" onValueChange={(v) => onMove(v === "backlog" ? null : v)}>
            <SelectTrigger
              aria-label="Move selected tickets to"
              className="h-8 w-[180px] rounded-full text-xs"
            >
              <SelectValue placeholder="Move to…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog" className="text-xs">
                Backlog
              </SelectItem>
              {sprints
                .filter((s) => s.status !== "completed")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={onEdit}>
          Edit
        </Button>
        {isManager ? (
          <ConfirmDelete
            title={`Delete ${deletableCount} selected ticket${deletableCount === 1 ? "" : "s"}?`}
            description={
              <>
                {blockedCount > 0 && (
                  <span className="block">
                    {blockedCount} ticket{blockedCount === 1 ? "" : "s"} with logged time or in a
                    completed sprint will be skipped.
                  </span>
                )}
                This cannot be undone.
              </>
            }
            onConfirm={onDelete}
            className=""
            trigger={
              <Button
                size="sm"
                variant="outline"
                disabled={deletableCount === 0 || deleting}
                className="h-8 rounded-full text-xs border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                Delete
              </Button>
            }
          />
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled
            className="h-8 rounded-full text-xs"
            title="Only project and account admins can delete tickets"
          >
            Delete (admins only)
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
