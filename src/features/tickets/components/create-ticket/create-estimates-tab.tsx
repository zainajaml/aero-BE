import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { MAX_HOURS, StepperNumInput } from "@/shared/ui/stepper-num-input";
import { formatDHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import {
  estimateRowMinutes,
  type EstimateDraft,
} from "../../hooks/create-ticket/use-estimate-draft";
import {
  FloatField,
  TK_CONTENT_BASE,
  TK_ITEM,
  TK_PLAIN_TRIGGER,
  initials,
} from "../ticket-dialog/dialog-ui";

/** Estimates staged in the create dialog; they are sent with the create call. */
export function CreateEstimatesTab({
  draft: est,
  resourceOptions,
}: {
  draft: EstimateDraft;
  resourceOptions: readonly string[];
}) {
  return (
    <div className="tk-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
      <section>
        <h1 className="mb-1.5 text-lg font-semibold text-[var(--tk-text)]">Estimates</h1>

        {/* Add estimate trigger */}
        {!est.showForm && (
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

        {/* Add estimate form */}
        {est.showForm && (
          <div className="mb-3 mt-2">
            <div className="flex flex-wrap items-end gap-3">
              <FloatField label="Role" className="w-[170px] overflow-hidden">
                <Select value={est.resource} onValueChange={est.setResource}>
                  <SelectTrigger
                    className={cn(
                      TK_PLAIN_TRIGGER,
                      "w-full justify-between truncate text-[var(--tk-body)]",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={TK_CONTENT_BASE} alignOffset={-10}>
                    {resourceOptions.map((r) => (
                      <SelectItem key={r} value={r} className={TK_ITEM}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FloatField>
              <FloatField label="Date" className="w-[150px] overflow-hidden">
                <Popover open={est.dateOpen} onOpenChange={est.setDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-sm text-[var(--tk-text)]"
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0 text-[var(--tk-muted)]" />
                      <span>{format(est.date, "MMM d, yyyy")}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    alignOffset={-10}
                    sideOffset={6}
                  >
                    <Calendar
                      mode="single"
                      selected={est.date}
                      onSelect={(d) => {
                        if (d) {
                          const now = new Date();
                          const merged = new Date(d);
                          merged.setHours(
                            now.getHours(),
                            now.getMinutes(),
                            now.getSeconds(),
                            now.getMilliseconds(),
                          );
                          est.setDate(merged);
                        }
                        est.setDateOpen(false);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </FloatField>
              <FloatField label="Hours" className="w-[96px] overflow-hidden">
                <StepperNumInput
                  ariaLabel="Estimate hours"
                  value={est.hours}
                  max={MAX_HOURS}
                  onChange={(h) => est.applyHM(h, est.minutes)}
                />
              </FloatField>
              <FloatField label="Mins" className="w-[96px] overflow-hidden">
                <StepperNumInput
                  ariaLabel="Estimate minutes"
                  value={est.minutes}
                  step={5}
                  onChange={(m) => est.applyHM(est.hours, m)}
                />
              </FloatField>
              <Button
                type="button"
                onClick={est.add}
                disabled={est.hours === 0 && est.minutes === 0}
                className="h-9 shrink-0 rounded-lg bg-[var(--tk-accent)] px-3 font-semibold text-[var(--tk-on-accent)] hover:bg-[var(--tk-accent-hover)]"
              >
                Add estimate
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={est.cancel}
                className="h-9 w-9 rounded-lg border-[var(--tk-border)] bg-transparent p-0 text-[var(--tk-body)]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {est.capped ? (
              <p className="mt-2 text-xs text-destructive">Maximum estimate is 999h 59m.</p>
            ) : null}
          </div>
        )}

        {est.estimates.length === 0 && (
          <div className="py-1.5 text-sm text-[var(--tk-muted)]">No estimates yet.</div>
        )}

        {est.estimates.map((e) => (
          <div
            key={e.id}
            className="group flex items-start gap-3 border-b border-t border-[var(--tk-divider)] py-3"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-[var(--tk-border)] text-[10px] font-semibold text-[var(--tk-accent)]">
                {initials(e.resourceType)}
              </AvatarFallback>
            </Avatar>
            <span className="shrink-0 text-sm font-semibold leading-6 text-[var(--tk-text)]">
              {e.resourceType}
            </span>
            <span className="min-w-0 flex-1" />
            <span className="w-24 shrink-0 text-right font-mono text-sm leading-6 tabular-nums text-[var(--tk-accent)]">
              {formatDHM(estimateRowMinutes(e))}
            </span>
            <span className="w-16 shrink-0 text-right text-xs leading-6 tabular-nums text-[var(--tk-muted)]">
              {format(new Date(e.estimatedAt), "MMM d")}
            </span>
            <div className="flex h-6 w-[52px] shrink-0 items-center justify-end gap-0.5">
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--tk-muted)] hover:text-destructive"
                  onClick={() => est.remove(e.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
