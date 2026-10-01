import { Archive, ArchiveRestore, Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import type { Project } from "@/features/projects/project-context";
import type { ProjectStats } from "@/features/projects/api/projects.api";
import { useTimezone } from "@/features/users/lib/timezone";

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="w-[74px] shrink-0 text-right text-[11px] text-muted-foreground last:w-[70px]">
      <span className="font-semibold tabular-nums text-foreground">{value}</span> {label}
    </div>
  );
}

export function AccountProjectRow({
  project: p,
  stats: s,
  archiverName,
  canEdit,
  canManageAccount,
  restorePending,
  onOpen,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  project: Project;
  stats: ProjectStats | undefined;
  archiverName: string | undefined;
  canEdit: boolean;
  canManageAccount: boolean;
  restorePending: boolean;
  onOpen: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const tz = useTimezone();
  const isArchived = !!p.archivedAt;
  return (
    <div
      data-archived={isArchived || undefined}
      className={cn(
        "group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto]",
        isArchived ? "bg-muted/30" : "bg-background/40",
      )}
    >
      <span className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={cn("flex min-w-0 items-center gap-2.5", isArchived && "opacity-70")}>
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted font-mono text-[10px] font-semibold uppercase">
          {p.key.slice(0, 3)}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => (isArchived ? onOpen() : onSelect())}
              className="truncate text-left text-sm font-medium hover:underline"
            >
              {p.name}
            </button>
            {isArchived && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Archive className="h-3 w-3" />
                Archived
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            <span className="capitalize">{p.projectType}</span> · started{" "}
            <span className="tabular-nums">
              {tz.formatDate(p.createdAt, { day: "2-digit", month: "short" })}
            </span>
            {isArchived && p.archivedAt && (
              <>
                {" "}
                · archived{" "}
                <span className="tabular-nums">
                  {tz.formatDate(p.archivedAt, { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                {archiverName && <> by {archiverName}</>}
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "col-span-2 flex shrink-0 items-center justify-end md:col-span-1",
          isArchived && "opacity-70",
        )}
      >
        <Metric label="members" value={s?.members ?? 0} />
        <Metric label="sprints" value={p.projectType === "kanban" ? "n/a" : (s?.sprints ?? 0)} />
        <Metric label="tickets" value={s?.tickets ?? 0} />
      </div>

      {(canEdit || canManageAccount) && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
          {isArchived ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onOpen}
                aria-label={`View ${p.name}`}
                title="View (read-only)"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={restorePending}
                onClick={onRestore}
                aria-label={`Restore ${p.name}`}
                title="Restore project"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                  aria-label={`Edit ${p.name}`}
                  title="Edit project"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canManageAccount && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onArchive}
                  aria-label={`Archive ${p.name}`}
                  title="Archive project"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
          {canManageAccount && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label={`Delete ${p.name}`}
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
