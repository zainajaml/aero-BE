import { CheckSquare, GripVertical, Play, Square, Target } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { PILL_BUTTON } from "@/shared/lib/cta";
import { cn } from "@/shared/lib/utils";
import { useTimezone } from "@/features/users/lib/timezone";
import type { BacklogSprint, BacklogTicket } from "../lib/backlog-types";
import { SprintDraggable } from "./dnd-primitives";
import { SelectAllCheckbox, ZoneRows, type RowsContext } from "./ticket-rows";
import {
  CollapseButton,
  NewTicketButton,
  ZoneActionsMenu,
  ZoneBody,
  ZoneTotals,
  type ZoneMenuItem,
} from "./zone-parts";

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

interface Props {
  sprint: BacklogSprint;
  items: BacklogTicket[];
  ctx: RowsContext;
  project: { id: string; key: string };
  canDrag: boolean;
  previewOffset: number;
  onHeight: (id: string, height: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  ticketDragging: boolean;
  sprintDragging: boolean;
  onStart: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}

/** One sprint panel: header (dates, totals, lifecycle actions, menu) and its ticket rows. */
export function SprintSection({
  sprint,
  items,
  ctx,
  project,
  canDrag,
  previewOffset,
  onHeight,
  collapsed,
  onToggleCollapse,
  ticketDragging,
  sprintDragging,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  onExport,
}: Props) {
  const tz = useTimezone();
  const { canWrite } = ctx;
  const total = items.reduce((s, t) => s + t.estimateMinutes, 0);
  const loggedTotal = items.reduce((s, t) => s + (t.loggedMinutes ?? 0), 0);
  const menuItems: ZoneMenuItem[] = [
    ...(canWrite
      ? [
          { label: "Edit sprint", onSelect: onEdit },
          { label: "Delete sprint", onSelect: onDelete },
        ]
      : []),
    { label: "Export tickets", disabled: items.length === 0, onSelect: onExport },
  ];

  return (
    <SprintDraggable
      sprintId={sprint.id}
      disabled={!canDrag}
      previewOffset={previewOffset}
      onHeight={onHeight}
    >
      {(drag) => (
        <GlassPanel
          ref={drag.setNodeRef}
          style={drag.style}
          className={cn(
            "p-4",
            drag.isDragging && "border-2 border-dashed border-primary/70 shadow-lg",
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="ml-3.5 mt-0.5">
                <SelectAllCheckbox items={items} ctx={ctx} />
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {canDrag && (
                    <button
                      type="button"
                      aria-label="Drag sprint"
                      className={cn(
                        "-ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground touch-none",
                        drag.isDragging ? "cursor-grabbing" : "cursor-grab",
                      )}
                      onClick={(event) => event.preventDefault()}
                      {...drag.handleProps}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <Target
                    className={cn(
                      "h-4 w-4",
                      sprint.status === "active" ? "text-green-500" : "text-muted-foreground",
                    )}
                  />
                  <h2 className="text-sm font-semibold tracking-tight">{sprint.name}</h2>
                  {sprint.goal && (
                    <span className="hidden text-xs text-muted-foreground md:inline">
                      · {sprint.goal}
                    </span>
                  )}
                  {sprint.goal && (
                    <span className="hidden text-xs text-muted-foreground md:inline">·</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {sprint.startsAt && (
                    <span>Start: {tz.formatDate(sprint.startsAt, DATE_OPTS)}</span>
                  )}
                  {sprint.endsAt && <span>End: {tz.formatDate(sprint.endsAt, DATE_OPTS)}</span>}
                  <ZoneTotals est={total} logged={loggedTotal} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!canWrite ? null : sprint.status === "completed" ? (
                <Button size="sm" variant="outline" disabled className={PILL_BUTTON}>
                  <CheckSquare className="h-3.5 w-3.5" />
                  Completed Sprint
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className={PILL_BUTTON}
                  onClick={sprint.status === "active" ? onComplete : onStart}
                >
                  {sprint.status === "active" ? (
                    <>
                      <Square className="h-2.5 w-2.5" />
                      Complete sprint
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Start sprint
                    </>
                  )}
                </Button>
              )}
              {canWrite && sprint.status !== "completed" && (
                <NewTicketButton
                  projectId={project.id}
                  projectKey={project.key}
                  sprintId={sprint.id}
                />
              )}

              <ZoneActionsMenu label="Sprint actions" items={menuItems} />
              <CollapseButton collapsed={collapsed} onToggle={onToggleCollapse} noun="sprint" />
            </div>
          </div>
          <ZoneBody
            zoneId={sprint.id}
            label={sprint.name}
            collapsed={collapsed}
            ticketDragging={ticketDragging}
            suppressLabel={sprintDragging}
            collapsedText={`Drop here to move into ${sprint.name}`}
          >
            <ZoneRows
              items={items}
              emptyText="Drag tickets here to commit."
              zoneId={sprint.id}
              ctx={ctx}
            />
          </ZoneBody>
        </GlassPanel>
      )}
    </SprintDraggable>
  );
}
