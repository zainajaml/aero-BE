import { createFileRoute } from "@tanstack/react-router";
import { SprintStatusView } from "@/features/reporting/views/sprint-status-view";

export const Route = createFileRoute("/_authenticated/sprint-status")({
  component: SprintStatusView,
});
