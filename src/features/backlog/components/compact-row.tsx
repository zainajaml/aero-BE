import type { ComponentType } from "react";
import { AlertTriangle, Bookmark, Bug, Plus } from "lucide-react";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { EpicIcon } from "@/shared/ui/icons/epic-icon";
import { StoryIcon } from "@/shared/ui/icons/story-icon";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { ComplexityBars } from "@/features/tickets/components/complexity-bars";
import { TicketCode } from "@/features/tickets/components/ticket-code";
import type { BacklogTicket } from "../lib/backlog-types";

const TYPE_ICON: Record<string, ComponentType<{ className?: string }>> = {
  task: Bookmark,
  bug: Bug,
  story: StoryIcon,
  epic: EpicIcon,
};

const TYPE_ICON_COLOR: Record<string, string> = {
  bug: "text-neon-rose",
  story: "text-neon-lime",
  task: "text-neon-cyan",
};

export interface CompactRowProps {
  ticket: BacklogTicket;
  stage: string | null;
  stageDone: boolean;
  logged: number;
  epicNames?: string[];
  epicIds?: string[];
  epicOptions?: { id: string; name: string }[];
  stageOptions?: { id: string; name: string }[];
  columnId?: string | null;
  onChangeEpic?: (epicId: string | null) => void;
  onChangeStage?: (columnId: string) => void;
  editable?: boolean;
  assigneeName?: string | null;
  assigneeAvatar?: string | null;
  onClick: () => void;
  dragging?: boolean;
  selected?: boolean;
  selectionActive?: boolean;
  onSelectedChange?: (next: boolean) => void;
}

