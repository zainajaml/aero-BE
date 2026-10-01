import { MockWindow } from "./mock-window";

import planningShot from "@/assets/features/planning.jpg";
import boardShot from "@/assets/features/board.jpg";
import dashboardShot from "@/assets/features/dashboard.jpg";
import workforceShot from "@/assets/features/workforce.jpg";
import documentsShot from "@/assets/features/documents.jpg";
import releasesShot from "@/assets/features/releases.jpg";
import auditShot from "@/assets/features/audit.jpg";
import sprintStatusShot from "@/assets/features/sprintstatus.jpg";

/** Real product screenshot framed in a faux app window. */
function Shot({ title, src, alt }: { title: string; src: string; alt: string }) {
  return (
    <MockWindow title={title} flush>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block w-full select-none"
        draggable={false}
      />
    </MockWindow>
  );
}

export const PlanningMock = () => (
  <Shot
    title="spacescope.ai/backlog"
    src={planningShot}
    alt="Space Scope backlog and sprint planning screen"
  />
);

export const BoardMock = () => (
  <Shot
    title="spacescope.ai/board"
    src={boardShot}
    alt="Space Scope sprint board with drag-and-drop columns"
  />
);

export const DashboardMock = () => (
  <Shot
    title="spacescope.ai/dashboard"
    src={dashboardShot}
    alt="Space Scope analytics dashboard with sprint metrics and charts"
  />
);

export const TimeTrackingMock = () => (
  <Shot
    title="spacescope.ai/workforce"
    src={workforceShot}
    alt="Space Scope team utilization and time tracking screen"
  />
);

export const DocumentsMock = () => (
  <Shot
    title="spacescope.ai/documents"
    src={documentsShot}
    alt="Space Scope documents library with rich-text editor"
  />
);

export const SprintStatusMock = () => (
  <Shot
    title="spacescope.ai/sprint-status"
    src={sprintStatusShot}
    alt="Space Scope sprint status RAG report, shareable via email and PDF"
  />
);

export const ReleaseNotesMock = () => (
  <Shot
    title="spacescope.ai/releases"
    src={releasesShot}
    alt="Space Scope release notes and changelog screen"
  />
);

export const AuditMock = () => (
  <Shot
    title="spacescope.ai/audit"
    src={auditShot}
    alt="Space Scope full audit trail and activity log"
  />
);
