import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AcceptView } from "@/features/invitations/views/accept-view";

export const Route = createFileRoute("/accept")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Accept invitation — Space Scope" },
      {
        name: "description",
        content: "Accept your Space Scope invitation to join your team and start planning sprints.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: function AcceptPage() {
    const { token } = Route.useSearch();
    return <AcceptView token={token} />;
  },
});
