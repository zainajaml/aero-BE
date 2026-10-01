import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bookmark, Bug, ExternalLink } from "lucide-react";
import { EpicIcon } from "@/shared/ui/icons/epic-icon";
import { StoryIcon } from "@/shared/ui/icons/story-icon";
import { Button } from "@/shared/ui/button";
import { formatHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { TicketRowView } from "../../lib/work-log-derive";

/** Type icons shown next to the ticket code, matching the ticket card. */
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

function TypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON[type];
  if (!Icon) return null;
  return (
    <Icon
      className={cn("h-3.5 w-3.5 shrink-0", TYPE_ICON_COLOR[type] ?? "text-muted-foreground")}
      aria-label={type}
    />
  );
}

export function WorkLogTicketTable({
  tickets,
  showAssignee,
}: {
  tickets: TicketRowView[];
  showAssignee: boolean;
}) {
  return (
    <div className="min-w-[1100px]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="w-24 shrink-0">Type / Code</span>
        <span className="min-w-0 flex-1">Title</span>
        <span className="w-28 shrink-0">Project</span>
        <span className="w-24 shrink-0 text-center">Stage</span>
        <span className="w-24 shrink-0 text-center">Sprint</span>
        <span className="w-14 shrink-0">Priority</span>
        {showAssignee && <span className="w-24 shrink-0">Assignee</span>}
        <span className="w-20 shrink-0 text-right">Logged</span>
        <span className="w-24 shrink-0 text-right">Due date</span>
        <span className="w-9 shrink-0" aria-hidden="true" />
      </div>
      {/* Rows */}
      <div>
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40"
          >
            <span className="flex w-24 shrink-0 items-center gap-1.5">
              <TypeIcon type={t.type} />
              <span className="truncate font-mono text-[11px] text-muted-foreground" title={t.code}>
                {t.code}
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate text-sm" title={t.title}>
              {t.title}
            </span>
            <span
              className="w-28 shrink-0 truncate text-xs text-muted-foreground"
              title={t.project}
            >
              {t.project}
            </span>
            <span
              className={cn(
                "w-24 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-[11px]",
                t.stageDone
                  ? "border-neon-lime bg-neon-lime/20 text-foreground"
                  : !t.stage
                    ? "border-muted-foreground/50 bg-muted text-muted-foreground"
                    : "border-foreground bg-neon-violet/10 text-foreground",
              )}
              title={t.stage ?? "No stage"}
            >
              {t.stage ?? "No stage"}
            </span>
            <span
              className="w-24 shrink-0 truncate rounded-full border border-border/60 px-2 py-0.5 text-center text-[11px] text-muted-foreground"
              title={t.sprint}
            >
              {t.sprint}
            </span>
            <span className="w-14 shrink-0 text-[11px] capitalize text-muted-foreground">
              {t.priority}
            </span>
            {showAssignee && (
              <span
                className="w-24 shrink-0 truncate text-[11px] text-muted-foreground"
                title={t.assignee}
              >
                {t.assignee}
              </span>
            )}
            <span
              className="w-20 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground"
              title="Logged in selected range"
            >
              {t.loggedMinutes ? formatHM(t.loggedMinutes) : "—"}
            </span>
            <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
              {t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "No due date"}
            </span>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-7 w-9 shrink-0"
              title="Open ticket"
            >
              <Link to="/ticket/$ticketId" params={{ ticketId: t.id }}>
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="sr-only">Open {t.code}</span>
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
