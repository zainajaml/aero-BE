import { Check, ChevronDown, ListFilter } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { PILL_BUTTON } from "@/shared/lib/cta";
import { SORT_OPTIONS, type SortKey } from "../lib/backlog-types";

/** "Sort by" pill (page-wide sort; "manual" enables drag-to-reorder). */
export function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={PILL_BUTTON}>
          <ListFilter className="h-4 w-4" />
          <span className="truncate">Sort by</span>
          {value !== "manual" && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">
              1
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
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
