import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CloseButton } from "@/shared/ui/close-button";
import { Button } from "@/shared/ui/button";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useUserOpenTickets } from "../hooks/admin-queries";
import { TicketCode } from "./ticket-code";

const UNASSIGN = "__unassign__";

/** `reassign` set = hand the open tickets over in the same archive call; omitted = leave them. */
export type ArchiveCompletion = (reassign?: { assigneeId: string | null }) => Promise<void>;

interface Props {
  userId: string;
  userName: string;
  open: boolean;
  onComplete: ArchiveCompletion;
}

/**
 * Shown when a user is being archived: their open tickets stay assigned to
 * someone who can no longer sign in, so offer a one-click hand-over. The archive
 * (with the optional reassignment) is a single server call.
 */
export function ReassignArchivedTicketsDialog({ userId, userName, open, onComplete }: Props) {
  const [target, setTarget] = useState<string>(UNASSIGN);

  const { data, isLoading, isError, refetch } = useUserOpenTickets(userId, open);
  const tickets = data?.tickets ?? [];
  const candidates = data?.candidates ?? [];
  const singleProjectId = data?.singleProjectId ?? null;

  const apply = useMutation({
    mutationFn: () => onComplete({ assigneeId: target === UNASSIGN ? null : target }),
    onError: () => toast.error("We couldn't update the tickets. Please try again."),
  });

  const leave = useMutation({
    mutationFn: () => onComplete(),
    onError: () => toast.error("We couldn't archive this user. Please try again."),
  });

  const isSubmitting = apply.isPending || leave.isPending;
  const finishWithoutChanges = () => {
    if (!isLoading && !isError && !isSubmitting) leave.mutate();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) finishWithoutChanges();
      }}
    >
      <DialogContent className="max-w-lg" hideCloseButton>
        <DialogHeader className="pr-10 text-left">
          <DialogTitle>Reassign open tickets</DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Checking for open work…"
              : isError
                ? "We couldn't load this user's open tickets."
                : tickets.length === 0
                  ? `${userName} has no open tickets left.`
                  : `${userName} will be archived and currently owns ${tickets.length} open ticket${
                      tickets.length === 1 ? "" : "s"
                    }.`}
          </DialogDescription>
          <div className="absolute right-4 top-4">
            <CloseButton
              onClick={finishWithoutChanges}
              disabled={isLoading || isError || isSubmitting}
            />
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3" aria-label="Loading open tickets">
            <div className="h-20 animate-pulse rounded-lg border border-glass-border bg-muted/40" />
            <div className="h-9 animate-pulse rounded-lg bg-muted/40" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && tickets.length > 0 && (
          <>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-glass-border">
              <div className="divide-y divide-border/60">
                {tickets.map((t) => (
                  <div key={t.id} className="flex h-10 items-center gap-3 px-3 text-xs">
                    <TicketCode code={t.code} size="xs" />
                    <span className="truncate">{t.title}</span>
                    {!singleProjectId && (
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {t.projectName}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="field-label shrink-0">Assign to</span>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-9 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGN}>Unassigned</SelectItem>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!singleProjectId && (
              <p className="text-xs text-muted-foreground">
                These tickets span multiple projects, so they can only be unassigned here. Reassign
                individually from each project board.
              </p>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isLoading || isError || isSubmitting}
            onClick={finishWithoutChanges}
          >
            {leave.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isLoading && tickets.length === 0 ? "Close" : "Leave as is"}
          </Button>
          {!isLoading && !isError && tickets.length > 0 && (
            <Button
              type="button"
              size="sm"
              className={CTA_BUTTON}
              disabled={isSubmitting}
              onClick={() => apply.mutate()}
            >
              {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
