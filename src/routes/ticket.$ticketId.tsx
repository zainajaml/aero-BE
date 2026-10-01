import { createFileRoute } from "@tanstack/react-router";
import { requireActiveSession } from "@/features/auth/lib/route-guards";
import { TicketDirectView, type TicketTab } from "@/features/tickets/views/ticket-direct-view";

const DESCRIPTION =
  "View and update ticket details, estimates, work logs and comments in Space Scope.";

export const Route = createFileRoute("/ticket/$ticketId")({
  validateSearch: (search: Record<string, unknown>): { tab?: TicketTab } => {
    const tab = search.tab;
    return tab === "comments" || tab === "estlogs" || tab === "description" ? { tab } : {};
  },
  // Anonymous visitors are sent to /login with the deep link stashed (setPostLoginRedirect).
  beforeLoad: ({ context, location }) => requireActiveSession(context.queryClient, location.href),
  head: ({ params }) => ({
    meta: [
      { title: "Ticket — Space Scope" },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ticket — Space Scope" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `https://spacescope.ai/ticket/${params.ticketId}` },
    ],
    links: [{ rel: "canonical", href: `https://spacescope.ai/ticket/${params.ticketId}` }],
  }),
  component: function TicketDirectPage() {
    const { ticketId } = Route.useParams();
    const { tab } = Route.useSearch();
    return <TicketDirectView ticketId={ticketId} tab={tab} />;
  },
});
