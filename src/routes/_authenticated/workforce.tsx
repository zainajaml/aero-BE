import { createFileRoute } from "@tanstack/react-router";
import { WorkforceView } from "@/features/reporting/views/workforce-view";

export const Route = createFileRoute("/_authenticated/workforce")({
  component: WorkforceView,
});
