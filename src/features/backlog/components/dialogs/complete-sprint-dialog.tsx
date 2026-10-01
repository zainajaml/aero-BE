import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { CTA_BUTTON } from "@/shared/lib/cta";
import type { BacklogSprint } from "../../lib/backlog-types";

export interface PendingSprintClose {
  sprintId: string;
  sprintName: string;
  openCount: number;
}

/** Ending a sprint with open tickets: pick a destination for them first. */
export function CompleteSprintDialog({
  pending,
  onClose,
  target,
  onTargetChange,
  sprints,
  pendingSubmit,
  onConfirm,
}: {
  pending: PendingSprintClose | null;
  onClose: () => void;
  target: string;
  onTargetChange: (v: string) => void;
  sprints: BacklogSprint[];
  pendingSubmit: boolean;
  onConfirm: () => void;
}) {
  const openTargets = sprints.filter((s) => s.status !== "completed");
  return (
    <Dialog
      open={!!pending}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="glass border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move open tickets before closing</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {pending
              ? `${pending.sprintName} still has ${pending.openCount} open ticket${
                  pending.openCount === 1 ? "" : "s"
                }. Choose where to move them, then the sprint will be completed.`
              : null}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground">Move open tickets to</Label>
            <Select value={target} onValueChange={onTargetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {openTargets
                  .filter((s) => s.id !== pending?.sprintId)
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.status === "active" ? " (current)" : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className={CTA_BUTTON} disabled={pendingSubmit} onClick={onConfirm}>
            {pendingSubmit && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {pendingSubmit ? "Completing…" : "Move & complete sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
