import { createFileRoute } from "@tanstack/react-router";
import { DocumentsView } from "@/features/documents/views/documents-view";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsView,
});
