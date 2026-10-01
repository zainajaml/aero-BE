import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { CTA_BUTTON } from "@/shared/lib/cta";
import { assertDateRange, isInvalidDateRange } from "@/shared/lib/date-validation";
import { createSprint } from "@/features/tickets/api/planning.api";
import { invalidateSprints } from "@/features/tickets/hooks/ticket-queries";
import { ticketErrorMessage } from "@/features/tickets/lib/ticket-errors";
import { dateInputToIso } from "../../lib/sprint-dates";
import { SprintFormFields, type SprintFormValues } from "./sprint-form-fields";

const EMPTY: SprintFormValues = { name: "", goal: "", startsAt: "", endsAt: "" };

/** "+ Sprint" button and dialog. The server places the new sprint at the top. */
export function CreateSprintDialog({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SprintFormValues>(EMPTY);
  const datesInvalid = isInvalidDateRange(values.startsAt, values.endsAt);

  const create = useMutation({
    mutationFn: async () => {
      if (!values.name.trim()) throw new Error("Name required");
      assertDateRange(values.startsAt, values.endsAt);
      return createSprint(projectId, {
        name: values.name.trim(),
        goal: values.goal.trim() || null,
        startsAt: dateInputToIso(values.startsAt),
        endsAt: dateInputToIso(values.endsAt),
      });
    },
    onSuccess: () => {
      toast.success("Sprint created");
      invalidateSprints(qc, projectId);
      setOpen(false);
      setValues(EMPTY);
    },
    onError: (e) => toast.error(ticketErrorMessage(e)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setValues(EMPTY);
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Sprint
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-glass-border">
        <DialogHeader>
          <DialogTitle>New sprint</DialogTitle>
        </DialogHeader>
        <SprintFormFields
          values={values}
          onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
          datesInvalid={datesInvalid}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={CTA_BUTTON}
            onClick={() => create.mutate()}
            disabled={create.isPending || datesInvalid}
          >
            {create.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
