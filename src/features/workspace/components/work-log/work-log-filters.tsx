import type { ReactNode } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Flag, FolderKanban, User as UserIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Checkbox } from "@/shared/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";
import type { WorkLogPanelState } from "../../hooks/use-work-log-panel";
import { DAY_MS, PRESETS } from "../../lib/work-log-range";

const TRIGGER = "h-8 max-w-[220px] justify-start gap-1.5 rounded-full text-xs font-normal";
const ITEM =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60";
const RESET =
  "mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent/60";

function PickerItem({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={ITEM}>
      <Checkbox checked={checked} className="pointer-events-none h-3.5 w-3.5" />
      <span className="truncate">{children}</span>
    </button>
  );
}

function SprintPicker({ s }: { s: WorkLogPanelState }) {
  const shortDate = (ms: number) => s.tz.formatDate(ms, { month: "short", day: "numeric" });
  const sprintLabel =
    s.selectedSprints.length === 0
      ? "All sprints"
      : s.selectedSprints.length === 1
        ? s.selectedSprints[0].name
        : `${s.selectedSprints.length} sprints`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(TRIGGER, s.sprintSpan && "border-primary text-primary")}
        >
          <Flag className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{sprintLabel}</span>
          <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <p className="px-2 pb-1.5 text-[11px] text-muted-foreground">
          Shows hours logged during the selected sprints' dates.
        </p>
        <div className="max-h-64 space-y-0.5 overflow-auto">
          {s.sprintOptions.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No sprints in this project.</p>
          )}
          {s.sprintOptions.map((sp) => (
            <button
              key={sp.id}
              type="button"
              disabled={!sp.window}
              onClick={() => s.toggleSprint(sp.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Checkbox
                checked={s.sprintIds.includes(sp.id)}
                className="pointer-events-none h-3.5 w-3.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{sp.name}</span>
                  {sp.status === "active" && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">
                      Active
                    </span>
                  )}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {sp.window
                    ? `${shortDate(sp.window.from)} – ${shortDate(sp.window.to - DAY_MS)}`
                    : "No dates set"}
                </span>
              </span>
            </button>
          ))}
        </div>
        {s.sprintIds.length > 0 && (
          <button type="button" onClick={() => s.setSprintIds([])} className={RESET}>
            Clear sprints
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Project / sprint / people pickers and the date presets. */
export function WorkLogFilters({ s }: { s: WorkLogPanelState }) {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={TRIGGER}>
            <FolderKanban className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{s.scopeLabel}</span>
            <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="max-h-64 space-y-0.5 overflow-auto">
            {s.projects.map((p) => (
              <PickerItem
                key={p.id}
                checked={s.projectIds.includes(p.id)}
                onClick={() => s.toggleProject(p.id)}
              >
                {p.name}
              </PickerItem>
            ))}
          </div>
          {s.projectIds.length > 0 && (
            <button type="button" onClick={() => s.setProjectIds([])} className={RESET}>
              All my projects
            </button>
          )}
        </PopoverContent>
      </Popover>

      {s.showSprintFilter && <SprintPicker s={s} />}

      {s.canPickResource ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={TRIGGER}>
              <UserIcon className="h-3 w-3 shrink-0 opacity-60" />
              <span className="truncate">{s.peopleLabel}</span>
              <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="max-h-64 space-y-0.5 overflow-auto">
              {s.resources.map((r) => (
                <PickerItem
                  key={r.id}
                  checked={s.resourceIds.includes(r.id)}
                  onClick={() => s.toggleResource(r.id)}
                >
                  {r.name}
                </PickerItem>
              ))}
            </div>
            {s.resourceIds.length > 0 && (
              <button type="button" onClick={() => s.setResourceIds([])} className={RESET}>
                Reset to {s.selfName}
              </button>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-8 justify-start gap-1.5 rounded-full text-xs font-normal disabled:opacity-100"
        >
          <UserIcon className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{s.selfName}</span>
        </Button>
      )}

      <div className="flex h-8 flex-wrap items-center gap-0.5 rounded-full border border-input p-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              s.setSprintIds([]);
              s.setPreset(p.key);
            }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs transition-colors",
              !s.sprintSpan && s.preset === p.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!s.sprintSpan && s.preset === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs">
              <CalendarIcon className="h-3 w-3" />
              {s.customFrom
                ? `${format(s.customFrom, "MMM d")} – ${format(s.customTo ?? s.customFrom, "MMM d")}`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: s.customFrom, to: s.customTo }}
              onSelect={(r) => s.setCustomRange(r?.from, r?.to)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
