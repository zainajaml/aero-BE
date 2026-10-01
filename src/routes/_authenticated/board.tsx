import { createFileRoute } from "@tanstack/react-router";
import { BoardView } from "@/features/board/views/board-view";

export const Route = createFileRoute("/_authenticated/board")({
  component: BoardView,
});
