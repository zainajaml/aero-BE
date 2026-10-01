import { createFileRoute } from "@tanstack/react-router";
import { GanttView } from "@/features/gantt/views/gantt-view";

export const Route = createFileRoute("/_authenticated/gantt")({
  component: GanttView,
});
