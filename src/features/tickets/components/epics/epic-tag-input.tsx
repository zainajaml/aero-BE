import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { X, Check } from "lucide-react";
import { EpicIcon } from "@/shared/ui/icons/epic-icon";
import { cn } from "@/shared/lib/utils";
import { useEpics } from "../../hooks/ticket-queries";

export interface EpicTag {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  selected: EpicTag[];
  onChange: (next: EpicTag[]) => void;
  disabled?: boolean;
}

export function EpicTagInput({ projectId, selected, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { data: epics = [] } = useEpics(projectId);

  const selectedIds = new Set(selected.map((e) => e.id));

  function toggle(epic: EpicTag) {
    if (selectedIds.has(epic.id)) {
      onChange(selected.filter((e) => e.id !== epic.id));
    } else {
      onChange([...selected, epic]);
    }
  }

  function remove(id: string) {
    onChange(selected.filter((e) => e.id !== id));
  }

  const EPIC_PILL =
    "inline-flex h-7 max-w-[220px] min-w-0 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-[rgba(242,214,75,0.12)] px-2.5 text-sm font-medium leading-none text-[var(--tk-accent)]";

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {selected.map((e) => (
          <span key={e.id} className={EPIC_PILL} title={e.name}>
            <EpicIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate">{e.name}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full flex-wrap items-center gap-1.5 border-0 bg-transparent p-0 text-left text-sm font-medium text-[var(--tk-body)] transition-colors hover:text-[var(--tk-text)]"
          >
            {selected.map((e) => (
              <span key={e.id} className={EPIC_PILL} title={e.name}>
                <EpicIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{e.name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="shrink-0 rounded-full p-0.5 hover:bg-[var(--tk-accent)]/10"

                  onClick={(ev) => {
                    ev.stopPropagation();
                    remove(e.id);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      ev.stopPropagation();
                      remove(e.id);
                    }
                  }}
                  aria-label={`Remove ${e.name}`}
                >
                  <X className="h-3 w-3 shrink-0" />
                </span>
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[var(--tk-muted)]">
              <EpicIcon className="h-3.5 w-3.5 opacity-40" />
              Add epic…
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="z-[60] w-44 max-w-[calc(100vw-2rem)] border-[var(--tk-border)] bg-[var(--tk-surface)] p-0 text-[var(--tk-text)]"
          align="end"
          side="bottom"
          sideOffset={4}
          avoidCollisions
          collisionPadding={16}
        >
          <Command
            shouldFilter
            className="rounded-md bg-transparent text-[var(--tk-text)] [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-[var(--tk-border)]"
          >
            <CommandInput
              placeholder="Search epics…"
              value={query}
              onValueChange={setQuery}
              className="h-9 border-0 bg-transparent px-0 text-sm shadow-none outline-none ring-0 focus:ring-0 focus-visible:ring-0"
            />
            <CommandList className="max-h-56 p-1">
              {epics.length > 0 && (
                <CommandGroup className="p-0 [&_[cmdk-group-heading]]:hidden">
                  {epics.map((e) => (
                    <CommandItem
                      key={e.id}
                      value={e.name}
                      onSelect={() => toggle(e)}
                      className="rounded-md border-0 bg-transparent text-[var(--tk-body)] data-[selected=true]:bg-[var(--tk-divider)] data-[selected=true]:text-[var(--tk-text)]"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedIds.has(e.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {e.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandEmpty className="px-3 py-2 text-left text-sm text-[var(--tk-muted)]">
                {epics.length === 0 ? "No epics available." : "No matching epic."}
              </CommandEmpty>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
