import { createFileRoute } from "@tanstack/react-router";
import { ReleasesView } from "@/features/reporting/views/releases-view";

export const Route = createFileRoute("/_authenticated/releases")({
  component: ReleasesView,
});
