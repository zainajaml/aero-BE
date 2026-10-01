import { createFileRoute } from "@tanstack/react-router";
import { UnsubscribeView } from "@/features/notifications/views/unsubscribe-view";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: function UnsubscribePage() {
    const { token } = Route.useSearch();
    return <UnsubscribeView token={token} />;
  },
});
