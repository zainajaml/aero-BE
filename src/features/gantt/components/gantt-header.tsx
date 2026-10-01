import { Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { RANGE_OPTIONS, type ViewMode } from "../lib/gantt-model";

/** Title, "Manage Epics", Sprints/Epics toggle and date range. */
export function GanttHeader({
  projectName,
  viewMode,
  onViewModeChange,
  range,
  onRangeChange,
  onManageEpics,
}: {
  projectName: string | null;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  range: string;
  onRangeChange: (v: string) => void;
  onManageEpics: (() => void) | null;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Gantt View</h1>
        <p className="text-sm text-muted-foreground">
          {projectName ?? "All projects"} ·{" "}
          {viewMode === "sprints" ? "Sprint timeline" : "Epic timeline"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {viewMode === "epics" && onManageEpics && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/50 bg-amber-300/5 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-amber-300/10 dark:text-amber-200"
            onClick={onManageEpics}
          >
            <Layers className="h-4 w-4" />
            Manage Epics
          </button>
        )}
        {/* Sprints / Epics toggle */}
        <div className="flex items-center rounded-full border border-glass-border bg-muted/30 p-0.5">
          {(["sprints", "epics"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        <Select value={range} onValueChange={(v) => v && onRangeChange(v)}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
