import { useState } from "react";
import { TicketDialogSlot } from "@/shared/ui/ticket-dialog-slot";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { DashboardStatCards } from "../components/dashboard/dashboard-stat-cards";
import {
  StageChart,
  TicketTimeChart,
  TimeByDateChart,
} from "../components/dashboard/dashboard-charts";
import { useDashboardAxisColor } from "../hooks/use-dashboard-axis-color";
import { useDashboardData } from "../hooks/use-dashboard-data";

export function DashboardView() {
  const d = useDashboardData();
  const axisColor = useDashboardAxisColor();
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  const openTicketByLabel = (label: unknown) => {
    if (typeof label !== "string") return;
    const id = d.codeToTicketId.get(label);
    if (id) setOpenTicket(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {d.activeProject?.name ?? "Overview"} —{" "}
            {d.isKanban
              ? "board state, time budget, and activity."
              : "sprint progress, time budget, and activity."}
          </p>
        </div>
        {!d.isKanban && d.sprintOptions.length > 0 && (
          <Select value={d.selectedSprint?.id ?? ""} onValueChange={d.setSelectedSprintId}>
            <SelectTrigger className="w-[220px] border-border bg-transparent text-foreground transition-colors hover:border-primary">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {d.sprintOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.status === "active" ? `${s.name} (This Sprint)` : s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current state */}
      <section className="space-y-4">
        <DashboardStatCards
          isKanban={d.isKanban}
          counts={d.counts}
          selectedSprint={d.selectedSprint}
          closeInfo={d.closeInfo}
          loggedTotal={d.loggedTotal}
          estimatedTotal={d.estimatedTotal}
          offsetMin={d.offsetMin}
        />

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TicketTimeChart
            data={d.ticketChart}
            personColor={d.personColor}
            axisColor={axisColor}
            loggedTotal={d.loggedTotal}
            isKanban={d.isKanban}
            onOpenLabel={openTicketByLabel}
          />
          <TimeByDateChart
            data={d.histogram}
            personColor={d.personColor}
            axisColor={axisColor}
            loggedTotal={d.loggedTotal}
            isKanban={d.isKanban}
          />
          <StageChart
            data={d.stageChart}
            axisColor={axisColor}
            total={d.counts.total}
            isKanban={d.isKanban}
          />
        </div>
      </section>

      <TicketDialogSlot
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
