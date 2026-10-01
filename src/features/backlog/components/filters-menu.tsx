import type { ReactNode } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { PILL_BUTTON } from "@/shared/lib/cta";
import {
  EMPTY_FILTERS,
  TICKET_PRIORITIES,
  TICKET_TYPES,
  activeFilterCount,
  toggleIn,
  type BacklogFilters,
} from "../lib/backlog-filters";

interface Option {
  id: string;
  name: string;
}

interface Props {
  filters: BacklogFilters;
  onChange: (next: BacklogFilters) => void;
  columns: Option[];
  assigneeOptions: Option[];
  reporterOptions: Option[];
  hasUnassigned: boolean;
}

const tick = (on: boolean) => (on ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null);

function SubCount({ count }: { count: number }) {
  return count > 0 ? (
    <span className="ml-1 text-[11px] text-muted-foreground">({count})</span>
  ) : null;
}

function MultiItem({
  label,
  on,
  onToggle,
  capitalize,
}: {
  label: ReactNode;
  on: boolean;
  onToggle: () => void;
  capitalize?: boolean;
}) {
  return (
    <DropdownMenuItem
      className={capitalize ? "gap-4 pr-2 text-xs capitalize" : "gap-4 pr-2 text-xs"}
      onSelect={(e) => {
        e.preventDefault();
        onToggle();
      }}
    >
      <span>{label}</span>
      {tick(on)}
    </DropdownMenuItem>
  );
}

/** "Filters" pill: stage, type, priority, assignee and reporter sub-menus. */
export function FiltersMenu({
  filters: f,
  onChange,
  columns,
  assigneeOptions,
  reporterOptions,
  hasUnassigned,
}: Props) {
  const count = activeFilterCount(f);
  const set = (patch: Partial<BacklogFilters>) => onChange({ ...f, ...patch });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={PILL_BUTTON}>
          <Filter className="h-4 w-4" />
          <span className="truncate">Filters</span>
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
              {count}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-[9rem]">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Ticket stage
            <SubCount count={f.stages.length} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {columns.map((c) => (
              <MultiItem
                key={c.id}
                label={c.name}
                on={f.stages.includes(c.id)}
                onToggle={() => set({ stages: toggleIn(f.stages, c.id) })}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Ticket type
            <SubCount count={f.types.length} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {TICKET_TYPES.map((type) => (
              <MultiItem
                key={type}
                capitalize
                label={type}
                on={f.types.includes(type)}
                onToggle={() => set({ types: toggleIn(f.types, type) })}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Priority
            <SubCount count={f.priorities.length} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-auto min-w-[8rem]">
            {TICKET_PRIORITIES.map((p) => (
              <MultiItem
                key={p}
                capitalize
                label={p}
                on={f.priorities.includes(p)}
                onToggle={() => set({ priorities: toggleIn(f.priorities, p) })}
              />
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Assignee
            <SubCount count={f.assignee !== "all" ? 1 : 0} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-64 w-auto min-w-[8rem] overflow-y-auto">
            <DropdownMenuItem
              className="gap-4 pr-2 text-xs"
              onSelect={() => set({ assignee: "all" })}
            >
              <span>All assignees</span>
              {tick(f.assignee === "all")}
            </DropdownMenuItem>
            {hasUnassigned && (
              <DropdownMenuItem
                className="gap-4 pr-2 text-xs"
                onSelect={() => set({ assignee: "__unassigned__" })}
              >
                <span>Unassigned</span>
                {tick(f.assignee === "__unassigned__")}
              </DropdownMenuItem>
            )}
            {assigneeOptions.map((a) => (
              <DropdownMenuItem
                key={a.id}
                className="gap-4 pr-2 text-xs"
                onSelect={() => set({ assignee: a.id })}
              >
                <span>{a.name}</span>
                {tick(f.assignee === a.id)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-xs">
            Reporter
            <SubCount count={f.reporters.length} />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-64 w-auto min-w-[8rem] overflow-y-auto">
            {reporterOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No reporters</div>
            ) : (
              reporterOptions.map((r) => (
                <MultiItem
                  key={r.id}
                  label={r.name}
                  on={f.reporters.includes(r.id)}
                  onToggle={() => set({ reporters: toggleIn(f.reporters, r.id) })}
                />
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {count > 0 && (
          <>
            <div className="mx-auto my-2 h-px w-1/2 bg-border/40" />
            <DropdownMenuItem
              className="text-xs text-muted-foreground focus:text-foreground"
              onSelect={() => onChange({ ...EMPTY_FILTERS, search: f.search })}
            >
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