/** One ticket line of the backlog/sprint lists. */
export function CompactRow({
  ticket,
  stage,
  stageDone,
  logged,
  epicNames,
  epicIds,
  epicOptions = [],
  stageOptions = [],
  columnId,
  onChangeEpic,
  onChangeStage,
  editable = true,
  assigneeName,
  assigneeAvatar,
  onClick,
  dragging,
  selected = false,
  selectionActive = false,
  onSelectedChange,
}: CompactRowProps) {
  const NO_EPIC = "__none__";
  const currentEpicId = epicIds && epicIds.length > 0 ? epicIds[0] : NO_EPIC;
  const badgeTriggerClass =
    "h-6 w-fit min-w-0 max-w-[120px] shrink-0 justify-start gap-1 overflow-hidden whitespace-nowrap rounded-full border border-foreground bg-neon-violet/10 px-2.5 py-0 text-[9px] font-medium uppercase leading-none tracking-wide text-foreground [&>span]:block [&>span]:min-w-0 [&>span]:truncate";

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg border border-glass-border bg-card/60 px-3 py-2 text-left transition-all",
        "hover:border-primary/40 hover:bg-card/90",
        dragging && "opacity-50 ring-1 ring-primary/40",
        selected && "border-primary/60 bg-primary/5",
      )}
    >
      {onSelectedChange && (
        <span
          className={cn(
            "-ml-1 flex h-5 w-5 shrink-0 items-center justify-center transition-opacity",
            selected || selectionActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(v: boolean | "indeterminate") => onSelectedChange(v === true)}
            aria-label={selected ? "Deselect ticket" : "Select ticket"}
            className="h-3.5 w-3.5 rounded-[5px] border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </span>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-6">
        {/* Column 1: title (left justified, min-width responsive, no fixed width) */}
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-[360px] flex-1 items-center gap-2 text-left lg:min-w-[360px] xl:min-w-[360px] 2xl:min-w-[600px]"
        >
          {(() => {
            const TypeIcon = TYPE_ICON[ticket.type];
            return TypeIcon ? (
              <TypeIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  TYPE_ICON_COLOR[ticket.type] ?? "text-muted-foreground",
                )}
                aria-label={ticket.type}
              />
            ) : null;
          })()}
          <ComplexityBars priority={ticket.priority} />
          <span className="sr-only">{ticket.priority}</span>
          <TicketCode code={ticket.code} />

          <span className="min-w-0 flex-1 truncate text-sm font-medium" title={ticket.title}>
            {ticket.title}
          </span>
        </button>

        {/* Metadata group: epic, stage, estimate/logged/assignee */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Column 2: epic (fixed width, editable dropdown) */}
          <div className="hidden w-[120px] shrink-0 items-center xl:flex">
            {editable ? (
              <Select
                value={currentEpicId}
                onValueChange={(v) => {
                  onChangeEpic?.(v === NO_EPIC ? null : v);
                  if (typeof document !== "undefined") {
                    (document.activeElement as HTMLElement | null)?.blur?.();
                  }
                }}
              >
                <SelectTrigger
                  className={cn(
                    badgeTriggerClass,
                    currentEpicId === NO_EPIC &&
                      "gap-1.5 border-dashed border-muted-foreground/60 bg-transparent text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 [&>svg:last-child]:hidden",
                  )}
                  title={currentEpicId === NO_EPIC ? undefined : epicNames?.join(", ")}
                  aria-label={currentEpicId === NO_EPIC ? "Add epic" : "Change epic"}
                >
                  {currentEpicId === NO_EPIC ? (
                    <>
                      <Plus className="h-3 w-3 shrink-0" aria-hidden />
                      <span>Epic</span>
                    </>
                  ) : (
                    <SelectValue placeholder="— Epic" />
                  )}
                </SelectTrigger>

                <SelectContent className="max-h-[280px] w-[240px] max-w-[240px]">
                  <SelectItem value={NO_EPIC}>No epic</SelectItem>
                  {epicOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id} title={e.name}>
                      <span className="block max-w-[180px] truncate">{e.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              epicNames &&
              epicNames.length > 0 && (
                <NeonBadge
                  tone="violet"
                  className="w-fit max-w-[120px] justify-start truncate border-foreground text-[9px] uppercase text-foreground"
                  title={epicNames.join(", ")}
                >
                  {epicNames[0].length > 15 ? `${epicNames[0].slice(0, 15)}...` : epicNames[0]}
                  {epicNames.length > 1 ? ` +${epicNames.length - 1}` : ""}
                </NeonBadge>
              )
            )}
          </div>

          {/* Column 3: sprint stage (fixed width, editable dropdown) */}
          <div className="hidden w-[120px] shrink-0 items-center xl:flex">
            {stage &&
              (() => {
                const key = stage.trim().toLowerCase();
                const isTodo = key === "to do" || key === "todo" || key === "backlog";
                const isDone =
                  stageDone || key === "done" || key === "complete" || key === "completed";
                const stageTone = isDone
                  ? "border-neon-lime bg-neon-lime/20 text-foreground"
                  : isTodo
                    ? "border-muted-foreground/50 bg-muted text-muted-foreground"
                    : "border-foreground bg-neon-violet/10 text-foreground";
                return editable ? (
                  <Select value={columnId ?? undefined} onValueChange={(v) => onChangeStage?.(v)}>
                    <SelectTrigger
                      className={cn(badgeTriggerClass, stageTone)}
                      aria-label="Change sprint stage"
                    >
                      <SelectValue placeholder="— Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stageOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-6 w-fit min-w-0 max-w-[120px] shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border px-2.5 text-[9px] font-medium uppercase leading-none tracking-wide",
                      stageTone,
                    )}
                    title={stage}
                  >
                    <span className="min-w-0 truncate">{stage}</span>
                  </span>
                );
              })()}
          </div>

          {/* Column 4: estimate / logged / assignee (right justified) */}
          <button
            type="button"
            onClick={onClick}
            className="flex shrink-0 items-center justify-end gap-2"
          >
            <span
              className="w-[68px] shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground"
              title="Estimate"
            >
              Est {formatDHM(ticket.estimateMinutes)}
            </span>
            <span
              className={cn(
                "w-[68px] shrink-0 text-right font-mono text-[10px] tabular-nums",
                logged > ticket.estimateMinutes && ticket.estimateMinutes > 0
                  ? "text-neon-rose"
                  : "text-foreground",
              )}
              title="Logged to date"
            >
              Log {formatDHM(logged)}
            </span>
            {ticket.assigneeId ? (
              <UserAvatar
                path={assigneeAvatar}
                name={assigneeName}
                title={assigneeName ?? "Assigned"}
              />
            ) : (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                title="Unassigned"
              >
                <AlertTriangle className="h-3 w-3" aria-label="Unassigned" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
