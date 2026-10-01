import { Bug, Download, Sparkles } from "lucide-react";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { NeonBadge } from "@/shared/ui/glass/neon-badge";
import { Button } from "@/shared/ui/button";
import { PILL_BUTTON } from "@/shared/lib/cta";
import type { SprintReportRow, TicketReportRow } from "../../api/reporting.api";
import { ReleaseGroup } from "./release-group";

export function ReleaseSprintCard({
  sprint,
  tickets,
  completedLabel,
  projectName,
  onDownload,
  onOpenTicket,
}: {
  sprint: SprintReportRow;
  tickets: TicketReportRow[];
  completedLabel: string;
  /** Shown under the goal in the "All projects" view only. */
  projectName: string | null;
  onDownload: () => void;
  onOpenTicket: (id: string) => void;
}) {
  const bugs = tickets.filter((t) => t.type === "bug");
  const features = tickets.filter((t) => t.type !== "bug");
  return (
    <GlassPanel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight">{sprint.name}</h2>
            <NeonBadge tone="lime">Completed: {completedLabel}</NeonBadge>
          </div>
          {sprint.goal && <p className="mt-2 text-sm text-muted-foreground">{sprint.goal}</p>}
          {projectName !== null && (
            <p className="mt-1 text-xs text-muted-foreground">{projectName}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={PILL_BUTTON}
          onClick={onDownload}
          disabled={tickets.length === 0}
        >
          <Download className="h-4 w-4" />
          Download Sprint Notes
        </Button>
      </div>

      {tickets.length === 0 ? (
        <p className="pt-4 text-sm text-muted-foreground">No tickets in this sprint.</p>
      ) : (
        <div className="grid gap-6 pt-4 md:grid-cols-2">
          <ReleaseGroup
            title="Features added"
            icon={<Sparkles className="h-4 w-4 text-cyan-400" />}
            tickets={features}
            onOpen={onOpenTicket}
          />
          <ReleaseGroup
            title="Bugs fixed"
            icon={<Bug className="h-4 w-4 text-rose-400" />}
            tickets={bugs}
            onOpen={onOpenTicket}
          />
        </div>
      )}
    </GlassPanel>
  );
}
