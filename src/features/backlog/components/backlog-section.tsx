import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import type { BacklogTicket } from "../lib/backlog-types";
import { SelectAllCheckbox, ZoneRows, type RowsContext } from "./ticket-rows";
import {
  CollapseButton,
  NewTicketButton,
  ZoneActionsMenu,
  ZoneBody,
  ZoneTotals,
} from "./zone-parts";

/** The backlog panel (tickets without a sprint), shown below the sprints. */
export function BacklogSection({
  items,
  ctx,
  project,
  collapsed,
  onToggleCollapse,
  ticketDragging,
  onExport,
}: {
  items: BacklogTicket[];
  ctx: RowsContext;
  project: { id: string; key: string };
  collapsed: boolean;
  onToggleCollapse: () => void;
  ticketDragging: boolean;
  onExport: () => void;
}) {
  const estTotal = items.reduce((s, t) => s + t.estimateMinutes, 0);
  const logTotal = items.reduce((s, t) => s + (t.loggedMinutes ?? 0), 0);
  return (
    <GlassPanel className="p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="ml-3.5 mt-0.5">
            <SelectAllCheckbox items={items} ctx={ctx} />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neon-cyan" />
              <h2 className="text-sm font-semibold tracking-tight">Backlog</h2>
            </div>
            <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <ZoneTotals est={estTotal} logged={logTotal} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ctx.canWrite && <NewTicketButton projectId={project.id} projectKey={project.key} />}
          <ZoneActionsMenu
            label="Backlog actions"
            items={[{ label: "Export tickets", disabled: items.length === 0, onSelect: onExport }]}
          />
          <CollapseButton collapsed={collapsed} onToggle={onToggleCollapse} noun="backlog" />
        </div>
      </div>
      <ZoneBody
        zoneId="backlog"
        label="backlog"
        collapsed={collapsed}
        ticketDragging={ticketDragging}
        collapsedText="Drop here to move into Backlog"
      >
        <ZoneRows
          items={items}
          emptyText="All tickets assigned to sprints."
          zoneId="backlog"
          ctx={ctx}
        />
      </ZoneBody>
    </GlassPanel>
  );
}
