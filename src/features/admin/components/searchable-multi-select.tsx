import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Checkbox } from "@/shared/ui/checkbox";

/** Checkbox list with search, used for assigning projects or accounts. */
export function SearchableMultiSelect({
  items,
  selected,
  onChange,
  emptyText = "No items available.",
  placeholder = "Search...",
}: {
  items: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyText}</p>;
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

  return (
    <div className="rounded-md border border-border/60">
      <div className="border-b border-border/60 p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8"
        />
      </div>
      <div className="max-h-48 space-y-1.5 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No matches.</p>
        ) : (
          filtered.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50"
            >
              <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
              <span>{p.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
