import { ListChecks, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";

export function StageFilter({ s }: { s: WorkLogPanelState }) {
  const { stageFilter, setStageFilter, stageOptions } = s;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-[160px] justify-start gap-1.5 rounded-full text-xs font-normal"
        >
          <ListChecks className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">
            {s.allStages
              ? "All stages"
              : stageFilter.length === 1
                ? stageFilter[0]
                : `${stageFilter.length} stages`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            Stages
            <button
              type="button"
              title="Refresh stages"
              aria-label="Refresh stages"
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              disabled={s.columnsFetching}
              onClick={() => void s.refetchColumns()}
            >
              <RefreshCw className={`h-3 w-3 ${s.columnsFetching ? "animate-spin" : ""}`} />
            </button>
          </span>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setStageFilter(stageFilter.length > 0 ? [] : [...stageOptions])}
          >
            {stageFilter.length > 0 ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="max-h-64 space-y-0.5 overflow-auto">
          {stageOptions.map((st) => (
            <label
              key={st}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent/50"
            >
              <Checkbox
                checked={stageFilter.includes(st)}
                onCheckedChange={(v) =>
                  setStageFilter((prev) =>
                    v === true ? [...prev, st] : prev.filter((x) => x !== st),
                  )
                }
              />
              <span className="truncate">{st}</span>
            </label>
          ))}
          {stageOptions.length === 0 && (
            <p className="px-1.5 py-1 text-xs text-muted-foreground">No stages available.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
