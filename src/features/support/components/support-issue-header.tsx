import { useRef } from "react";
import { CheckCircle2, CornerUpLeft, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CloseButton } from "@/shared/ui/close-button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import type { SupportIssue } from "../api/support.api";
import { useDeleteSupportIssue, useToggleSupportIssueStatus } from "../hooks/use-support-mutations";
import { fmtTime, shortDayFmt } from "../lib/support-format";

export function SupportStatusBadge({
  status,
  size = "sm",
}: {
  status: SupportIssue["status"];
  size?: "sm" | "md";
}) {
  return (
    <Badge
      variant={status === "open" ? "default" : "secondary"}
      className={cn("rounded-full capitalize", size === "sm" ? "text-[10px]" : "text-xs")}
    >
      {status === "open" ? "Open" : "Closed"}
    </Badge>
  );
}

/** Ticket title, reporter and the close/reopen/delete actions above a thread. */
export function SupportIssueHeader({
  issue,
  onClose,
  onDeleted,
}: {
  issue: SupportIssue;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("super_admin");
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const toggleStatus = useToggleSupportIssueStatus();
  const deleteIssue = useDeleteSupportIssue(onDeleted);

  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-8 py-5">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          #{issue.ticketNumber}
        </div>
        <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight break-words">
          {issue.subject}
        </h2>
        <div className="mt-1.5 truncate text-xs text-muted-foreground">
          Logged by <span className="font-medium text-foreground">{issue.owner.name}</span> ·{" "}
          {shortDayFmt.format(new Date(issue.createdAt))} at {fmtTime(issue.createdAt)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span>
          <SupportStatusBadge status={issue.status} size="md" />
        </span>
        <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              aria-label="Ticket actions"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="w-auto min-w-fit">
            <DropdownMenuItem
              onSelect={() => toggleStatus.mutate(issue)}
              disabled={toggleStatus.isPending}
            >
              {issue.status === "open" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Close Ticket
                </>
              ) : (
                <>
                  <CornerUpLeft className="h-4 w-4" />
                  Reopen Ticket
                </>
              )}
            </DropdownMenuItem>
            {(issue.owner.id === user?.id || isAdmin) && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  deleteTriggerRef.current?.click();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <CloseButton onClick={onClose} aria-label="Close support" />
        <ConfirmDelete
          title="Delete this support ticket?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteIssue.mutate(issue)}
          trigger={
            <button
              ref={deleteTriggerRef}
              type="button"
              className="hidden"
              aria-hidden
              tabIndex={-1}
            />
          }
        />
      </div>
    </div>
  );
}
