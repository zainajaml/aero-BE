import { cn } from "@/shared/lib/utils";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";
import { StageFilter } from "./stage-filter";
import { WorkLogChart } from "./work-log-chart";
import { WorkLogTicketTable } from "./work-log-ticket-table";

/** "Currently assigned tickets": header, stage filter, chart, open/closed tabs and the table. */
export function WorkLogTickets({ s }: { s: WorkLogPanelState }) {
  const { dayFilter, targetUserIds, loading, ticketTab } = s;
  const tabbed = ticketTab === "open" ? s.openTickets : s.closedTickets;
  return (
    <section className="min-w-0 rounded-xl border border-border/50 bg-card/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {dayFilter === null ? "Currently assigned tickets" : "Tickets worked on this day"}
          </h3>
          {dayFilter === null ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              All tickets assigned to{" "}
              {targetUserIds.length > 1
                ? `${targetUserIds.length} people`
                : s.nameFor(targetUserIds[0] ?? "")}{" "}
              across {s.scopeLabel}. Logged hours reflect the selected date range.
            </p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {s.tz.formatDate(dayFilter, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <button
                type="button"
                onClick={() => s.setDayFilter(null)}
                className="rounded-full border border-input px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Show all tickets
              </button>
            </div>
          )}
        </div>

        <StageFilter s={s} />
      </div>

      <WorkLogChart s={s} />

      {/* Open / closed tabs */}
      <div className="mt-5 mb-3 flex items-center gap-0.5 self-start rounded-full border border-input p-1">
        {(
          [
            { key: "open", label: `Open (${s.openTickets.length})` },
            { key: "closed", label: `Closed (${s.closedTickets.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => s.setTicketTab(t.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-colors",
              ticketTab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="min-w-0 overflow-auto"
        style={{ minHeight: "480px", maxHeight: "calc(100vh - 300px)" }}
      >
        {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
        {!loading && tabbed.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {s.filteredTickets.length === 0
              ? s.allStages
                ? "No tickets assigned."
                : "No tickets match the selected stages."
              : ticketTab === "open"
                ? "No open tickets."
                : "No closed tickets."}
          </p>
        )}
        {!loading && tabbed.length > 0 && (
          <WorkLogTicketTable tickets={tabbed} showAssignee={targetUserIds.length > 1} />
        )}
      </div>
    </section>
  );
}
