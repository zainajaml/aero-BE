import { createFileRoute } from "@tanstack/react-router";
import { BacklogView } from "@/features/backlog/views/backlog-view";

export const Route = createFileRoute("/_authenticated/backlog")({
  component: BacklogView,
});
