import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import {
  DAY,
  LABEL_W,
  isClosedStatus,
  type GanttGroup,
  type GanttTicket,
  type StageMark,
  type ViewMode,
} from "../lib/gantt-model";
import type { GanttScale } from "../lib/gantt-scale";

function SprintBar({ group, scale }: { group: GanttGroup; scale: GanttScale }) {
  const { pct, fmtDate } = scale;
  const s = group.startsAt ? new Date(group.startsAt).getTime() : null;
  const e = group.endsAt ? new Date(group.endsAt).getTime() : null;
  if (s === null || e === null) return null;
  const overdueEnd = isClosedStatus(group.status) ? e : Math.max(e, Date.now());
  const hasOverdue = overdueEnd > e;
  return (
    <>
      <div
        className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md border border-neon-cyan/40 bg-neon-cyan/15"
        style={{ left: `${pct(s)}%`, width: `${Math.max(pct(e) - pct(s), 0.5)}%` }}
        title={`${fmtDate(s)} → ${fmtDate(e)}`}
      >
        <span className="truncate px-2 text-[10px] text-muted-foreground">
          {fmtDate(s)} → {fmtDate(e)}
        </span>
      </div>
      {hasOverdue && (
        <div
          className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md border border-destructive/50 bg-destructive/25"
          style={{ left: `${pct(e)}%`, width: `${Math.max(pct(overdueEnd) - pct(e), 0.5)}%` }}
          title={`Overdue · ${fmtDate(e)} → ${fmtDate(overdueEnd)}`}
        >
          <span className="truncate px-2 text-[10px] text-destructive">Overdue</span>
        </div>
      )}
    </>
  );
}

/** Epic span: earliest → latest stage marker across its tickets. */
function EpicBar({
  group,
  scale,
  timelineFor,
}: {
  group: GanttGroup;
  scale: GanttScale;
  timelineFor: (t: GanttTicket) => StageMark[];
}) {
  const { pct, fmtDate } = scale;
  const times: number[] = [];
  for (const t of group.tickets) for (const stage of timelineFor(t)) times.push(stage.at);
  if (!times.length) return null;
  const s = Math.min(...times);
  const e = Math.max(Math.max(...times), s + DAY);
  return (
    <div
      className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md border border-neon-violet/40 bg-neon-violet/15"
      style={{ left: `${pct(s)}%`, width: `${Math.max(pct(e) - pct(s), 0.5)}%` }}
      title={`${fmtDate(s)} → ${fmtDate(e)}`}
    >
      <span className="truncate px-2 text-[10px] text-muted-foreground">
        {fmtDate(s)} → {fmtDate(e)}
      </span>
    </div>
  );
}

/** Group header row: collapse toggle, name, count, status and the span bar. */
export function GanttGroupBar({
  group,
  viewMode,
  scale,
  timelineFor,
  collapsed,
  onToggle,
}: {
  group: GanttGroup;
  viewMode: ViewMode;
  scale: GanttScale;
  timelineFor: (t: GanttTicket) => StageMark[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const bar: ReactNode =
    viewMode === "sprints" ? (
      <SprintBar group={group} scale={scale} />
    ) : (
      <EpicBar group={group} scale={scale} timelineFor={timelineFor} />
    );
  return (
    <div className="flex items-stretch bg-card/30">
      <button
        type="button"
        onClick={onToggle}
        className="sticky left-0 z-10 flex shrink-0 items-center gap-2 bg-card/60 py-2.5 pr-3 text-left backdrop-blur transition-colors hover:bg-accent/40"
        style={{ width: LABEL_W, paddingLeft: 10 }}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate font-display text-sm font-semibold">{group.name}</span>
        <NeonBadge tone="muted" className="shrink-0 text-[9px]">
          {group.tickets.length}
        </NeonBadge>
        {group.status && (
          <NeonBadge tone={group.status === "active" ? "lime" : "muted"} className="shrink-0">
            {group.status}
          </NeonBadge>
        )}
      </button>
      <div className="relative flex-1 py-2.5">{bar}</div>
    </div>
  );
}
