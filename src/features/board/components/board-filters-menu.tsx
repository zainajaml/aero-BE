import { Check, ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  EMPTY_BOARD_FILTERS,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  type BoardFilters,
} from "../lib/board-types";

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/** Board "Filters" menu: stage, type, priority and reporter. */
export function BoardFiltersMenu({
  filters: f,
  onChange,
  columns,
  reporterOptions,
}: {
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
  columns: { id: string; name: string }[];
  reporterOptions: { id: string; name: string }[];
}) {
  const count = f.stages.length + f.types.length + f.priorities.length + f.reporters.length;
  const set = (patch: Partial<BoardFilters>) => onChange({ ...f, ...patch });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-normal text-foreground shadow-sm ring-offset-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-1 focus:ring-ring whitespace-nowrap"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
            {count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {count}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-[9rem]">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Ticket stage
            {f.stages.length > 0 ? (
              <span className="ml-1 text-[11px] text-muted-foreground">({f.stages.length})</span>
            ) : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {columns.map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="gap-4 pr-2 text-xs"
                onSelect={(e) => {
                  e.preventDefault();
                  set({ stages: toggleIn(f.stages, c.id) });
                }}
              >
                <span>{c.name}</span>
                {f.stages.includes(c.id) ? (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Ticket type
            {f.types.length > 0 ? (
              <span className="ml-1 text-[11px] text-muted-foreground">({f.types.length})</span>
            ) : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {TICKET_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                className="gap-4 pr-2 text-xs"
                onSelect={(e) => {
                  e.preventDefault();
                  set({ types: toggleIn(f.types, type) });
                }}
              >
                <span className="capitalize">{type}</span>
                {f.types.includes(type) ? (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Priority
            {f.priorities.length > 0 ? (
              <span className="ml-1 text-[11px] text-muted-foreground">
                ({f.priorities.length})
              </span>
            ) : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {TICKET_PRIORITIES.map((p) => (
              <DropdownMenuItem
                key={p}
                className="gap-4 pr-2 text-xs capitalize"
                onSelect={(e) => {
                  e.preventDefault();
                  set({ priorities: toggleIn(f.priorities, p) });
                }}
              >
                <span>{p}</span>
                {f.priorities.includes(p) ? (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Reporter
            {f.reporters.length > 0 ? (
              <span className="ml-1 text-[11px] text-muted-foreground">({f.reporters.length})</span>
            ) : null}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-64 w-auto min-w-[8rem] overflow-y-auto">
            {reporterOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No reporters</div>
            ) : (
              reporterOptions.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  className="gap-4 pr-2 text-xs"
                  onSelect={(e) => {
                    e.preventDefault();
                    set({ reporters: toggleIn(f.reporters, r.id) });
                  }}
                >
                  <span>{r.name}</span>
                  {f.reporters.includes(r.id) ? (
                    <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {count > 0 && (
          <>
            <div className="mx-auto my-2 h-px w-1/2 bg-border/40" />
            <DropdownMenuItem
              className="text-xs text-muted-foreground focus:text-foreground"
              onSelect={() => {
                onChange({ ...EMPTY_BOARD_FILTERS, search: f.search });
              }}
            >
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
