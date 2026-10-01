import { useWorkLogPanel } from "../hooks/use-work-log-panel";
import { WorkLogExportMenu } from "./work-log/work-log-export-menu";
import { WorkLogFilters } from "./work-log/work-log-filters";
import { WorkLogSummary } from "./work-log/work-log-summary";
import { WorkLogTickets } from "./work-log/work-log-tickets";

/**
 * My Work Log — a personal, resource-scoped view of logged hours and ticket counts across every
 * project the signed-in user can see. Account admins get a resource picker so they can review any
 * member of the projects in scope. Deliberately NOT a copy of the per-project dashboard.
 */
export function MyWorkLogPanel() {
  const s = useWorkLogPanel();
  return (
    <div className="min-w-0 space-y-5 pb-8">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <WorkLogFilters s={s} />
        <WorkLogExportMenu s={s} />
      </div>

      <WorkLogSummary s={s} />

      <WorkLogTickets s={s} />
    </div>
  );
}
