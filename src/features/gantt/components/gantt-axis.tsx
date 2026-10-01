import { LABEL_W, type ViewMode } from "../lib/gantt-model";
import type { GanttScale } from "../lib/gantt-scale";

/** Sticky date-axis header with evenly spaced ticks. */
export function GanttAxis({
  ticks,
  scale,
  viewMode,
}: {
  ticks: number[];
  scale: GanttScale;
  viewMode: ViewMode;
}) {
  return (
    <div className="sticky top-0 z-30 flex items-stretch border-b border-glass-border bg-background/80 backdrop-blur">
      <div
        className="sticky left-0 z-40 shrink-0 bg-background/95 backdrop-blur"
        style={{ width: LABEL_W }}
      >
        <span className="block px-3 py-2 text-xs font-medium text-muted-foreground">
          {viewMode === "sprints" ? "Sprint / Ticket" : "Epic / Ticket"}
        </span>
      </div>
      <div className="relative flex-1">
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-l border-glass-border/40"
            style={{ left: `${scale.pct(t)}%` }}
          >
            <span className="absolute left-1 top-1.5 whitespace-nowrap text-[10px] text-muted-foreground">
              {scale.fmtDate(t)}
            </span>
          </div>
        ))}
        <div className="py-2 text-[10px] opacity-0">.</div>
      </div>
    </div>
  );
}
