import { createFileRoute } from "@tanstack/react-router";
import { DashboardView } from "@/features/reporting/views/dashboard-view";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Space Scope" }] }),
  component: DashboardView,
});
