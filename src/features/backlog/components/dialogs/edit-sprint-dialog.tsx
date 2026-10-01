import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { assertDateRange, isInvalidDateRange } from "@/shared/lib/date-validation";
import { updateSprint, type Sprint } from "@/features/tickets/api/planning.api";
import { invalidateSprints } from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";
import { dateInputToIso, isoToDateInput } from "../../lib/sprint-dates";
import { SprintFormFields, type SprintFormValues } from "./sprint-form-fields";

const fromSprint = (sprint: Sprint): SprintFormValues => ({
  name: sprint.name,
  goal: sprint.goal ?? "",
  startsAt: isoToDateInput(sprint.startsAt),
  endsAt: isoToDateInput(sprint.endsAt),
});

/**
 * Edit dialog of one sprint. Mounted only while open (the page renders it for the sprint being
 * edited), so the form always starts from the saved values and unsaved edits are discarded.
 */
export function EditSprintDialog({
  projectId,
  sprint,
  open,
  onOpenChange,
}: {
  projectId: string;
  sprint: Sprint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<SprintFormValues>(() => fromSprint(sprint));
  const datesInvalid = isInvalidDateRange(values.startsAt, values.endsAt);

  const update = useMutation({
    mutationFn: async () => {
      if (!values.name.trim()) throw new Error("Name required");
      assertDateRange(values.startsAt, values.endsAt);
      return updateSprint(projectId, sprint.id, {
        name: values.name.trim(),
        goal: values.goal.trim() || null,
        startsAt: dateInputToIso(values.startsAt),
        endsAt: dateInputToIso(values.endsAt),
      });
    },
    onSuccess: () => {
      toast.success("Sprint updated");
      invalidateSprints(qc, projectId);
      onOpenChange(false);
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-glass-border">
        <DialogHeader>
          <DialogTitle>Edit sprint</DialogTitle>
        </DialogHeader>
        <SprintFormFields
          values={values}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          datesInvalid={datesInvalid}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={CTA_BUTTON}
            onClick={() => update.mutate()}
            disabled={update.isPending || datesInvalid}
          >
            {update.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
