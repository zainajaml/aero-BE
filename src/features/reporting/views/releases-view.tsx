import { useState } from "react";
import { Download, Rocket } from "lucide-react";
import { useProjects } from "@/features/projects/project-context";
import { useTimezone } from "@/features/users/lib/timezone";
import { GlassPanel } from "@/shared/ui/glass/glass-panel";
import { Button } from "@/shared/ui/button";
import { PILL_BUTTON } from "@/shared/lib/cta";
import { TicketDialogSlot } from "@/shared/ui/ticket-dialog-slot";
import type { SprintReportRow } from "../api/reporting.api";
import { ReleaseSprintCard } from "../components/releases/release-sprint-card";
import { useReleases } from "../hooks/use-releases";
import {
  allReleaseNotesFilename,
  buildReleaseCsv,
  downloadCsv,
  sprintReleaseNotesFilename,
} from "../lib/releases-csv";

export function ReleasesView() {
  const { projects, activeProjectId, isAllProjects, isLoading: projectsLoading } = useProjects();
  const tz = useTimezone();
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  const { sprints, ticketsBySprint, isLoading } = useReleases(
    isAllProjects ? undefined : (activeProjectId ?? undefined),
    !!activeProjectId,
  );

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Unknown project";
  const formatEndDate = (iso: string) => tz.formatDate(iso, { year: "numeric" });

  const loading = projectsLoading || isLoading;

  const handleDownloadAll = () => {
    downloadCsv(
      buildReleaseCsv(sprints, ticketsBySprint, formatEndDate),
      allReleaseNotesFilename(),
    );
  };

  const handleDownloadSprint = (sprint: SprintReportRow) => {
    downloadCsv(
      buildReleaseCsv([sprint], ticketsBySprint, formatEndDate),
      sprintReleaseNotesFilename(sprint.name),
    );
  };

  const hasTickets = sprints.some((s) => (ticketsBySprint[s.id] ?? []).length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Release Notes</h1>
          <p className="text-sm text-muted-foreground">
            {isAllProjects
              ? "Completed sprints across all projects, newest first."
              : "Completed sprints for this project, newest first."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={PILL_BUTTON}
          onClick={handleDownloadAll}
          disabled={!hasTickets}
        >
          <Download className="h-4 w-4" />
          Download All Release Notes
        </Button>
      </div>

      {loading ? (
        <GlassPanel className="p-10 text-center text-sm text-muted-foreground">Loading…</GlassPanel>
      ) : sprints.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Rocket className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No releases yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed sprints will appear here as a running release timeline.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => (
            <ReleaseSprintCard
              key={sprint.id}
              sprint={sprint}
              tickets={ticketsBySprint[sprint.id] ?? []}
              completedLabel={sprint.endsAt ? formatEndDate(sprint.endsAt) : "—"}
              projectName={isAllProjects ? projectName(sprint.projectId) : null}
              onDownload={() => handleDownloadSprint(sprint)}
              onOpenTicket={setOpenTicket}
            />
          ))}
        </div>
      )}

      <TicketDialogSlot
        ticketId={openTicket}
        open={!!openTicket}
        onOpenChange={(o) => !o && setOpenTicket(null)}
      />
    </div>
  );
}
