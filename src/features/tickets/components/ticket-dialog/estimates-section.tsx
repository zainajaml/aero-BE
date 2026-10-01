import { format } from "date-fns";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ConfirmDelete } from "@/shared/ui/confirm-delete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { MAX_HOURS, StepperNumInput } from "@/shared/ui/stepper-num-input";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { TicketEstimates } from "../../hooks/ticket-dialog/use-ticket-estimates";
import { FloatField, TK_CONTENT, TK_ITEM, TK_PLAIN_TRIGGER, initials } from "./dialog-ui";

type HM = TicketEstimates["draft"];

/** Role + Hours + Mins fields shared by the add bar and inline edit. */
function EstimateFields({
  options,
  role,
  onRole,
  hm,
}: {
  options: readonly string[];
  role: string;
  onRole: (role: string) => void;
  hm: HM;
}) {
  return (
    <>
      <FloatField label="Role" className="w-[170px] overflow-hidden">
        <Select value={role} onValueChange={onRole}>
          <SelectTrigger
            className={cn(
              TK_PLAIN_TRIGGER,
              "w-full justify-between truncate text-[var(--tk-body)]",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={TK_CONTENT} alignOffset={-10}>
            {options.map((r) => (
              <SelectItem key={r} value={r} className={TK_ITEM}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FloatField>
      <FloatField label="Hours" className="w-[96px] overflow-hidden">
        <StepperNumInput
          ariaLabel="Estimate hours"
          value={hm.hours}
          max={MAX_HOURS}
          onChange={(h) => hm.apply(h, hm.minutes)}
        />
      </FloatField>
      <FloatField label="Mins" className="w-[96px] overflow-hidden">
        <StepperNumInput
          ariaLabel="Estimate minutes"
          value={hm.minutes}
          step={5}
          onChange={(m) => hm.apply(hm.hours, m)}
        />
      </FloatField>
    </>
  );
}

function CappedNotice({ capped }: { capped: boolean }) {
  return capped ? (
    <p className="mt-2 text-xs text-destructive">Maximum estimate is 999h 59m.</p>
  ) : null;
}

export function EstimatesSection({
  est,
  sprintLocked,
  isManager,
}: {
  est: TicketEstimates;
  sprintLocked: boolean;
  isManager: boolean;
}) {
  return (
    <section>
      <h1 className="text-lg font-semibold text-[var(--tk-text)] mb-1.5">Estimates</h1>

      {/* Add estimate trigger */}
      {!est.showForm && !sprintLocked && (
        <button
          type="button"
          onClick={() => est.setShowForm(true)}
          className="mb-3 mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--tk-accent)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--tk-surface)] border border-[var(--tk-border)]">
            <Plus className="h-4 w-4 text-[var(--tk-accent)]" />
          </span>
          Add Estimates
        </button>
      )}

      {/* Add estimate bar */}
      {est.showForm && (
        <div className="mb-3 mt-2">
          <div className="flex flex-wrap items-end gap-3">
            <EstimateFields
              options={est.resourceOptions}
              role={est.role}
              onRole={est.setRole}
              hm={est.draft}
            />
            <Button
              type="button"
              onClick={() => est.add.mutate()}
              disabled={est.add.isPending || (est.draft.hours === 0 && est.draft.minutes === 0)}
              className="h-9 shrink-0 rounded-lg bg-[var(--tk-accent)] px-3 font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
            >
              Add estimate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={est.cancelAdd}
              className="h-9 w-9 rounded-lg border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CappedNotice capped={est.draft.capped} />
        </div>
      )}

      {est.estimates.length === 0 && (
        <div className="py-1.5 text-sm text-[var(--tk-muted)]">No estimates yet.</div>
      )}
      {est.estimates.map((e) => {
        const roleName = e.resourceType || "Role";
        if (est.editingId === e.id) {
          return (
            <div key={e.id} className="border-b border-[var(--tk-divider)] py-2">
              <div className="flex flex-wrap items-end gap-3">
                <EstimateFields
                  options={est.resourceOptions}
                  role={est.editRole}
                  onRole={est.setEditRole}
                  hm={est.edit}
                />
                <Button
                  type="button"
                  onClick={() => est.save.mutate(e.id)}
                  disabled={est.save.isPending || (est.edit.hours === 0 && est.edit.minutes === 0)}
                  className="h-9 rounded-lg bg-[var(--tk-accent)] px-4 font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => est.setEditingId(null)}
                  className="h-9 w-9 rounded-lg border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CappedNotice capped={est.edit.capped} />
            </div>
          );
        }
        return (
          <div
            key={e.id}
            className="group flex items-start gap-3 border-b border-t border-[var(--tk-divider)] py-3"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-[var(--tk-border)] text-[10px] font-semibold text-[var(--tk-accent)]">
                {initials(roleName)}
              </AvatarFallback>
            </Avatar>
            <span className="shrink-0 text-sm font-semibold leading-6 text-[var(--tk-text)]">
              {roleName}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm leading-6 text-[var(--tk-body)]">
              {e.note ?? ""}
            </span>
            <span className="w-24 shrink-0 text-right font-mono text-sm leading-6 tabular-nums text-[var(--tk-accent)]">
              {formatDHM(e.minutes)}
            </span>
            <span className="w-16 shrink-0 text-right text-xs leading-6 tabular-nums text-[var(--tk-muted)]">
              {format(new Date(e.estimatedAt ?? e.createdAt), "MMM d")}
            </span>
            <div className="flex h-6 w-[52px] shrink-0 items-center justify-end gap-0.5">
              {isManager && !sprintLocked && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                    onClick={() => est.startEdit(e)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ConfirmDelete
                    title="Delete estimate?"
                    description="Remove this estimate line? This cannot be undone."
                    onConfirm={() => est.remove.mutate(e.id)}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[var(--tk-muted)] hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
