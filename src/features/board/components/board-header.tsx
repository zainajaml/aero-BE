import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { CreateTicketDialog } from "@/features/tickets/components/create-ticket/create-ticket-dialog";
import type { BoardColumn, Sprint } from "@/features/tickets/api/planning.api";
import type { BoardFilters, SortKey } from "../lib/board-types";
import { BoardFiltersMenu } from "./board-filters-menu";
import { BoardSortMenu } from "./board-sort-menu";
import { ManageColumnsDialog } from "./manage-columns-dialog";

interface Props {
  project: { id: string; key: string };
  isKanban: boolean;
  canWrite: boolean;
  columns: BoardColumn[];
  sprints: Sprint[];
  reporterOptions: { id: string; name: string }[];
  filters: BoardFilters;
  onFiltersChange: (next: BoardFilters) => void;
  sortBy: SortKey;
  onSortChange: (v: SortKey) => void;
  sprintFilter: string;
  onSprintFilterChange: (v: string) => void;
}

/** Title (with the sprints being viewed) and the search/filter/sort/sprint/columns toolbar. */
export function BoardHeader({
  project,
  isKanban,
  canWrite,
  columns,
  sprints,
  reporterOptions,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  sprintFilter,
  onSprintFilterChange,
}: Props) {
  const viewed =
    sprintFilter === "active"
      ? sprints.filter((s) => s.status === "active")
      : sprints.filter((s) => s.id === sprintFilter);
  return (
    <div className="flex shrink-0 flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {isKanban ? "Kanban Board" : "Sprint Board"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isKanban ? (
            "Currently Viewing All Tickets"
          ) : (
            <>
              {"Currently Viewing Sprint(s) - "}
              {viewed.length === 0 ? (
                <span className="text-yellow font-medium">None</span>
              ) : (
                viewed.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ", "}
                    <span className="text-yellow font-medium">{s.name}</span>
                  </span>
                ))
              )}
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Search title or ID…"
            className="h-8 w-[240px] pl-8 pr-3 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <BoardFiltersMenu
            filters={filters}
            onChange={onFiltersChange}
            columns={columns}
            reporterOptions={reporterOptions}
          />
          <BoardSortMenu value={sortBy} onChange={onSortChange} />

          {!isKanban && (
            <Select value={sprintFilter} onValueChange={onSprintFilterChange}>
              <SelectTrigger
                title={
                  sprintFilter === "active"
                    ? "Active sprints"
                    : (sprints.find((s) => s.id === sprintFilter)?.name ?? "")
                }
                className="h-8 w-auto max-w-[150px] gap-2 border-border bg-transparent px-3 text-xs font-normal text-foreground shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus:ring-offset-background [&>span]:truncate"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active sprints</SelectItem>
                {sprints
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          {canWrite && <ManageColumnsDialog projectId={project.id} columns={columns} />}
          <CreateTicketDialog projectId={project.id} projectKey={project.key} />
        </div>
      </div>
    </div>
  );
}
