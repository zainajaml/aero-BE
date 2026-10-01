import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, Bug, Bookmark } from "lucide-react";
import { UserAvatar } from "@/features/users/components/user-avatar";
import { ArchivedBadge } from "@/shared/ui/glass/archived-badge";
import { EpicIcon } from "@/shared/ui/icons/epic-icon";
import { StoryIcon } from "@/shared/ui/icons/story-icon";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { displayName } from "@/features/users/lib/names";
import { ComplexityBars } from "./complexity-bars";
import { TicketCode } from "./ticket-code";

export interface TicketAssignee {
  fullName: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  archivedAt?: string | null;
}

export interface TicketLike {
  id: string;
  code: string;
  title: string;
  type: string;
  priority: string;
  estimateMinutes: number;
  loggedMinutes?: number;
  assigneeId: string | null;
  assignee?: TicketAssignee | null;
}

interface Props {
  ticket: TicketLike;
  onClick?: () => void;
  dragging?: boolean;
  compact?: boolean;
  className?: string;
  dragHandle?: ReactNode;
}

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

export function TicketCard({ ticket, onClick, dragging, compact, className, dragHandle }: Props) {
  const baseName = ticket.assignee ? displayName(ticket.assignee, "") || null : null;
  const isArchived = !!ticket.assignee?.archivedAt;
  const assigneeName = baseName ?? null;
  const TypeIcon = TYPE_ICON[ticket.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group block w-full rounded-xl border border-glass-border bg-card/60 p-3 text-left backdrop-blur-sm transition-all",
        "hover:border-primary/40 hover:shadow-[0_4px_24px_-8px_var(--primary)] hover:-translate-y-0.5",
        dragging && "opacity-50 ring-1 ring-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {dragHandle}
          <TicketCode code={ticket.code} />
        </span>

        <div className="flex items-center gap-2">
          <ComplexityBars priority={ticket.priority} />
          <span className="sr-only">{ticket.priority}</span>
          {TypeIcon && (
            <TypeIcon
              className={cn(
                "h-4 w-4 shrink-0",
                TYPE_ICON_COLOR[ticket.type] ?? "text-muted-foreground",
              )}
              aria-label={ticket.type}
            />
          )}
        </div>
      </div>
      <div className={cn("mt-1.5 text-sm font-medium leading-snug", compact && "line-clamp-2")}>
        {ticket.title}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {ticket.assigneeId ? (
          <span className="flex items-center gap-1.5 min-w-0">
            <UserAvatar
              path={ticket.assignee?.avatarUrl}
              name={assigneeName}
              title={
                assigneeName
                  ? isArchived
                    ? `${assigneeName} (Archived)`
                    : assigneeName
                  : "Assigned"
              }
            />
            {assigneeName && (
              <span className="flex min-w-0 items-center gap-1.5 truncate text-[10px] text-muted-foreground">
                <span className="truncate">{assigneeName}</span>
                {isArchived && <ArchivedBadge />}
              </span>
            )}
          </span>
        ) : (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            title="Unassigned"
          >
            <AlertTriangle className="h-3 w-3" aria-label="Unassigned" />
          </span>
        )}
        {(ticket.estimateMinutes > 0 || (ticket.loggedMinutes ?? 0) > 0) && (
          <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
            <span className="text-muted-foreground/70">est</span>{" "}
            {formatDHM(ticket.estimateMinutes)}
            {" / "}
            <span
              className={cn(
                (ticket.loggedMinutes ?? 0) > ticket.estimateMinutes &&
                  ticket.estimateMinutes > 0 &&
                  "text-destructive",
              )}
            >
              {formatDHM(ticket.loggedMinutes ?? 0)}
            </span>{" "}
            <span className="text-muted-foreground/70">logged</span>
          </span>
        )}
      </div>
    </button>
  );
}
