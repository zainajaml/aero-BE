import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useProjects } from "@/features/projects/project-context";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TicketDialogSlot } from "@/shared/ui/ticket-dialog-slot";
import { HoursPerDayChart } from "../components/workforce/hours-per-day-chart";
import { UtilizationTable } from "../components/workforce/utilization-table";
import { useWorkforce } from "../hooks/use-workforce";
import { TIME_RANGES } from "../lib/workforce-range";
import {
  defaultDirFor,
  filterAndSortMembers,
  type SortDir,
  type SortKey,
} from "../lib/workforce-table";

/** Team utilisation for the selected project (also embedded in the admin page). */
export function WorkforceView() {
  const { activeProject } = useProjects();
  const { range, setRange, rangeLabel, utilization, histogram } = useWorkforce(activeProject?.id);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("logged");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  const members = utilization?.members;
  const visibleMembers = useMemo(
    () =>
      filterAndSortMembers(
        members ?? [],
        filter,
        sortKey,
        sortDir,
        activeProject ? { name: activeProject.name, key: activeProject.key } : null,
      ),
    [members, filter, sortKey, sortDir, activeProject],
  );

  if (!activeProject) {
    return (
      <GlassPanel className="p-10 text-center">
        <p className="text-muted-foreground">Select a project to view workforce data.</p>
      </GlassPanel>
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDirFor(key));
    }
  };

  return (
    <div className="flex h-[calc(100vh-2.5rem)] flex-col gap-4">
      <div className="flex shrink-0 flex-nowrap items-center gap-3 pt-1">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by member, job title, project, ticket…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-[160px] rounded-full border border-input bg-background text-xs font-normal text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <HoursPerDayChart histogram={histogram} rangeLabel={rangeLabel} />

      <UtilizationTable
        members={visibleMembers}
        totalMembers={members?.length ?? 0}
        availableMin={utilization?.capacityMinutesPerMember ?? 0}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        onOpenTicket={setOpenTicket}
      />

      <TicketDialogSlot
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
