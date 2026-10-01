import { useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";

export function ToggleGroupInline<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="flex items-center rounded-full border border-border p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiSelect({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: { value: string; label: string; sub?: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          {label} ({selected.length === 0 ? "All" : selected.length})
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}…`}
          className="h-8"
        />
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {filtered.length} available
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear Filters
          </Button>
        </div>
        <div className="mt-1 max-h-64 overflow-y-auto">
          {filtered.map((i) => {
            const active = selected.includes(i.value);
            return (
              <button
                key={i.value}
                type="button"
                onClick={() => toggle(i.value)}
                className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50"
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-border",
                    active && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{i.label}</span>
                  {i.sub && (
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {i.sub}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No matches.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass?: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{title}</div>
          <div className="mt-1 truncate text-xl font-semibold tabular-nums text-foreground">
            {value}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        <Icon className={cn("h-5 w-5 shrink-0 text-muted-foreground", iconClass)} />
      </CardContent>
    </Card>
  );
}
