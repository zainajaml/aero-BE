import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, ListChecks } from "lucide-react";
import { formatHM } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";

function Stat({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        accent ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/30",
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="truncate text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const Loading = () => <p className="text-xs text-muted-foreground">Loading…</p>;

/** Ticket counts plus hours per day / project / person. */
export function WorkLogSummary({ s }: { s: WorkLogPanelState }) {
  const { loading, perDay, perProject, perPerson, rangeLabel } = s;
  const maxDay = Math.max(1, ...perDay.map((d) => d.minutes));
  const maxPerson = Math.max(1, ...perPerson.map((x) => x.minutes));
  return (
    <>
      {/* Ticket counts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="Assigned tickets"
          value={String(s.workload.total)}
        />
        <Stat
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          label="Completed"
          value={String(s.workload.completed)}
        />
        <Stat
          icon={<CircleDashed className="h-3.5 w-3.5" />}
          label="Pending"
          value={String(s.workload.pending)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per day */}
        <section className="rounded-xl border border-border/50 bg-card/30 p-4">
          <h3 className="text-sm font-semibold">Hours per day</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {rangeLabel} · {s.scopeLabel}
          </p>
          <div className="mt-3 max-h-[320px] space-y-1.5 overflow-auto pr-1">
            {loading && <Loading />}
            {!loading && perDay.length === 0 && (
              <p className="text-xs text-muted-foreground">No days in range.</p>
            )}
            {!loading &&
              perDay.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">
                    {s.tz.formatDate(d.day, { day: "numeric", month: "short", weekday: "short" })}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${(d.minutes / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                    {d.minutes ? formatHM(d.minutes) : "—"}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* Per project */}
        <section className="rounded-xl border border-border/50 bg-card/30 p-4">
          <h3 className="text-sm font-semibold">Hours per project</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Accumulated across {s.sprintSpan ? rangeLabel : rangeLabel.toLowerCase()}
          </p>
          <div className="mt-3 max-h-[320px] space-y-1.5 overflow-auto pr-1">
            {loading && <Loading />}
            {!loading && perProject.length === 0 && (
              <p className="text-xs text-muted-foreground">No time logged in this range.</p>
            )}
            {!loading &&
              perProject.map((p) => (
                <div
                  key={p.pid}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40"
                >
                  <span className="truncate text-sm" title={p.name}>
                    {p.name}
                  </span>
                  <span className="shrink-0 text-xs font-medium tabular-nums">
                    {formatHM(p.minutes)}
                  </span>
                </div>
              ))}
            {!loading && perProject.length > 1 && (
              <div className="mt-2 flex items-center justify-between border-t border-border/50 px-2 pt-2 text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatHM(s.totalMinutes)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Per person — only meaningful when more than one person is selected */}
        {s.targetUserIds.length > 1 && (
          <section className="rounded-xl border border-border/50 bg-card/30 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold">Hours per person</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {rangeLabel} · {s.targetUserIds.length} people
            </p>
            <div className="mt-3 max-h-[320px] space-y-1.5 overflow-auto pr-1">
              {loading && <Loading />}
              {!loading &&
                perPerson.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span
                      className="w-40 shrink-0 truncate text-xs text-muted-foreground"
                      title={p.name}
                    >
                      {p.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${(p.minutes / maxPerson) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                      {p.minutes ? formatHM(p.minutes) : "—"}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
