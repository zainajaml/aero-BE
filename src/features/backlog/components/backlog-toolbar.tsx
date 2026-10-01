import { Eye, EyeOff, Search, Settings } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PILL_BUTTON } from "@/shared/lib/cta";
import type { BacklogFilters } from "../lib/backlog-filters";
import type { SortKey } from "../lib/backlog-types";
import type { BacklogData } from "../hooks/use-backlog-data";
import { CreateSprintDialog } from "./dialogs/create-sprint-dialog";
import { FiltersMenu } from "./filters-menu";
import { SortMenu } from "./sort-menu";

interface Props {
  projectId: string;
  isKanban: boolean;
  canWrite: boolean;
  data: BacklogData;
  filters: BacklogFilters;
  onFiltersChange: (next: BacklogFilters) => void;
  sortBy: SortKey;
  onSortChange: (v: SortKey) => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onOpenEpics: () => void;
}

/** Search, filters, sort, completed-sprints toggle, epics and "+ Sprint". */
export function BacklogToolbar({
  projectId,
  isKanban,
  canWrite,
  data,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  showCompleted,
  onToggleCompleted,
  onOpenEpics,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search title or ID…"
          className="h-8 w-[240px] pl-8 pr-3 text-xs"
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <FiltersMenu
          filters={filters}
          onChange={onFiltersChange}
          columns={data.columns}
          assigneeOptions={data.assigneeOptions}
          reporterOptions={data.reporterOptions}
          hasUnassigned={data.hasUnassigned}
        />
        <SortMenu value={sortBy} onChange={onSortChange} />

        {!isKanban && (
          <Button variant="outline" size="sm" className={PILL_BUTTON} onClick={onToggleCompleted}>
            {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCompleted ? "Hide completed sprints" : "Show completed sprints"}
          </Button>
        )}
        {canWrite && (
          <Button variant="outline" size="sm" className={PILL_BUTTON} onClick={onOpenEpics}>
            <Settings className="h-4 w-4" />
            Epics
          </Button>
        )}
        {!isKanban && canWrite && <CreateSprintDialog projectId={projectId} />}
      </div>
    </div>
  );
}
