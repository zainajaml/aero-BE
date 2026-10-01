import { createFileRoute } from "@tanstack/react-router";
import { useProjects } from "@/features/projects/project-context";

// Temporary until the reporting slice ports the analytics dashboard (ledger W-16).
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Space Scope" }] }),
  component: function DashboardPage() {
    const { activeProject } = useProjects();
    return (
      <div className="p-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {activeProject ? activeProject.name : "No project selected"}
        </p>
      </div>
    );
  },
});
