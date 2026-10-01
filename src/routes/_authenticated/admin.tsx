import { createFileRoute } from "@tanstack/react-router";

// Placeholder while the page is being ported.
export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: () => null,
});
