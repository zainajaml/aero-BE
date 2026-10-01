import type { ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { CloseButton } from "@/shared/ui/close-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { CTA_BUTTON } from "@/shared/lib/cta";
import {
  CLEAR,
  KEEP,
  useBulkEdit,
  type BulkEditOptions,
} from "../../hooks/bulk-edit/use-bulk-edit";
import { EpicTagInput } from "../epics/epic-tag-input";
import { PRIORITIES, TICKET_TYPES } from "../ticket-dialog/dialog-ui";

function FieldRow({
  label,
  children,
  onClear,
}: {
  label: string;
  children: ReactNode;
  onClear?: () => void;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3">
      <span className="field-label pt-2">{label}</span>
      <div className="space-y-1">
        {children}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="block w-full text-right text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Select with a "Keep as is" first option (and optional extra leading options). */
function KeepSelect({
  value,
  onChange,
  leading,
  options,
  capitalize,
}: {
  value: string;
  onChange: (value: string) => void;
  leading?: ReactNode;
  options: { id: string; name: string }[];
  capitalize?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={KEEP}>Keep as is</SelectItem>
        {leading}
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id} className={capitalize ? "capitalize" : undefined}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const asOptions = (values: string[]) => values.map((v) => ({ id: v, name: v }));

export function BulkEditTicketsDialog(props: BulkEditOptions) {
  const { projectId, ticketIds, open, onOpenChange, columns, sprints } = props;
  const s = useBulkEdit(props);
  const plural = ticketIds.length === 1 ? "" : "s";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg" hideCloseButton>
          <DialogHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1.5 text-left">
              <DialogTitle className="flex items-center gap-2">
                Bulk edit
                <span className="text-muted-foreground">|</span>
                <span className="font-normal text-muted-foreground">
                  {ticketIds.length} ticket{plural}
                </span>
              </DialogTitle>
              <DialogDescription>Modify any of the below fields to continue.</DialogDescription>
            </div>
            <CloseButton onClick={() => onOpenChange(false)} />
          </DialogHeader>

          <div className="max-h-[52vh] space-y-3 overflow-auto rounded-lg border border-glass-border p-3">
            <FieldRow label="Stage">
              <KeepSelect value={s.stage} onChange={s.setStage} options={columns} />
            </FieldRow>

            <FieldRow label="Assignee" onClear={() => s.setAssignee(CLEAR)}>
              <KeepSelect
                value={s.assignee}
                onChange={s.setAssignee}
                leading={<SelectItem value={CLEAR}>Unassigned</SelectItem>}
                options={s.members}
              />
            </FieldRow>

            <FieldRow label="Priority">
              <KeepSelect
                value={s.priority}
                onChange={s.setPriority}
                options={asOptions(PRIORITIES)}
                capitalize
              />
            </FieldRow>

            <FieldRow label="Type">
              <KeepSelect
                value={s.type}
                onChange={s.setType}
                options={asOptions(TICKET_TYPES)}
                capitalize
              />
            </FieldRow>

            <FieldRow label="Sprint">
              <KeepSelect
                value={s.sprint}
                onChange={s.setSprint}
                leading={<SelectItem value={CLEAR}>Backlog</SelectItem>}
                options={sprints.filter((sp) => sp.status !== "completed")}
              />
            </FieldRow>

            <FieldRow label="Epics">
              <div className="rounded-lg border border-glass-border px-3 py-2">
                <EpicTagInput projectId={projectId} selected={s.epics} onChange={s.setEpics} />
              </div>
            </FieldRow>

            <FieldRow
              label="Due date"
              onClear={() => {
                s.setDueDate(undefined);
                s.setDueMode(CLEAR);
              }}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-between font-normal"
                  >
                    {s.dueMode === "set" && s.dueDate
                      ? format(s.dueDate, "MMM d, yyyy")
                      : s.dueMode === CLEAR
                        ? "Cleared"
                        : "Keep as is"}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={s.dueDate}
                    onSelect={(d) => {
                      s.setDueDate(d ?? undefined);
                      s.setDueMode(d ? "set" : KEEP);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FieldRow>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              disabled={s.changes.length === 0}
              onClick={() => s.setConfirmOpen(true)}
              size="sm"
              className={CTA_BUTTON}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={s.confirmOpen} onOpenChange={s.setConfirmOpen}>
        <AlertDialogContent className="glass border-glass-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apply changes to {ticketIds.length} ticket{plural}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span className="block">The following fields will be updated:</span>
                <ul className="mt-2 list-disc space-y-0.5 pl-5">
                  {s.changes.map((c) => (
                    <li key={c.label} className="capitalize">
                      <span className="font-medium">{c.label}:</span> {c.value}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-[var(--tk-accent)] font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)] disabled:opacity-60"
              onClick={(e) => {
                e.preventDefault();
                s.save.mutate();
              }}
              disabled={s.save.isPending}
            >
              {s.save.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {s.save.isPending ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
