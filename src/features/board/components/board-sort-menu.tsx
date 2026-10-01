import { Check, ChevronDown, ListFilter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { SORT_OPTIONS, type SortKey } from "../lib/board-types";

/** Board "Sort by" menu ("manual" shows drag handles). */
export function BoardSortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-xs font-normal text-foreground shadow-sm ring-offset-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-1 focus:ring-ring whitespace-nowrap"
        >
          <span className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            Sort by
            {value !== "manual" && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                1
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-[9rem]">
        {SORT_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            title={o.hint}
            className="gap-4 pr-2 text-xs"
            onSelect={() => onChange(o.value)}
          >
            <span>{o.label}</span>
            {value === o.value ? <Check className="ml-auto h-3.5 w-3.5 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
        {value !== "manual" && (
          <>
            <div className="mx-auto my-2 h-px w-1/2 bg-border/40" />
            <DropdownMenuItem
              className="text-xs text-muted-foreground focus:text-foreground"
              onSelect={() => onChange("manual")}
            >
              Reset to default
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
